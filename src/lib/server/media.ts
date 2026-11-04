/**
 * R2 media helpers. Objects live under prefixes listed in MEDIA_PREFIXES and
 * are served by src/pages/media/[...key].ts at /media/<key>.
 */
import { randomToken } from "@/lib/server/auth";

export const MEDIA_PREFIXES = ["events/", "gallery/"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function isServableKey(key: string): boolean {
  if (!key || key.includes("..") || key.includes("\\") || key.startsWith("/")) return false;
  return MEDIA_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
}

/** True for a form File that actually carries bytes (empty file inputs submit a 0-byte File). */
export function hasUpload(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && v.size > 0;
}

/** Validates type/size; returns an error message or null. */
export function checkImage(file: File): string | null {
  if (!IMAGE_TYPES[file.type]) return "Photo must be a JPEG, PNG, WebP, or AVIF image.";
  if (file.size > MAX_UPLOAD_BYTES) return "Photo must be 8 MB or smaller.";
  return null;
}

/** Stores an event photo; returns its public path (/media/events/<yyyy>/<random>.<ext>). */
export async function putEventPhoto(bucket: R2Bucket, file: File, year: string): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  const key = `events/${/^\d{4}$/.test(year) ? year : new Date().getUTCFullYear()}/${randomToken(12)}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return `/media/${key}`;
}

/** Deletes an R2 object referenced by a /media/... path. Ignores anything else (e.g. /assets/...). */
export async function deleteMediaPath(bucket: R2Bucket, path: string | null | undefined): Promise<void> {
  if (!path || !path.startsWith("/media/")) return;
  const key = path.slice("/media/".length);
  if (!isServableKey(key)) return;
  await bucket.delete(key);
}
