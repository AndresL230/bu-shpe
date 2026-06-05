// Helpers for the conferences section. Pure functions, no DOM.

/** Format an ISO date range like "Oct 28–31, 2026" or "Oct 28 – Nov 1, 2026". */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const mon = (d: Date) => d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const startMon = mon(start);
  const endMon = mon(end);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();
  if (startMon === endMon) {
    return `${startMon} ${startDay}–${endDay}, ${year}`;
  }
  return `${startMon} ${startDay} – ${endMon} ${endDay}, ${year}`;
}

/** Format a single ISO date like "Oct 28, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
