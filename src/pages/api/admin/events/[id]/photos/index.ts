import type { APIRoute } from "astro";
import { addEventPhotos, getEventById, listEventPhotos, MAX_ROLL_PHOTOS } from "@/lib/server/events";
import { checkImage, deleteMediaPath, hasUpload, putEventPhoto } from "@/lib/server/media";

export const prerender = false;

const MAX_PER_REQUEST = 12;

/**
 * POST (multipart, field `photos`, multiple) — append photos to an event's roll.
 * If the event has no cover yet, the first upload becomes the cover.
 */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const event = Number.isInteger(id) && id > 0 ? await getEventById(env.DB, id) : null;
  if (!event) return redirect("/admin/events?error=not_found", 303);
  const back = (q: string) => redirect(`/admin/events/${id}?${q}#photos`, 303);

  const files = (await request.formData()).getAll("photos").filter(hasUpload);
  if (!files.length) return back("error=photos_none");
  const existing = await listEventPhotos(env.DB, id);
  if (files.length > MAX_PER_REQUEST || existing.length + files.length > MAX_ROLL_PHOTOS) return back("error=photos_many");
  for (const f of files) {
    const bad = checkImage(f);
    if (bad) return back(`error=${bad.includes("8 MB") ? "photo_size" : "photo_type"}`);
  }

  const urls: string[] = [];
  try {
    for (const f of files) urls.push(await putEventPhoto(env.MEDIA, f, event.date.slice(0, 4) || String(new Date().getFullYear())));
  } catch (err) {
    console.error("roll upload failed:", err);
    await Promise.all(urls.map((u) => deleteMediaPath(env.MEDIA, u).catch(() => {})));
    return back("error=upload_failed");
  }

  try {
    let roll = urls;
    if (!event.photo) {
      await env.DB.prepare("UPDATE events SET photo = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(urls[0], id).run();
      roll = urls.slice(1);
    }
    await addEventPhotos(env.DB, id, roll);
  } catch (err) {
    console.error("roll insert failed:", err);
    await Promise.all(urls.map((u) => deleteMediaPath(env.MEDIA, u).catch(() => {})));
    return back("error=server");
  }
  return back("ok=photos_added");
};
