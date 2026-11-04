import type { APIRoute } from "astro";
import { beginGoogleAuth } from "@/lib/server/auth";

export const prerender = false;

/** Starts Google sign-in. `?mode=popup` when opened from the sign-in popup. */
export const GET: APIRoute = async ({ locals, cookies, url, redirect }) => {
  const env = locals.runtime.env;
  const mode = url.searchParams.get("mode") === "popup" ? "popup" : "page";
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    // Route through the callback screen so the popup reports back to its opener.
    return redirect(`/admin/callback?error=not_configured&mode=${mode}`, 302);
  }
  const authorizeUrl = await beginGoogleAuth(env, cookies, url, mode);
  return redirect(authorizeUrl, 302);
};
