/**
 * Campaign email template: table-based, inline-styled HTML + plain-text twin.
 *
 * Authors write the body as plain text with light markdown:
 *   - blank line            → new paragraph (single newlines become <br>)
 *   - **bold**              → <strong>
 *   - [label](https://…)    → link (http, https and mailto only)
 *   - lines starting "- "   → bullet list
 * Everything else is HTML-escaped, so the body can never inject markup.
 */
import siteData from "@/data/site.json";

/**
 * Email clients can't read CSS variables, so the @theme tokens from
 * src/styles/global.css are mirrored here. This is the ONLY file allowed to
 * hard-code hex values; keep it in sync with global.css.
 */
const C = {
  bg: "#FAFAF8", //        --color-bg
  surface: "#FFFFFF", //   --color-surface
  ink: "#001F5B", //       --color-ink / --color-deep
  inkMuted: "#626366", //  --color-ink-muted
  accent: "#FD652F", //    --color-accent
  link: "#0070C0", //      --color-link
  rule: "#72A9BE", //      --color-rule
  cream: "#FCF0D6", //     --color-cream
  hairline: "#ECEAE2", //  --color-hairline
} as const;

// Web fonts are unreliable in email; these stacks degrade to system faces.
const FONT_DISPLAY = "'Barlow Condensed','Arial Narrow','Helvetica Neue Condensed',Arial,sans-serif";
const FONT_BODY = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
const FONT_MONO = "'IBM Plex Mono',Menlo,Consolas,monospace";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(url: string): string | null {
  const u = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(u) ? u : null;
}

const INLINE = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function inlineHtml(raw: string): string {
  let out = "";
  let last = 0;
  for (const m of raw.matchAll(INLINE)) {
    out += escapeHtml(raw.slice(last, m.index));
    if (m[1] !== undefined) {
      out += `<strong style="font-weight:700;color:${C.ink};">${inlineHtml(m[1])}</strong>`;
    } else {
      const href = safeHref(m[3]);
      const label = inlineHtml(m[2]);
      out += href
        ? `<a href="${escapeHtml(href)}" style="color:${C.link};text-decoration:underline;">${label}</a>`
        : escapeHtml(m[0]);
    }
    last = (m.index ?? 0) + m[0].length;
  }
  return out + escapeHtml(raw.slice(last));
}

function inlineText(raw: string): string {
  return raw.replace(INLINE, (whole, bold, label, url) => {
    if (bold !== undefined) return bold;
    return safeHref(url) ? `${label} (${url})` : whole;
  });
}

type Block = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] };

const BULLET = /^\s*[-*]\s+/;

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const chunks = body.replace(/\r\n?/g, "\n").trim().split(/\n\s*\n/);
  for (const c of chunks) {
    const lines = c.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    // A chunk may mix a lead-in paragraph with bullets; split on bullet runs.
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => { if (para.length) blocks.push({ kind: "p", lines: para }); para = []; };
    const flushList = () => { if (list.length) blocks.push({ kind: "ul", items: list }); list = []; };
    for (const l of lines) {
      if (BULLET.test(l)) { flushPara(); list.push(l.replace(BULLET, "")); }
      else { flushList(); para.push(l.trim()); }
    }
    flushPara();
    flushList();
  }
  return blocks;
}

export function markdownToHtml(body: string): string {
  const p = `margin:0 0 18px 0;font-family:${FONT_BODY};font-size:16px;line-height:1.6;color:${C.ink};`;
  return parseBlocks(body)
    .map((b) =>
      b.kind === "p"
        ? `<p style="${p}">${b.lines.map(inlineHtml).join("<br>")}</p>`
        : `<ul style="margin:0 0 18px 0;padding:0 0 0 22px;">${b.items
            .map((i) => `<li style="margin:0 0 6px 0;font-family:${FONT_BODY};font-size:16px;line-height:1.6;color:${C.ink};">${inlineHtml(i)}</li>`)
            .join("")}</ul>`,
    )
    .join("\n");
}

export function markdownToText(body: string): string {
  return parseBlocks(body)
    .map((b) => (b.kind === "p" ? b.lines.map(inlineText).join("\n") : b.items.map((i) => `- ${inlineText(i)}`).join("\n")))
    .join("\n\n");
}

export interface RenderedCampaign {
  /** HTML / text with `placeholder` where each recipient's unsubscribe URL goes. */
  html: string;
  text: string;
  placeholder: string;
}

/**
 * Renders once per campaign; `personalize` then does a cheap string replace
 * per recipient, which keeps Worker CPU flat as the list grows.
 */
export function renderCampaign(subject: string, body: string, siteUrl: string): RenderedCampaign {
  const placeholder = `__UNSUB_${crypto.randomUUID()}__`;
  const site = siteUrl.replace(/\/$/, "");
  const siteHost = site.replace(/^https?:\/\//, "");
  const address = siteData.mailingAddress;
  const preheader = escapeHtml(markdownToText(body).replace(/\s+/g, " ").slice(0, 120));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
      <!-- Masthead -->
      <tr><td style="background:${C.ink};padding:26px 36px 22px 36px;">
        <div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:26px;line-height:1;letter-spacing:0.02em;text-transform:uppercase;color:${C.cream};">SHPE <span style="color:${C.accent};">&middot;</span> Boston University</div>
        <div style="margin-top:8px;font-family:${FONT_MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.rule};">Chapter dispatch</div>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:${C.surface};padding:40px 36px 20px 36px;border-left:1px solid ${C.hairline};border-right:1px solid ${C.hairline};">
        <h1 style="margin:0 0 18px 0;font-family:${FONT_DISPLAY};font-weight:700;font-size:34px;line-height:1.05;letter-spacing:-0.01em;color:${C.ink};">${escapeHtml(subject)}</h1>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;"><tr><td width="48" height="3" style="width:48px;height:3px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr></table>
        ${markdownToHtml(body)}
      </td></tr>
      <tr><td style="background:${C.surface};padding:4px 36px 34px 36px;border-left:1px solid ${C.hairline};border-right:1px solid ${C.hairline};border-bottom:1px solid ${C.hairline};">
        <p style="margin:0;font-family:${FONT_BODY};font-size:16px;line-height:1.6;color:${C.ink};">&iexcl;Nos vemos pronto!<br><span style="color:${C.inkMuted};">The BU SHPE e-board</span></p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:24px 36px 0 36px;">
        <p style="margin:0 0 8px 0;font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:${C.inkMuted};">You're receiving this because you joined the BU SHPE mailing list at <a href="${site}" style="color:${C.link};">${escapeHtml(siteHost)}</a> or at a chapter event.</p>
        <p style="margin:0 0 8px 0;font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:${C.inkMuted};"><a href="${placeholder}" style="color:${C.link};text-decoration:underline;">Unsubscribe</a> &nbsp;&middot;&nbsp; <a href="${site}" style="color:${C.link};text-decoration:underline;">Visit the site</a></p>
        <p style="margin:0;font-family:${FONT_MONO};font-size:10px;line-height:1.6;letter-spacing:0.08em;text-transform:uppercase;color:${C.inkMuted};">${escapeHtml(address)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    "SHPE · BOSTON UNIVERSITY",
    "",
    subject.toUpperCase(),
    "",
    markdownToText(body),
    "",
    "¡Nos vemos pronto!",
    "The BU SHPE e-board",
    "",
    "--",
    `You're receiving this because you joined the BU SHPE mailing list at ${siteHost} or at a chapter event.`,
    `Unsubscribe: ${placeholder}`,
    address,
  ].join("\n");

  return { html, text, placeholder };
}

/** Per-recipient values for merge tags. Missing names are null/empty. */
export interface MergeVars {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/** Tags authors can use in the subject and body. */
export const MERGE_TAGS = ["first_name", "last_name", "full_name", "email"] as const;

/**
 * Replaces {{first_name}}, {{last_name}}, {{full_name}}, {{email}} with the
 * recipient's values. `{{first_name|there}}` falls back to "there" when the
 * value is empty. Unknown tags are left as typed so typos are visible in the
 * preview. In HTML mode the value is escaped; the fallback text is already
 * escaped because the body went through the markdown renderer.
 */
export function applyMergeTags(s: string, vars: MergeVars, mode: "html" | "text"): string {
  const first = (vars.first_name ?? "").trim();
  const last = (vars.last_name ?? "").trim();
  const values: Record<string, string> = {
    first_name: first,
    last_name: last,
    full_name: [first, last].filter(Boolean).join(" "),
    email: (vars.email ?? "").trim(),
  };
  return s.replace(/\{\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}\}/g, (match, key: string, fallback?: string) => {
    if (!(key in values)) return match;
    const v = values[key];
    if (v) return mode === "html" ? escapeHtml(v) : v;
    return (fallback ?? "").trim();
  });
}

export function personalize(
  r: RenderedCampaign,
  unsubscribeUrl: string,
  vars: MergeVars = {},
): { html: string; text: string } {
  return {
    html: applyMergeTags(r.html.split(r.placeholder).join(escapeHtml(unsubscribeUrl)), vars, "html"),
    text: applyMergeTags(r.text.split(r.placeholder).join(unsubscribeUrl), vars, "text"),
  };
}

/** Subject lines are plain text (Resend encodes them). */
export function personalizeSubject(subject: string, vars: MergeVars): string {
  return applyMergeTags(subject, vars, "text").replace(/\s+/g, " ").trim();
}

/** Sample values for previews: the signed-in admin's own name, so authors see real output. */
export function previewVars(admin?: { name: string | null; email: string } | null): MergeVars {
  const [first = "", ...rest] = (admin?.name ?? "").trim().split(/\s+/);
  return { first_name: first || null, last_name: rest.join(" ") || null, email: admin?.email ?? null };
}

/** Footer link target: the confirm page, so link scanners can't unsubscribe anyone. */
export function unsubscribePageUrl(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
}
