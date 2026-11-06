/** Parses + validates the admin volunteering-program form; reorders programs. */
import type { VolunteeringInput } from "@/lib/server/content";
import { listVolunteering } from "@/lib/server/content";
import { parsePhotoChanges, type PhotoChanges } from "@/lib/server/convention-form";
import { parseShpeYear } from "@/lib/shpe-year";

export const VOLUNTEERING_MESSAGES = {
  added: "Program added.",
  updated: "Saved.",
  deleted: "Program deleted.",
  moved: "Order updated.",
  name: "Enter a name.",
  shpe_year: "SHPE year must look like 26-27, 2026-27 or 2026. Leave it blank for ongoing.",
  image: "Photos must be JPEG, PNG, WebP, or AVIF images, 8 MB or smaller.",
  too_many: "That's too many photos. Keep it to 24 or fewer.",
  path: "Photo paths must start with /assets/ or /media/.",
  upload_failed: "A photo upload failed. Try again.",
  not_found: "That program doesn't exist anymore.",
  server: "Something went wrong saving that. Try again.",
} as const;
export type VolunteeringCode = keyof typeof VOLUNTEERING_MESSAGES;

export function volunteeringMessage(code: string | null): string | null {
  return code && code in VOLUNTEERING_MESSAGES ? VOLUNTEERING_MESSAGES[code as VolunteeringCode] : null;
}

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export type VolunteeringFields = Omit<VolunteeringInput, "photos" | "sort">;

export function parseVolunteeringForm(
  fd: FormData,
): { ok: true; value: VolunteeringFields; photos: PhotoChanges } | { ok: false; error: VolunteeringCode } {
  const name = text(fd, "name", 160);
  if (!name) return { ok: false, error: "name" };
  const yearRaw = text(fd, "shpe_year", 20);
  const shpeYear = yearRaw ? parseShpeYear(yearRaw) : null;
  if (yearRaw && (shpeYear === null || shpeYear < 1950 || shpeYear > 2100)) return { ok: false, error: "shpe_year" };
  const photos = parsePhotoChanges(fd);
  if (!photos.ok) return photos;
  return { ok: true, photos: photos.value, value: { name, description: text(fd, "description", 2000), shpeYear } };
}

/** Swaps a program with its neighbour and renumbers the whole list (10, 20, …). */
export async function moveVolunteering(db: D1Database, id: number, dir: -1 | 1): Promise<void> {
  const all = await listVolunteering(db);
  const i = all.findIndex((v) => v.id === id);
  if (i < 0 || !all[i + dir]) return;
  [all[i], all[i + dir]] = [all[i + dir], all[i]];
  await db.batch(all.map((v, n) => db.prepare("UPDATE volunteering_programs SET sort = ? WHERE id = ?").bind((n + 1) * 10, v.id)));
}
