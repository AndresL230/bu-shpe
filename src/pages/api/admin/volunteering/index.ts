import type { APIRoute } from "astro";
import { insertVolunteering, nextVolunteeringSort } from "@/lib/server/content";
import { discardUploads, mergePhotos, uploadPhotos } from "@/lib/server/convention-form";
import { parseVolunteeringForm } from "@/lib/server/volunteering-form";

export const prerender = false;

/** POST — add a volunteering program (goes to the end of the list). */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const back = (q: string) => redirect(`/admin/volunteering/new?${q}`, 303);

  const parsed = parseVolunteeringForm(fd);
  if (!parsed.ok) return back(`error=${parsed.error}`);
  const { value, photos } = parsed;

  let uploaded: string[] = [];
  try {
    uploaded = await uploadPhotos(env.MEDIA, photos.uploads, "volunteering", value.shpeYear ?? "ongoing");
  } catch (err) {
    console.error("volunteering photo upload failed:", err);
    return back("error=upload_failed");
  }
  let id: number;
  try {
    const sort = await nextVolunteeringSort(env.DB);
    id = await insertVolunteering(env.DB, { ...value, sort, photos: mergePhotos([], photos, uploaded) });
  } catch (err) {
    console.error("add volunteering program failed:", err);
    await discardUploads(env.MEDIA, uploaded);
    return back("error=server");
  }
  return redirect(`/admin/volunteering?ok=added#v${id}`, 303);
};
