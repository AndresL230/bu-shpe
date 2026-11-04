import type { APIRoute } from "astro";
import { requireOwner } from "@/lib/server/auth";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST (owner-only) — manage the admin allowlist. `action` = add | role | remove.
 * Guards: owners can't remove or re-role themselves, and the last owner stays.
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = requireOwner(locals);
  if (denied) return denied;
  const me = locals.admin!;
  const db = locals.runtime.env.DB;
  const back = (q: string) => redirect(`/admin/admins?${q}`, 303);

  const fd = await request.formData();
  const action = String(fd.get("action") ?? "");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");

  if (!EMAIL_RE.test(email) || email.length > 254) return back("error=email");
  const isMe = email === me.email.toLowerCase();

  const ownerCount = async () =>
    (await db.prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'owner'").first<{ n: number }>())?.n ?? 0;
  const current = await db
    .prepare("SELECT email, role FROM admins WHERE email = ? COLLATE NOCASE")
    .bind(email)
    .first<{ email: string; role: "owner" | "editor" }>();

  if (action === "add") {
    if (role !== "owner" && role !== "editor") return back("error=role");
    if (current) return back("error=exists");
    await db
      .prepare("INSERT INTO admins (email, role, added_by) VALUES (?, ?, ?)")
      .bind(email, role, me.email)
      .run();
    return back("ok=added");
  }

  if (!current) return back("error=missing");

  if (action === "role") {
    if (role !== "owner" && role !== "editor") return back("error=role");
    if (isMe) return back("error=self");
    if (current.role === "owner" && role === "editor" && (await ownerCount()) <= 1) return back("error=last_owner");
    await db.prepare("UPDATE admins SET role = ? WHERE email = ?").bind(role, current.email).run();
    return back("ok=role");
  }

  if (action === "remove") {
    if (isMe) return back("error=self");
    if (current.role === "owner" && (await ownerCount()) <= 1) return back("error=last_owner");
    await db.batch([
      db.prepare("DELETE FROM admins WHERE email = ?").bind(current.email),
      db.prepare("DELETE FROM sessions WHERE email = ?").bind(current.email),
    ]);
    return back("ok=removed");
  }

  return back("error=action");
};
