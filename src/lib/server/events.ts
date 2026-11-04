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
