import type { APIRoute } from "astro";
import { copyTermRoles, insertBoardMember, listBoard, nextSort, normalizeTerm } from "@/lib/server/board";
import { parseBoardForm } from "@/lib/server/board-form";
import { deleteMediaPath, putBoardPhoto } from "@/lib/server/media";

export const prerender = false;

/** POST — `action` = add (new member) | copy (start a new year from an existing one's roles). */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env;
  const fd = await request.formData();
  const action = String(fd.get("action") ?? "add");
  const back = (term: string | null, q: string) =>
    redirect(`/admin/board?${term ? `term=${encodeURIComponent(term)}&` : ""}${q}`, 303);

  if (action === "copy") {
    const from = normalizeTerm(String(fd.get("from") ?? ""));
    const to = normalizeTerm(String(fd.get("to") ?? ""));
    if (!to) return back(from, "error=term");
    if (!from) return back(null, "error=term_empty");
    if ((await listBoard(env.DB, to)).length) return back(to, "error=term_exists");
    await copyTermRoles(env.DB, from, to);
    return back(to, "ok=copied");
  }

  const parsed = parseBoardForm(fd);
  const term = normalizeTerm(String(fd.get("term") ?? ""));
  if (!parsed.ok) return back(term, `error=${parsed.error}`);
  const { value, upload } = parsed;
  if (!fd.has("sort") || String(fd.get("sort")).trim() === "") {
    value.sort = value.isAdvisor ? 900 : await nextSort(env.DB, value.term);
  }

  let photo = "";
  if (upload) {
    try {
      photo = await putBoardPhoto(env.MEDIA, upload, value.term);
    } catch (err) {
      console.error("board photo upload failed:", err);
      return back(value.term, "error=upload_failed");
    }
  }
  try {
    await insertBoardMember(env.DB, value, photo);
  } catch (err) {
    console.error("add board member failed:", err);
    await deleteMediaPath(env.MEDIA, photo);
    return back(value.term, "error=server");
  }
  return back(value.term, "ok=added");
};
