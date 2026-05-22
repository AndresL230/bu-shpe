# SHPE-BostonU Website

Editorial-style marketing site for Boston University's chapter of the Society of Hispanic Professional Engineers. Built with Astro 5 + Tailwind CSS v4, statically rendered, deployed to Cloudflare Pages. All chapter content lives in JSON files so non-developers can update the roster, events, sponsors, conferences, and volunteer programs without touching code.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 5** | `output: 'static'` — pure SSG, no runtime |
| Styling | **Tailwind CSS v4** | Via `@tailwindcss/vite`; tokens defined in CSS with `@theme` |
| Language | **TypeScript** | `strict` mode, `@/*` alias to `src/*` |
| Fonts | Google Fonts | Inter, Barlow Condensed, Playfair Display Italic |
| Hosting | Cloudflare Pages | Static `dist/` deploy, optional `wrangler.toml` |

No SSR adapter, no React island, no JS framework on the page — every page is a static `.astro` file with a tiny inline `<script>` only where strictly needed (mobile drawer toggle, gallery lightbox, scroll reveal).

---

## Quick start

```bash
# 1. install deps
npm install

# 2. run dev server
npm run dev                # http://localhost:4321

# 3. type-check before committing
npm run check              # astro check — must report 0 errors

# 4. production build
npm run build              # writes ./dist
npm run preview            # serves ./dist locally
```

**Node:** 20+ recommended. Astro 5 needs Node 18.17.1+.

---

## Editing content (no code required)

All chapter-editable content lives in `src/data/*.json`. The TypeScript types backing each file live in `src/types.ts` — your editor will autocomplete and validate as you type.

### `site.json` — global metadata

Holds chapter name, mission, contact emails, the Google Calendar embed URL, donate link, sponsorship packet link, constitution PDF link, and social URLs (LinkedIn, Instagram, Facebook, SHPE National). Touched by every page via `import siteData from "@/data/site.json"`.

To change the contact email, donate link, or any social URL: edit `site.json`, commit, deploy.

### `board.json` — E-Board roster

```json
[
  {
    "name": "Jane Doe",
    "role": "President",
    "major": "Computer Engineering",
    "year": "Senior",
    "hometown": "Houston, TX",
    "bio": "Joined SHPE in fall 2022. Loves robotics and salsa dancing.",
    "photo": "/assets/board/jane-doe.jpg"
  }
]
```

The roster is grouped on the Board page into **officers** (`role !== "Faculty Advisor"`) and the **Faculty Advisor** (one entry). If every officer entry has `name: "TBD"`, the page renders a "We're updating the roster" notice instead of a stale grid.

**To add a board member:**
1. Drop their headshot into `public/assets/board/` (any common image format works — JPEG/PNG/WebP).
2. Append a new object to `board.json` with `photo: "/assets/board/<filename>"`.
3. Commit and deploy.

### `events.json` — past event recaps

```json
{
  "title": "Resume Review with GE",
  "date": "2022-10",
  "category": "Professional",
  "description": "Three GE engineers gave one-on-one resume feedback.",
  "photo": "/assets/events/resume-review-ge.png"
}
```

`category` must be one of: `"Professional"`, `"Cultural"`, `"Social"`, `"Study Night"`, `"Volunteering"`, `"Conference"`. `date` is ISO `yyyy-mm` or `yyyy-mm-dd` — string-sort works because of the ISO format. The Events page filters by `?cat=Professional` etc. and sorts newest first.

**Upcoming events** are not in this JSON file — they come from the embedded Google Calendar (`siteData.calendarEmbedUrl`). To change which calendar is shown, edit `site.json`.

### `conferences.json` — National Convention recaps

```json
{
  "year": 2023,
  "city": "Salt Lake City, UT",
  "region": "National Convention",
  "description": "Members received interviews and offers...",
  "photos": ["/assets/conferences/national-convention-2023-slc.jpeg"]
}
```

`photos[0]` is used as the full-bleed background of the conference card; the rest are currently unused but reserved for a future detail view.

### `sponsors.json` — sponsor list

```json
{
  "name": "Capital One",
  "logo": "/assets/sponsors/capital-one.png",
  "url": "https://www.capitalonecareers.com/",
  "tier": "Gold"
}
```

`tier` is optional. **If any sponsor has a `tier`, the Sponsors page groups all sponsors by tier** (Platinum → Gold → Silver → Partner) with subheadings. If no entries have `tier`, the page renders a flat 4-column grid. So you can introduce tiers later without code changes — just add the field to existing entries.

### `volunteering.json` — community service programs

```json
{
  "name": "Museum of Science — Women's History Month",
  "description": "Hosted a hands-on station teaching kids about science...",
  "photos": [
    "/assets/volunteering/museum-of-science-1.jpeg",
    "/assets/volunteering/museum-of-science-2.jpeg"
  ]
}
```

The Volunteering page alternates programs left/right with editorial overlapping photos. Programs with `photos.length === 0` render a navy quote card instead of an image — useful for new programs that don't have photos yet.

---

## Assets

Two parallel asset directories live in the repo:

- **`shpe-assets/`** — raw source-of-truth originals (logos, scraped photos, the chapter constitution PDF). Tracked in git as an archive. Don't reference these paths from JSON.
- **`public/assets/`** — web-served copies. Astro serves anything under `public/` from the site root, so `public/assets/events/foo.jpg` becomes `https://shpe.bu.edu/assets/events/foo.jpg` and that's what you put in `events.json`.

When you add a new asset:
1. Add the original to `shpe-assets/<category>/` (if you want an archived copy).
2. Always add the web copy to `public/assets/<category>/`.
3. Reference it in JSON as `/assets/<category>/<filename>`.

### Known asset limitations

The bulk of the event/volunteering/conference photos in this repo were scraped from the old `sites.bu.edu/shpe` WordPress site at **636×477 px** — thumbnail resolution. They look fine inline as event cards or in the gallery, but they were intentionally **not used as full-bleed hero backgrounds** because the upscale would be visibly blurry. Page heroes are typographic instead. Replace these files with higher-resolution originals when available.

---

## Project structure

```
bu-shpe/
├─ astro.config.mjs          # Astro + Tailwind plugin + site URL
├─ tsconfig.json             # strict TS, @/* → src/*
├─ wrangler.toml             # optional Cloudflare Pages CLI deploy config
├─ package.json
│
├─ public/
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ assets/                # served at /assets/*
│     ├─ logos/              # chapter logo (DKBG only), donate graphic, constitution.pdf
│     ├─ events/             # past-event recap photos
│     ├─ conferences/        # National Convention photos
│     ├─ sponsors/           # sponsor logos
│     ├─ volunteering/       # community service photos
│     └─ board/              # E-board headshots + placeholder.svg
│
├─ src/
│  ├─ env.d.ts               # Astro type shim
│  ├─ types.ts               # SiteMeta, BoardMember, EventItem, Sponsor, Conference, VolunteeringProgram
│  │
│  ├─ data/                  # ALL editable content — JSON-driven
│  │  ├─ site.json
│  │  ├─ board.json
│  │  ├─ events.json
│  │  ├─ conferences.json
│  │  ├─ sponsors.json
│  │  └─ volunteering.json
│  │
│  ├─ styles/
│  │  └─ global.css          # @theme tokens, base resets, utility classes (.display, .eyebrow, etc.)
│  │
│  ├─ layouts/
│  │  └─ Base.astro          # html shell, meta, fonts, <Nav>, <Footer>, slot
│  │
│  ├─ components/
│  │  ├─ Nav.astro           # navy fixed top nav with full DKBG logo + condensed-bold uppercase links
│  │  ├─ Footer.astro        # navy footer with logo, contact, socials, donate CTA
│  │  ├─ PageHero.astro      # typographic editorial hero (no images)
│  │  ├─ Hero.astro          # legacy full-bleed image hero — not currently used; safe to delete
│  │  ├─ SectionHeading.astro
│  │  ├─ BoardCard.astro
│  │  ├─ EventCard.astro
│  │  ├─ ConferenceCard.astro
│  │  ├─ SponsorGrid.astro
│  │  ├─ Gallery.astro       # CSS-columns masonry + native <dialog> lightbox
│  │  ├─ SocialLinks.astro
│  │  └─ MailingListForm.astro  # mailto: form (no server needed)
│  │
│  └─ pages/                 # one .astro file per route
│     ├─ index.astro         # /
│     ├─ about.astro         # /about
│     ├─ board.astro         # /board
│     ├─ events.astro        # /events (calendar embed + filterable archive)
│     ├─ conferences.astro   # /conferences
│     ├─ volunteering.astro  # /volunteering
│     ├─ gallery.astro       # /gallery (filterable masonry + lightbox)
│     ├─ sponsors.astro      # /sponsors
│     └─ join.astro          # /join
│
├─ shpe-assets/              # raw originals archive (git-tracked, not served)
└─ docs/
   └─ superpowers/
      └─ plans/
         └─ 2026-05-21-bu-shpe-rebuild.md  # original implementation plan
```

---

## Design system

Defined entirely in `src/styles/global.css` via Tailwind v4's `@theme` directive. Every page and component pulls from these tokens — no inline hex codes anywhere.

### Color tokens

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `bg` | `#FAFAF8` | `bg-bg` `text-bg` | Page background (warm off-white) |
| `surface` | `#FFFFFF` | `bg-surface` | Cards, raised surfaces |
| `ink` | `#001F5B` | `text-ink` `border-ink` | Primary text (SHPE navy) |
| `ink-muted` | `#626366` | `text-ink-muted` | Body / secondary text (SHPE gray) |
| `accent` | `#FD652F` | `bg-accent` `text-accent` | CTAs, highlights, the orange rule, italic accent word |
| `link` | `#0070C0` | `text-link` | Inline links (SHPE blue) |
| `rule` | `#72A9BE` | `border-rule` | Dividers, tags (SHPE pale blue) |
| `cream` | `#FCF0D6` | `text-cream` | Text on navy backgrounds |
| `deep` | `#001F5B` | `bg-deep` | Navy sections (nav, footer, CTA bands) |

`deep` is an alias of `ink` — kept separate so it reads correctly as a *background* color in component code.

### Font tokens

| Token | Value | Tailwind class | Use |
|---|---|---|---|
| `--font-sans` | Inter | `font-sans` (default) | Body, UI, buttons, form inputs |
| `--font-display` | Barlow Condensed Bold 700 | (used inside `.display`) | Headlines (`<h1>` / `<h2>`) |
| `--font-cond` | Barlow Condensed | `font-cond` | Eyebrows + navbar links |
| `--font-serif` | Playfair Display Italic | `font-serif` | Accent words inside headlines only (`<em>Familia</em>`) |

Font-stack rationale: SHPE's official typeface is Univers LT Std (paid). The brand brief's web-fallback recommendation is "bold condensed sans-serif for headlines + clean sans-serif for body" — Barlow Condensed + Inter implement that exactly. Playfair Display Italic gives editorial contrast for single accent words against the bold condensed display.

### Custom utility classes

| Class | What it does |
|---|---|
| `.display` | Barlow Condensed Bold 700, tight letter-spacing — for all headlines |
| `.pullquote` | Playfair Display Italic, responsive size — editorial callouts |
| `.eyebrow` | Barlow Condensed SemiBold uppercase tracked — small category labels |
| `.rule-accent` | Adds an orange tick line (`::before`) above the element — section heading accent |
| `.grain` | Subtle SVG noise overlay via `::after` — applied on hero + dark sections for texture |
| `.photo-warm` | CSS filter on child `<img>` — slight warm color grade for editorial photo consistency |
| `.reveal` | Fade-up-on-load via `@starting-style` — CSS-only scroll reveal, respects `prefers-reduced-motion` |

### Editorial accent pattern

Headlines with an italic-serif accent word:

```astro
<h1 class="display text-ink text-5xl">
  ¡Bienvenidos a la <em class="font-serif italic font-normal lowercase tracking-normal text-accent">Familia</em>!
</h1>
```

The `<em>` keeps the word in italic Playfair Display while the rest stays in Barlow Condensed Bold. Used on the Home hero and the CTA band ("become part of the *familia*").

---

## Common tasks

### Add a new E-Board member

```diff
  // src/data/board.json
  [
+   {
+     "name": "Maria Lopez",
+     "role": "Secretary",
+     "major": "Mechanical Engineering",
+     "year": "Junior",
+     "hometown": "Miami, FL",
+     "bio": "Loves CAD and Cuban coffee.",
+     "photo": "/assets/board/maria-lopez.jpg"
+   },
    ...
  ]
```

Then drop `maria-lopez.jpg` into `public/assets/board/`. Commit + deploy.

### Add a new past event recap

```diff
  // src/data/events.json
  [
+   {
+     "title": "Fall 2025 Recruiter Mixer",
+     "date": "2025-10",
+     "category": "Professional",
+     "description": "Recruiters from Google, Lockheed, and Apple over empanadas.",
+     "photo": "/assets/events/fall-2025-mixer.jpg"
+   },
    ...
  ]
```

Drop the photo into `public/assets/events/`.

### Change the Google Calendar shown on /events

Edit `siteData.calendarEmbedUrl` in `src/data/site.json` — paste the embed URL from Google Calendar's share dialog.

### Update the donate link

Edit `siteData.donateUrl` in `src/data/site.json`. Used by the footer and the Join page.

### Update a sponsor's tier

```diff
  // src/data/sponsors.json
  {
    "name": "Capital One",
    "logo": "/assets/sponsors/capital-one.png",
    "url": "https://www.capitalonecareers.com/",
+   "tier": "Gold"
  }
```

The Sponsors page automatically groups by tier when *any* sponsor has the field set.

### Hide the empty-roster notice on /board

Once real names replace the `"TBD"` placeholders in `board.json`, the "We're updating the roster" panel disappears automatically. (The check: `board.json.every(m => m.name === "TBD" && m.role !== "Faculty Advisor")`.)

### Add a new page

1. Create `src/pages/<route>.astro`.
2. Wrap in `<Base title="<Page>">...</Base>`.
3. Start with `<PageHero eyebrow="..." headline="..." headlineAccent="..." subtitle="..." />` for editorial consistency.
4. Add a link to it in `src/components/Nav.astro`'s `links` array.

---

## Deployment

### Cloudflare Pages — dashboard (recommended for the chapter)

1. Cloudflare dashboard → **Pages → Create application → Connect to Git** → select this repo.
2. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Node version:** `20` (set under Environment variables: `NODE_VERSION=20`)
3. Save & deploy. Production branch = `main`. Every push to `main` auto-deploys.

No adapter is required — Astro's static output (`output: 'static'`) writes plain HTML/CSS/JS that Pages serves directly. If you ever add SSR routes, install `@astrojs/cloudflare`, set `output: 'server'` in `astro.config.mjs`, and add the adapter under `integrations`.

### Cloudflare Pages — wrangler CLI

```bash
npm install -g wrangler          # one-time
wrangler login                   # one-time
npm run build
wrangler pages deploy dist       # project name + output dir come from wrangler.toml
```

### Custom domain

In the Pages project settings → **Custom domains → Set up a custom domain** → add `shpe.bu.edu` (or whatever the chapter chooses). Update `site` in `astro.config.mjs` to match — that field is used for the canonical URL meta tag and sitemap.

---

## Browser support

Modern evergreen browsers. The site uses several modern CSS features (`@starting-style`, `color-mix()`, native `<dialog>`, `<details>` for the mobile drawer, CSS containment via `isolation: isolate`). Tested defaults:

- Chrome / Edge 117+
- Firefox 129+
- Safari 17.4+

`prefers-reduced-motion: reduce` is honored — the scroll-reveal `.reveal` class doesn't animate when the user has motion reduced.

---

## Conventions

- **No inline hex colors.** Every color references a `@theme` token via Tailwind utility classes. If you find yourself wanting a new hue, add it to `global.css` as a token first.
- **No JavaScript unless strictly necessary.** Astro renders to static HTML. The only `<script>` blocks in the codebase are the mobile drawer toggle (none — native `<details>`), gallery lightbox, and scroll reveal (CSS-only). Keep it that way.
- **Editorial spacing.** Sections are `py-24` to `py-32`. Container width is `max-w-[1200px]`. Paragraph copy is capped at `max-w-3xl` for readability.
- **JSON is the source of truth.** Component code should never hardcode roster/event/sponsor content. If something needs to be editable by a non-developer, add a token or field — don't embed strings in `.astro` files.
- **Run `npm run check` before every commit.** It catches type errors, missing imports, and Astro template issues.

---

## License

UNLICENSED — internal chapter website. Do not redistribute without chapter approval.
