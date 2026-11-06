/**
 * Parses + validates the admin convention-record form, plus the photo-list
 * helpers shared with the volunteering form (remove checkboxes, multi-file
 * upload, pasted /assets/... or /media/... paths).
 */
import type { ConventionInput } from "@/lib/server/content";
import { mediaInUse } from "@/lib/server/content";
import { checkImage, deleteMediaPath, hasUpload, isServableKey, putImage } from "@/lib/server/media";

export const CONVENTION_MESSAGES = {
  added: "Record added.",
  updated: "Saved.",
  deleted: "Record deleted.",
  year: "Enter the convention year, e.g. 2026.",
  year_taken: "There's already a record for that year.",
  city: "Enter the city.",
  headcount: "Headcount must be a whole number (0 if unknown).",
  image: "Photos must be JPEG, PNG, WebP, or AVIF images, 8 MB or smaller.",
  too_many: "That's too many photos. Keep it to 24 or fewer.",
  path: "Photo paths must start with /assets/ or /media/.",
  upload_failed: "A photo upload failed. Try again.",
  not_found: "That record doesn't exist anymore.",
  server: "Something went wrong saving that. Try again.",
} as const;
export type ConventionCode = keyof typeof CONVENTION_MESSAGES;

export function conventionMessage(code: string | null): string | null {
  return code && code in CONVENTION_MESSAGES ? CONVENTION_MESSAGES[code as ConventionCode] : null;
}

export const MAX_PHOTOS = 24;

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const lines = (raw: string) => raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

/* ---------------- Photo list (shared with volunteering) ---------------- */

export interface PhotoChanges {
  /** Current paths ticked "remove". */
  remove: string[];
  /** Pasted existing paths, in order. */
  paths: string[];
  /** Files to upload, in order. */
  uploads: File[];
}

/** True for a site path we accept as a photo: /assets/... or a servable /media/... key. */
export function isPhotoPath(p: string): boolean {
  if (p.length > 300 || /[\s"'<>\\]/.test(p) || p.includes("..")) return false;
  if (p.startsWith("/assets/")) return p.length > "/assets/".length;
  if (p.startsWith("/media/")) return isServableKey(p.slice("/media/".length));
  return false;
}

/** Reads remove_photo checkboxes, photo_paths textarea and the photos file input. */
export function parsePhotoChanges(fd: FormData): { ok: true; value: PhotoChanges } | { ok: false; error: "image" | "path" | "too_many" } {
  const remove = fd.getAll("remove_photo").map(String);
  const paths = lines(String(fd.get("photo_paths") ?? ""));
  if (paths.some((p) => !isPhotoPath(p))) return { ok: false, error: "path" };
  const uploads = fd.getAll("photos").filter(hasUpload);
  if (uploads.some((f) => checkImage(f))) return { ok: false, error: "image" };
  if (paths.length + uploads.length > MAX_PHOTOS) return { ok: false, error: "too_many" };
  return { ok: true, value: { remove, paths, uploads } };
}

/** Existing (minus removed) first, then pasted paths, then uploaded ones. No duplicates. */
export function mergePhotos(current: string[], changes: PhotoChanges, uploaded: string[]): string[] {
  const out: string[] = [];
  for (const p of [...current.filter((p) => !changes.remove.includes(p)), ...changes.paths, ...uploaded]) {
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

/** Uploads files to R2 under folder/sub. On failure, deletes whatever went up and rethrows. */
export async function uploadPhotos(bucket: R2Bucket, files: File[], folder: string, sub: string | number): Promise<string[]> {
  const done: string[] = [];
  try {
    for (const f of files) done.push(await putImage(bucket, f, folder, sub));
  } catch (err) {
    await discardUploads(bucket, done);
    throw err;
  }
  return done;
}

/** Deletes freshly uploaded objects (nothing references them yet). */
export async function discardUploads(bucket: R2Bucket, paths: string[]): Promise<void> {
  await Promise.all(paths.map((p) => deleteMediaPath(bucket, p).catch(() => {})));
}

/** After a DB write: deletes the R2 objects for /media/ paths nothing references anymore. */
export async function cleanupMedia(db: D1Database, bucket: R2Bucket, paths: string[]): Promise<void> {
  for (const p of new Set(paths)) {
    if (!p.startsWith("/media/")) continue;
    try {
      if (!(await mediaInUse(db, p))) await deleteMediaPath(bucket, p);
    } catch (err) {
      console.error("media cleanup failed:", p, err);
    }
  }
}

/* ---------------- Convention record ---------------- */

export type ConventionFields = Omit<ConventionInput, "photos">;

export function parseConventionForm(
  fd: FormData,
): { ok: true; value: ConventionFields; photos: PhotoChanges } | { ok: false; error: ConventionCode } {
  const yearRaw = text(fd, "year", 6);
  const year = Number(yearRaw);
  if (!/^\d{4}$/.test(yearRaw) || year < 1950 || year > 2100) return { ok: false, error: "year" };
  const city = text(fd, "city", 120);
  if (!city) return { ok: false, error: "city" };
  const headRaw = text(fd, "headcount", 6) || "0";
  if (!/^\d+$/.test(headRaw)) return { ok: false, error: "headcount" };
  const photos = parsePhotoChanges(fd);
  if (!photos.ok) return photos;
  return {
    ok: true,
    photos: photos.value,
    value: {
      year,
      city,
      region: text(fd, "region", 120) || "National Convention",
      description: text(fd, "description", 2000),
      headcount: Number(headRaw),
      outcomes: lines(text(fd, "outcomes", 3000)).map((s) => s.slice(0, 200)).slice(0, 20),
      quoteText: text(fd, "quote_text", 600),
      quoteAttribution: text(fd, "quote_attribution", 120),
    },
  };
}
