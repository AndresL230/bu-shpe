import type { APIRoute } from "astro";
import { destroySession } from "@/lib/server/auth";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, url, redirect }) => {
  await destroySession(locals.runtime.env.DB, cookies, url);
  return redirect("/admin?signed_out=1", 303);
};
