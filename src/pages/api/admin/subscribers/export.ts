import type { APIRoute } from "astro";
import { toCsv, type SubscriberRow } from "@/lib/server/subscribers";

export const prerender = false;

/** Full ledger as CSV. `?status=subscribed` narrows to active addresses. */
export const GET: APIRoute = async ({ url, locals }) => {
  const status = url.searchParams.get("status");
  const db = locals.runtime.env.DB;
  const stmt =
    status === "subscribed" || status === "unsubscribed"
      ? db.prepare("SELECT * FROM subscribers WHERE status = ? ORDER BY created_at, id").bind(status)
      : db.prepare("SELECT * FROM subscribers ORDER BY created_at, id");
  const { results } = await stmt.all<SubscriberRow>();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(results), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bu-shpe-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};
