/** Parses + validates the admin partner form, plus partner reordering and logo cleanup. */
import { listPartners, mediaInUse, PARTNER_TIERS, type PartnerInput, type PartnerTier } from "@/lib/server/content";
import { checkImage, deleteMediaPath, hasUpload } from "@/lib/server/media";
import { parseShpeYear } from "@/lib/shpe-year";

export const PARTNER_MESSAGES = {
  added: "Partner added.",
  updated: "Saved.",
  removed: "Partner removed.",
  moved: "Order updated.",
  logo_removed: "Logo removed.",
  copied: "New year started with the same partners. Remove anyone who didn't renew.",
  name: "Enter a name.",
  year: "SHPE year must look like 26-27.",
  year_exists: "That year already has partners.",
  year_empty: "Pick a year that has partners to copy from.",
  tier: "Pick a tier from the list.",
  url: "Link must be a web address, like https://example.com.",
  logo_path: "Logo path must start with /assets/ or /media/.",
  image: "Logo must be a JPEG, PNG, WebP, or AVIF image, 8 MB or smaller.",
  upload_failed: "The logo upload failed. Try again.",
  not_found: "That partner doesn't exist anymore.",
  server: "Something went wrong saving that. Try again.",
} as const;
export type PartnerCode = keyof typeof PARTNER_MESSAGES;

export function partnerMessage(code: string | null): string | null {
  return code && code in PARTNER_MESSAGES ? PARTNER_MESSAGES[code as PartnerCode] : null;
}

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

/** "" stays "", bare domains get https://, anything that isn't http(s) is rejected (null). */
export function normalizeUrl(raw: string): string | null {
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** "" or a site-relative image path under /assets/ or /media/; null when invalid. */
export function normalizeLogoPath(raw: string): string | null {
  if (!raw) return "";
  if (raw.includes("..") || !/^\/(assets|media)\/[\w\-./]+$/.test(raw)) return null;
  return raw;
}

export interface PartnerFormValue {
  input: PartnerInput;
  /** False when the order field was left blank (caller picks a sort). */
  sortGiven: boolean;
  upload: File | null;
}

export function parsePartnerForm(fd: FormData): { ok: true; value: PartnerFormValue } | { ok: false; error: PartnerCode } {
  const name = text(fd, "name", 120);
  if (!name) return { ok: false, error: "name" };
  const shpeYear = parseShpeYear(text(fd, "year", 20));
  if (shpeYear === null || shpeYear < 1990 || shpeYear > 2100) return { ok: false, error: "year" };
  const tierRaw = text(fd, "tier", 20);
  if (tierRaw && !(PARTNER_TIERS as readonly string[]).includes(tierRaw)) return { ok: false, error: "tier" };
  const url = normalizeUrl(text(fd, "url", 300));
  if (url === null) return { ok: false, error: "url" };
  const logo = normalizeLogoPath(text(fd, "logo_path", 300));
  if (logo === null) return { ok: false, error: "logo_path" };
  const file = fd.get("logo_file");
  const upload = hasUpload(file) ? file : null;
  if (upload && checkImage(upload)) return { ok: false, error: "image" };
  const sortRaw = text(fd, "sort", 12);
  const sort = Number(sortRaw);
  const sortGiven = sortRaw !== "" && Number.isFinite(sort);
  return {
    ok: true,
    value: {
      upload,
      sortGiven,
      input: { shpeYear, name, logo, url, tier: tierRaw as PartnerTier | "", sort: sortGiven ? Math.round(sort) : 0 },
    },
  };
}

/** Swaps a partner with its neighbour in the same SHPE year, renumbering the year 10, 20, 30… */
export async function movePartner(db: D1Database, id: number, dir: -1 | 1): Promise<void> {
  const me = await db.prepare("SELECT shpe_year FROM partners WHERE id = ?").bind(id).first<{ shpe_year: number }>();
  if (!me) return;
  const list = await listPartners(db, me.shpe_year);
  const i = list.findIndex((p) => p.id === id);
  if (i < 0 || !list[i + dir]) return;
  [list[i], list[i + dir]] = [list[i + dir], list[i]];
  await db.batch(list.map((p, n) => db.prepare("UPDATE partners SET sort = ? WHERE id = ?").bind((n + 1) * 10, p.id)));
}

/**
 * Deletes an uploaded image from R2 once nothing in D1 points at it any more.
 * Call after the DB write. /assets/ paths and empty values are ignored.
 */
export async function releaseMedia(db: D1Database, bucket: R2Bucket, path: string | null | undefined): Promise<void> {
  if (!path || !path.startsWith("/media/")) return;
  try {
    if (await mediaInUse(db, path)) return;
    await deleteMediaPath(bucket, path);
  } catch (err) {
    console.error("media cleanup failed:", path, err);
  }
}
