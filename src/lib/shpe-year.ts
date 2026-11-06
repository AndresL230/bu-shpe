/**
 * SHPE years run August through July, like the academic year. A SHPE year is
 * stored as its starting calendar year (2026 = Aug 2026 – Jul 2027) and shown
 * as "26-27". Safe to import from client and server code.
 */

/** Start year of the SHPE year containing `d` (default: today). */
export function currentShpeYear(d: Date = new Date()): number {
  const y = d.getUTCFullYear();
  return d.getUTCMonth() >= 7 ? y : y - 1;
}

/**
 * Start year of the SHPE year an ISO date ("2026-10", "2026-10-28") falls in.
 * An empty date ("Date TBA") counts as the current SHPE year.
 */
export function shpeYearOf(date: string): number {
  if (!date) return currentShpeYear();
  const y = parseInt(date.slice(0, 4), 10);
  const m = parseInt(date.slice(5, 7), 10) || 1;
  return m >= 8 ? y : y - 1;
}

/** 2026 -> "26-27". */
export function formatShpeYear(start: number): string {
  const two = (n: number) => String(n % 100).padStart(2, "0");
  return `${two(start)}-${two(start + 1)}`;
}

/** 2026 -> "2026–27", for places that want the full start year. */
export function formatShpeYearLong(start: number): string {
  return `${start}–${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Parses what people type for a SHPE year: "26-27", "2026-27", "2026–2027",
 * "2026/27", or a bare start year "2026". Returns the start year, or null.
 */
export function parseShpeYear(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const bare = /^(\d{4})$/.exec(s);
  if (bare) return Number(bare[1]);
  const m = /^(\d{2}|\d{4})\s*[-–—/]\s*(\d{2}|\d{4})$/.exec(s);
  if (!m) return null;
  const start = m[1].length === 2 ? 2000 + Number(m[1]) : Number(m[1]);
  const endRaw = Number(m[2]);
  const end = m[2].length === 2 ? Math.floor(start / 100) * 100 + endRaw + (endRaw < start % 100 ? 100 : 0) : endRaw;
  return end === start + 1 ? start : null;
}

/** Board terms are stored as "2026–2027"; this returns 2026 (or null). */
export function termStartYear(term: string): number | null {
  return parseShpeYear(term);
}
