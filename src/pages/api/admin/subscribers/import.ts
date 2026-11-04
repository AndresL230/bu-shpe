import type { APIRoute } from "astro";
import { adminReturn, importSubscribers, parseImport } from "@/lib/server/subscribers";

export const prerender = false;

/** Pasted bulk import. Existing / opted-out addresses are skipped, never changed. */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const text = String(form.get("lines") ?? "").slice(0, 500_000);
  const { valid, invalid } = parseImport(text);
  const { added, skipped } = await importSubscribers(locals.runtime.env.DB, valid);
  return redirect(adminReturn(form.get("back"), { flash: "imported", added, skipped, invalid: invalid.length }), 303);
};
