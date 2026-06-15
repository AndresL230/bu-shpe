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

/** True when the event is in the future relative to the current month. */
export function isUpcoming(date: string): boolean {
  const today = new Date().toISOString().slice(0, 7); // yyyy-mm
  return date >= today;
}
