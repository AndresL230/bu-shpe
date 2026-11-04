/**
 * Minimal Resend client over `fetch` (no SDK dependency).
 *
 * Confirmed against https://resend.com/docs/api-reference/emails/send-batch-emails
 * and https://resend.com/docs/api-reference/emails/send-email (Nov 2026):
 *   - POST https://api.resend.com/emails        → one message, returns { id }
 *   - POST https://api.resend.com/emails/batch  → JSON array, max 100 messages,
 *     returns { data: [{ id }, …] } in request order. `attachments` and
 *     scheduling are not supported in batch (we use neither).
 *   - Per-message fields: from, to, subject, html, text, reply_to, headers.
 *   - `Idempotency-Key` header: unique per request, max 256 chars, 24h window.
 *   - Rate limit: 10 req/s per team; 429 carries a `retry-after` (seconds).
 */

const RESEND_API = "https://api.resend.com";
export const RESEND_BATCH_MAX = 100;

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type SendResult =
  | { ok: true; ids: string[] }
  | { ok: false; status: number; error: string; /** true when retrying later can't help (bad key, unverified domain). */ fatal: boolean };

/** Thrown when the Worker isn't configured to send (missing secret / vars). */
export class EmailConfigError extends Error {}

interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
}

export interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo: string | null;
}

/** Validates env before any send. Throws EmailConfigError with an admin-readable message. */
export function emailConfig(env: EmailEnv): EmailConfig {
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new EmailConfigError(
      "Email sending isn't configured: the RESEND_API_KEY secret is missing. " +
        "Set it with `npx wrangler secret put RESEND_API_KEY` (or in .dev.vars locally).",
    );
  }
  const from = (env.EMAIL_FROM ?? "").trim();
  if (!from) throw new EmailConfigError("Email sending isn't configured: EMAIL_FROM is empty in wrangler.toml.");
  return { apiKey, from, replyTo: (env.EMAIL_REPLY_TO ?? "").trim() || null };
}

/** True when sending is possible; used to grey out send buttons. */
export function emailConfigured(env: EmailEnv): boolean {
  try {
    emailConfig(env);
    return true;
  } catch {
    return false;
  }
}

/** Splits an array into chunks of at most `size` (Resend batch = 100). */
export function chunk<T>(items: readonly T[], size = RESEND_BATCH_MAX): T[][] {
  if (size < 1) throw new RangeError("chunk size must be >= 1");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * RFC 2369 / RFC 8058 headers. The HTTPS URL accepts the one-click POST
 * (`List-Unsubscribe=One-Click`); the mailto is a fallback for clients that
 * only support mail-based unsubscribe.
 */
export function unsubscribeHeaders(siteUrl: string, token: string, mailto: string | null): Record<string, string> {
  const url = `${siteUrl.replace(/\/$/, "")}/api/unsubscribe?token=${encodeURIComponent(token)}`;
  const parts = [`<${url}>`];
  if (mailto) parts.push(`<mailto:${mailto}?subject=unsubscribe>`);
  return {
    "List-Unsubscribe": parts.join(", "),
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function toPayload(cfg: EmailConfig, m: OutgoingEmail) {
  return {
    from: cfg.from,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(cfg.replyTo ? { reply_to: cfg.replyTo } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; name?: string };
    if (body?.message) return body.name ? `${body.name}: ${body.message}` : body.message;
  } catch {
    /* non-JSON body */
  }
  return `HTTP ${res.status}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST with one retry on 429 / 5xx. Reusing the same Idempotency-Key makes the
 * retry safe: Resend won't deliver twice if the first attempt actually landed.
 */
async function post(cfg: EmailConfig, path: string, body: unknown, idempotencyKey?: string): Promise<Response> {
  const init: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify(body),
  };
  let res = await fetch(`${RESEND_API}${path}`, init);
  if (res.status === 429 || res.status >= 500) {
    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : 1000);
    res = await fetch(`${RESEND_API}${path}`, init);
  }
  return res;
}

const isFatal = (status: number) => status === 401 || status === 403 || status === 422;

/** Single message (test sends). */
export async function sendEmail(cfg: EmailConfig, msg: OutgoingEmail, idempotencyKey?: string): Promise<SendResult> {
  try {
    const res = await post(cfg, "/emails", toPayload(cfg, msg), idempotencyKey);
    if (!res.ok) return { ok: false, status: res.status, error: await readError(res), fatal: isFatal(res.status) };
    const data = (await res.json()) as { id?: string };
    return { ok: true, ids: data.id ? [data.id] : [] };
  } catch (err) {
    return { ok: false, status: 0, error: `Network error: ${(err as Error).message}`, fatal: false };
  }
}

/** Up to 100 individually-addressed messages in one API call. */
export async function sendBatch(cfg: EmailConfig, msgs: OutgoingEmail[], idempotencyKey: string): Promise<SendResult> {
  if (msgs.length === 0) return { ok: true, ids: [] };
  if (msgs.length > RESEND_BATCH_MAX) throw new RangeError(`Resend batch max is ${RESEND_BATCH_MAX}`);
  try {
    const res = await post(cfg, "/emails/batch", msgs.map((m) => toPayload(cfg, m)), idempotencyKey);
    if (!res.ok) return { ok: false, status: res.status, error: await readError(res), fatal: isFatal(res.status) };
    const data = (await res.json()) as { data?: { id: string }[] };
    return { ok: true, ids: (data.data ?? []).map((d) => d.id) };
  } catch (err) {
    return { ok: false, status: 0, error: `Network error: ${(err as Error).message}`, fatal: false };
  }
}
