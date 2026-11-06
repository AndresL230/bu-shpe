import type { APIRoute } from "astro";
import { createEvent } from "@/lib/server/events";
import { parseEventForm } from "@/lib/server/event-form";
import { putEventPhoto } from "@/lib/server/media";

export const prerender = false;

/** POST — create an event from the admin form (multipart). */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const parsed = parseEventForm(fd);
  if (!parsed.ok) return redirect(`/admin/events/new?error=${parsed.error}`, 303);

  const { input, upload, photoPath } = parsed.value;
  let photo = photoPath;
  if (upload) {
    try {
      photo = await putEventPhoto(env.MEDIA, upload, input.date.slice(0, 4) || String(new Date().getFullYear()));
    } catch (err) {
      console.error("event photo upload failed:", err);
      return redirect("/admin/events/new?error=upload_failed", 303);
    }
  }

  try {
    const id = await createEvent(env.DB, { ...input, photo });
    return redirect(`/admin/events/${id}?ok=created`, 303);
  } catch (err) {
    console.error("create event failed:", err);
    return redirect("/admin/events/new?error=server", 303);
  }
};
