# SHPE-BostonU Website

Editorial-style marketing site for Boston University's Society of Hispanic Professional Engineers chapter. Astro 5 + Tailwind v4, deployed as a static build to Cloudflare Pages.

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
npm run check        # type-check
npm run build        # dist/
```

## Editing content (no code required)

All chapter content lives in `src/data/*.json`:

- `site.json` — global metadata, contact, social URLs, donate link
- `board.json` — E-Board roster (one entry per role)
- `events.json` — past event recaps
- `conferences.json` — National Convention recaps
- `sponsors.json` — sponsor list
- `volunteering.json` — volunteer programs

To add a board member: append an object to `board.json`, drop their headshot into `public/assets/board/`, set `photo` to its path (e.g. `/assets/board/jane-doe.jpg`), commit, deploy.

To add a sponsor: append to `sponsors.json` with a `logo` path under `/assets/sponsors/`, drop the logo file into `public/assets/sponsors/`, optionally set a `tier` (`"Platinum"`, `"Gold"`, `"Silver"`, or `"Partner"`) — the Sponsors page will group by tier automatically if any entries have one.

To recap a new event: append to `events.json` with `title`, ISO `date` (`yyyy-mm` or `yyyy-mm-dd`), `category` (one of `Professional`, `Cultural`, `Social`, `Study Night`, `Volunteering`, `Conference`), `description`, and `photo` path.

## Assets

Originals live under `shpe-assets/` (raw source-of-truth, kept in repo for archival). Web-served copies live under `public/assets/`. Astro serves anything in `public/` from the site root, so `/assets/foo.jpg` resolves to `public/assets/foo.jpg`.

## Deploy (Cloudflare Pages — dashboard flow)

1. Cloudflare Dashboard → Pages → Connect to Git → select this repo.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Node version: 20 (or newer)
5. Save & deploy. Production branch = `main`.

No adapter is required — Cloudflare Pages serves the static `dist/` directly. If SSR is added later, install `@astrojs/cloudflare`, set `output: 'server'` in `astro.config.mjs`, and add the adapter to the `integrations` array.

### Optional: Deploy via wrangler CLI

If you prefer command-line deploys, install wrangler and run `wrangler pages deploy dist --project-name=bu-shpe`. A `wrangler.toml` is included so the project name and build output directory don't need to be re-specified.

## Project structure

```
src/
  layouts/Base.astro            # global shell, nav, footer, meta
  components/                   # Nav, Footer, Hero, SectionHeading, Hero, cards, gallery
  pages/                        # one .astro per route
  data/*.json                   # all editable content
  styles/global.css             # design tokens (@theme) + utility classes
  types.ts                      # TypeScript types for data files
public/
  assets/                       # served at /assets/*
  favicon.svg
  robots.txt
shpe-assets/                    # raw originals (archive)
docs/superpowers/plans/         # implementation plan(s)
```

## Design system

Color tokens (defined in `src/styles/global.css` via `@theme`): `bg`, `surface`, `ink`, `ink-muted`, `accent`, `link`, `rule`, `cream`, `deep`. Use as Tailwind utilities: `bg-accent`, `text-ink`, `border-rule`, etc.

Font tokens: `font-serif` (Instrument Serif), `font-sans` (Instrument Sans, default), `font-cond` (Barlow Condensed).

Custom utility classes: `.eyebrow` (uppercase tracked condensed label), `.display` (serif headline), `.pullquote` (italic serif callout), `.rule-accent` (orange tick above element), `.grain` (subtle noise overlay), `.photo-warm` (warm filter on child `<img>`), `.reveal` (scroll-reveal via `@starting-style`).

## License

UNLICENSED — internal chapter website.
