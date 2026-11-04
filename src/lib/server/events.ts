/**
 * D1 data access for events. Events used to live in src/data/events.json;
 * D1 is now the source of truth (seeded by migrations/0002_seed_events.sql).
 */
import type { EventCategory, EventItem } from "@/types";
import { eventSlug } from "@/lib/events";

export interface EventRow {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: EventCategory;
  description: string;
  body: string | null;
  photo: string;
  location: string | null;
  featured: number;
  published: number;
  created_at: string;
  updated_at: string;
}

/** Admin-facing record: the public EventItem plus DB bookkeeping. */
export interface EventRecord extends EventItem {
  id: number;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function rowToEvent(r: EventRow): EventRecord {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    date: r.date,
    category: r.category,
    description: r.description,
    body: r.body ?? undefined,
    photo: r.photo,
    location: r.location ?? undefined,
    featured: r.featured === 1,
    published: r.published === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Published events, newest first. This is what public pages render. */
export async function listPublishedEvents(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM events WHERE published = 1 ORDER BY date DESC, id DESC")
    .all<EventRow>();
  return results.map(rowToEvent);
}

/** Every event including drafts — admin only. */
export async function listAllEvents(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM events ORDER BY date DESC, id DESC")
    .all<EventRow>();
  return results.map(rowToEvent);
}

export async function getEventBySlug(db: D1Database, slug: string, opts: { includeDrafts?: boolean } = {}) {
  const sql = opts.includeDrafts
    ? "SELECT * FROM events WHERE slug = ?"
    : "SELECT * FROM events WHERE slug = ? AND published = 1";
  const row = await db.prepare(sql).bind(slug).first<EventRow>();
  return row ? rowToEvent(row) : null;
}

export async function getEventById(db: D1Database, id: number) {
  const row = await db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<EventRow>();
  return row ? rowToEvent(row) : null;
}

/** Slug derived from the title, suffixed -2, -3… if it collides with another event. */
export async function uniqueSlug(db: D1Database, title: string, exceptId?: number): Promise<string> {
  const base = eventSlug(title) || "event";
  let candidate = base;
  for (let n = 2; ; n++) {
    const hit = await db
      .prepare("SELECT id FROM events WHERE slug = ?")
      .bind(candidate)
      .first<{ id: number }>();
    if (!hit || hit.id === exceptId) return candidate;
    candidate = `${base}-${n}`;
  }
}

/**
 * Published events in creation order (id ASC) — the order the legacy
 * events.json array had. Public pages re-sort by date with a stable sort, so
 * same-month events fall back to creation order exactly as they did before
 * the move to D1.
 */
export async function listPublishedEventsInCreationOrder(db: D1Database): Promise<EventRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM events WHERE published = 1 ORDER BY id ASC")
    .all<EventRow>();
  return results.map(rowToEvent);
}

/**
 * Cache policy for public pages that render events from D1. Browsers always
 * revalidate (max-age=0) so admin edits show up on the next load; a shared
 * cache in front of the Worker may hold the page for up to a minute.
 */
export const PUBLIC_EVENTS_CACHE_CONTROL = "public, max-age=0, s-maxage=60";

/* ---------------- admin writes (Agent A) ---------------- */

export const EVENT_CATEGORIES: EventCategory[] = [
  "Professional",
  "Cultural",
  "Social",
  "Study Night",
  "Volunteering",
  "Conference",
];

export function isEventCategory(v: string): v is EventCategory {
  return (EVENT_CATEGORIES as string[]).includes(v);
}

/** ISO yyyy-mm or yyyy-mm-dd with a real month/day. */
export function isValidEventDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v);
  if (!m) return false;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return false;
  if (m[3] === undefined) return true;
  const day = Number(m[3]);
  const last = new Date(Date.UTC(Number(m[1]), month, 0)).getUTCDate();
  return day >= 1 && day <= last;
}

export interface EventInput {
  title: string;
  date: string;
  category: EventCategory;
  description: string;
  body: string | null;
  photo: string;
  location: string | null;
  featured: boolean;
  published: boolean;
}

const nowIso = () => new Date().toISOString();

export async function createEvent(db: D1Database, input: EventInput): Promise<number> {
  const slug = await uniqueSlug(db, input.title);
  const ts = nowIso();
  const row = await db
    .prepare(
      `INSERT INTO events (slug, title, date, category, description, body, photo, location, featured, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      slug, input.title, input.date, input.category, input.description, input.body,
      input.photo, input.location, input.featured ? 1 : 0, input.published ? 1 : 0, ts, ts,
    )
    .first<{ id: number }>();
  if (!row) throw new Error("insert failed");
  return row.id;
}

/** Updates an event; the slug is recomputed only when the title changes. */
export async function updateEvent(db: D1Database, id: number, input: EventInput, prevTitle: string): Promise<void> {
  const slugSql = input.title !== prevTitle ? ", slug = ?" : "";
  const binds: (string | number | null)[] = [
    input.title, input.date, input.category, input.description, input.body,
    input.photo, input.location, input.featured ? 1 : 0, input.published ? 1 : 0, nowIso(),
  ];
  if (slugSql) binds.push(await uniqueSlug(db, input.title, id));
  binds.push(id);
  await db
    .prepare(
      `UPDATE events SET title = ?, date = ?, category = ?, description = ?, body = ?,
         photo = ?, location = ?, featured = ?, published = ?, updated_at = ?${slugSql}
       WHERE id = ?`,
    )
    .bind(...binds)
    .run();
}

export async function deleteEvent(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
}
