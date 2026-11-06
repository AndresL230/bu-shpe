import type { APIRoute } from "astro";
import { getEventById, updateEvent } from "@/lib/server/events";
import { parseEventForm } from "@/lib/server/event-form";
import { deleteMediaPath, putEventPhoto } from "@/lib/server/media";

export const prerender = false;

/** POST — update an event from the admin edit form (multipart). */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return redirect("/admin/events?error=not_found", 303);
  const existing = await getEventById(env.DB, id);
  if (!existing) return redirect("/admin/events?error=not_found", 303);

  const back = `/admin/events/${id}`;
  const fd = await request.formData();
  const parsed = parseEventForm(fd);
  if (!parsed.ok) return redirect(`${back}?error=${parsed.error}`, 303);

  const { input, upload, photoPath } = parsed.value;
  let photo = photoPath;
  if (upload) {
    try {
      photo = await putEventPhoto(env.MEDIA, upload, input.date.slice(0, 4) || String(new Date().getFullYear()));
    } catch (err) {
      console.error("event photo upload failed:", err);
      return redirect(`${back}?error=upload_failed`, 303);
    }
  }

  try {
    await updateEvent(env.DB, id, { ...input, photo }, existing.title);
  } catch (err) {
    console.error("update event failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, photo); // don't orphan the new upload
    return redirect(`${back}?error=server`, 303);
  }

  // Old R2 object goes only after the row points elsewhere; /assets/... files are never touched.
  if (existing.photo && existing.photo !== photo) {
    try {
      await deleteMediaPath(env.MEDIA, existing.photo);
    } catch (err) {
      console.error("old photo cleanup failed:", err);
    }
  }
  return redirect(`${back}?ok=updated`, 303);
};
