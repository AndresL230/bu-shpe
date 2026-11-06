/** Parses + validates the admin employer form, plus reordering within an industry. */
import { listEmployers, listIndustries, type EmployerInput } from "@/lib/server/content";
import { checkImage, hasUpload } from "@/lib/server/media";
import { normalizeLogoPath } from "@/lib/server/partner-form";

export const EMPLOYER_MESSAGES = {
  added: "Company added.",
  updated: "Saved.",
  removed: "Company removed.",
  moved: "Order updated.",
  logo_removed: "Logo removed. The site will look one up from the domain.",
  name: "Enter a company name.",
  industry: "Pick or type an industry.",
  domain: "Domain should look like example.com.",
  logo_path: "Logo path must start with /assets/ or /media/.",
  image: "Logo must be a JPEG, PNG, WebP, or AVIF image, 8 MB or smaller.",
  upload_failed: "The logo upload failed. Try again.",
  not_found: "That company doesn't exist anymore.",
  server: "Something went wrong saving that. Try again.",
} as const;
export type EmployerCode = keyof typeof EMPLOYER_MESSAGES;

export function employerMessage(code: string | null): string | null {
  return code && code in EMPLOYER_MESSAGES ? EMPLOYER_MESSAGES[code as EmployerCode] : null;
}

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

/** "https://www.Tesla.com/careers" -> "tesla.com"; "" stays ""; null when it isn't a domain. */
export function normalizeDomain(raw: string): string | null {
  if (!raw) return "";
  const host = raw
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/^www\./, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export interface EmployerFormValue {
  /** `sort` is left at 0; the API route decides placement. */
  input: EmployerInput;
  upload: File | null;
}

export function parseEmployerForm(fd: FormData): { ok: true; value: EmployerFormValue } | { ok: false; error: EmployerCode } {
  const industry = text(fd, "industry", 80).replace(/\s+/g, " ");
  if (!industry) return { ok: false, error: "industry" };
  const name = text(fd, "name", 120);
  if (!name) return { ok: false, error: "name" };
  const domain = normalizeDomain(text(fd, "domain", 200));
  if (domain === null) return { ok: false, error: "domain" };
  const logo = normalizeLogoPath(text(fd, "logo_path", 300));
  if (logo === null) return { ok: false, error: "logo_path" };
  const file = fd.get("logo_file");
  const upload = hasUpload(file) ? file : null;
  if (upload && checkImage(upload)) return { ok: false, error: "image" };
  return { ok: true, value: { upload, input: { industry, name, domain, logo, sort: 0 } } };
}

/**
 * Swaps a company with its neighbour inside the same industry. The group's
 * existing sort values are reused in the new order (made strictly increasing
 * without lowering the smallest), so the industry keeps its place on the page.
 */
export async function moveEmployer(db: D1Database, id: number, dir: -1 | 1): Promise<void> {
  const all = await listEmployers(db);
  const me = all.find((e) => e.id === id);
  if (!me) return;
  const group = all.filter((e) => e.industry === me.industry);
  const i = group.findIndex((e) => e.id === id);
  if (!group[i + dir]) return;
  const slots = group.map((e) => e.sort);
  for (let n = 1; n < slots.length; n++) if (slots[n] <= slots[n - 1]) slots[n] = slots[n - 1] + 1;
  [group[i], group[i + dir]] = [group[i + dir], group[i]];
  await db.batch(group.map((e, n) => db.prepare("UPDATE employers SET sort = ? WHERE id = ?").bind(slots[n], e.id)));
}

/**
 * Picks the stored spelling of an industry when the typed one only differs in
 * case ("technology" -> "Technology"), so the list doesn't split in two.
 */
export async function canonicalIndustry(db: D1Database, typed: string): Promise<string> {
  const match = (await listIndustries(db)).find((i) => i.toLowerCase() === typed.toLowerCase());
  return match ?? typed;
}
