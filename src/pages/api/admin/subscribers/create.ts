import type { APIRoute } from "astro";
import { addFromAdmin, adminReturn } from "@/lib/server/subscribers";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const outcome = await addFromAdmin(locals.runtime.env.DB, {
    email,
    firstName: String(form.get("first_name") ?? ""),
    lastName: String(form.get("last_name") ?? ""),
  });
  return redirect(adminReturn(form.get("back"), { flash: `add-${outcome}`, email: email.trim().slice(0, 254) }), 303);
};
