import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const row = await locals.runtime.env.DB.prepare("SELECT COUNT(*) AS n FROM events").first<{ n: number }>();
  return Response.json({ ok: true, events: row?.n ?? 0 });
};
