/**
 * Kebab-case slug derived from an event title.
 * "Resume Review with GE" -> "resume-review-with-ge"
 */
export function eventSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format an ISO `yyyy-mm` or `yyyy-mm-dd` event date for display.
 *
 * Past events always render as month + year ("October 2022"), even when the
 * data carries a day. Upcoming events with an explicit day render the full
 * date ("October 15, 2026") so members know exactly when to show up.
 */
export function formatEventDate(date: string, opts: { withDay?: boolean } = {}): string {
  const [y, m, d] = date.split("-");
  const month = MONTHS[parseInt(m, 10) - 1] ?? "";
  if (opts.withDay && d) {
    return `${month} ${parseInt(d, 10)}, ${y}`;
  }
  return `${month} ${y}`;
}

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/**
 * Compact uppercase date stamp for mono labels and cards.
 *
 * Day dates render "28 OCT 2026"; month-only dates render "SEP 2026" — never
 * "SEP 26", which reads as September 26. Pass `withYear: false` only where a
 * surrounding header already states the calendar year ("28 OCT", "SEP").
 */
export function formatEventStamp(date: string, opts: { withYear?: boolean } = {}): string {
  const { withYear = true } = opts;
  const [y, m, d] = date.split("-");
  const month = MONTH_ABBR[parseInt(m, 10) - 1] ?? "—";
  const parts = [d ? String(parseInt(d, 10)).padStart(2, "0") : "", month, withYear ? y : ""];
  return parts.filter(Boolean).join(" ");
}

/**
 * Academic year (August–July) an event falls in, e.g. "2025-10" -> "2025–26",
 * "2026-03" -> "2025–26". `start` is the August calendar year, for sorting.
 */
export function academicYear(date: string): { start: number; label: string } {
  const y = parseInt(date.slice(0, 4), 10);
  const m = parseInt(date.slice(5, 7), 10);
  const start = m >= 8 ? y : y - 1;
  return { start, label: `${start}–${String((start + 1) % 100).padStart(2, "0")}` };
}

/** True when the event is in the future relative to the current month. */
export function isUpcoming(date: string): boolean {
  const today = new Date().toISOString().slice(0, 7); // yyyy-mm
  return date >= today;
}
