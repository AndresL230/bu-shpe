# CLAUDE.md

Project context for Claude Code sessions working on this repo. Read once at session start — everything below is stable.

## What this is

Editorial-style marketing site for **Boston University's SHPE chapter**. Astro 5 static site, Tailwind v4, TypeScript strict, deployed to **Cloudflare Workers static assets** (Git-connected). Every page is a `.astro` file that composes shared components and pulls content from `src/data/*.json`. No SSR, no React island, no client-side framework.

User: chapter member (`andreslopez.23061@gmail.com`). Tone is editorial / magazine, not corporate / SaaS.

## Quick commands

```bash
npm run check        # MUST be 0 errors before any commit
npm run build        # MUST succeed before any commit (writes ./dist, 15 pages)
npm run dev          # http://localhost:4321
```

There are no unit tests — this is a static marketing site. **Verification = `check` + `build` clean + visual confirmation in dev server.** Don't waste time scaffolding a test runner.

## Deployment

Git-connected **Cloudflare Workers static assets** (Worker name `bu-shpe`). Pushing to `main` on `AndresL230/bu-shpe` triggers a Cloudflare build that runs `npx wrangler deploy`; `wrangler.toml`'s `[build] command = "npm run build"` generates `./dist`, and `[assets] directory = "./dist"` uploads it. No dashboard build command is configured — the build lives in `wrangler.toml`. Live at `https://bu-shpe.andreslopez-23061.workers.dev`. Node is pinned to 22 via `.nvmrc`. **Not** Cloudflare Pages — the two config styles (`[assets]` vs `pages_build_output_dir`) are mutually exclusive; don't reintroduce `pages_build_output_dir`. `astro.config.mjs` `site:` is still the `https://shpe.bu.edu` placeholder, so built canonical URLs won't match the live workers.dev host until a real domain is set.

## File map

```
src/
  data/*.json             # ALL editable content (site, board, events, sponsors, conferences, volunteering)
  types.ts                # SiteMeta, BoardMember, EventItem, Sponsor, Conference, VolunteeringProgram
  styles/global.css       # @theme tokens + utility classes (.display, .eyebrow, .pullquote, .rule-accent, .grain, .photo-warm, .reveal)
  layouts/Base.astro      # html shell, meta, fonts, Nav, Footer, slot. Props: title, description, ogImage.
  components/             # Nav, Footer, PageHero, SectionHeading, BoardCard, EventCard, ConferenceCard, SponsorGrid, Gallery, SocialLinks, MailingListForm
  pages/                  # one .astro per route (15 routes total)
public/assets/            # served at /assets/*
shpe-assets/              # raw originals archive (not served)
docs/superpowers/plans/2026-05-21-bu-shpe-rebuild.md   # original implementation plan
```

## Design system (do not re-derive)

### Color tokens (Tailwind utility = token name)
- `bg` `#FAFAF8` warm off-white page background
- `surface` `#FFFFFF` cards
- `ink` `#001F5B` primary text (SHPE navy)
- `ink-muted` `#626366` secondary text (SHPE gray)
- `accent` `#FD652F` orange — CTAs, italic accent word, rule-accent tick
- `link` `#0070C0` SHPE blue
- `rule` `#72A9BE` SHPE pale blue — dividers
- `cream` `#FCF0D6` text on navy backgrounds
- `deep` `#001F5B` navy bg sections (alias of `ink`, kept for semantic clarity in `bg-deep`)

Use as Tailwind classes: `bg-deep`, `text-ink-muted`, `border-rule`, etc.

### Font tokens
- `--font-sans` → **Inter** (default body, UI, buttons, inputs)
- `--font-display` → **Barlow Condensed Bold 700** (used inside `.display`)
- `--font-cond` → **Barlow Condensed** (eyebrows + nav links)
- `--font-serif` → **Playfair Display Italic** (accent word inside headlines ONLY)
- `--font-mono` → **IBM Plex Mono** — section-local to `/conferences/*` (dossier treatment): data, dates, stat labels, `01 — TRAVEL` section indices, badge/table text. Surfaced via the `.mono-label` utility. Don't use elsewhere.

> **Section-local note:** `--font-mono` (IBM Plex Mono) and `--color-scarlet` (`#CC0000`, BU scarlet — one sparing accent per page max), plus the `.mono-label` / `.blueprint` / `.blueprint-deep` utilities, are the "delegation dossier" treatment scoped to `/conferences` + its three spokes. They're loaded site-wide but used only there.

### Custom classes
- `.display` — Barlow Condensed Bold 700, tight letter-spacing, line-height 1.05 — for all headlines
- `.pullquote` — Playfair Display italic, responsive size
- `.eyebrow` — Barlow Condensed SemiBold uppercase tracked 0.14em — section labels
- `.rule-accent` — orange `::before` tick line above element
- `.grain` — subtle SVG noise overlay via `::after`
- `.photo-warm` — `filter: saturate(1.05) contrast(1.02) sepia(0.04)` on child `<img>`
- `.reveal` — CSS-only scroll fade-up via `@starting-style`, respects `prefers-reduced-motion`

### Editorial italic-accent pattern (used on hero + CTA band)

```astro
<h1 class="display text-ink text-5xl">
  Some headline <em class="font-serif italic font-normal lowercase tracking-normal text-accent">accent word</em>!
</h1>
```

`PageHero.astro` does this automatically when the page passes `headlineAccent="..."`.

## Routes / page-by-page intent

| Path | File | Pattern |
|---|---|---|
| `/` | `pages/index.astro` | Off-white typographic hero (no image), 2-col layout with Four Values right rail. Then: mission band, pillars strip, recent events grid, sponsor strip, navy CTA band ("Become part of the *familia*") |
| `/about` | `pages/about.astro` | PageHero + mission asymmetric 2-col + values pull-quote + 10-reasons grid + event categories + constitution/advisor footer + CTA band |
| `/board` | `pages/board.astro` | PageHero + roster grid (officers + faculty advisor). Renders empty-state notice when all officers are `name: "TBD"`. |
| `/events` | `pages/events.astro` | PageHero + Google Calendar embed + filterable archive (`?cat=Professional` chips, server-side filter) + mailing-list nudge |
| `/conferences` | `pages/conferences.astro` | Dossier hub — credential badge, live countdown, count-up stats, key-dates timeline, trip manifest, cost/funding, eligibility, FAQ, spoke links, CTA |
| `/conferences/prep` | `pages/conferences/prep.astro` | Career fair prep — bootcamp checklist, industry-tagged recruiter wall, loadout, booth walkthrough |
| `/conferences/competitions` | `pages/conferences/competitions.astro` | Competition tracks scorecard, how-it-works, trophy record block |
| `/conferences/delegations` | `pages/conferences/delegations.astro` | Year-by-year dossier-entry archive (extensible via conferences.json) |
| `/volunteering` | `pages/volunteering.astro` | PageHero + pull-quote + alternating image/text program list (index parity controls left/right) + CTA |
| `/gallery` | `pages/gallery.astro` | PageHero + filter chips + masonry Gallery with native `<dialog>` lightbox |
| `/sponsors` | `pages/sponsors.astro` | PageHero + thank-you copy + SponsorGrid (tier-aware: groups by tier if any have one, flat otherwise) + sponsor-packet CTA + donate footnote |
| `/join` | `pages/join.astro` | PageHero + 3-step "how to join" + mailing list form + socials + contact card + donate ribbon |

## Architecture conventions

- **JSON is the source of truth.** Roster, events, sponsors, conferences, volunteering programs, contact emails, social URLs — all in `src/data/*.json`. Never hardcode chapter content inside `.astro` files. If something needs to be editable by a non-developer, add a token or field.
- **No inline hex colors.** Every color goes through a `@theme` token. Adding a new hue = add it to `global.css` first.
- **No JavaScript unless strictly necessary.** Static HTML by default. Existing inline `<script>` blocks: gallery lightbox (`Gallery.astro`), scroll-reveal toggle (none — pure CSS). That's it. Don't add a framework.
- **Editorial spacing rhythm.** Sections are `py-24` to `py-32`. Container width `max-w-[1200px]`. Paragraph copy capped at `max-w-3xl`.
- **`PageHero` for all internal pages.** Image-based heroes (`Hero.astro`) were removed because source photos are low-res (see below).
- **TypeScript strict — `@/*` resolves to `src/*`.** Use `@/types`, `@/data/site.json`, `@/components/Foo.astro`, `@/styles/global.css`.

## Asset constraint (important)

The bulk of event/volunteering/conference photos in `public/assets/` were scraped from the old WordPress site at **636×477 px** — thumbnail resolution. They look fine inline (event cards, gallery, volunteering blocks) but **must not be used as full-bleed hero backgrounds** — the upscale to 1920px+ is visibly blurry. That's why every page uses `PageHero` (typographic, no image) instead of `Hero` (image-based, deprecated).

Don't reintroduce image-based heroes unless higher-resolution originals are available.

## Logo asset constraint

The only chapter logo file in the repo is `public/assets/logos/SHPE_logo_horiz_Boston-University_DKBG.png` — the **dark-background** variant. Its wordmark + BU mark are **white**, only the swirl mark and orange tagline are colored. This means:

- ✅ Works on the navy navbar (`bg-deep`) and the navy footer (`bg-deep`)
- ❌ Does NOT work on any light background — the wordmark becomes invisible

If a future design wants the logo on a light background, the chapter needs to supply a light-bg / color-on-white variant. Until then, the logo lives only in nav + footer.

## Things NOT to do

- Don't bring back full-bleed image heroes (low-res source photos).
- Don't put the DKBG logo on a light background — wordmark vanishes.
- Don't add CSS framework dependencies (no Bootstrap, no Material). Tailwind v4 only.
- Don't add a JS framework (no React, Vue, Svelte). React integration is installed-on-demand if/when a true interactive island is needed.
- Don't add a test runner. Verification is `check + build + visual`.
- Don't reintroduce the `transparentNav` prop on `Base.astro`. The navbar is always navy now. The toggle scroll listener was removed.
- Don't change the chapter logo size in the nav without explicit user request — the user is particular about this.
- Don't scale up font sizes site-wide without explicit user request — the user has rejected this twice. If they want a UI element bigger, scope changes to just that element.

## Useful patterns / gotchas

- **Adding font weights:** Inter loads 400/500/600/700, Barlow Condensed loads 500/600/700, Playfair Display loads 400/500 italic. To use a weight not in that set, update the Google Fonts URL in `Base.astro`.
- **Tailwind v4 `@theme`:** custom tokens become utility classes by stripping the prefix. `--color-foo` → `bg-foo`, `text-foo`, `border-foo`. `--font-foo` → `font-foo`.
- **Date sorting:** ISO `yyyy-mm` / `yyyy-mm-dd` strings sort correctly with `String.prototype.localeCompare`. Used by `index.astro` and `events.astro`. No `Date` parsing needed.
- **Events page chip filtering:** server-side via `Astro.url.searchParams.get('cat')`. No client-side JS.
- **Gallery lightbox:** native `<dialog>` + `showModal()` + click-outside-to-close. ESC works for free.
- **Mailing-list form:** `<form action="mailto:...?subject=...">` — no backend. Works on static deploy. Future: swap to a Cloudflare Pages Function if needed.
- **Mobile menu:** native `<details>` + `<summary>`. No JS.

## Workflow expectations

- **Run `npm run check` before any commit.** The user expects 0 errors / 0 warnings / 0 hints.
- **Run `npm run build` before any commit.** Must produce all 15 pages cleanly.
- **Commit with descriptive messages** — the user reads them. Group related changes into one logical commit.
- **Use heredoc for multi-line commit messages** to preserve formatting:
  ```bash
  git commit -m "$(cat <<'EOF'
  short summary

  More detailed explanation with line wraps that survive.
  EOF
  )"
  ```
- **Never push to remote unless asked.** No remote is currently configured.
- **Co-author trailer:** the user's repo has been receiving Sonnet 4.6 co-author trailers from sub-agents and Opus 4.7 trailers from the main session. Don't pre-bake a model name into sub-agent commit prompts — let each sub-agent attribute its own work.

## Original implementation plan

The plan that drove the initial build is at `docs/superpowers/plans/2026-05-21-bu-shpe-rebuild.md`. It's a historical artifact — the actual code has diverged from it (esp. hero treatment, navbar styling). Use it for context on the original architecture decisions, not as a current spec.

## When the user asks for a design change

The user iterates quickly on visual feedback and has specific preferences:
- Editorial / magazine aesthetic, not SaaS.
- Sparse, lots of whitespace. Don't clutter.
- They reject obvious-AI-defaults: generic gradients, glassmorphism, gray card borders, cliché stock-photo placeholder language.
- They care about typography. The current type system (Inter + Barlow Condensed Bold + Playfair Display Italic) was chosen after several iterations — don't change fonts without an explicit request.
- They will tell you when something is wrong. Don't preemptively redesign.

When in doubt about a design direction, surface a quick `AskUserQuestion` with 2–3 concrete options (using the `preview` field for ASCII mockups) rather than guessing.
