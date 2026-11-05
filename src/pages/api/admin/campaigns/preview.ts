import type { APIRoute } from "astro";
import { BODY_MAX, SUBJECT_MAX } from "@/lib/server/campaigns";
import { personalize, personalizeSubject, previewVars, renderCampaign } from "@/lib/server/email-template";

export const prerender = false;

/** Returns the rendered campaign HTML for the composer's live-preview iframe. */
export const POST: APIRoute = async ({ request, locals, url }) => {
  const form = await request.formData();
  const subject = String(form.get("subject") ?? "").slice(0, SUBJECT_MAX) || "Untitled dispatch";
  const body = String(form.get("body") ?? "").slice(0, BODY_MAX);
  const site = locals.runtime.env.SITE_URL || url.origin;
  const vars = previewVars(locals.admin);
  const { html } = personalize(renderCampaign(personalizeSubject(subject, vars), body, site), "#", vars);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
};
