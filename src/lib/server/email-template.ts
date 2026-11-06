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
import { currentShpeYear, formatShpeYear } from "@/lib/shpe-year";

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

/** Chapter logo for the masthead (white wordmark: navy backgrounds only). 3266×647. */
const LOGO_PATH = "/assets/logos/SHPE_logo_horiz_Boston-University_DKBG.png";
const LOGO_W = 210;
const LOGO_H = Math.round((LOGO_W * 647) / 3266);

// Web fonts are unreliable in email; these stacks degrade to system faces.
const FONT_DISPLAY = "'Barlow Condensed','Arial Narrow','Helvetica Neue Condensed',Arial,sans-serif";
const FONT_BODY = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
const FONT_MONO = "'IBM Plex Mono',Menlo,Consolas,monospace";
const FONT_SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";
// Loaded where the client allows it (Apple Mail, iOS, Outlook.com); others use the stacks above.
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Inter:wght@400;600&family=IBM+Plex+Mono:wght@500&family=Playfair+Display:ital@1&display=swap";

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
        ? `<a href="${escapeHtml(href)}" style="color:${C.ink};font-weight:600;text-decoration:underline;text-decoration-color:${C.accent};text-decoration-thickness:2px;text-underline-offset:3px;">${label}</a>`
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
  const text = `font-family:${FONT_BODY};font-size:16px;line-height:1.65;color:${C.ink};`;
  return parseBlocks(body)
    .map((b) =>
      b.kind === "p"
        ? `<p style="margin:0 0 20px 0;${text}">${b.lines.map(inlineHtml).join("<br>")}</p>`
        : // Table rows instead of <ul>, so the orange square marker renders the same everywhere.
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;">${b.items
            .map(
              (i) =>
                `<tr><td width="22" valign="top" style="width:22px;padding:10px 0 0 2px;"><div style="width:7px;height:7px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</div></td>` +
                `<td valign="top" style="padding:0 0 10px 0;${text}">${inlineHtml(i)}</td></tr>`,
            )
            .join("")}</table>`,
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

  const logo = `${site}${LOGO_PATH}`;
  const issue = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "America/New_York" });
  const shpeYear = formatShpeYear(currentShpeYear());
  const socials = [
    ["Instagram", siteData.socials.instagram],
    ["LinkedIn", siteData.socials.linkedin],
    ["Website", site],
  ] as const;
  const mono = (size: number, color: string, extra = "") =>
    `font-family:${FONT_MONO};font-size:${size}px;line-height:1.5;letter-spacing:0.14em;text-transform:uppercase;color:${color};${extra}`;
  const small = `font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:${C.rule};`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<link href="${FONT_LINK}" rel="stylesheet">
<style>
  @media (max-width: 520px) {
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .h1 { font-size: 34px !important; }
    .logo { width: 170px !important; height: auto !important; }
    .issue { display: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
  <tr><td align="center" style="padding:28px 10px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
      <!-- Masthead: the chapter logo on navy, issue date on the right -->
      <tr><td class="px" style="background:${C.ink};padding:28px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle"><a href="${site}" style="text-decoration:none;"><img class="logo" src="${escapeHtml(logo)}" width="${LOGO_W}" height="${LOGO_H}" alt="SHPE Boston University" style="display:block;border:0;width:${LOGO_W}px;height:${LOGO_H}px;color:${C.cream};font-family:${FONT_DISPLAY};font-size:20px;font-weight:700;"></a></td>
          <td class="issue" valign="middle" align="right" style="${mono(10, C.rule)}">${escapeHtml(issue)}</td>
        </tr></table>
      </td></tr>
      <tr><td height="4" style="height:4px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
      <!-- Body -->
      <tr><td class="px" style="background:${C.surface};padding:44px 40px 12px 40px;">
        <p style="margin:0 0 14px 0;${mono(11, C.accent, "font-weight:500;")}">Chapter dispatch &middot; SHPE ${shpeYear}</p>
        <h1 class="h1" style="margin:0 0 28px 0;font-family:${FONT_DISPLAY};font-weight:700;font-size:42px;line-height:1.02;letter-spacing:-0.005em;color:${C.ink};">${escapeHtml(subject)}</h1>
        ${markdownToHtml(body)}
      </td></tr>
      <!-- Sign-off -->
      <tr><td class="px" style="background:${C.surface};padding:8px 40px 40px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.hairline};padding-top:24px;">
          <p style="margin:0 0 6px 0;font-family:${FONT_SERIF};font-style:italic;font-size:24px;line-height:1.2;color:${C.accent};">&iexcl;Nos vemos pronto!</p>
          <p style="margin:0;${mono(11, C.inkMuted)}">The BU SHPE e-board</p>
        </td></tr></table>
      </td></tr>
      <!-- Footer -->
      <tr><td class="px" style="background:${C.ink};padding:30px 40px 32px 40px;">
        <p style="margin:0 0 18px 0;${mono(11, C.cream)}">${socials
          .map(([label, href]) => `<a href="${escapeHtml(href)}" style="color:${C.cream};text-decoration:none;">${label}</a>`)
          .join(`<span style="color:${C.accent};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`)}</p>
        <p style="margin:0 0 10px 0;${small}">You're receiving this because you joined the BU SHPE mailing list at <a href="${site}" style="color:${C.cream};text-decoration:underline;">${escapeHtml(siteHost)}</a> or at a chapter event. <a href="${placeholder}" style="color:${C.cream};text-decoration:underline;">Unsubscribe</a></p>
        <p style="margin:0;${mono(9, C.rule, "letter-spacing:0.1em;")}">${escapeHtml(address)}</p>
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
