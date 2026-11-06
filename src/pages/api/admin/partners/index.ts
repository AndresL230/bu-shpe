import type { APIRoute } from "astro";
import { copyPartnerYear, insertPartner, listPartners, nextPartnerSort } from "@/lib/server/content";
import { parsePartnerForm } from "@/lib/server/partner-form";
import { deleteMediaPath, putImage } from "@/lib/server/media";
import { formatShpeYear, parseShpeYear } from "@/lib/shpe-year";

export const prerender = false;

/** POST — `action` = add (new partner) | copy (start a new SHPE year from an existing one's list). */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const action = String(fd.get("action") ?? "add");
  const back = (year: number | null, q: string) =>
    redirect(`/admin/partners?${year !== null ? `year=${formatShpeYear(year)}&` : ""}${q}`, 303);

  if (action === "copy") {
    const from = parseShpeYear(String(fd.get("from") ?? ""));
    const to = parseShpeYear(String(fd.get("to") ?? ""));
    if (to === null) return back(from, "error=year");
    if (from === null) return back(null, "error=year_empty");
    if ((await listPartners(env.DB, to)).length) return back(to, "error=year_exists");
    const copied = await copyPartnerYear(env.DB, from, to);
    if (!copied) return back(from, "error=year_empty");
    return back(to, "ok=copied");
  }

  const parsed = parsePartnerForm(fd);
  const fallbackYear = parseShpeYear(String(fd.get("year") ?? ""));
  if (!parsed.ok) return back(fallbackYear, `error=${parsed.error}`);
  const { input, upload, sortGiven } = parsed.value;
  if (!sortGiven) input.sort = await nextPartnerSort(env.DB, input.shpeYear);

  if (upload) {
    try {
      input.logo = await putImage(env.MEDIA, upload, "partners", input.shpeYear);
    } catch (err) {
      console.error("partner logo upload failed:", err);
      return back(input.shpeYear, "error=upload_failed");
    }
  }
  try {
    await insertPartner(env.DB, input);
  } catch (err) {
    console.error("add partner failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, input.logo);
    return back(input.shpeYear, "error=server");
  }
  return back(input.shpeYear, "ok=added");
};
