import type { APIRoute } from "astro";
import { deleteEventPhoto, getEventById, getEventPhoto, swapCoverWithRollPhoto } from "@/lib/server/events";
import { deleteMediaPath } from "@/lib/server/media";

export const prerender = false;

/** POST action=remove | cover — remove a roll photo, or make it the event's cover. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const photoId = Number(params.photoId);
  const event = Number.isInteger(id) && id > 0 ? await getEventById(env.DB, id) : null;
  if (!event) return redirect("/admin/events?error=not_found", 303);
  const back = (q: string) => redirect(`/admin/events/${id}?${q}#photos`, 303);
  const photo = Number.isInteger(photoId) && photoId > 0 ? await getEventPhoto(env.DB, id, photoId) : null;
  if (!photo) return back("error=not_found");

  const action = (await request.formData()).get("action");
  if (action === "cover") {
    await swapCoverWithRollPhoto(env.DB, id, photo, event.photo);
    return back("ok=cover_set");
  }
  if (action === "remove") {
    await deleteEventPhoto(env.DB, photo.id);
    try {
      await deleteMediaPath(env.MEDIA, photo.url);
    } catch (err) {
      console.error("roll photo cleanup failed:", err);
    }
    return back("ok=photo_removed");
  }
  return back("error=server");
};
