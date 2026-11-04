/**
 * Campaign storage + the bulk-send loop.
 *
 * ── Worker limits reasoning (developers.cloudflare.com/workers/platform/limits,
 *    /d1/platform/limits, checked Nov 2026) ────────────────────────────────
 * - Subrequests: 50/invocation (Free), 10,000 (Paid). Each Resend batch call is
 *   one fetch for up to 100 recipients, plus one D1 progress write per batch.
 *   ~2 subrequests per 100 recipients → Free tops out near ~2,000 recipients
 *   per campaign; Paid is effectively unlimited for a chapter list.
 * - D1 queries: 50/invocation (Free), 1,000 (Paid). We use 1 read for the
 *   list, 1 insert, 1 update per batch and 1 final update.
 * - CPU: 10 ms (Free) / 30 s default (Paid). Waiting on fetch() isn't CPU. The
 *   template is rendered ONCE (renderCampaign) and each recipient only costs a
 *   string replace + JSON serialisation, so CPU stays small per batch.
 * - Wall time: unlimited while the client is connected, but we hand the loop to
 *   ctx.waitUntil() so the admin gets an immediate redirect to the campaign
 *   page (which auto-refreshes while status = "sending"). waitUntil grants up
 *   to 30 s after the response. A Resend batch call takes roughly 0.5–2 s, so
 *   that budget covers ~15+ batches (1,500+ recipients). If the list outgrows
 *   that, move this loop to a Cloudflare Queue consumer.
 * - Resend rate limit is 10 req/s; batches run sequentially, so we stay well
 *   under it, and email.ts retries once on 429 honouring retry-after.
 * sent_count is written after every batch, so a Worker eviction mid-send
 * leaves an accurate partial count (the detail page flags stalled sends).
 */
import { chunk, emailConfig, sendBatch, unsubscribeHeaders, type OutgoingEmail } from "./email";
import { personalize, personalizeSubject, renderCampaign, unsubscribePageUrl } from "./email-template";
import { activeSubscribers } from "./subscribers";

export interface CampaignRow {
  id: number;
  subject: string;
  body: string;
  sent_by: string;
  recipient_count: number;
  sent_count: number;
  status: "sending" | "sent" | "partial" | "failed";
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export const SUBJECT_MAX = 200;
export const BODY_MAX = 50_000;

/** After this long in "sending", the Worker was almost certainly evicted. */
export const STALL_MS = 10 * 60 * 1000;

export async function listCampaigns(db: D1Database): Promise<CampaignRow[]> {
  const { results } = await db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC, id DESC LIMIT 200").all<CampaignRow>();
  return results;
}

export async function getCampaign(db: D1Database, id: number): Promise<CampaignRow | null> {
  return db.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first<CampaignRow>();
}

interface SendEnv {
  DB: D1Database;
  SITE_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
}

export interface StartedCampaign {
  id: number;
  /** The send loop; pass to ctx.waitUntil (or await it). */
  run: Promise<void>;
  /** True when an identical campaign from this sender was just created (double-click). */
  duplicate: boolean;
}

/**
 * Validates config, snapshots the recipient list, creates the campaign row and
 * returns the send loop as a promise. Throws EmailConfigError if the Worker
 * can't send, before anything is written.
 */
export async function startCampaign(env: SendEnv, input: { subject: string; body: string; sentBy: string }): Promise<StartedCampaign> {
  const cfg = emailConfig(env);
  const db = env.DB;

  // Double-submit guard (no schema change needed): same sender + subject +
  // body within 2 minutes → reuse that campaign rather than mailing twice.
  const dupe = await db
    .prepare(
      `SELECT id FROM campaigns WHERE sent_by = ? AND subject = ? AND body = ?
         AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 minutes') ORDER BY id DESC LIMIT 1`,
    )
    .bind(input.sentBy, input.subject, input.body)
    .first<{ id: number }>();
  if (dupe) return { id: dupe.id, run: Promise.resolve(), duplicate: true };

  const recipients = await activeSubscribers(db);
  if (recipients.length === 0) throw new Error("There are no subscribed addresses to send to.");

  const created = await db
    .prepare("INSERT INTO campaigns (subject, body, sent_by, recipient_count, status) VALUES (?, ?, ?, ?, 'sending') RETURNING id")
    .bind(input.subject, input.body, input.sentBy, recipients.length)
    .first<{ id: number }>();
  if (!created) throw new Error("Couldn't create the campaign record.");
  const id = created.id;

  const run = (async () => {
    let sent = 0;
    const errors: string[] = [];
    try {
      const site = env.SITE_URL;
      const tpl = renderCampaign(input.subject, input.body, site);
      const batches = chunk(recipients);
      for (let i = 0; i < batches.length; i++) {
        const msgs: OutgoingEmail[] = batches[i].map((r) => {
          const vars = { first_name: r.first_name, last_name: r.last_name, email: r.email };
          const p = personalize(tpl, unsubscribePageUrl(site, r.unsubscribe_token), vars);
          return {
            to: r.email,
            subject: personalizeSubject(input.subject, vars),
            html: p.html,
            text: p.text,
            headers: unsubscribeHeaders(site, r.unsubscribe_token, cfg.replyTo),
          };
        });
        const res = await sendBatch(cfg, msgs, `campaign-${id}-batch-${i}`);
        if (res.ok) {
          sent += msgs.length;
          await db.prepare("UPDATE campaigns SET sent_count = ? WHERE id = ?").bind(sent, id).run();
        } else {
          errors.push(`Batch ${i + 1}/${batches.length} (${msgs.length} recipients): ${res.error}`);
          if (res.fatal) {
            const left = batches.length - i - 1;
            if (left > 0) errors.push(`Stopped: ${left} remaining batch${left === 1 ? "" : "es"} not attempted.`);
            break;
          }
        }
      }
    } catch (err) {
      errors.push(`Unexpected error: ${(err as Error).message}`);
    }
    const status: CampaignRow["status"] = sent === recipients.length ? "sent" : sent > 0 ? "partial" : "failed";
    await db
      .prepare(
        "UPDATE campaigns SET status = ?, sent_count = ?, error = ?, sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
      )
      .bind(status, sent, errors.length ? errors.join("\n").slice(0, 4000) : null, id)
      .run();
  })();

  return { id, run, duplicate: false };
}
