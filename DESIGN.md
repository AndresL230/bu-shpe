# Design System: Boston University SHPE

> Source of truth for Google Stitch (and other AI screen generators) prompting new screens for the BU SHPE chapter site. Encodes the established editorial design language — honor it, don't re-derive it.

---

## 1. Visual Theme & Atmosphere

Editorial magazine aesthetic — **Bloomberg Businessweek meets a university chapter newsletter**. Not SaaS. Not corporate. Not "modern tech startup."

Warm off-white canvas, confident SHPE navy authority, a single high-impact orange accent. Generous whitespace, restrained motion, hierarchy driven by typographic pairing — a condensed display face for headlines, a distinctive italic serif for one accent word, a neutral sans for body. The atmosphere reads like a well-art-directed print spread that happens to live on the web.

**Density:** 3 — gallery airy. Lots of vertical breathing room (`py-24` to `py-32` between sections).
**Variance:** 6 — offset asymmetric. 60/40 splits, sidebar rails, alternating zig-zag program blocks. Centered Hero blocks are banned for primary pages.
**Motion:** 2 — static restrained. CSS-only fade-ups on scroll. No framer-motion, no GSAP, no scroll choreography. The pacing of reading the layout *is* the motion.

---

## 2. Color Palette & Roles

- **Warm Off-White** (`#FAFAF8`) — Primary page background. Never pure white.
- **Pure Surface** (`#FFFFFF`) — Card and elevated container fill where it serves hierarchy.
- **SHPE Navy** (`#001F5B`) — Primary ink color, navbar background, footer background, full-bleed CTA bands.
- **SHPE Gray** (`#626366`) — Secondary text: metadata, supporting copy, captions, dates.
- **Orange Accent** (`#FD652F`) — The single accent. CTAs, italic display accent word, orange tick mark above eyebrows. No other warm hue is allowed.
- **SHPE Link Blue** (`#0070C0`) — Hyperlinks and inline references only. Not used for buttons.
- **SHPE Pale Blue** (`#72A9BE`) — Hairline dividers and 1px structural rules between sections.
- **Cream on Navy** (`#FCF0D6`) — Text color when set on navy backgrounds. The off-white doesn't have enough contrast against navy; cream does.

**Constraints:**
- One accent color total. No purple, no neon, no AI-tech blue glow.
- No pure black anywhere (`#000000` is banned — use `#001F5B`).
- No gradients on headlines.
- No tinted gray shadows — use neutral warm-gray shadows at low opacity.

---

## 3. Typography Rules

Three-font system. **Do not substitute fonts without explicit user request — this stack was chosen after multiple iterations.**

- **Display Headlines** — `Barlow Condensed` Bold 700, track-tight (`-0.01em`), line-height 1.05. Condensed for editorial weight. Sizes scale with `clamp()` for fluid responsive type. Used inside the `.display` utility class.
- **Italic Accent Word** — `Playfair Display` Italic 400, **lowercase**, **orange** (`#FD652F`), tracking normal. Embedded as a single `<em>` inside a Barlow Condensed headline. This is the **signature typographic move** of the site. Use it sparingly — once per hero, optionally once per CTA band.
  - Example: `Building the next generation of Hispanic engineers, <em>together</em>.`
- **Eyebrows / Section Labels** — `Barlow Condensed` SemiBold 600, **uppercase**, tracked `0.14em`, in `text-ink-muted` or accent. Used inside the `.eyebrow` class.
- **Body Copy** — `Inter` 400/500, line-height 1.6, capped at `max-w-3xl` (~65ch) for paragraph copy. The neutral workhorse — distinctive character comes from the display fonts above, Inter stays out of the way.
- **Pull Quotes** — `Playfair Display` Italic 400/500, large size, used in mission/values sections. Class: `.pullquote`.
- **Nav Links** — `Barlow Condensed` Medium 500, uppercase, slightly tracked.

**Banned:**
- Generic serifs (`Times New Roman`, `Georgia`, `Garamond`) — only `Playfair Display Italic` for the accent role.
- Adding new font families without explicit user request.
- Site-wide font scale increases (the user has rejected this twice — scope changes to just the element that needs it).
- Bold body text without semantic reason.
- All-caps body copy beyond the established eyebrow pattern.

---

## 4. Component Stylings

### Buttons
- **Primary CTA:** Solid orange fill (`#FD652F`), white text, `px-8 py-4`, `rounded-md` (6px). No shadow, no glow, no scale-up bounce. Hover: subtle darken (~`#E55522`), 200ms ease.
- **Ghost on Navy:** Cream text, underline-on-hover or thin cream border. No filled state on navy backgrounds.
- **Tactile push effects, 3D shadows, neon glows: banned.** This is editorial print, not iOS.

### Cards (event, conference, board, sponsor)
- White surface (`#FFFFFF`) on the warm off-white canvas.
- 1px pale-blue border (`#72A9BE` at low opacity) — a hairline, not a heavy box.
- Subtle warm shadow (low opacity, neutral-warm gray, not blue-tinted).
- Generous internal padding (`p-8`), `rounded-lg` (~8px).
- Hover: `translateY(-2px)` + slight shadow deepen. No scale, no glow.

### Section Dividers
- **Orange tick** — 24px orange `::before` pseudo-element above eyebrow labels (via `.rule-accent` class). The signature section opener.
- **Hairline rules** — 1px `#72A9BE` for full-width section breaks.

### Inputs (mailing list, contact)
- Label **above** input. Underline-style or thin border. Focus ring in orange. Error text below in muted red.
- No floating labels, no fancy focus animations.

### Image Treatment
- All photos pass through `.photo-warm` filter: `saturate(1.05) contrast(1.02) sepia(0.04)`. Subtle editorial warmth — like film stock, not Instagram.
- **No full-bleed image heroes.** Source photos in `public/assets/` are 636×477 (scraped thumbnails) and visibly blur when upscaled. All page heroes are typographic (`PageHero.astro`).
- The DKBG chapter logo only works on navy backgrounds — never place it on a light surface (wordmark is white, will vanish).

### Grain Overlay
- `.grain` utility — subtle SVG noise via `::after` pseudo-element on full-bleed navy sections. Analog texture, not visual noise.

### Loading / Empty / Error States
- **Empty state (e.g. board roster):** Show editorial-styled notice block, not a generic "No data" message. The current board page renders an empty-state for officers when all entries are `TBD`.
- **No skeleton shimmer loaders** — this is a static site, content is always present at build time.

---

## 5. Layout Principles

- **Container:** `max-w-[1200px]` centered, minimum `px-6` horizontal padding.
- **Vertical rhythm:** `py-24` to `py-32` between sections. Sub-blocks within a section use `py-12` to `py-16`.
- **Hero pattern (all internal pages):** Typographic only via `PageHero.astro`. Eyebrow caps → condensed display headline → optional Playfair italic accent → kicker prose at `max-w-3xl`. No image background.
- **Mission / About sections:** Asymmetric 60/40 or 70/30 splits. Pull-quote breaks vertical rhythm.
- **Program lists (volunteering, conferences):** Alternating zig-zag image/text blocks. Index parity (`i % 2`) controls left/right placement.
- **Card grids:** 2-column for boards (large headshots), 3-column for events/conferences (medium cards). **The generic 3-equal-card horizontal "feature row" is banned** — use zig-zag or asymmetric.
- **Sponsor grid:** Tier-aware. Groups by tier when any sponsor has one (label + grid per tier), flat 3–4 column grid otherwise.
- **Gallery:** Masonry layout with native `<dialog>` lightbox triggered by `showModal()`. No JS framework.
- **CTA closing band:** Navy full-width section (`bg-deep`) with cream display headline + orange CTA button. Used to close most pages.

### Responsive
- **Below 768px:** All multi-column layouts collapse to single column. No exceptions.
- **Mobile nav:** Native `<details>` + `<summary>` (no JavaScript framework).
- **Typography:** Headline sizes scale via `clamp()`. Body minimum `1rem`.
- **Touch targets:** All interactive elements minimum 44px.
- **No horizontal scroll on mobile, ever.**

### Banned Layout Patterns
- Centered hero blocks for primary pages (force left-align with content rail).
- 3-equal-card horizontal feature rows.
- Full-bleed image heroes (low-res source photos).
- Carousels for content that already fits on screen.
- Sticky banners, popups, exit-intent modals.
- Overlapping elements with absolute positioning stacks.
- `h-screen` for full-height (iOS Safari catastrophic jump) — use `min-h-[100dvh]`.

---

## 6. Motion & Interaction

**Philosophy:** CSS-only, editorial, restrained. The site reads like a printed magazine — motion exists to ease transitions, not to perform.

- **Scroll reveal:** `.reveal` class uses `@starting-style` for a CSS-only fade-up on first viewport entry. Respects `prefers-reduced-motion: reduce`.
- **Hover transitions:** 200ms `ease` on color, border, transform. No bounces, no springs, no overshoot.
- **Card hover:** `translateY(-2px)` + shadow deepen. That's it.
- **Animate only:** `transform`, `opacity`, `color`. Never `top`, `left`, `width`, `height`, `margin`.
- **No perpetual loops:** No shimmer, no pulse, no floating elements. No "active dashboard" feel.
- **No scroll choreography:** No pinned sections, no scrub animations, no parallax. The page scrolls like a document.

---

## 7. Page Pattern Reference

For Stitch generating new screens that match the existing 9 routes:

| Pattern | Use When |
|---|---|
| `PageHero` block | Opening any internal page. Eyebrow + condensed headline + italic accent + optional kicker. |
| Orange tick + eyebrow + display heading | Opening any sub-section. Use `.rule-accent` class. |
| 60/40 asymmetric prose block | Mission, about, intro sections. |
| Pull-quote (Playfair italic large) | Breaking vertical rhythm in long-form pages. |
| Card grid (2 or 3 column) | Boards, events, conferences, sponsors. Never 3-equal feature rows. |
| Zig-zag image/text alternating | Volunteering programs, conference details. |
| Stats strip (large display numbers + labels) | Conferences page intro. Numbers in condensed display face. |
| Navy CTA closing band | Closing most pages. Cream display headline + orange button. |
| Filter chips (server-side) | Events archive, gallery. URL params drive filter state, no client JS. |

**Content sourcing:** All editable content lives in `src/data/*.json` (`site.json`, `board.json`, `events.json`, `sponsors.json`, `conferences.json`, `volunteering.json`). Never hardcode chapter copy in components — every editable field needs a JSON home.

---

## 8. Anti-Patterns (Explicit Bans)

Encoded here because anti-patterns are as important as rules. Stitch must avoid:

- ❌ **Pure black** (`#000000`) — use SHPE Navy `#001F5B` for primary ink.
- ❌ **Generic gradients** on headlines or backgrounds. Flat color always.
- ❌ **Glassmorphism, backdrop-blur, frosted-glass cards.**
- ❌ **Neon glows, accent-tinted shadows, outer rings on buttons or cards.**
- ❌ **Emojis** in copy or UI (unless user explicitly requests).
- ❌ **AI copywriting clichés:** "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize", "Unlock potential", "Empower", "Transform".
- ❌ **Generic placeholder names** ("John Doe", "Acme Corp", "Nexus", "Lorem ipsum" beyond truly throwaway scaffolding).
- ❌ **Fake round-number stats** ("99.9% satisfaction", "10x faster").
- ❌ **Filler scroll UI:** "Scroll to explore", bouncing chevrons, scroll arrows, "Swipe down".
- ❌ **3-equal-card horizontal feature rows** — use asymmetric or zig-zag.
- ❌ **Centered hero blocks** for primary pages — left-align with content rail.
- ❌ **Full-bleed image heroes** (source photos are 636×477 — will blur on upscale).
- ❌ **DKBG chapter logo on light backgrounds** — white wordmark vanishes.
- ❌ **Site-wide font scale increases** without explicit user request. Scope all type changes to the specific element that needs it.
- ❌ **Carousels** for content that fits on screen.
- ❌ **Sticky banners, exit-intent popups, modal overlays** for marketing.
- ❌ **Skeuomorphic buttons** with 3D tactile push effects.
- ❌ **Custom mouse cursors, animated SVG cursor trails.**
- ❌ **CSS framework dependencies** beyond Tailwind v4 (no Bootstrap, no Material).
- ❌ **JS framework islands** (no React, Vue, Svelte) unless an interactive widget genuinely requires it.

---

## 9. Implementation Notes for Stitch

When generating screens for this project:

1. **Compose with existing components** in `src/components/` before inventing new ones: `Nav`, `Footer`, `PageHero`, `SectionHeading`, `BoardCard`, `EventCard`, `ConferenceCard`, `SponsorGrid`, `Gallery`, `SocialLinks`, `MailingListForm`.
2. **Use Tailwind utilities mapped to the `@theme` tokens** in `src/styles/global.css`. Token names → utility classes: `--color-ink` → `text-ink`, `bg-ink`, `border-ink`.
3. **Astro 5 static** — no SSR, no React, no client-side framework. Components are `.astro` files.
4. **Content via JSON imports** — `import data from "@/data/foo.json"` then iterate.
5. **TypeScript strict mode.** All component props typed via `Astro.props` interface.
6. **Verify with `npm run check` and `npm run build`** — both must be 0 errors before considering a screen complete.
