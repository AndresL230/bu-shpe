import type { APIRoute } from "astro";
import { insertEmployer, nextEmployerSort } from "@/lib/server/content";
import { canonicalIndustry, parseEmployerForm } from "@/lib/server/employer-form";
import { deleteMediaPath, putImage } from "@/lib/server/media";

export const prerender = false;

/** POST — add a company. */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const back = (q: string, anchor = "") => redirect(`/admin/employers?${q}${anchor}`, 303);

  const parsed = parseEmployerForm(fd);
  if (!parsed.ok) return back(`error=${parsed.error}`);
  const { input, upload } = parsed.value;
  input.industry = await canonicalIndustry(env.DB, input.industry);
  input.sort = await nextEmployerSort(env.DB, input.industry);

  if (upload) {
    try {
      input.logo = await putImage(env.MEDIA, upload, "employers", "logos");
    } catch (err) {
      console.error("employer logo upload failed:", err);
      return back("error=upload_failed");
    }
  }
  let id: number;
  try {
    id = await insertEmployer(env.DB, input);
  } catch (err) {
    console.error("add employer failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, input.logo);
    return back("error=server");
  }
  return back("ok=added", `#e${id}`);
};
