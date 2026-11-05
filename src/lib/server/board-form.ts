/** Parses + validates the admin e-board member form. */
import { normalizeTerm, type BoardInput } from "@/lib/server/board";
import { checkImage, hasUpload } from "@/lib/server/media";

export const BOARD_MESSAGES = {
  added: "Added to the board.",
  updated: "Saved.",
  removed: "Removed from the board.",
  moved: "Order updated.",
  photo_removed: "Photo removed.",
  copied: "New year started with the same roles. Fill in the names.",
  name: "Enter a name.",
  role: "Enter a position.",
  term: "Academic year must look like 2026–2027.",
  term_exists: "That year already has members.",
  term_empty: "Pick a year to copy roles from.",
  image: "Photo must be a JPEG, PNG, WebP, or AVIF image, 8 MB or smaller.",
  upload_failed: "The photo upload failed. Try again.",
  not_found: "That member doesn't exist anymore.",
  server: "Something went wrong saving that. Try again.",
} as const;
export type BoardCode = keyof typeof BOARD_MESSAGES;

export function boardMessage(code: string | null): string | null {
  return code && code in BOARD_MESSAGES ? BOARD_MESSAGES[code as BoardCode] : null;
}

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export function parseBoardForm(
  fd: FormData,
): { ok: true; value: BoardInput; upload: File | null } | { ok: false; error: BoardCode } {
  const name = text(fd, "name", 120);
  const role = text(fd, "role", 120);
  const term = normalizeTerm(text(fd, "term", 20));
  if (!name) return { ok: false, error: "name" };
  if (!role) return { ok: false, error: "role" };
  if (!term) return { ok: false, error: "term" };
  const photo = fd.get("photo");
  const upload = hasUpload(photo) ? photo : null;
  if (upload && checkImage(upload)) return { ok: false, error: "image" };
  const sort = Number(fd.get("sort"));
  return {
    ok: true,
    upload,
    value: {
      term,
      name,
      role,
      major: text(fd, "major", 120),
      classYear: text(fd, "class_year", 40),
      hometown: text(fd, "hometown", 120),
      bio: text(fd, "bio", 600),
      isAdvisor: fd.get("is_advisor") === "on",
      sort: Number.isFinite(sort) ? sort : 0,
    },
  };
}
