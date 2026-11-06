#!/usr/bin/env node
/**
 * BU SHPE events MCP server (stdio).
 *
 * Lets Claude list, add, edit and delete chapter events, and upload event
 * photos, without anyone running wrangler by hand. It drives the same D1
 * database and R2 bucket the /admin portal uses, through the wrangler CLI
 * and your existing `wrangler login` — no API tokens of its own.
 *
 * Env:
 *   BU_SHPE_TARGET   "remote" (default, production) or "local" (the dev DB)
 *   CLOUDFLARE_ACCOUNT_ID  defaults to the chapter's account
 *
 * Mirrors the admin portal's rules (src/lib/server/events.ts, media.ts):
 * slugs from the title with -2/-3 on collision, ISO dates or "" for TBA,
 * photos under events/<yyyy>/<random>.<ext> served at /media/....
 */
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { stat } from "node:fs/promises";
import { extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WRANGLER = resolve(ROOT, "node_modules/.bin/wrangler");
const TARGET = process.env.BU_SHPE_TARGET === "local" ? "local" : "remote";
const DB = "bu-shpe-db";
const BUCKET = "bu-shpe-media";
const SITE = "https://bu-shpe.andreslopez-23061.workers.dev";

const CATEGORIES = ["Professional", "Cultural", "Social", "Study Night", "Volunteering", "Conference"];
const IMAGE_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/* ---------- wrangler plumbing ---------- */

async function wrangler(args) {
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? "0bda3a2560ca48711ef7336cc421abed", CI: "1" };
  // Cloudflare's API intermittently rejects a valid login with code 7403;
  // that happens before the query runs, so retrying is safe.
  for (let attempt = 1; ; attempt++) {
    try {
      const { stdout } = await run(WRANGLER, args, { cwd: ROOT, env, maxBuffer: 32 * 1024 * 1024 });
      return stdout;
    } catch (err) {
      const msg = (err.stderr || err.stdout || err.message || "").toString().trim();
      if (attempt < 3 && /code: 7403|"code": 7403/.test(msg)) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
        continue;
      }
      throw new Error(`wrangler ${args.slice(0, 3).join(" ")} failed: ${msg.slice(-1500)}`);
    }
  }
}

/** SQL literal. D1 via the CLI has no bind params, so quote strictly. */
function q(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") {
    if (!Number.isInteger(v)) throw new Error("only integer numbers are allowed");
    return String(v);
  }
  if (typeof v === "boolean") return v ? "1" : "0";
  const s = String(v);
  if (s.includes("\0")) throw new Error("text may not contain NUL characters");
  return `'${s.replaceAll("'", "''")}'`;
}

/** Runs SQL; returns the rows of the last statement. */
async function sql(statement) {
  const out = await wrangler(["d1", "execute", DB, `--${TARGET}`, "--json", "--command", statement]);
  const parsed = JSON.parse(out.slice(out.indexOf("[")));
  const last = parsed.at(-1);
  if (last && last.success === false) throw new Error(JSON.stringify(last));
  return last?.results ?? [];
}

/* ---------- event rules (mirrors src/lib/server/events.ts) ---------- */

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(title, exceptId) {
  const base = slugify(title) || "event";
  const rows = await sql(`SELECT id, slug FROM events WHERE slug = ${q(base)} OR slug LIKE ${q(base + "-%")}`);
  const taken = new Map(rows.map((r) => [r.slug, r.id]));
  let candidate = base;
  for (let n = 2; taken.has(candidate) && taken.get(candidate) !== exceptId; n++) candidate = `${base}-${n}`;
  return candidate;
}

/** "TBA"/"" -> ""; otherwise must be yyyy-mm or yyyy-mm-dd with a real day. */
function normalizeDate(v) {
  const s = (v ?? "").trim();
  if (s === "" || s.toUpperCase() === "TBA") return "";
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s);
  if (!m) throw new Error(`date must be YYYY-MM-DD, YYYY-MM or "TBA" (got "${s}")`);
  const month = Number(m[2]);
  if (month < 1 || month > 12) throw new Error(`invalid month in "${s}"`);
  if (m[3] !== undefined) {
    const last = new Date(Date.UTC(Number(m[1]), month, 0)).getUTCDate();
    const day = Number(m[3]);
    if (day < 1 || day > last) throw new Error(`invalid day in "${s}"`);
  }
  return s;
}

const isUpcoming = (date) => !date || date >= new Date().toISOString().slice(0, 7);
const eventUrl = (slug) => `${SITE}/events/${slug}`;
const now = () => new Date().toISOString();

function summarize(r) {
  return {
    id: r.id,
    title: r.title,
    date: r.date || "TBA",
    category: r.category,
    status: r.published ? (isUpcoming(r.date) ? "upcoming" : "past") : "draft",
    url: eventUrl(r.slug),
  };
}

async function findEvent({ id, slug }) {
  if (id === undefined && !slug) throw new Error("pass id or slug");
  const where = id !== undefined ? `id = ${q(id)}` : `slug = ${q(slug)}`;
  const [row] = await sql(`SELECT * FROM events WHERE ${where}`);
  if (!row) throw new Error(`no event with ${id !== undefined ? `id ${id}` : `slug "${slug}"`}`);
  return row;
}

/* ---------- R2 ---------- */

/** Uploads a local image; returns its public /media/... path. */
async function uploadImage(filePath, folderYear) {
  const ext = extname(filePath).toLowerCase();
  const type = IMAGE_TYPES[ext];
  if (!type) throw new Error("photo must be .jpg, .jpeg, .png, .webp or .avif");
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) throw new Error(`no file at ${filePath}`);
  if (info.size > MAX_UPLOAD_BYTES) throw new Error("photo must be 8 MB or smaller");
  const year = /^\d{4}$/.test(folderYear ?? "") ? folderYear : String(new Date().getUTCFullYear());
  const key = `events/${year}/${randomBytes(9).toString("base64url").slice(0, 12)}${ext === ".jpeg" ? ".jpg" : ext}`;
  await wrangler([
    "r2", "object", "put", `${BUCKET}/${key}`, `--${TARGET}`,
    "--file", filePath, "--content-type", type, "--cache-control", "public, max-age=31536000, immutable",
  ]);
  return `/media/${key}`;
}

/** Deletes an uploaded image, unless another event or photo roll still uses it. */
async function deleteMedia(path) {
  if (!path?.startsWith("/media/events/")) return;
  const [{ n }] = await sql(
    `SELECT (SELECT COUNT(*) FROM events WHERE photo = ${q(path)}) + (SELECT COUNT(*) FROM event_photos WHERE url = ${q(path)}) AS n`,
  );
  if (n > 0) return;
  await wrangler(["r2", "object", "delete", `${BUCKET}/${path.slice("/media/".length)}`, `--${TARGET}`]).catch(() => {});
}

/** A photo argument is either a site path (/assets/..., /media/...) or a local file to upload. */
async function resolvePhoto(photo, date) {
  if (!photo) return "";
  if (photo.startsWith("/assets/") || photo.startsWith("/media/")) return photo;
  return uploadImage(photo, date.slice(0, 4));
}

/* ---------- MCP ---------- */

const server = new McpServer({ name: "bu-shpe-events", version: "1.0.0" });
const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (err) => ({ isError: true, content: [{ type: "text", text: String(err?.message ?? err) }] });
const tool = (name, config, fn) =>
  server.registerTool(name, config, async (args) => {
    try {
      return ok(await fn(args));
    } catch (err) {
      return fail(err);
    }
  });

const dateArg = z.string().describe('Event date: "YYYY-MM-DD", "YYYY-MM" (month only), or "TBA" when there is no date yet.');
const photoArg = z.string().describe("Cover photo: a site path (/assets/... or /media/...) or an absolute path to a local image to upload (jpg/png/webp/avif, max 8 MB).");

tool(
  "list_events",
  {
    title: "List events",
    description: `List chapter events (${TARGET} database). Newest first; TBA events count as upcoming.`,
    inputSchema: {
      filter: z.enum(["upcoming", "past", "drafts", "all"]).default("all"),
      search: z.string().optional().describe("Case-insensitive match on the title."),
      limit: z.number().int().min(1).max(500).default(30),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ filter, search, limit }) => {
    const where = [];
    if (search) where.push(`title LIKE ${q(`%${search}%`)}`);
    if (filter === "drafts") where.push("published = 0");
    else if (filter !== "all") where.push("published = 1");
    const rows = await sql(
      `SELECT id, slug, title, date, category, published FROM events ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY CASE WHEN date = '' THEN '9999' ELSE date END DESC, id DESC`,
    );
    const picked = rows.filter((r) => (filter === "upcoming" ? isUpcoming(r.date) : filter === "past" ? !isUpcoming(r.date) : true));
    return { target: TARGET, total: picked.length, events: picked.slice(0, limit).map(summarize) };
  },
);

tool(
  "get_event",
  {
    title: "Get event",
    description: "Full details of one event, including extra photos.",
    inputSchema: { id: z.number().int().optional(), slug: z.string().optional() },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    const row = await findEvent(args);
    const photos = await sql(`SELECT id, url FROM event_photos WHERE event_id = ${q(row.id)} ORDER BY sort, id`);
    return { ...row, date: row.date || "TBA", published: !!row.published, featured: !!row.featured, url: eventUrl(row.slug), extra_photos: photos };
  },
);

tool(
  "create_event",
  {
    title: "Create event",
    description: `Add an event to the ${TARGET} site. Published events appear on the live site within about a minute.`,
    inputSchema: {
      title: z.string().min(1).max(160),
      date: dateArg,
      category: z.enum(CATEGORIES),
      description: z.string().min(1).max(600).describe("One or two sentences for event cards."),
      body: z.string().max(20000).optional().describe("Longer copy for the event page; blank lines separate paragraphs. Links: [link text](https://...) or a bare URL."),
      location: z.string().max(160).optional(),
      photo: photoArg.optional(),
      published: z.boolean().default(true).describe("false saves a hidden draft."),
      featured: z.boolean().default(false),
    },
  },
  async (a) => {
    const date = normalizeDate(a.date);
    const slug = await uniqueSlug(a.title.trim());
    const photo = await resolvePhoto(a.photo, date);
    const ts = now();
    const [row] = await sql(
      `INSERT INTO events (slug, title, date, category, description, body, photo, location, featured, published, created_at, updated_at)
       VALUES (${[slug, a.title.trim(), date, a.category, a.description.trim(), a.body?.trim() || null, photo, a.location?.trim() || null, a.featured, a.published, ts, ts].map(q).join(", ")})
       RETURNING *`,
    );
    return { created: summarize(row), photo: photo || null };
  },
);

tool(
  "update_event",
  {
    title: "Update event",
    description: "Change any fields of an existing event. Omitted fields stay as they are. Renaming changes the URL slug.",
    inputSchema: {
      id: z.number().int(),
      title: z.string().min(1).max(160).optional(),
      date: dateArg.optional(),
      category: z.enum(CATEGORIES).optional(),
      description: z.string().min(1).max(600).optional(),
      body: z.string().max(20000).nullable().optional().describe("null clears it."),
      location: z.string().max(160).nullable().optional().describe("null clears it."),
      photo: photoArg.nullable().optional().describe("New cover (path or local file); null removes the cover."),
      published: z.boolean().optional(),
      featured: z.boolean().optional(),
    },
  },
  async ({ id, ...a }) => {
    const row = await findEvent({ id });
    const set = {};
    if (a.title !== undefined && a.title.trim() !== row.title) {
      set.title = a.title.trim();
      set.slug = await uniqueSlug(set.title, id);
    }
    if (a.date !== undefined) set.date = normalizeDate(a.date);
    if (a.category !== undefined) set.category = a.category;
    if (a.description !== undefined) set.description = a.description.trim();
    if (a.body !== undefined) set.body = a.body?.trim() || null;
    if (a.location !== undefined) set.location = a.location?.trim() || null;
    if (a.published !== undefined) set.published = a.published;
    if (a.featured !== undefined) set.featured = a.featured;
    let oldPhoto = null;
    if (a.photo !== undefined) {
      set.photo = a.photo === null ? "" : await resolvePhoto(a.photo, set.date ?? row.date);
      if (set.photo !== row.photo) oldPhoto = row.photo;
    }
    if (Object.keys(set).length === 0) return { unchanged: summarize(row) };
    set.updated_at = now();
    const [updated] = await sql(
      `UPDATE events SET ${Object.entries(set).map(([k, v]) => `${k} = ${q(v)}`).join(", ")} WHERE id = ${q(id)} RETURNING *`,
    );
    if (oldPhoto) await deleteMedia(oldPhoto);
    return { updated: summarize(updated), changed: Object.keys(set).filter((k) => k !== "updated_at") };
  },
);

tool(
  "add_event_photos",
  {
    title: "Add event photos",
    description: "Upload local images (or attach site paths) to an event's photo roll, shown on its page and in /gallery.",
    inputSchema: {
      id: z.number().int(),
      photos: z.array(z.string()).min(1).max(50).describe("Absolute local image paths, or /assets/... / /media/... paths."),
    },
  },
  async ({ id, photos }) => {
    const row = await findEvent({ id });
    const [{ next }] = await sql(`SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM event_photos WHERE event_id = ${q(id)}`);
    const urls = [];
    for (const p of photos) urls.push(await resolvePhoto(p, row.date));
    await sql(
      `INSERT OR IGNORE INTO event_photos (event_id, url, sort) VALUES ${urls.map((u, i) => `(${q(id)}, ${q(u)}, ${q(next + i)})`).join(", ")}`,
    );
    return { event: summarize(row), added: urls };
  },
);

tool(
  "delete_event",
  {
    title: "Delete event",
    description: "Permanently delete an event, its photo roll, and its uploaded images. To just hide it, use update_event with published: false.",
    inputSchema: { id: z.number().int() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const row = await findEvent({ id });
    const photos = await sql(`SELECT url FROM event_photos WHERE event_id = ${q(id)}`);
    await sql(`DELETE FROM event_photos WHERE event_id = ${q(id)}; DELETE FROM events WHERE id = ${q(id)}`);
    for (const p of [row.photo, ...photos.map((r) => r.url)]) await deleteMedia(p);
    return { deleted: summarize(row) };
  },
);

await server.connect(new StdioServerTransport());
