# Editorial redesign — Home, Board, Events, Conferences

**Status:** Approved (brainstorming)
**Date:** 2026-05-22
**Scope:** Replace the current page bodies for 4 of 9 routes (`/`, `/board`, `/events`, `/conferences`) with new editorial layouts derived from the templates in `newcode.md`. Keep Nav, Footer, design tokens, JSON content layer, and Astro + Tailwind v4 stack untouched. Real chapter assets replace newcode.md's AI-generated placeholders.

## 1. Goals

- Adopt the editorial section patterns from `newcode.md` (asymmetric splits, orange-tick eyebrow, zig-zag image+text blocks, bordered 3-col card grid, navy CTA bands) on the 4 listed routes.
- Preserve every existing piece of infrastructure: `Base.astro`, `Nav.astro`, `Footer.astro`, all `src/data/*.json` files, `@theme` token vocabulary, asset directory, Tailwind v4, Cloudflare Pages output.
- Keep the JSON files as the single source of truth for chapter content. New page markup pulls data from them; no hardcoded chapter facts in `.astro` files.
- Stay within the native resolution of existing chapter photos (max ~636×477) so nothing upscales blurry.

## 2. Non-goals

- **Out of scope this pass:** `/about`, `/volunteering`, `/gallery`, `/sponsors`, `/join`. They keep their current design and `PageHero` usage until a follow-up.
- No new framework (React/Vue/Svelte) and no CSS framework changes — Tailwind v4 only.
- No new font families. Inter / Barlow Condensed / Playfair Display stay as-is.
- No site-wide font scale-up — new pages use the existing scale (`text-5xl`/`6xl` hero, `text-4xl`/`5xl` section heads).
- No new icon font (no Material Symbols). 4–5 tiny inline SVGs cover all the arrows.
- No `Hero.astro` revival. No image background hero. Image-side slots are constrained to native resolution.

## 3. User-approved decisions

| Decision | Outcome |
|---|---|
| Page scope | 4 covered now (`/`, `/board`, `/events`, `/conferences`); other 5 stay as follow-up |
| Token names | Keep our semantic tokens (`ink`, `accent`, `rule`, `cream`, `deep`); mechanically translate newcode.md classes onto them |
| Home hero image | Image with `EST. 1974` badge, fixed-height crop (no upscaling beyond native res ≈ 477px tall) |
| Icons | Tiny inline SVG set (`arrow_forward`, `trending_flat`, `person_add` — ~3–5 total); no Material Symbols font |
| Scroll reveal | Adopt newcode.md's IntersectionObserver pattern (small inline JS) |
| Board TBD | Both — page-level notice when ALL officers TBD; per-card empty state otherwise |
| Type scale | Keep current scale (no site-wide bump) |
| Approach | A — Per-page rewrite + minimal component extraction |

## 4. Architecture

### 4.1 Files rewritten

- `src/pages/index.astro`
- `src/pages/board.astro`
- `src/pages/events.astro`
- `src/pages/conferences.astro`

### 4.2 New components

| Component | Purpose | Used by |
|---|---|---|
| `src/components/OrangeTick.astro` | 24×4 orange bar with `mb-2` — eyebrow accent | All 4 pages |
| `src/components/ZigZagBlock.astro` | Image + text block, props: `image`, `imageAlt`, `eyebrow?`, `heading`, `body`, `bullets?`, `cta?`, `quote?`, `reverse?`, `split?` (`60/40` \| `40/60`) | Home pillars, Conferences blocks |
| `src/components/CtaBand.astro` | Navy section: eyebrow? + display heading (with optional italic accent word) + body + 1–2 buttons | Home, Board, Conferences |
| `src/components/StatsStrip.astro` | 3-col big-number + caption strip | Conferences (initial), reserved for About/Sponsors later |
| `src/components/Reveal.astro` | Wrapper applying `data-reveal` attribute; the observer script lives once in `Base.astro` | All 4 pages, opt-in |
| `src/components/Icon.astro` | Inline SVG sprite — props: `name: "arrow-forward" \| "trending-flat" \| "person-add"`, `class?` | All 4 pages |

### 4.3 Files deleted

- `src/components/Hero.astro` — already deprecated; remove now.

### 4.4 Files kept untouched

- `src/layouts/Base.astro` (with one small addition: the IntersectionObserver script — see §5.3)
- `src/components/Nav.astro`
- `src/components/Footer.astro`
- `src/components/PageHero.astro` — still used by the 5 un-migrated pages
- `src/components/BoardCard.astro` — replaced inside `board.astro` with inline editorial cards; the component file stays for now (used nowhere after this change, but a separate cleanup commit can remove it once we confirm nothing references it)
- All `src/data/*.json`
- All `public/assets/**`

### 4.5 Data changes

- `src/data/site.json` — add `currentBoardTerm: "2024–2025"` (or whatever the user supplies). Consumed by Board hero meta card.
- No other JSON changes. `events.json`, `board.json`, `conferences.json`, `volunteering.json`, `sponsors.json` stay exactly as they are.

## 5. Style additions to `src/styles/global.css`

Additive only — no removals. Existing tokens and `.display` / `.eyebrow` / `.pullquote` / `.rule-accent` / `.grain` / `.photo-warm` / `.reveal` classes unchanged.

### 5.1 New `@theme` tokens

```css
--color-surface-soft: #F4F3F9;   /* slight gray for card-band backgrounds */
--color-outline-soft: #C5C6D1;   /* warmer border for event/conference card grids */
```

Used as Tailwind utilities `bg-surface-soft`, `border-outline-soft`, etc.

### 5.2 New utility classes

```css
.orange-tick-block {
  display: block;
  width: 1.5rem;
  height: 0.25rem;
  background: var(--color-accent);
  margin-bottom: 0.5rem;
}

.photo-mono {
  filter: grayscale(1) brightness(0.9);
  transition: filter 0.5s ease;
}
.photo-mono:hover { filter: none; }

[data-reveal] {
  opacity: 0;
  transform: translateY(2rem);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
[data-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

`.orange-tick` (the `::before` form) stays as it is; `.orange-tick-block` is the standalone-`<div>` variant the new layouts use most often.

### 5.3 Scroll-reveal script (in `Base.astro`)

One small inline `<script>` block injected once per page via `Base.astro`. Uses `IntersectionObserver`, threshold 0.1, adds `is-revealed` class on intersect, unobserves after firing. ≤25 lines. Short-circuits if `matchMedia('(prefers-reduced-motion: reduce)').matches`.

## 6. Page-by-page design

### 6.1 Home (`/`)

| Section | Layout | Content source |
|---|---|---|
| Hero | 60/40 split. Left: `<OrangeTick/>` + `.display` headline `"Building the next generation of Hispanic engineers, <em>together</em>."` + body from `site.json.mission` (short version) + two anchors: "Explore Chapter" → `/about`, "View Events" → `/events`. Right: chapter group photo with `EST. 1974` navy badge overlay at bottom-left. Image constrained to `max-h-[477px]`, `max-w-[440px]`. | `site.json` |
| Hairline divider | Full-width `border-t border-rule` | — |
| Mission band | 40/60 asymmetric. Left: `<OrangeTick/>` + `.pullquote` italic quote + attribution. Right: eyebrow `OUR MISSION` + display heading + 2 paragraphs from `site.json.mission` / `site.json.about`. | `site.json` |
| Pillars zig-zag | 3× `<ZigZagBlock/>`: Conferences, Volunteering, Professional Development. Alternating split direction. Each pulls a representative image from its JSON. | `conferences.json[0].image`, `volunteering.json[0].image`, generic event/workshop photo |
| Recent events grid | 3-col bordered card grid showing 3 most recent past events (sorted desc by date). Same card pattern as Events page upcoming grid. | `events.json` filtered past, sliced 0..3 |
| Sponsor strip | Existing `SponsorGrid` component dropped in unchanged | `sponsors.json` |
| CTA band | `<CtaBand/>` "Become part of the <em>familia</em>." → button "Join SHPE" → `/join` | hardcoded copy (small enough to be inline) |

### 6.2 Board (`/board`)

| Section | Layout | Content source |
|---|---|---|
| Hero | 60/40. Left: `<OrangeTick/>` + display `"Meet the <em>board</em>."` + body. Right: small hairline-bordered card on `bg-surface-soft` with eyebrow `Elected Term` + big year from `site.json.currentBoardTerm`. | `site.json` |
| Board grid | 2-col, each officer = `<article>` with 4:5 portrait image left and metadata right. Filled cards: photo + eyebrow role + display name + italic quote + `border-l-2 border-deep pl-4` block with discipline + class year. TBD cards: 4:5 placeholder with centered `person-add` icon on `bg-surface-soft`, "Election in progress" label, then on right: eyebrow role + big TBD heading + navy info card with role description + "View Requirements" button. | `board.json` |
| Empty state (all-TBD) | Replaces the grid entirely when every officer in `board.json` is TBD. Reuses the current page-level notice copy. | `board.json` |
| Vision block | 40/60 asymmetric on `bg-surface-soft`. Left: display "Our Vision" + body + 3-item bullet list. Right: 16:9 chapter group photo with `border-[24px] border-bg` inset frame. | `site.json` for copy; chapter group photo from `public/assets/` |
| CTA band | `<CtaBand/>` "Lead with us." → "Apply for Committee" + "Our Constitution" buttons | hardcoded |

### 6.3 Events (`/events`)

| Section | Layout | Content source |
|---|---|---|
| Hero | Single column. `<OrangeTick/>` + eyebrow `CALENDAR <YEAR>` (dynamic via `new Date().getFullYear()`) + display `"Events & <em>opportunities</em>."` + body. | hardcoded headline; body from `site.json` if applicable |
| Filter chips | Server-side `?cat=` chips matching the existing implementation. Restyled to bordered-chip pattern (active = `bg-deep text-cream`, inactive = `border-outline-soft hover:border-deep`). | existing categories in `events.json` |
| Google Calendar embed | Existing iframe block, kept | — |
| Featured event | 60/40 editorial. Left 60: orange-tick eyebrow `FEATURED ENGAGEMENT` + display heading + body + 3-col meta strip (date / location / time) above a top `border-t border-rule`. Right 40: 4:5 image with `.photo-mono` (grayscale-on-hover). Picks the next upcoming event, or if none upcoming, the most recent past event marked `featured: true` in JSON (need to allow this optional field in `types.ts` — additive only). | `events.json` |
| Upcoming sessions | 3-col bordered grid, up to 3 next events. Each card: eyebrow category + huge faded date number watermark (e.g. `22 OCT`) at `opacity-10` + display heading + body + bottom rule line with `TIME | LOCATION` + arrow icon. | `events.json` filtered upcoming |
| Past events archive | 12-col grid. Left 4: `border-l-4 border-accent pl-8` block — display heading "Event Archives" + body + "VIEW ALL PAST EVENTS" anchor with arrow. Right 8: 2-col grid of past event thumbnails (4 most recent, filtered if `?cat=` is set). | `events.json` |

`src/types.ts` change: add optional `featured?: boolean` to `EventItem`. Backward-compatible (existing events without the field still work).

### 6.4 Conferences (`/conferences`)

| Section | Layout | Content source |
|---|---|---|
| Hero | Navy background (`bg-deep`). 12-col grid. Left 8: eyebrow `ANNUAL CONVENTION <YEAR>` + display `"SHPE <em>national</em> convention."` (cream text, orange accent stays) + body. Right 4: meta block on `border-l border-cream/20` — eyebrow `LOCATION` + big display location. Background-only decorative giant `SHPE` text bottom-right at 240px on `opacity-10`, `pointer-events-none`. | `conferences.json` |
| Stats strip | `<StatsStrip/>` with 3 stats from `conferences.json` (or component props if data isn't there) | `conferences.json` |
| Zig-zag blocks | 3× `<ZigZagBlock/>`: Travel Logistics (60/40, with bullet list), Career Fair Prep (40/60 reversed, with CTA button + arrow), Competitions (60/40, with inline quote-card variant) | `conferences.json` |
| CTA band | `<CtaBand/>` "Ready to represent BU?" → "Register Interest" button | hardcoded |

`conferences.json` may need a small additive shape extension to carry stats numbers and section copy, OR these can be component props on the page. Decision deferred to plan phase based on actual current JSON shape.

## 7. Asset mapping

Existing chapter photos in `public/assets/` are used everywhere. Approximate mapping (final selection during implementation):

- **Home hero** — best chapter group photo available in `public/assets/about/` or `public/assets/events/`.
- **Home pillars** — first usable image from `conferences.json`, `volunteering.json`, and a workshop/pro-dev photo from `events.json`.
- **Board portraits** — each officer's `photo` field in `board.json`.
- **Board vision block** — different group photo than Home hero if possible.
- **Events featured** — `events.json[next_upcoming].image` or `events.json[most_recent_featured].image`.
- **Events upcoming/archive** — each event's `image` field.
- **Conferences zig-zag** — `public/assets/conferences/*` if present; otherwise generic professional photos from `events.json`.

If a slot has no good match, fall back to the bordered placeholder pattern (same shape as the TBD board card).

## 8. Verification

- `npm run check` — must exit 0 errors, 0 warnings, 0 hints.
- `npm run build` — must produce 9 pages cleanly.
- Visual confirmation in `npm run dev` for all 4 redesigned routes + at least 1 untouched route (e.g. `/about`) to confirm Nav/Footer still render across both.
- No regressions on mobile menu, sponsor grid, calendar embed, or filter behavior.

## 9. Risks / open items

- **Newcode.md uses 72px display headlines.** We're keeping current sizes, which means the new pages will read slightly more restrained than the source mockups. Acceptable per decision §3.
- **Scroll-reveal adds JS where we previously had none.** Single small block, motion-pref aware. Explicit user decision in §3.
- **`featured` field on `EventItem`** is a new optional type — must keep `types.ts` change additive only.
- **Photo selection** for hero/vision blocks happens in implementation. If no good chapter group photo exists, Home hero falls back to a typographic-only treatment (closest variant of newcode.md's right-side image side, but reduced to just the `EST. 1974` badge on a navy block).
- **The 5 un-migrated pages** will look visually different from the 4 new ones until they're migrated. Known temporary inconsistency.

## 10. Out of scope (follow-ups)

- Migrate `/about`, `/volunteering`, `/gallery`, `/sponsors`, `/join` to the new editorial system using the components extracted in this pass.
- Delete `BoardCard.astro` after confirming no remaining references.
- Delete `PageHero.astro` after the 5 remaining pages are migrated.
