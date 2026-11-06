/**
 * D1 data access for chapter content that used to live in src/data/*.json
 * (migrations/0007_chapter_content.sql): partners, employers, convention
 * records, and volunteering programs.
 *
 * SHPE years are stored as the starting calendar year (2026 = "26-27");
 * format them with src/lib/shpe-year.ts.
 */
import type { Conference, EmployerGroup, Sponsor, VolunteeringProgram } from "@/types";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

/** JSON array column -> string[] (tolerates bad data). */
function list(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  } catch {
    return [];
  }
}
const json = (v: string[]) => JSON.stringify(v.map((s) => s.trim()).filter(Boolean));

/* ================= Partners & sponsors ================= */

export const PARTNER_TIERS = ["Platinum", "Gold", "Silver", "Bronze"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

export interface PartnerRecord extends Sponsor {
  id: number;
  shpeYear: number;
  sort: number;
}
interface PartnerRow {
  id: number;
  shpe_year: number;
  name: string;
  logo: string;
  url: string;
  tier: string;
  sort: number;
}
export interface PartnerInput {
  shpeYear: number;
  name: string;
  logo: string;
  url: string;
  tier: PartnerTier | "";
  sort: number;
}

const toPartner = (r: PartnerRow): PartnerRecord => ({
  id: r.id,
  shpeYear: r.shpe_year,
  name: r.name,
  logo: r.logo,
  url: r.url || undefined,
  tier: (PARTNER_TIERS as readonly string[]).includes(r.tier) ? (r.tier as PartnerTier) : undefined,
  sort: r.sort,
});

/** SHPE years that have partners, newest first. */
export async function listPartnerYears(db: D1Database): Promise<number[]> {
  const { results } = await db.prepare("SELECT DISTINCT shpe_year FROM partners ORDER BY shpe_year DESC").all<{ shpe_year: number }>();
  return results.map((r) => r.shpe_year);
}

/** The year the public site shows: the newest SHPE year with any partners. */
export async function publicPartnerYear(db: D1Database): Promise<number | null> {
  const r = await db.prepare("SELECT MAX(shpe_year) AS y FROM partners").first<{ y: number | null }>();
  return r?.y ?? null;
}

export async function listPartners(db: D1Database, shpeYear: number): Promise<PartnerRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM partners WHERE shpe_year = ? ORDER BY sort, id")
    .bind(shpeYear)
    .all<PartnerRow>();
  return results.map(toPartner);
}

/** Partners for the public site (newest year). Empty if none. */
export async function listPublicPartners(db: D1Database): Promise<PartnerRecord[]> {
  const y = await publicPartnerYear(db);
  return y === null ? [] : listPartners(db, y);
}

export async function getPartner(db: D1Database, id: number): Promise<PartnerRecord | null> {
  const r = await db.prepare("SELECT * FROM partners WHERE id = ?").bind(id).first<PartnerRow>();
  return r ? toPartner(r) : null;
}

export async function nextPartnerSort(db: D1Database, shpeYear: number): Promise<number> {
  const r = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM partners WHERE shpe_year = ?").bind(shpeYear).first<{ s: number }>();
  return (r?.s ?? 0) + 10;
}

export async function insertPartner(db: D1Database, p: PartnerInput): Promise<number> {
  const r = await db
    .prepare("INSERT INTO partners (shpe_year, name, logo, url, tier, sort) VALUES (?, ?, ?, ?, ?, ?) RETURNING id")
    .bind(p.shpeYear, p.name, p.logo, p.url, p.tier, p.sort)
    .first<{ id: number }>();
  return r!.id;
}

export async function updatePartner(db: D1Database, id: number, p: PartnerInput): Promise<void> {
  await db
    .prepare(`UPDATE partners SET shpe_year = ?, name = ?, logo = ?, url = ?, tier = ?, sort = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(p.shpeYear, p.name, p.logo, p.url, p.tier, p.sort, id)
    .run();
}

export async function deletePartner(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM partners WHERE id = ?").bind(id).run();
}

/** Starts a SHPE year from another year's partner list (same logos/order). Returns rows copied. */
export async function copyPartnerYear(db: D1Database, from: number, to: number): Promise<number> {
  const src = await listPartners(db, from);
  if (!src.length) return 0;
  await db.batch(
    src.map((p) =>
      db
        .prepare("INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT ?, name, logo, url, tier, sort FROM partners WHERE id = ?")
        .bind(to, p.id),
    ),
  );
  return src.length;
}

/* ================= Employers ("Where SHPE takes us") ================= */

export interface EmployerRecord {
  id: number;
  industry: string;
  name: string;
  domain: string;
  logo: string;
  sort: number;
}
export type EmployerInput = Omit<EmployerRecord, "id">;

export async function listEmployers(db: D1Database): Promise<EmployerRecord[]> {
  const { results } = await db.prepare("SELECT id, industry, name, domain, logo, sort FROM employers ORDER BY sort, id").all<EmployerRecord>();
  return results;
}

/** Employers grouped by industry, industries in order of their first company. Same shape as employers.json. */
export async function listEmployerGroups(db: D1Database): Promise<EmployerGroup[]> {
  const groups: EmployerGroup[] = [];
  for (const e of await listEmployers(db)) {
    let g = groups.find((x) => x.industry === e.industry);
    if (!g) groups.push((g = { industry: e.industry, companies: [] }));
    g.companies.push({ name: e.name, domain: e.domain || undefined, logo: e.logo || undefined });
  }
  return groups;
}

export async function listIndustries(db: D1Database): Promise<string[]> {
  return (await listEmployerGroups(db)).map((g) => g.industry);
}

export async function getEmployer(db: D1Database, id: number): Promise<EmployerRecord | null> {
  return db.prepare("SELECT id, industry, name, domain, logo, sort FROM employers WHERE id = ?").bind(id).first<EmployerRecord>();
}

/** Sort value that places a new company at the end of its industry (or the end of the list for a new industry). */
export async function nextEmployerSort(db: D1Database, industry: string): Promise<number> {
  const inGroup = await db.prepare("SELECT MAX(sort) AS s FROM employers WHERE industry = ?").bind(industry).first<{ s: number | null }>();
  if (inGroup?.s != null) return inGroup.s + 1;
  const all = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM employers").first<{ s: number }>();
  return (all?.s ?? 0) + 10;
}

export async function insertEmployer(db: D1Database, e: EmployerInput): Promise<number> {
  const r = await db
    .prepare("INSERT INTO employers (industry, name, domain, logo, sort) VALUES (?, ?, ?, ?, ?) RETURNING id")
    .bind(e.industry, e.name, e.domain, e.logo, e.sort)
    .first<{ id: number }>();
  return r!.id;
}

export async function updateEmployer(db: D1Database, id: number, e: EmployerInput): Promise<void> {
  await db
    .prepare(`UPDATE employers SET industry = ?, name = ?, domain = ?, logo = ?, sort = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(e.industry, e.name, e.domain, e.logo, e.sort, id)
    .run();
}

export async function deleteEmployer(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM employers WHERE id = ?").bind(id).run();
}

/* ================= Convention delegation record ================= */

export interface ConventionRecord extends Conference {
  id: number;
  outcomes: string[];
}
interface ConventionRow {
  id: number;
  year: number;
  city: string;
  region: string;
  description: string;
  photos: string;
  headcount: number;
  outcomes: string;
  quote_text: string;
  quote_attribution: string;
}
export interface ConventionInput {
  year: number;
  city: string;
  region: string;
  description: string;
  photos: string[];
  headcount: number;
  outcomes: string[];
  quoteText: string;
  quoteAttribution: string;
}

const toConvention = (r: ConventionRow): ConventionRecord => ({
  id: r.id,
  year: r.year,
  city: r.city,
  region: r.region || undefined,
  description: r.description,
  photos: list(r.photos),
  headcount: r.headcount,
  outcomes: list(r.outcomes),
  quote: r.quote_text ? { text: r.quote_text, attribution: r.quote_attribution } : undefined,
});

/** Newest first, the order /conferences/record shows. */
export async function listConventionRecords(db: D1Database): Promise<ConventionRecord[]> {
  const { results } = await db.prepare("SELECT * FROM convention_records ORDER BY year DESC").all<ConventionRow>();
  return results.map(toConvention);
}

export async function getConventionRecord(db: D1Database, id: number): Promise<ConventionRecord | null> {
  const r = await db.prepare("SELECT * FROM convention_records WHERE id = ?").bind(id).first<ConventionRow>();
  return r ? toConvention(r) : null;
}

export async function conventionYearTaken(db: D1Database, year: number, exceptId?: number): Promise<boolean> {
  const r = await db.prepare("SELECT id FROM convention_records WHERE year = ?").bind(year).first<{ id: number }>();
  return !!r && r.id !== exceptId;
}

export async function insertConventionRecord(db: D1Database, c: ConventionInput): Promise<number> {
  const r = await db
    .prepare(
      `INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(c.year, c.city, c.region, c.description, json(c.photos), c.headcount, json(c.outcomes), c.quoteText, c.quoteAttribution)
    .first<{ id: number }>();
  return r!.id;
}

export async function updateConventionRecord(db: D1Database, id: number, c: ConventionInput): Promise<void> {
  await db
    .prepare(
      `UPDATE convention_records SET year = ?, city = ?, region = ?, description = ?, photos = ?, headcount = ?,
              outcomes = ?, quote_text = ?, quote_attribution = ?, updated_at = ${NOW} WHERE id = ?`,
    )
    .bind(c.year, c.city, c.region, c.description, json(c.photos), c.headcount, json(c.outcomes), c.quoteText, c.quoteAttribution, id)
    .run();
}

export async function deleteConventionRecord(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM convention_records WHERE id = ?").bind(id).run();
}

/* ================= Volunteering programs ================= */

export interface VolunteeringRecord extends VolunteeringProgram {
  id: number;
  /** SHPE year start (2026 = "26-27"), or null when ongoing / undated. */
  shpeYear: number | null;
  sort: number;
}
interface VolunteeringRow {
  id: number;
  name: string;
  description: string;
  photos: string;
  shpe_year: number | null;
  sort: number;
}
export interface VolunteeringInput {
  name: string;
  description: string;
  photos: string[];
  shpeYear: number | null;
  sort: number;
}

const toVolunteering = (r: VolunteeringRow): VolunteeringRecord => ({
  id: r.id,
  name: r.name,
  description: r.description,
  photos: list(r.photos),
  shpeYear: r.shpe_year,
  sort: r.sort,
});

export async function listVolunteering(db: D1Database): Promise<VolunteeringRecord[]> {
  const { results } = await db.prepare("SELECT * FROM volunteering_programs ORDER BY sort, id").all<VolunteeringRow>();
  return results.map(toVolunteering);
}

export async function getVolunteering(db: D1Database, id: number): Promise<VolunteeringRecord | null> {
  const r = await db.prepare("SELECT * FROM volunteering_programs WHERE id = ?").bind(id).first<VolunteeringRow>();
  return r ? toVolunteering(r) : null;
}

export async function nextVolunteeringSort(db: D1Database): Promise<number> {
  const r = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM volunteering_programs").first<{ s: number }>();
  return (r?.s ?? 0) + 10;
}

export async function insertVolunteering(db: D1Database, v: VolunteeringInput): Promise<number> {
  const r = await db
    .prepare("INSERT INTO volunteering_programs (name, description, photos, shpe_year, sort) VALUES (?, ?, ?, ?, ?) RETURNING id")
    .bind(v.name, v.description, json(v.photos), v.shpeYear, v.sort)
    .first<{ id: number }>();
  return r!.id;
}

export async function updateVolunteering(db: D1Database, id: number, v: VolunteeringInput): Promise<void> {
  await db
    .prepare(`UPDATE volunteering_programs SET name = ?, description = ?, photos = ?, shpe_year = ?, sort = ?, updated_at = ${NOW} WHERE id = ?`)
    .bind(v.name, v.description, json(v.photos), v.shpeYear, v.sort, id)
    .run();
}

export async function deleteVolunteering(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM volunteering_programs WHERE id = ?").bind(id).run();
}

/* ================= Shared ================= */

/**
 * True when a /media/... path is still referenced anywhere (event covers,
 * photo rolls, board, partners, employers, conventions, volunteering), so
 * callers only delete R2 objects nothing uses.
 */
export async function mediaInUse(db: D1Database, path: string): Promise<boolean> {
  const like = `%${JSON.stringify(path).slice(1, -1)}%`;
  const r = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM events WHERE photo = ?1) +
         (SELECT COUNT(*) FROM event_photos WHERE url = ?1) +
         (SELECT COUNT(*) FROM board_members WHERE photo = ?1) +
         (SELECT COUNT(*) FROM partners WHERE logo = ?1) +
         (SELECT COUNT(*) FROM employers WHERE logo = ?1) +
         (SELECT COUNT(*) FROM convention_records WHERE photos LIKE ?2) +
         (SELECT COUNT(*) FROM volunteering_programs WHERE photos LIKE ?2) AS n`,
    )
    .bind(path, like)
    .first<{ n: number }>();
  return (r?.n ?? 0) > 0;
}
