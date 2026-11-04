/**
 * Admin auth: opaque session cookies backed by D1 + Google OAuth (OIDC, PKCE).
 *
 * Cookie `shpe_admin` carries a random 32-byte token (base64url). The DB only
 * ever stores its SHA-256 hex, so a leaked `sessions` table can't be replayed.
 * Every lookup joins `admins`, so removing someone from the allowlist revokes
 * access on their very next request.
 */
import type { AstroCookies } from "astro";

export const SESSION_COOKIE = "shpe_admin";
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const OAUTH_STATE_COOKIE = "shpe_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "shpe_oauth_verifier";
export const OAUTH_MODE_COOKIE = "shpe_oauth_mode";
const OAUTH_COOKIE_TTL_S = 10 * 60;

export type AdminRole = "owner" | "editor";
export type AdminIdentity = NonNullable<App.Locals["admin"]>;

/* ---------------- encoding / crypto helpers ---------------- */

export function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecodeToString(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function randomToken(byteLength = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Base64url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return base64url(digest);
}

/** Secure cookies everywhere except plain-http localhost dev. */
export function isSecureRequest(url: URL): boolean {
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return !(url.protocol === "http:" && local);
}

/* ---------------- sessions ---------------- */

interface SessionJoinRow {
  email: string;
  name: string | null;
  picture: string | null;
  expires_at: number;
  role: AdminRole;
  admin_name: string | null;
}

/** Creates a session row and sets the cookie. Returns the raw token. */
export async function createSession(
  db: D1Database,
  cookies: AstroCookies,
  url: URL,
  who: { email: string; name: string | null; picture: string | null },
): Promise<string> {
  const token = randomToken(32);
  const id = await sha256Hex(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
    db
      .prepare("INSERT INTO sessions (id, email, name, picture, expires_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, who.email.toLowerCase(), who.name, who.picture, expiresAt),
  ]);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(url),
    path: "/",
    expires: new Date(expiresAt),
  });
  return token;
}

/** Deletes the session (if any) and clears the cookie. */
export async function destroySession(db: D1Database, cookies: AstroCookies, url: URL): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
  }
  cookies.delete(SESSION_COOKIE, { path: "/", httpOnly: true, sameSite: "lax", secure: isSecureRequest(url) });
}

/**
 * Resolves the signed-in admin from the session cookie, or null.
 * Re-checks the allowlist on every call (JOIN admins) and drops expired rows.
 */
export async function getAdminFromRequest(db: D1Database, cookies: AstroCookies): Promise<AdminIdentity | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 128) return null;
  const id = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT s.email, s.name, s.picture, s.expires_at, a.role, a.name AS admin_name
         FROM sessions s JOIN admins a ON a.email = s.email
        WHERE s.id = ?`,
    )
    .bind(id)
    .first<SessionJoinRow>();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    return null;
  }
  return {
    email: row.email,
    name: row.name ?? row.admin_name,
    picture: row.picture,
    role: row.role,
  };
}

/** For owner-only routes. Returns a Response to short-circuit with, or null when allowed. */
export function requireOwner(locals: App.Locals, opts: { api?: boolean } = {}): Response | null {
  if (locals.admin?.role === "owner") return null;
  if (opts.api) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  return new Response(null, { status: 302, headers: { Location: "/admin/dashboard?error=owner_only" } });
}

/* ---------------- Google OAuth (OIDC authorization code + PKCE) ---------------- */

const GOOGLE_AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export function oauthRedirectUri(url: URL): string {
  return `${url.origin}/admin/callback`;
}

/**
 * Generates state + PKCE verifier, stores them (and the popup/page mode) in
 * short-lived HttpOnly cookies, and returns Google's authorize URL.
 */
export async function beginGoogleAuth(
  env: Env,
  cookies: AstroCookies,
  url: URL,
  mode: "popup" | "page",
): Promise<string> {
  const state = randomToken(24);
  const verifier = randomToken(48);
  const challenge = await sha256Base64url(verifier);
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(url),
    path: "/admin",
    maxAge: OAUTH_COOKIE_TTL_S,
  };
  cookies.set(OAUTH_STATE_COOKIE, state, opts);
  cookies.set(OAUTH_VERIFIER_COOKIE, verifier, opts);
  cookies.set(OAUTH_MODE_COOKIE, mode, opts);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: oauthRedirectUri(url),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    include_granted_scopes: "true",
  });
  return `${GOOGLE_AUTHORIZE}?${params}`;
}

/** Reads and clears the OAuth cookies set by beginGoogleAuth. */
export function takeOAuthCookies(cookies: AstroCookies, url: URL) {
  const state = cookies.get(OAUTH_STATE_COOKIE)?.value ?? null;
  const verifier = cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? null;
  const mode = cookies.get(OAUTH_MODE_COOKIE)?.value === "popup" ? "popup" : "page";
  const del = { path: "/admin", httpOnly: true, sameSite: "lax" as const, secure: isSecureRequest(url) };
  cookies.delete(OAUTH_STATE_COOKIE, del);
  cookies.delete(OAUTH_VERIFIER_COOKIE, del);
  cookies.delete(OAUTH_MODE_COOKIE, del);
  return { state, verifier, mode } as const;
}

export interface GoogleIdentity {
  email: string;
  name: string | null;
  picture: string | null;
}

/**
 * Exchanges the authorization code and validates the id_token claims.
 * The token comes straight from Google's token endpoint over TLS, so per
 * OIDC Core §3.1.3.7 the signature check may be skipped; we still verify
 * iss / aud / exp / email_verified.
 */
export async function exchangeGoogleCode(
  env: Env,
  url: URL,
  code: string,
  verifier: string,
): Promise<GoogleIdentity> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: oauthRedirectUri(url),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}`);
  const json = (await res.json()) as { id_token?: string };
  if (!json.id_token) throw new Error("no id_token");

  const parts = json.id_token.split(".");
  if (parts.length !== 3) throw new Error("malformed id_token");
  const claims = JSON.parse(base64urlDecodeToString(parts[1])) as {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
  };

  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!claims.iss || !GOOGLE_ISSUERS.has(claims.iss)) throw new Error("bad iss");
  if (!aud.includes(env.GOOGLE_CLIENT_ID)) throw new Error("bad aud");
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error("expired id_token");
  if (!claims.email) throw new Error("no email");
  if (!(claims.email_verified === true || claims.email_verified === "true")) throw new Error("email not verified");

  return {
    email: claims.email.toLowerCase(),
    name: claims.name ?? null,
    picture: claims.picture ?? null,
  };
}
