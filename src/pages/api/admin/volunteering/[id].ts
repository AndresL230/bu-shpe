import type { APIRoute } from "astro";
import { deleteVolunteering, getVolunteering, updateVolunteering } from "@/lib/server/content";
import { cleanupMedia, discardUploads, mergePhotos, uploadPhotos } from "@/lib/server/convention-form";
import { moveVolunteering, parseVolunteeringForm } from "@/lib/server/volunteering-form";

export const prerender = false;

/** POST — `action` = update | delete | up | down, for one volunteering program. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getVolunteering(env.DB, id) : null;
  if (!existing) return redirect("/admin/volunteering?error=not_found", 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "update");
  const edit = (q: string) => redirect(`/admin/volunteering/${id}?${q}`, 303);

  if (action === "up" || action === "down") {
    await moveVolunteering(env.DB, id, action === "up" ? -1 : 1);
    return redirect(`/admin/volunteering?ok=moved#v${id}`, 303);
  }

  if (action === "delete") {
    await deleteVolunteering(env.DB, id);
    await cleanupMedia(env.DB, env.MEDIA, existing.photos);
    return redirect("/admin/volunteering?ok=deleted", 303);
  }

  const parsed = parseVolunteeringForm(fd);
  if (!parsed.ok) return edit(`error=${parsed.error}`);
  const { value, photos } = parsed;

  let uploaded: string[] = [];
  try {
    uploaded = await uploadPhotos(env.MEDIA, photos.uploads, "volunteering", value.shpeYear ?? "ongoing");
  } catch (err) {
    console.error("volunteering photo upload failed:", err);
    return edit("error=upload_failed");
  }
  const next = mergePhotos(existing.photos, photos, uploaded);
  try {
    await updateVolunteering(env.DB, id, { ...value, sort: existing.sort, photos: next });
  } catch (err) {
    console.error("update volunteering program failed:", err);
    await discardUploads(env.MEDIA, uploaded);
    return edit("error=server");
  }
  await cleanupMedia(env.DB, env.MEDIA, existing.photos.filter((p) => !next.includes(p)));
  return edit("ok=updated");
};
