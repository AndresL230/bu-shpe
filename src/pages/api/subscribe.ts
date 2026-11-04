import type { APIRoute } from "astro";
import { isValidEmail, normalizeEmail, upsertFromWebsite } from "@/lib/server/subscribers";

export const prerender = false;

/** Public mailing-list signup (MailingListForm.astro). Always ends in a 303. */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect("/subscribed?error=invalid", 303);
  }

  // Honeypot hit: pretend success so bots learn nothing.
  if (String(form.get("company") ?? "").trim() !== "") return redirect("/subscribed", 303);

  const email = normalizeEmail(String(form.get("email") ?? ""));
  if (!isValidEmail(email)) return redirect("/subscribed?error=invalid", 303);

  try {
    await upsertFromWebsite(locals.runtime.env.DB, {
      email,
      firstName: String(form.get("first_name") ?? ""),
      lastName: String(form.get("last_name") ?? ""),
    });
  } catch (err) {
    console.error("subscribe failed", err);
    return redirect("/subscribed?error=server", 303);
  }
  return redirect("/subscribed", 303);
};
