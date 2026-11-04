/**
 * D1 access + parsing for the mailing list (`subscribers` table, 0001_init.sql).
 */

export interface SubscriberRow {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: "subscribed" | "unsubscribed";
  source: "website" | "admin" | "import";
  unsubscribe_token: string;
  created_at: string;
  unsubscribed_at: string | null;
}

export interface SubscriberInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

// Pragmatic check: one @, no spaces, a dot in the domain, sane length.
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

function cleanName(raw: string | null | undefined): string | null {
  const s = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return s || null;
}

/** 32 random bytes, base64url. Used in unsubscribe links. */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type UpsertOutcome = "added" | "resubscribed" | "unchanged";

/**
 * Public signup: insert, or flip a previous unsubscribe back to subscribed.
 * Names only fill blanks so a typo'd re-signup can't wipe a stored name.
 */
export async function upsertFromWebsite(db: D1Database, input: SubscriberInput): Promise<UpsertOutcome> {
  const email = normalizeEmail(input.email);
  const first = cleanName(input.firstName);
  const last = cleanName(input.lastName);
  const existing = await db
    .prepare("SELECT id, status FROM subscribers WHERE email = ?")
    .bind(email)
    .first<{ id: number; status: SubscriberRow["status"] }>();
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO subscribers (email, first_name, last_name, source, unsubscribe_token)
         VALUES (?, ?, ?, 'website', ?)
         ON CONFLICT(email) DO NOTHING`,
      )
      .bind(email, first, last, newToken())
      .run();
    return "added";
  }
  await db
    .prepare(
      `UPDATE subscribers
          SET status = 'subscribed', unsubscribed_at = NULL,
              first_name = COALESCE(first_name, ?), last_name = COALESCE(last_name, ?)
        WHERE id = ?`,
    )
    .bind(first, last, existing.id)
    .run();
  return existing.status === "unsubscribed" ? "resubscribed" : "unchanged";
}

/** Admin "add one". Never re-subscribes someone who opted out. */
export async function addFromAdmin(
  db: D1Database,
  input: SubscriberInput,
): Promise<"added" | "exists" | "opted-out" | "invalid"> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) return "invalid";
  const existing = await db
    .prepare("SELECT status FROM subscribers WHERE email = ?")
    .bind(email)
    .first<{ status: SubscriberRow["status"] }>();
  if (existing) return existing.status === "unsubscribed" ? "opted-out" : "exists";
  await db
    .prepare(
      `INSERT INTO subscribers (email, first_name, last_name, source, unsubscribe_token)
       VALUES (?, ?, ?, 'admin', ?) ON CONFLICT(email) DO NOTHING`,
    )
    .bind(email, cleanName(input.firstName), cleanName(input.lastName), newToken())
    .run();
  return "added";
}

/**
 * Parses pasted import lines. Accepts, one per line:
 *   jane@bu.edu
 *   Jane Doe <jane@bu.edu>
 *   Jane,Doe,jane@bu.edu      (CSV first,last,email; a header row is skipped)
 */
export function parseImport(text: string): { valid: SubscriberInput[]; invalid: string[] } {
  const valid: SubscriberInput[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    let rec: SubscriberInput | null = null;
    const angle = line.match(/^(.*?)<\s*([^>]+?)\s*>\s*$/);
    if (angle) {
      const name = angle[1].replace(/^["']|["']$/g, "").trim().split(/\s+/).filter(Boolean);
      rec = { email: angle[2], firstName: name[0] ?? null, lastName: name.slice(1).join(" ") || null };
    } else if (line.includes(",")) {
      const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cells.length >= 3) rec = { firstName: cells[0], lastName: cells[1], email: cells[2] };
      else {
        const email = cells.find((c) => c.includes("@")) ?? "";
        rec = { email };
      }
      // Header row like "first,last,email"
      if (/^e-?mail$/i.test(rec.email.trim())) continue;
    } else {
      rec = { email: line };
    }
    const email = normalizeEmail(rec.email);
    if (!isValidEmail(email)) {
      invalid.push(line);
      continue;
    }
    if (seen.has(email)) continue; // duplicate within the paste: count once
    seen.add(email);
    valid.push({ email, firstName: cleanName(rec.firstName), lastName: cleanName(rec.lastName) });
  }
  return { valid, invalid };
}

/**
 * Bulk insert. Existing addresses (including opted-out ones) are skipped, never
 * overwritten. db.batch() counts as ONE D1 query toward the per-invocation
 * limit (50 free / 1000 paid), and each statement binds 5 params (< 100 max),
 * so a single batch of up to 500 rows per call is safe.
 */
export async function importSubscribers(db: D1Database, rows: SubscriberInput[]): Promise<{ added: number; skipped: number }> {
  let added = 0;
  const stmt = db.prepare(
    `INSERT INTO subscribers (email, first_name, last_name, source, unsubscribe_token)
     VALUES (?, ?, ?, 'import', ?) ON CONFLICT(email) DO NOTHING`,
  );
  for (let i = 0; i < rows.length; i += 500) {
    const slice = rows.slice(i, i + 500);
    const results = await db.batch(slice.map((r) => stmt.bind(r.email, r.firstName ?? null, r.lastName ?? null, newToken())));
    for (const r of results) added += r.meta.changes ?? 0;
  }
  return { added, skipped: rows.length - added };
}

export async function setStatus(db: D1Database, id: number, status: SubscriberRow["status"]): Promise<void> {
  await db
    .prepare(
      status === "unsubscribed"
        ? "UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'subscribed'"
        : "UPDATE subscribers SET status = 'subscribed', unsubscribed_at = NULL WHERE id = ?",
    )
    .bind(id)
    .run();
}

export async function deleteSubscriber(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM subscribers WHERE id = ?").bind(id).run();
}

export async function findByToken(db: D1Database, token: string): Promise<SubscriberRow | null> {
  if (!token || token.length > 100) return null;
  return db.prepare("SELECT * FROM subscribers WHERE unsubscribe_token = ?").bind(token).first<SubscriberRow>();
}

/** Idempotent: returns the row (already-unsubscribed rows are left as-is). */
export async function unsubscribeByToken(db: D1Database, token: string): Promise<SubscriberRow | null> {
  const row = await findByToken(db, token);
  if (!row) return null;
  if (row.status === "subscribed") await setStatus(db, row.id, "unsubscribed");
  return row;
}

export const PAGE_SIZE = 50;

export interface ListQuery {
  q?: string;
  status?: "subscribed" | "unsubscribed" | "";
  page?: number;
}

function where(query: ListQuery): { sql: string; params: string[] } {
  const clauses: string[] = [];
  const params: string[] = [];
  const q = (query.q ?? "").trim();
  if (q) {
    // Escape LIKE wildcards so a search for "_" or "%" is literal.
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    clauses.push(
      "(email LIKE ? ESCAPE '\\' OR first_name LIKE ? ESCAPE '\\' OR last_name LIKE ? ESCAPE '\\' OR (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) LIKE ? ESCAPE '\\')",
    );
    params.push(like, like, like, like);
  }
  if (query.status) {
    clauses.push("status = ?");
    params.push(query.status);
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export async function listSubscribers(db: D1Database, query: ListQuery): Promise<{ rows: SubscriberRow[]; total: number }> {
  const w = where(query);
  const page = Math.max(1, query.page ?? 1);
  const [count, list] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM subscribers ${w.sql}`).bind(...w.params),
    db
      .prepare(`SELECT * FROM subscribers ${w.sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...w.params, PAGE_SIZE, (page - 1) * PAGE_SIZE),
  ]);
  return {
    total: ((count.results[0] as { n: number } | undefined)?.n) ?? 0,
    rows: list.results as unknown as SubscriberRow[],
  };
}

export async function countByStatus(db: D1Database): Promise<{ subscribed: number; unsubscribed: number }> {
  const { results } = await db
    .prepare("SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status")
    .all<{ status: SubscriberRow["status"]; n: number }>();
  const out = { subscribed: 0, unsubscribed: 0 };
  for (const r of results) out[r.status] = r.n;
  return out;
}

type ActiveSubscriber = Pick<SubscriberRow, "email" | "unsubscribe_token" | "first_name" | "last_name">;

export async function activeSubscribers(db: D1Database): Promise<ActiveSubscriber[]> {
  const { results } = await db
    .prepare("SELECT email, unsubscribe_token, first_name, last_name FROM subscribers WHERE status = 'subscribed' ORDER BY id")
    .all<ActiveSubscriber>();
  return results;
}

/** RFC 4180 CSV; cells starting with = + - @ are prefixed to defuse spreadsheet formulas. */
export function toCsv(rows: SubscriberRow[]): string {
  const cell = (v: string | null) => {
    let s = v ?? "";
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = "email,first_name,last_name,status,source,joined_at,unsubscribed_at";
  const lines = rows.map((r) =>
    [r.email, r.first_name, r.last_name, r.status, r.source, r.created_at, r.unsubscribed_at].map(cell).join(","),
  );
  return [head, ...lines].join("\r\n") + "\r\n";
}

/**
 * Builds the post-action redirect for admin forms. `back` comes from a hidden
 * field; only same-section paths are honoured (no open redirect).
 */
export function adminReturn(back: unknown, flash: Record<string, string | number>): string {
  const raw = typeof back === "string" ? back : "";
  const base = new URL(/^\/admin\/subscribers(\/|\?|$)/.test(raw) ? raw : "/admin/subscribers", "http://x");
  for (const k of ["flash", "added", "skipped", "invalid", "email"]) base.searchParams.delete(k);
  for (const [k, v] of Object.entries(flash)) base.searchParams.set(k, String(v));
  return `${base.pathname}${base.search}`;
}
