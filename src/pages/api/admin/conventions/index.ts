import type { APIRoute } from "astro";
import { conventionYearTaken, insertConventionRecord } from "@/lib/server/content";
import { discardUploads, mergePhotos, parseConventionForm, uploadPhotos } from "@/lib/server/convention-form";

export const prerender = false;

/** POST — add a convention record. */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const back = (q: string) => redirect(`/admin/conventions/new?${q}`, 303);

  const parsed = parseConventionForm(fd);
  if (!parsed.ok) return back(`error=${parsed.error}`);
  const { value, photos } = parsed;
  if (await conventionYearTaken(env.DB, value.year)) return back("error=year_taken");

  let uploaded: string[] = [];
  try {
    uploaded = await uploadPhotos(env.MEDIA, photos.uploads, "conventions", value.year);
  } catch (err) {
    console.error("convention photo upload failed:", err);
    return back("error=upload_failed");
  }
  let id: number;
  try {
    id = await insertConventionRecord(env.DB, { ...value, photos: mergePhotos([], photos, uploaded) });
  } catch (err) {
    console.error("add convention record failed:", err);
    await discardUploads(env.MEDIA, uploaded);
    return back("error=server");
  }
  return redirect(`/admin/conventions?ok=added#c${id}`, 303);
};
