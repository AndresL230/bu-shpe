#!/usr/bin/env node
/**
 * BU SHPE content MCP server (stdio), registered as "bu-shpe-events".
 *
 * Lets Claude manage chapter content without anyone running wrangler by hand:
 * events (+ photo rolls), partners & sponsors (per SHPE year), employers,
 * National Convention records, and volunteering programs. It drives the same D1
 * database and R2 bucket the /admin portal uses, through the wrangler CLI
 * and your existing `wrangler login` — no API tokens of its own.
 *
 * Env:
 *   BU_SHPE_TARGET   "remote" (default, production) or "local" (the dev DB)
 *   CLOUDFLARE_ACCOUNT_ID  defaults to the chapter's account
 *
 * Mirrors the admin portal's rules (src/lib/server/events.ts, content.ts,
 * media.ts, src/lib/shpe-year.ts): slugs from the title with -2/-3 on
 * collision, ISO dates or "" for TBA, uploads under <folder>/<sub>/<random>.<ext>
 * served at /media/..., SHPE years (Aug–Jul) stored as the start year and
 * shown as "26-27".
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

/* ---------- SHPE years (mirrors src/lib/shpe-year.ts) ---------- */

function currentShpeYear(d = new Date()) {
  return d.getUTCMonth() >= 7 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}
function shpeYearOf(date) {
  if (!date) return currentShpeYear();
  const y = parseInt(date.slice(0, 4), 10);
  const m = parseInt(date.slice(5, 7), 10) || 1;
  return m >= 8 ? y : y - 1;
}
const formatShpeYear = (start) => `${String(start % 100).padStart(2, "0")}-${String((start + 1) % 100).padStart(2, "0")}`;
/** "26-27", "2026-27", "2026–2027", "2026" -> 2026. Throws on anything else. */
function parseShpeYear(raw) {
  const s = String(raw ?? "").trim();
  const bare = /^(\d{4})$/.exec(s);
  if (bare) return Number(bare[1]);
  const m = /^(\d{2}|\d{4})\s*[-–—/]\s*(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const start = m[1].length === 2 ? 2000 + Number(m[1]) : Number(m[1]);
    const e = Number(m[2]);
    const end = m[2].length === 2 ? Math.floor(start / 100) * 100 + e + (e < start % 100 ? 100 : 0) : e;
    if (end === start + 1) return start;
  }
  throw new Error(`SHPE year must look like "26-27", "2026-27" or "2026" (got "${s}")`);
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
    shpe_year: formatShpeYear(shpeYearOf(r.date)),
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

/** Uploads a local image to <folder>/<sub>/; returns its public /media/... path. */
async function uploadImage(filePath, folder, sub) {
  const ext = extname(filePath).toLowerCase();
  const type = IMAGE_TYPES[ext];
  if (!type) throw new Error("photo must be .jpg, .jpeg, .png, .webp or .avif");
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) throw new Error(`no file at ${filePath}`);
  if (info.size > MAX_UPLOAD_BYTES) throw new Error("photo must be 8 MB or smaller");
  const dir = String(sub ?? "").replace(/[^\w-]/g, "") || String(new Date().getUTCFullYear());
  const key = `${folder}/${dir}/${randomBytes(9).toString("base64url").slice(0, 12)}${ext === ".jpeg" ? ".jpg" : ext}`;
  await wrangler([
    "r2", "object", "put", `${BUCKET}/${key}`, `--${TARGET}`,
    "--file", filePath, "--content-type", type, "--cache-control", "public, max-age=31536000, immutable",
  ]);
  return `/media/${key}`;
}

/** Deletes an uploaded image unless anything still references it (mirrors mediaInUse in content.ts). */
async function deleteMedia(path) {
  if (!path?.startsWith("/media/")) return;
  const like = `%${JSON.stringify(path).slice(1, -1)}%`;
  const [{ n }] = await sql(
    `SELECT (SELECT COUNT(*) FROM events WHERE photo = ${q(path)})
          + (SELECT COUNT(*) FROM event_photos WHERE url = ${q(path)})
          + (SELECT COUNT(*) FROM board_members WHERE photo = ${q(path)})
          + (SELECT COUNT(*) FROM partners WHERE logo = ${q(path)})
          + (SELECT COUNT(*) FROM employers WHERE logo = ${q(path)})
          + (SELECT COUNT(*) FROM convention_records WHERE photos LIKE ${q(like)})
          + (SELECT COUNT(*) FROM volunteering_programs WHERE photos LIKE ${q(like)}) AS n`,
  );
  if (n > 0) return;
  await wrangler(["r2", "object", "delete", `${BUCKET}/${path.slice("/media/".length)}`, `--${TARGET}`]).catch(() => {});
}

/** An image argument is either a site path (/assets/..., /media/...) or a local file to upload. */
async function resolveImage(img, folder, sub) {
  if (!img) return "";
  if (img.startsWith("/assets/") || img.startsWith("/media/")) return img;
  return uploadImage(img, folder, sub);
}
const resolvePhoto = (photo, date) => resolveImage(photo, "events", date.slice(0, 4));

/* ---------- MCP ---------- */

const server = new McpServer({ name: "bu-shpe-events", version: "2.0.0" });
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
      shpe_year: z.string().optional().describe('Only events in this SHPE year (Aug–Jul), e.g. "26-27".'),
      limit: z.number().int().min(1).max(500).default(30),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ filter, search, shpe_year, limit }) => {
    const yearFilter = shpe_year ? parseShpeYear(shpe_year) : null;
    const where = [];
    if (search) where.push(`title LIKE ${q(`%${search}%`)}`);
    if (filter === "drafts") where.push("published = 0");
    else if (filter !== "all") where.push("published = 1");
    const rows = await sql(
      `SELECT id, slug, title, date, category, published FROM events ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY CASE WHEN date = '' THEN '9999' ELSE date END DESC, id DESC`,
    );
    const picked = rows
      .filter((r) => (filter === "upcoming" ? isUpcoming(r.date) : filter === "past" ? !isUpcoming(r.date) : true))
      .filter((r) => yearFilter === null || shpeYearOf(r.date) === yearFilter);
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

/* ================= Partners & sponsors (per SHPE year) ================= */

const TIERS = ["", "Platinum", "Gold", "Silver", "Bronze"];
const yearArg = z.string().describe('SHPE year (Aug–Jul), e.g. "26-27", "2026-27" or "2026".');
const imageArg = z.string().describe("A site path (/assets/... or /media/...) or an absolute path to a local image to upload (jpg/png/webp/avif, max 8 MB).");
const partnerOut = (r) => ({ id: r.id, shpe_year: formatShpeYear(r.shpe_year), name: r.name, logo: r.logo, url: r.url, tier: r.tier || null, sort: r.sort });

async function findRow(table, id) {
  const [row] = await sql(`SELECT * FROM ${table} WHERE id = ${q(id)}`);
  if (!row) throw new Error(`no ${table.replace(/_/g, " ")} row with id ${id}`);
  return row;
}
async function nextSort(table, where = "1 = 1") {
  const [{ s }] = await sql(`SELECT COALESCE(MAX(sort), 0) AS s FROM ${table} WHERE ${where}`);
  return s + 10;
}
const jsonList = (raw) => {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x) : [];
  } catch {
    return [];
  }
};
/** Applies add/remove to a JSON photo list; uploads local files. Returns [nextList, removed]. */
async function editPhotos(current, add = [], remove = [], folder, sub) {
  const removeSet = new Set(remove);
  const kept = current.filter((p) => !removeSet.has(p));
  for (const a of add) {
    const path = await resolveImage(a, folder, sub);
    if (!kept.includes(path)) kept.push(path);
  }
  return [kept, current.filter((p) => removeSet.has(p))];
}

tool(
  "list_partners",
  {
    title: "List partners & sponsors",
    description: "Partners and sponsors for a SHPE year (default: the newest year with partners, which is what the site shows). Also returns which years exist.",
    inputSchema: { shpe_year: yearArg.optional() },
    annotations: { readOnlyHint: true },
  },
  async ({ shpe_year }) => {
    const years = (await sql("SELECT DISTINCT shpe_year FROM partners ORDER BY shpe_year DESC")).map((r) => r.shpe_year);
    const year = shpe_year ? parseShpeYear(shpe_year) : years[0] ?? currentShpeYear();
    const rows = await sql(`SELECT * FROM partners WHERE shpe_year = ${q(year)} ORDER BY sort, id`);
    return { target: TARGET, shpe_year: formatShpeYear(year), shown_on_site: year === years[0], years: years.map(formatShpeYear), partners: rows.map(partnerOut) };
  },
);

tool(
  "add_partner",
  {
    title: "Add partner",
    description: "Add a partner/sponsor to a SHPE year (default: current SHPE year). Appears in the site's partner strip and /support/corporate when that year is the newest with partners.",
    inputSchema: {
      name: z.string().min(1).max(120),
      shpe_year: yearArg.optional(),
      logo: imageArg.optional(),
      url: z.string().url().optional(),
      tier: z.enum(["Platinum", "Gold", "Silver", "Bronze"]).optional(),
    },
  },
  async (a) => {
    const year = a.shpe_year ? parseShpeYear(a.shpe_year) : currentShpeYear();
    const logo = await resolveImage(a.logo, "partners", year);
    const sort = await nextSort("partners", `shpe_year = ${q(year)}`);
    const [row] = await sql(
      `INSERT INTO partners (shpe_year, name, logo, url, tier, sort) VALUES (${[year, a.name.trim(), logo, a.url ?? "", a.tier ?? "", sort].map(q).join(", ")}) RETURNING *`,
    );
    return { created: partnerOut(row) };
  },
);

tool(
  "update_partner",
  {
    title: "Update partner",
    description: "Change a partner's name, logo, link, tier, year or position. Omitted fields stay the same.",
    inputSchema: {
      id: z.number().int(),
      name: z.string().min(1).max(120).optional(),
      shpe_year: yearArg.optional(),
      logo: imageArg.nullable().optional().describe("New logo (path or local file); null removes it."),
      url: z.string().nullable().optional(),
      tier: z.enum(TIERS).optional().describe('"" clears the tier.'),
      sort: z.number().int().optional(),
    },
  },
  async ({ id, ...a }) => {
    const row = await findRow("partners", id);
    const set = {};
    if (a.name !== undefined) set.name = a.name.trim();
    if (a.shpe_year !== undefined) set.shpe_year = parseShpeYear(a.shpe_year);
    if (a.url !== undefined) set.url = a.url ?? "";
    if (a.tier !== undefined) set.tier = a.tier;
    if (a.sort !== undefined) set.sort = a.sort;
    if (a.logo !== undefined) set.logo = a.logo === null ? "" : await resolveImage(a.logo, "partners", set.shpe_year ?? row.shpe_year);
    if (!Object.keys(set).length) return { unchanged: partnerOut(row) };
    set.updated_at = now();
    const [updated] = await sql(`UPDATE partners SET ${Object.entries(set).map(([k, v]) => `${k} = ${q(v)}`).join(", ")} WHERE id = ${q(id)} RETURNING *`);
    if (set.logo !== undefined && set.logo !== row.logo) await deleteMedia(row.logo);
    return { updated: partnerOut(updated) };
  },
);

tool(
  "delete_partner",
  {
    title: "Delete partner",
    description: "Remove a partner from its SHPE year (other years keep their own rows).",
    inputSchema: { id: z.number().int() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const row = await findRow("partners", id);
    await sql(`DELETE FROM partners WHERE id = ${q(id)}`);
    await deleteMedia(row.logo);
    return { deleted: partnerOut(row) };
  },
);

tool(
  "copy_partner_year",
  {
    title: "Start a partner year",
    description: "Start a new SHPE year's partner list as a copy of another year's (same logos, links, tiers, order). Fails if the target year already has partners.",
    inputSchema: { from: yearArg, to: yearArg },
  },
  async ({ from, to }) => {
    const f = parseShpeYear(from);
    const t = parseShpeYear(to);
    const [{ n }] = await sql(`SELECT COUNT(*) AS n FROM partners WHERE shpe_year = ${q(t)}`);
    if (n > 0) throw new Error(`${formatShpeYear(t)} already has ${n} partners`);
    await sql(`INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT ${q(t)}, name, logo, url, tier, sort FROM partners WHERE shpe_year = ${q(f)}`);
    const rows = await sql(`SELECT * FROM partners WHERE shpe_year = ${q(t)} ORDER BY sort, id`);
    return { shpe_year: formatShpeYear(t), copied_from: formatShpeYear(f), partners: rows.map(partnerOut) };
  },
);

/* ================= Employers ("Where SHPE takes us") ================= */

const employerOut = (r) => ({ id: r.id, industry: r.industry, name: r.name, domain: r.domain, logo: r.logo, sort: r.sort });

tool(
  "list_employers",
  {
    title: "List employers",
    description: "Companies where members and alumni work, grouped by industry, as shown on /support, /careers, /join and the homepage.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const rows = await sql("SELECT * FROM employers ORDER BY sort, id");
    const groups = [];
    for (const r of rows) {
      let g = groups.find((x) => x.industry === r.industry);
      if (!g) groups.push((g = { industry: r.industry, companies: [] }));
      g.companies.push(employerOut(r));
    }
    return { target: TARGET, industries: groups };
  },
);

tool(
  "add_employer",
  {
    title: "Add employer",
    description: "Add a company to an industry group (a new industry name starts a new group at the end). Without a logo, the site fetches one by domain.",
    inputSchema: {
      industry: z.string().min(1).max(80),
      name: z.string().min(1).max(120),
      domain: z.string().max(120).optional().describe('e.g. "boeing.com"'),
      logo: imageArg.optional(),
    },
  },
  async (a) => {
    const industry = a.industry.trim();
    const [{ s }] = await sql(`SELECT MAX(sort) AS s FROM employers WHERE industry = ${q(industry)}`);
    const sort = s != null ? s + 1 : await nextSort("employers");
    const logo = await resolveImage(a.logo, "employers", "logos");
    const [row] = await sql(
      `INSERT INTO employers (industry, name, domain, logo, sort) VALUES (${[industry, a.name.trim(), (a.domain ?? "").trim(), logo, sort].map(q).join(", ")}) RETURNING *`,
    );
    return { created: employerOut(row) };
  },
);

tool(
  "update_employer",
  {
    title: "Update employer",
    description: "Change a company's industry, name, domain, logo or position. Omitted fields stay the same.",
    inputSchema: {
      id: z.number().int(),
      industry: z.string().min(1).max(80).optional(),
      name: z.string().min(1).max(120).optional(),
      domain: z.string().max(120).optional(),
      logo: imageArg.nullable().optional().describe("New logo (path or local file); null removes it (the site falls back to a logo by domain)."),
      sort: z.number().int().optional(),
    },
  },
  async ({ id, ...a }) => {
    const row = await findRow("employers", id);
    const set = {};
    for (const k of ["industry", "name", "domain"]) if (a[k] !== undefined) set[k] = a[k].trim();
    if (a.sort !== undefined) set.sort = a.sort;
    if (a.logo !== undefined) set.logo = a.logo === null ? "" : await resolveImage(a.logo, "employers", "logos");
    if (!Object.keys(set).length) return { unchanged: employerOut(row) };
    set.updated_at = now();
    const [updated] = await sql(`UPDATE employers SET ${Object.entries(set).map(([k, v]) => `${k} = ${q(v)}`).join(", ")} WHERE id = ${q(id)} RETURNING *`);
    if (set.logo !== undefined && set.logo !== row.logo) await deleteMedia(row.logo);
    return { updated: employerOut(updated) };
  },
);

tool(
  "delete_employer",
  {
    title: "Delete employer",
    description: "Remove a company from the employers list.",
    inputSchema: { id: z.number().int() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const row = await findRow("employers", id);
    await sql(`DELETE FROM employers WHERE id = ${q(id)}`);
    await deleteMedia(row.logo);
    return { deleted: employerOut(row) };
  },
);

/* ================= National Convention record ================= */

const conventionOut = (r) => ({
  id: r.id,
  year: r.year,
  shpe_year: formatShpeYear(r.year),
  city: r.city,
  region: r.region,
  description: r.description,
  photos: jsonList(r.photos),
  headcount: r.headcount || null,
  outcomes: jsonList(r.outcomes),
  quote: r.quote_text ? { text: r.quote_text, attribution: r.quote_attribution } : null,
});
const conventionFields = {
  city: z.string().min(1).max(120),
  region: z.string().max(80).optional().describe('Default "National Convention".'),
  description: z.string().max(4000).optional(),
  headcount: z.number().int().min(0).optional().describe("Delegates; 0 = unknown."),
  outcomes: z.array(z.string().max(200)).max(20).optional().describe("Results/highlights, one per item (replaces the list)."),
  quote_text: z.string().max(600).optional(),
  quote_attribution: z.string().max(120).optional(),
};

tool(
  "list_conventions",
  {
    title: "List convention records",
    description: "The chapter's National Convention delegation record (/conferences/record), newest first.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => ({ target: TARGET, conventions: (await sql("SELECT * FROM convention_records ORDER BY year DESC")).map(conventionOut) }),
);

tool(
  "add_convention",
  {
    title: "Add convention record",
    description: "Add a year to the convention record. Year is the convention's calendar year (fall), unique.",
    inputSchema: {
      year: z.number().int().min(1990).max(2100),
      ...conventionFields,
      photos: z.array(imageArg).max(30).optional(),
    },
  },
  async (a) => {
    const [taken] = await sql(`SELECT id FROM convention_records WHERE year = ${q(a.year)}`);
    if (taken) throw new Error(`${a.year} already has a record (id ${taken.id}); use update_convention`);
    const [photos] = await editPhotos([], a.photos ?? [], [], "conventions", a.year);
    const [row] = await sql(
      `INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution)
       VALUES (${[a.year, a.city.trim(), a.region?.trim() || "National Convention", a.description?.trim() ?? "", JSON.stringify(photos), a.headcount ?? 0, JSON.stringify(a.outcomes ?? []), a.quote_text ?? "", a.quote_attribution ?? ""].map(q).join(", ")})
       RETURNING *`,
    );
    return { created: conventionOut(row) };
  },
);

tool(
  "update_convention",
  {
    title: "Update convention record",
    description: "Edit a convention year. Omitted fields stay the same; add_photos appends (uploads local files), remove_photos drops listed paths.",
    inputSchema: {
      id: z.number().int(),
      year: z.number().int().min(1990).max(2100).optional(),
      ...Object.fromEntries(Object.entries(conventionFields).map(([k, v]) => [k, v.optional()])),
      add_photos: z.array(imageArg).max(30).optional(),
      remove_photos: z.array(z.string()).max(30).optional(),
    },
  },
  async ({ id, add_photos, remove_photos, ...a }) => {
    const row = await findRow("convention_records", id);
    const set = {};
    if (a.year !== undefined && a.year !== row.year) {
      const [taken] = await sql(`SELECT id FROM convention_records WHERE year = ${q(a.year)}`);
      if (taken) throw new Error(`${a.year} already has a record (id ${taken.id})`);
      set.year = a.year;
    }
    for (const k of ["city", "region", "description", "quote_text", "quote_attribution"]) if (a[k] !== undefined) set[k] = a[k].trim();
    if (a.headcount !== undefined) set.headcount = a.headcount;
    if (a.outcomes !== undefined) set.outcomes = JSON.stringify(a.outcomes.map((o) => o.trim()).filter(Boolean));
    let removed = [];
    if (add_photos?.length || remove_photos?.length) {
      let next;
      [next, removed] = await editPhotos(jsonList(row.photos), add_photos, remove_photos, "conventions", set.year ?? row.year);
      set.photos = JSON.stringify(next);
    }
    if (!Object.keys(set).length) return { unchanged: conventionOut(row) };
    set.updated_at = now();
    const [updated] = await sql(`UPDATE convention_records SET ${Object.entries(set).map(([k, v]) => `${k} = ${q(v)}`).join(", ")} WHERE id = ${q(id)} RETURNING *`);
    for (const p of removed) await deleteMedia(p);
    return { updated: conventionOut(updated) };
  },
);

tool(
  "delete_convention",
  {
    title: "Delete convention record",
    description: "Remove a year from the convention record (its uploaded photos are deleted unless used elsewhere).",
    inputSchema: { id: z.number().int() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const row = await findRow("convention_records", id);
    await sql(`DELETE FROM convention_records WHERE id = ${q(id)}`);
    for (const p of jsonList(row.photos)) await deleteMedia(p);
    return { deleted: conventionOut(row) };
  },
);

/* ================= Volunteering programs ================= */

const volunteeringOut = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  shpe_year: r.shpe_year == null ? null : formatShpeYear(r.shpe_year),
  photos: jsonList(r.photos),
  sort: r.sort,
});

tool(
  "list_volunteering",
  {
    title: "List volunteering programs",
    description: "Volunteering programs on /volunteering, in display order. shpe_year null = ongoing / undated.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => ({ target: TARGET, programs: (await sql("SELECT * FROM volunteering_programs ORDER BY sort, id")).map(volunteeringOut) }),
);

tool(
  "add_volunteering",
  {
    title: "Add volunteering program",
    description: "Add a volunteering program (appended to the end of /volunteering).",
    inputSchema: {
      name: z.string().min(1).max(160),
      description: z.string().max(2000).optional(),
      shpe_year: yearArg.optional().describe("SHPE year it happened; omit for ongoing."),
      photos: z.array(imageArg).max(30).optional(),
    },
  },
  async (a) => {
    const year = a.shpe_year ? parseShpeYear(a.shpe_year) : null;
    const [photos] = await editPhotos([], a.photos ?? [], [], "volunteering", year ?? "ongoing");
    const sort = await nextSort("volunteering_programs");
    const [row] = await sql(
      `INSERT INTO volunteering_programs (name, description, photos, shpe_year, sort) VALUES (${[a.name.trim(), a.description?.trim() ?? "", JSON.stringify(photos), year, sort].map(q).join(", ")}) RETURNING *`,
    );
    return { created: volunteeringOut(row) };
  },
);

tool(
  "update_volunteering",
  {
    title: "Update volunteering program",
    description: "Edit a program. Omitted fields stay the same; shpe_year null marks it ongoing; add_photos/remove_photos edit the photo list.",
    inputSchema: {
      id: z.number().int(),
      name: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).optional(),
      shpe_year: yearArg.nullable().optional(),
      sort: z.number().int().optional(),
      add_photos: z.array(imageArg).max(30).optional(),
      remove_photos: z.array(z.string()).max(30).optional(),
    },
  },
  async ({ id, add_photos, remove_photos, ...a }) => {
    const row = await findRow("volunteering_programs", id);
    const set = {};
    if (a.name !== undefined) set.name = a.name.trim();
    if (a.description !== undefined) set.description = a.description.trim();
    if (a.shpe_year !== undefined) set.shpe_year = a.shpe_year === null ? null : parseShpeYear(a.shpe_year);
    if (a.sort !== undefined) set.sort = a.sort;
    let removed = [];
    if (add_photos?.length || remove_photos?.length) {
      const year = set.shpe_year !== undefined ? set.shpe_year : row.shpe_year;
      let next;
      [next, removed] = await editPhotos(jsonList(row.photos), add_photos, remove_photos, "volunteering", year ?? "ongoing");
      set.photos = JSON.stringify(next);
    }
    if (!Object.keys(set).length) return { unchanged: volunteeringOut(row) };
    set.updated_at = now();
    const [updated] = await sql(`UPDATE volunteering_programs SET ${Object.entries(set).map(([k, v]) => `${k} = ${q(v)}`).join(", ")} WHERE id = ${q(id)} RETURNING *`);
    for (const p of removed) await deleteMedia(p);
    return { updated: volunteeringOut(updated) };
  },
);

tool(
  "delete_volunteering",
  {
    title: "Delete volunteering program",
    description: "Remove a volunteering program (its uploaded photos are deleted unless used elsewhere).",
    inputSchema: { id: z.number().int() },
    annotations: { destructiveHint: true },
  },
  async ({ id }) => {
    const row = await findRow("volunteering_programs", id);
    await sql(`DELETE FROM volunteering_programs WHERE id = ${q(id)}`);
    for (const p of jsonList(row.photos)) await deleteMedia(p);
    return { deleted: volunteeringOut(row) };
  },
);

await server.connect(new StdioServerTransport());
