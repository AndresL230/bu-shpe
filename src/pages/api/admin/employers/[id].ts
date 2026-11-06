import type { APIRoute } from "astro";
import { deleteEmployer, getEmployer, nextEmployerSort, updateEmployer } from "@/lib/server/content";
import { canonicalIndustry, moveEmployer, parseEmployerForm } from "@/lib/server/employer-form";
import { releaseMedia } from "@/lib/server/partner-form";
import { deleteMediaPath, putImage } from "@/lib/server/media";

export const prerender = false;

/** POST — `action` = update | delete | up | down | remove_logo, for one company. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getEmployer(env.DB, id) : null;
  if (!existing) return redirect("/admin/employers?error=not_found", 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "update");
  const list = (q: string, anchor = `#e${id}`) => redirect(`/admin/employers?${q}${anchor}`, 303);
  const edit = (q: string) => redirect(`/admin/employers/${id}?${q}`, 303);
  const oldLogo = existing.logo;

  if (action === "up" || action === "down") {
    await moveEmployer(env.DB, id, action === "up" ? -1 : 1);
    return list("ok=moved");
  }

  if (action === "delete") {
    await deleteEmployer(env.DB, id);
    await releaseMedia(env.DB, env.MEDIA, oldLogo);
    return list("ok=removed", "");
  }

  if (action === "remove_logo") {
    const { industry, name, domain, sort } = existing;
    await updateEmployer(env.DB, id, { industry, name, domain, logo: "", sort });
    await releaseMedia(env.DB, env.MEDIA, oldLogo);
    return edit("ok=logo_removed");
  }

  const parsed = parseEmployerForm(fd);
  if (!parsed.ok) return edit(`error=${parsed.error}`);
  const { input, upload } = parsed.value;
  input.industry = await canonicalIndustry(env.DB, input.industry);
  // Keep its place; a company moved to another industry goes to the end of that one.
  input.sort = input.industry === existing.industry ? existing.sort : await nextEmployerSort(env.DB, input.industry);

  if (upload) {
    try {
      input.logo = await putImage(env.MEDIA, upload, "employers", "logos");
    } catch (err) {
      console.error("employer logo upload failed:", err);
      return edit("error=upload_failed");
    }
  }
  try {
    await updateEmployer(env.DB, id, input);
  } catch (err) {
    console.error("update employer failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, input.logo);
    return edit("error=server");
  }
  if (oldLogo !== input.logo) await releaseMedia(env.DB, env.MEDIA, oldLogo);
  return list("ok=updated");
};
