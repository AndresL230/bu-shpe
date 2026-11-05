import type { APIRoute } from "astro";
import { deleteEvent, getEventById, listEventPhotos } from "@/lib/server/events";
import { deleteMediaPath } from "@/lib/server/media";

export const prerender = false;

/** POST — delete an event. The form must carry confirm=DELETE. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getEventById(env.DB, id) : null;
  if (!existing) return redirect("/admin/events?error=not_found", 303);

  const fd = await request.formData();
  const confirm = fd.get("confirm");
  if (typeof confirm !== "string" || confirm.trim().toUpperCase() !== "DELETE") {
    return redirect(`/admin/events/${id}?error=confirm#delete`, 303);
  }

  const roll = await listEventPhotos(env.DB, id);
  await deleteEvent(env.DB, id);
  await env.DB.prepare("DELETE FROM event_photos WHERE event_id = ?").bind(id).run(); // in case FKs are off
  try {
    await Promise.all([existing.photo, ...roll.map((p) => p.url)].map((u) => deleteMediaPath(env.MEDIA, u)));
  } catch (err) {
    console.error("photo cleanup failed:", err);
  }
  return redirect("/admin/events?ok=deleted", 303);
};
