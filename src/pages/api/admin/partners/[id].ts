import type { APIRoute } from "astro";
import { deletePartner, getPartner, nextPartnerSort, updatePartner, type PartnerInput } from "@/lib/server/content";
import { movePartner, parsePartnerForm, releaseMedia } from "@/lib/server/partner-form";
import { deleteMediaPath, putImage } from "@/lib/server/media";
import { formatShpeYear } from "@/lib/shpe-year";

export const prerender = false;

/** POST — `action` = update | delete | up | down | remove_logo, for one partner. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getPartner(env.DB, id) : null;
  if (!existing) return redirect("/admin/partners?error=not_found", 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "update");
  const list = (year: number, q: string) => redirect(`/admin/partners?year=${formatShpeYear(year)}&${q}`, 303);
  const edit = (q: string) => redirect(`/admin/partners/${id}?${q}`, 303);
  const oldLogo = existing.logo;

  if (action === "up" || action === "down") {
    await movePartner(env.DB, id, action === "up" ? -1 : 1);
    return list(existing.shpeYear, "ok=moved");
  }

  if (action === "delete") {
    await deletePartner(env.DB, id);
    await releaseMedia(env.DB, env.MEDIA, oldLogo);
    return list(existing.shpeYear, "ok=removed");
  }

  if (action === "remove_logo") {
    const current: PartnerInput = {
      shpeYear: existing.shpeYear,
      name: existing.name,
      logo: "",
      url: existing.url ?? "",
      tier: existing.tier ?? "",
      sort: existing.sort,
    };
    await updatePartner(env.DB, id, current);
    await releaseMedia(env.DB, env.MEDIA, oldLogo);
    return edit("ok=logo_removed");
  }

  const parsed = parsePartnerForm(fd);
  if (!parsed.ok) return edit(`error=${parsed.error}`);
  const { input, upload, sortGiven } = parsed.value;
  if (!sortGiven) {
    // Keep its place; a partner moved to another year goes to the end of that year.
    input.sort = input.shpeYear === existing.shpeYear ? existing.sort : await nextPartnerSort(env.DB, input.shpeYear);
  }

  if (upload) {
    try {
      input.logo = await putImage(env.MEDIA, upload, "partners", input.shpeYear);
    } catch (err) {
      console.error("partner logo upload failed:", err);
      return edit("error=upload_failed");
    }
  }
  try {
    await updatePartner(env.DB, id, input);
  } catch (err) {
    console.error("update partner failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, input.logo);
    return edit("error=server");
  }
  if (oldLogo !== input.logo) await releaseMedia(env.DB, env.MEDIA, oldLogo);
  return list(input.shpeYear, "ok=updated");
};
