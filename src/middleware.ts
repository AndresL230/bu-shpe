/**
 * Admin gate + CSRF guard. The CSRF check covers every non-GET request;
 * the admin gate only touches /admin/* and /api/admin/*; every other path
 * (including prerendered pages, which run middleware at build time with no
 * runtime env) passes straight through.
 */
import { defineMiddleware } from "astro:middleware";
import { getAdminFromRequest } from "@/lib/server/auth";

function stripSlash(p: string) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard. Replaces Astro's `security.checkOrigin` (disabled in
 * astro.config.mjs) because that check would also reject RFC 8058 one-click
 * unsubscribe POSTs, which mail providers send without an Origin header.
 * Every state-changing request must come from this origin, except the
 * one-click endpoint, which is authorized by its unguessable token instead.
 */
function isCrossSiteWrite(request: Request, url: URL, path: string): boolean {
  if (SAFE_METHODS.has(request.method)) return false;
  if (path === "/api/unsubscribe") return false;
  const origin = request.headers.get("origin");
  if (origin) return origin !== url.origin;
  // No Origin header: fall back to Fetch Metadata; reject if absent too.
  return request.headers.get("sec-fetch-site") !== "same-origin";
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = stripSlash(context.url.pathname);
  if (isCrossSiteWrite(context.request, context.url, path)) {
    return new Response("Cross-site request blocked", { status: 403 });
  }
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path.startsWith("/api/admin/") || path === "/api/admin";
  if (!isAdminPage && !isAdminApi) return next();

  // Public OAuth landing: validates its own state and creates the session.
  if (path === "/admin/callback") return next();

  const db = context.locals.runtime.env.DB;
  const admin = await getAdminFromRequest(db, context.cookies);

  if (path === "/admin") {
    if (admin) return context.redirect("/admin/dashboard", 302);
    return next();
  }

  if (!admin) {
    if (isAdminApi) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return context.redirect("/admin", 302);
  }

  context.locals.admin = admin;
  const res = await next();
  // Signed-in views must never be cached by shared caches.
  try {
    res.headers.set("Cache-Control", "private, no-store");
  } catch {
    // Immutable headers (e.g. Response.redirect) — nothing to cache anyway.
  }
  return res;
});
