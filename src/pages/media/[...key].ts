import type { APIRoute } from "astro";
import { isServableKey } from "@/lib/server/media";

export const prerender = false;

/** Streams an R2 object (events/*, gallery/*) with long-lived immutable caching. */
export const GET: APIRoute = async ({ params, locals, request }) => {
  const key = params.key ?? "";
  if (!isServableKey(key)) return new Response("Not found", { status: 404 });

  // Plain-object conditional (a Headers instance doesn't survive the dev platform proxy).
  const inm = request.headers.get("If-None-Match")?.replace(/^W\//, "").replace(/"/g, "").trim();
  const obj = await locals.runtime.env.MEDIA.get(key, inm ? { onlyIf: { etagDoesNotMatch: inm } } : undefined);
  if (!obj) return new Response("Not found", { status: 404 });

  // Copy metadata by hand: writeHttpMetadata(Headers) also trips the dev proxy.
  const headers = new Headers();
  const meta = obj.httpMetadata ?? {};
  if (meta.contentType) headers.set("Content-Type", meta.contentType);
  if (meta.contentLanguage) headers.set("Content-Language", meta.contentLanguage);
  if (meta.contentDisposition) headers.set("Content-Disposition", meta.contentDisposition);
  if (meta.contentEncoding) headers.set("Content-Encoding", meta.contentEncoding);
  headers.set("ETag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");

  // onlyIf matched the ETag → R2 returns metadata without a body.
  if (!("body" in obj)) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
