import type { APIRoute } from "astro";
import { deleteBoardMember, getBoardMember, getBoardPhoto, moveBoardMember, updateBoardMember } from "@/lib/server/board";
import { parseBoardForm } from "@/lib/server/board-form";
import { deleteMediaPath, putBoardPhoto } from "@/lib/server/media";

export const prerender = false;

/** POST — `action` = update | delete | up | down | remove_photo, for one member. */
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const env = locals.runtime.env;
  const id = Number(params.id);
  const existing = Number.isInteger(id) && id > 0 ? await getBoardMember(env.DB, id) : null;
  if (!existing) return redirect("/admin/board?error=not_found", 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "update");
  const list = (term: string, q: string) => redirect(`/admin/board?term=${encodeURIComponent(term)}&${q}`, 303);
  const edit = (q: string) => redirect(`/admin/board/${id}?${q}`, 303);
  const oldPhoto = await getBoardPhoto(env.DB, id);

  if (action === "up" || action === "down") {
    await moveBoardMember(env.DB, id, action === "up" ? -1 : 1);
    return list(existing.term, "ok=moved");
  }

  if (action === "delete") {
    await deleteBoardMember(env.DB, id);
    await deleteMediaPath(env.MEDIA, oldPhoto).catch((err) => console.error("board photo cleanup failed:", err));
    return list(existing.term, "ok=removed");
  }

  if (action === "remove_photo") {
    await updateBoardMember(env.DB, id, { ...existing, classYear: existing.year }, "");
    await deleteMediaPath(env.MEDIA, oldPhoto).catch((err) => console.error("board photo cleanup failed:", err));
    return edit("ok=photo_removed");
  }

  const parsed = parseBoardForm(fd);
  if (!parsed.ok) return edit(`error=${parsed.error}`);
  const { value, upload } = parsed;

  let photo = oldPhoto;
  if (upload) {
    try {
      photo = await putBoardPhoto(env.MEDIA, upload, value.term);
    } catch (err) {
      console.error("board photo upload failed:", err);
      return edit("error=upload_failed");
    }
  }
  try {
    await updateBoardMember(env.DB, id, value, photo);
  } catch (err) {
    console.error("update board member failed:", err);
    if (upload) await deleteMediaPath(env.MEDIA, photo);
    return edit("error=server");
  }
  if (upload && oldPhoto && oldPhoto !== photo) {
    await deleteMediaPath(env.MEDIA, oldPhoto).catch((err) => console.error("board photo cleanup failed:", err));
  }
  return list(value.term, "ok=updated");
};
