import type { APIRoute } from "astro";
import { unsubscribeByToken } from "@/lib/server/subscribers";

export const prerender = false;

/**
 * POST /api/unsubscribe
 *  - From the /unsubscribe confirm page: form field `token` → 303 to /unsubscribe?…&done=1.
 *  - RFC 8058 one-click from mail clients: `?token=` in the URL (the
 *    List-Unsubscribe header) and body `List-Unsubscribe=One-Click` → 200.
 * Idempotent: unsubscribing twice is fine. Unknown tokens never error loudly.
 */
export const POST: APIRoute = async ({ request, url, locals, redirect }) => {
  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch {
    /* one-click senders may post an empty or non-form body */
  }
  const token = String(form?.get("token") ?? url.searchParams.get("token") ?? "").trim();
  const oneClick = form?.get("List-Unsubscribe") === "One-Click" || (!form?.get("token") && url.searchParams.has("token"));

  const row = token ? await unsubscribeByToken(locals.runtime.env.DB, token) : null;

  if (oneClick) {
    return new Response(row ? "Unsubscribed." : "Unknown token.", {
      status: row ? 200 : 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return redirect(`/unsubscribe?token=${encodeURIComponent(token)}&done=1`, 303);
};

/** A plain GET (someone pasting the header URL) shows the confirm page instead of acting. */
export const GET: APIRoute = ({ url, redirect }) =>
  redirect(`/unsubscribe?token=${encodeURIComponent(url.searchParams.get("token") ?? "")}`, 302);
