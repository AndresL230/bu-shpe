/**
 * Parses + validates the admin event form (multipart). Shared by the create
 * and update API routes; error codes map to copy in FLASH_MESSAGES so the
 * redirect query string never carries free text.
 */
import { isEventCategory, isValidEventDate, type EventInput } from "@/lib/server/events";
import { checkImage, hasUpload } from "@/lib/server/media";

export const FLASH_MESSAGES = {
  // ok
  created: "Event created.",
  updated: "Changes saved.",
  deleted: "Event deleted.",
  // errors
  title: "Give the event a title (160 characters max).",
  date: "Pick a valid date — a full date, or a month for month-only events.",
  category: "Choose one of the listed categories.",
  description: "Add a short card description (600 characters max).",
  body: "Long copy is capped at 20,000 characters.",
  location: "Location is capped at 160 characters.",
  photo_type: "Photo must be a JPEG, PNG, WebP, or AVIF image.",
  photo_size: "Photo must be 8 MB or smaller.",
  photo_path: "Photo path must start with /assets/ or /media/.",
  photo_required: "Published events need a photo — upload one or save as a draft.",
  upload_failed: "The photo upload failed. Try again.",
  not_found: "That event no longer exists.",
  confirm: "Type DELETE to confirm.",
  server: "Something went wrong saving the event. Try again.",
} as const;

export type FlashCode = keyof typeof FLASH_MESSAGES;

export function flashMessage(code: string | null): string | null {
  if (!code) return null;
  return code in FLASH_MESSAGES ? FLASH_MESSAGES[code as FlashCode] : null;
}

export interface ParsedEventForm {
  input: Omit<EventInput, "photo">;
  /** New upload, if any (already type/size checked). */
  upload: File | null;
  /** Typed/kept photo path ('' when none). */
  photoPath: string;
}

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};

export function parseEventForm(fd: FormData): { ok: true; value: ParsedEventForm } | { ok: false; error: FlashCode } {
  const title = str(fd, "title").replace(/\s+/g, " ");
  if (!title || title.length > 160) return { ok: false, error: "title" };

  const precision = str(fd, "date_precision") === "month" ? "month" : "day";
  const date = precision === "month" ? str(fd, "date_month") : str(fd, "date_day");
  if (!isValidEventDate(date) || (precision === "month") !== (date.length === 7)) {
    return { ok: false, error: "date" };
  }

  const category = str(fd, "category");
  if (!isEventCategory(category)) return { ok: false, error: "category" };

  const description = str(fd, "description");
  if (!description || description.length > 600) return { ok: false, error: "description" };

  const bodyRaw = str(fd, "body").replace(/\r\n?/g, "\n");
  if (bodyRaw.length > 20000) return { ok: false, error: "body" };

  const location = str(fd, "location");
  if (location.length > 160) return { ok: false, error: "location" };

  const file = fd.get("photo_file");
  let upload: File | null = null;
  if (hasUpload(file)) {
    const problem = checkImage(file);
    if (problem) return { ok: false, error: file.size > 8 * 1024 * 1024 ? "photo_size" : "photo_type" };
    upload = file;
  }

  const photoPath = str(fd, "photo_path");
  if (photoPath && !/^\/(assets|media)\/[\w\-./]+$/.test(photoPath)) return { ok: false, error: "photo_path" };
  if (photoPath.includes("..")) return { ok: false, error: "photo_path" };

  const published = fd.get("published") === "on";
  if (published && !upload && !photoPath) return { ok: false, error: "photo_required" };

  return {
    ok: true,
    value: {
      input: {
        title,
        date,
        category,
        description,
        body: bodyRaw ? bodyRaw : null,
        location: location || null,
        featured: fd.get("featured") === "on",
        published,
      },
      upload,
      photoPath,
    },
  };
}
