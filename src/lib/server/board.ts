/**
 * D1 data access for the e-board roster (migrations/0005_board_members.sql).
 * One row per person per academic year; the public page shows the latest term.
 */
import type { BoardMember } from "@/types";

export interface BoardRow {
  id: number;
  term: string;
  name: string;
  role: string;
  major: string;
  class_year: string;
  hometown: string;
  bio: string;
  photo: string;
  is_advisor: number;
  sort: number;
}

export interface BoardRecord extends BoardMember {
  id: number;
  term: string;
  isAdvisor: boolean;
  sort: number;
}

export const PLACEHOLDER_PHOTO = "/assets/board/placeholder.svg";

/** Academic year label, e.g. "2026–2027" (en dash). Accepts "2026-27", "2026-2027", "2026–2027". */
export function normalizeTerm(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})\s*[-–—/]\s*(\d{2}|\d{4})$/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2].length === 2 ? Math.floor(start / 100) * 100 + Number(m[2]) : Number(m[2]);
  if (end !== start + 1) return null;
  return `${start}–${end}`;
}

/** The academic year that contains `d` (Aug–Jul), e.g. Nov 2026 → "2026–2027". */
export function termFor(d = new Date()): string {
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 7 ? y : y - 1;
  return `${start}–${start + 1}`;
}

function toRecord(r: BoardRow): BoardRecord {
  return {
    id: r.id,
    term: r.term,
    name: r.name,
    role: r.role,
    major: r.major,
    year: r.class_year,
    hometown: r.hometown,
    bio: r.bio,
    photo: r.photo || PLACEHOLDER_PHOTO,
    isAdvisor: r.is_advisor === 1,
    sort: r.sort,
  };
}

/** Terms that have at least one member, newest first. */
export async function listTerms(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare("SELECT DISTINCT term FROM board_members ORDER BY term DESC").all<{ term: string }>();
  return results.map((r) => r.term);
}

/**
 * The year the public page shows by default: the newest one with at least one
 * officer whose name is filled in, so a freshly started (all-TBD) year stays
 * hidden until someone enters the new board.
 */
export async function publicTerm(db: D1Database): Promise<string | null> {
  const r = await db
    .prepare("SELECT MAX(term) AS term FROM board_members WHERE is_advisor = 0 AND name <> 'TBD'")
    .first<{ term: string | null }>();
  return r?.term ?? null;
}

export async function listBoard(db: D1Database, term: string): Promise<BoardRecord[]> {
  const { results } = await db
    .prepare("SELECT * FROM board_members WHERE term = ? ORDER BY is_advisor, sort, id")
    .bind(term)
    .all<BoardRow>();
  return results.map(toRecord);
}

export async function getBoardMember(db: D1Database, id: number): Promise<BoardRecord | null> {
  const r = await db.prepare("SELECT * FROM board_members WHERE id = ?").bind(id).first<BoardRow>();
  return r ? toRecord(r) : null;
}

/** Raw photo column (no placeholder substitution), for cleanup. */
export async function getBoardPhoto(db: D1Database, id: number): Promise<string> {
  const r = await db.prepare("SELECT photo FROM board_members WHERE id = ?").bind(id).first<{ photo: string }>();
  return r?.photo ?? "";
}

export interface BoardInput {
  term: string;
  name: string;
  role: string;
  major: string;
  classYear: string;
  hometown: string;
  bio: string;
  isAdvisor: boolean;
  sort: number;
}

export async function nextSort(db: D1Database, term: string): Promise<number> {
  const r = await db
    .prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM board_members WHERE term = ? AND is_advisor = 0")
    .bind(term)
    .first<{ s: number }>();
  return (r?.s ?? 0) + 10;
}

export async function insertBoardMember(db: D1Database, m: BoardInput, photo: string): Promise<number> {
  const r = await db
    .prepare(
      `INSERT INTO board_members (term, name, role, major, class_year, hometown, bio, photo, is_advisor, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(m.term, m.name, m.role, m.major, m.classYear, m.hometown, m.bio, photo, m.isAdvisor ? 1 : 0, m.sort)
    .first<{ id: number }>();
  return r!.id;
}

export async function updateBoardMember(db: D1Database, id: number, m: BoardInput, photo: string): Promise<void> {
  await db
    .prepare(
      `UPDATE board_members SET term = ?, name = ?, role = ?, major = ?, class_year = ?, hometown = ?, bio = ?,
              photo = ?, is_advisor = ?, sort = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = ?`,
    )
    .bind(m.term, m.name, m.role, m.major, m.classYear, m.hometown, m.bio, photo, m.isAdvisor ? 1 : 0, m.sort, id)
    .run();
}

export async function deleteBoardMember(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM board_members WHERE id = ?").bind(id).run();
}

/** Swaps a member's position with its neighbour in the same term (dir -1 = up, 1 = down). */
export async function moveBoardMember(db: D1Database, id: number, dir: -1 | 1): Promise<void> {
  const me = await db.prepare("SELECT * FROM board_members WHERE id = ?").bind(id).first<BoardRow>();
  if (!me) return;
  const list = (await listBoard(db, me.term)).filter((m) => m.isAdvisor === (me.is_advisor === 1));
  const i = list.findIndex((m) => m.id === id);
  const other = list[i + dir];
  if (!other) return;
  // Renumber the whole group so equal sort values can't get stuck.
  [list[i], list[i + dir]] = [list[i + dir], list[i]];
  await db.batch(list.map((m, n) => db.prepare("UPDATE board_members SET sort = ? WHERE id = ?").bind((n + 1) * 10, m.id)));
}

/**
 * Starts a new academic year from an existing one: same roles and order, names
 * left as "TBD" so nobody shows up for a year they didn't serve.
 */
export async function copyTermRoles(db: D1Database, from: string, to: string): Promise<number> {
  const src = await listBoard(db, from);
  if (!src.length) return 0;
  await db.batch(
    src.map((m) =>
      m.isAdvisor
        ? db
            .prepare(
              `INSERT INTO board_members (term, name, role, major, class_year, hometown, bio, photo, is_advisor, sort)
               SELECT ?, name, role, major, class_year, hometown, bio, photo, 1, sort FROM board_members WHERE id = ?`,
            )
            .bind(to, m.id)
        : db
            .prepare("INSERT INTO board_members (term, name, role, sort) VALUES (?, 'TBD', ?, ?)")
            .bind(to, m.role, m.sort),
    ),
  );
  return src.length;
}
