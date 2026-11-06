import type { APIRoute } from "astro";
import { conventionYearTaken, deleteConventionRecord, getConventionRecord, updateConventionRecord } from "@/lib/server/content";
import { cleanupMedia, discardUploads, mergePhotos, parseConventionForm, uploadPhotos } from "@/lib/server/convention-form";

export const prerender = false;

/** POST — `action` = update | delete, for one convention record. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getConventionRecord(env.DB, id) : null;
  if (!existing) return redirect("/admin/conventions?error=not_found", 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "update");
  const edit = (q: string) => redirect(`/admin/conventions/${id}?${q}`, 303);

  if (action === "delete") {
    await deleteConventionRecord(env.DB, id);
    await cleanupMedia(env.DB, env.MEDIA, existing.photos);
    return redirect("/admin/conventions?ok=deleted", 303);
  }

  const parsed = parseConventionForm(fd);
  if (!parsed.ok) return edit(`error=${parsed.error}`);
  const { value, photos } = parsed;
  if (await conventionYearTaken(env.DB, value.year, id)) return edit("error=year_taken");

  let uploaded: string[] = [];
  try {
    uploaded = await uploadPhotos(env.MEDIA, photos.uploads, "conventions", value.year);
  } catch (err) {
    console.error("convention photo upload failed:", err);
    return edit("error=upload_failed");
  }
  const next = mergePhotos(existing.photos, photos, uploaded);
  try {
    await updateConventionRecord(env.DB, id, { ...value, photos: next });
  } catch (err) {
    console.error("update convention record failed:", err);
    await discardUploads(env.MEDIA, uploaded);
    return edit("error=server");
  }
  await cleanupMedia(env.DB, env.MEDIA, existing.photos.filter((p) => !next.includes(p)));
  return edit("ok=updated");
};
