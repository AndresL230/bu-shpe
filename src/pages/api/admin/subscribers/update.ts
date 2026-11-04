import type { APIRoute } from "astro";
import { adminReturn, deleteSubscriber, setStatus } from "@/lib/server/subscribers";

export const prerender = false;

/** Row actions: action = unsubscribe | resubscribe | delete. */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const id = Number(form.get("id"));
  const action = String(form.get("action") ?? "");
  const email = String(form.get("email") ?? "").slice(0, 254);
  const db = locals.runtime.env.DB;
  if (!Number.isInteger(id) || id < 1) return redirect(adminReturn(form.get("back"), { flash: "bad-request" }), 303);

  if (action === "unsubscribe") await setStatus(db, id, "unsubscribed");
  else if (action === "resubscribe") await setStatus(db, id, "subscribed");
  else if (action === "delete") await deleteSubscriber(db, id);
  else return redirect(adminReturn(form.get("back"), { flash: "bad-request" }), 303);

  return redirect(adminReturn(form.get("back"), { flash: action, email }), 303);
};
