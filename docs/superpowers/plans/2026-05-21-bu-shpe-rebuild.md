# BU SHPE Website Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Design-skill workflow:** This plan explicitly invokes frontend design skills at specific gates:
> - `superpowers:brainstorming` (only if scope shifts) + `shape` — direction setting before pages
> - `frontend-design:frontend-design` (alias: `impeccable craft`) — every page build
> - `typeset`, `layout` — applied within page builds when refining
> - `adapt` — responsive pass (Task 19)
> - `animate` — motion pass (Task 20)
> - `audit` + `critique` + `polish` — pre-ship quality gates (Tasks 21–22)
>
> **Parallel dispatch:** Tasks 10–18 (the nine page builds) are independent. Use `superpowers:dispatching-parallel-agents` to fan them out concurrently once Phase 1 (foundation + design system) is complete. Each page brief in this plan is self-contained so a fresh subagent can pick it up cold.

**Goal:** Ship a multi-page, editorial-aesthetic marketing site for BU SHPE built with Astro 5 + Tailwind v4, deployable as a static build to Cloudflare Pages, with all roster/event/sponsor data driven by JSON files so non-developers can update content.

**Architecture:** Astro static-site generation (`output: 'static'`). Shared `Base.astro` layout provides navigation, footer, fonts, and global metadata. Page-specific `.astro` files compose reusable Astro components (`Hero`, `BoardCard`, `EventCard`, `SponsorGrid`, `ConferenceCard`, `SectionHeading`). Content lives in typed JSON under `src/data/*.json` and is imported at build time. Tailwind v4 via `@tailwindcss/vite`, with chapter design tokens defined under `@theme` in `src/styles/global.css`. No React islands in v1 (the spec lists `@astrojs/react` for future admin/forms — defer install until needed).

**Tech Stack:** Astro 5 · Tailwind CSS v4 · TypeScript (strict) · Google Fonts (Instrument Serif, Instrument Sans, Barlow Condensed) · Cloudflare Pages (static deploy, no adapter required for v1)

**Cloudflare-adapter note:** The original brief lists `@astrojs/cloudflare`, but that adapter is only used with `output: 'server'` / `'hybrid'`. For a static build, Cloudflare Pages simply serves `dist/` and no adapter is needed. We will document the swap-in steps for future SSR but not install the package now (YAGNI).

---

## File Structure (Decomposition Map)

Lock these boundaries in before coding so each task is self-contained.

```
bu-shpe/
  astro.config.mjs                    # Astro + Tailwind plugin + site config
  tsconfig.json                       # strict TS, "@/*" alias to src/*
  package.json                        # deps + scripts
  .gitignore
  README.md                           # one-pager: dev, build, deploy, content edits
  wrangler.toml                       # OPTIONAL — only if using `wrangler pages deploy`
  public/
    favicon.svg
    robots.txt
    assets/
      logos/                          # chapter logo, donate graphic, constitution.pdf
      events/                         # 9 event jpgs/png
      conferences/                    # 2 convention jpegs
      sponsors/                       # 7 sponsor logos
      volunteering/                   # 3 volunteering jpegs
      board/                          # placeholder headshot until real photos arrive
  src/
    env.d.ts                          # Astro env types
    types.ts                          # BoardMember, EventItem, Sponsor, Conference, VolunteeringProgram, SiteMeta
    styles/
      global.css                      # @import tailwindcss; @theme tokens; base resets; noise overlay; grain
    data/
      site.json                       # global meta, contact, social, donate, calendar URL
      board.json                      # E-board roster
      events.json                     # past-event recaps (calendar embed handles "upcoming")
      conferences.json                # convention recaps + photo arrays
      sponsors.json                   # sponsor list (currently flat — `tier` field reserved)
      volunteering.json               # programs + photo arrays
    layouts/
      Base.astro                      # html shell, fonts, meta, slot, nav, footer
    components/
      Nav.astro                       # sticky nav, transparent-over-hero, mobile drawer
      Footer.astro                    # navy footer, 3-col, donate CTA
      Hero.astro                      # reusable hero (image, eyebrow, headline, subtitle, CTAs)
      SectionHeading.astro            # eyebrow + serif headline + orange accent line
      BoardCard.astro                 # headshot + name + role chip + bio (expand on hover)
      EventCard.astro                 # event photo + category chip + title + blurb + date
      ConferenceCard.astro            # full-bleed image card + year overlay + recap
      SponsorGrid.astro               # logo grid w/ grayscale→color hover, optional tier groups
      SocialLinks.astro               # icon row (LinkedIn, IG, FB, shpe.org)
      MailingListForm.astro           # static form posting to mailto: (v1) — placeholder for future endpoint
      Gallery.astro                   # CSS columns masonry + native <dialog> lightbox
    pages/
      index.astro                     # Home
      about.astro                     # Who We Are
      board.astro                     # E-Board grid
      events.astro                    # Calendar embed + past-event archive
      conferences.astro               # Conference recaps
      volunteering.astro              # Volunteer programs
      gallery.astro                   # Photo gallery (all event + volunteering + conference photos)
      sponsors.astro                  # Sponsor grid + sponsorship packet CTA
      join.astro                      # Mailing list + socials + contact + donate
  docs/
    superpowers/plans/2026-05-21-bu-shpe-rebuild.md   # this file
```

**Files that change together live together.** Components are flat (no nesting) — the site is small enough that nesting adds friction. Data files mirror the components that consume them.

---

## Verification Model

Astro static sites don't have a meaningful unit-test surface — the deliverable is rendered HTML, not behavior. We use these gates instead of TDD:

1. **`npm run check`** — `astro check` runs TypeScript + content validation across `.astro` files. Must pass with 0 errors.
2. **`npm run build`** — full static build. Must complete with 0 errors and produce `dist/`.
3. **Visual confirmation** — start `npm run dev` (port 4321) and open the changed page in a browser. Confirm renders match brief.
4. **Design-skill gates** — `audit`, `critique`, `polish` at the end. These produce reports and apply fixes.

Every task ends with steps 1–3. The plan calls out which design skill (if any) to invoke for the task.

---

## Phase 0 — Foundation

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/env.d.ts`

- [ ] **Step 1: Initialize npm + install deps**

Run from `/home/andresl/Projects/bu-shpe`:

```bash
npm init -y
npm install --save-exact astro@^5
npm install --save-exact @tailwindcss/vite@^4 tailwindcss@^4
npm install --save-dev --save-exact typescript@^5
```

- [ ] **Step 2: Write `astro.config.mjs`**

Create `astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://shpe.bu.edu', // placeholder; update once domain is finalized
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "preserve",
    "verbatimModuleSyntax": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.env
.env.*
.DS_Store
.wrangler/
```

- [ ] **Step 5: Write `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 6: Replace `scripts` in `package.json`**

Edit `package.json` `"scripts"` block to:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check"
}
```

Then install the check CLI:

```bash
npm install --save-dev --save-exact @astrojs/check@^0 typescript@^5
```

- [ ] **Step 7: Verify build pipeline**

Run:

```bash
npm run check && npm run build
```

Expected: `astro check` reports 0 errors (project is empty so this just confirms toolchain). `npm run build` fails with `No pages found` — that's expected; we add pages later.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .gitignore src/env.d.ts
git commit -m "chore: scaffold Astro 5 + Tailwind v4 + TS project"
```

---

### Task 2: Migrate assets into `public/`

**Files:**
- Create directory tree under `public/assets/`
- Copy: `shpe-assets/**/*` → `public/assets/**/*`
- Create: `public/robots.txt`
- Create: `public/favicon.svg`

- [ ] **Step 1: Move asset tree**

```bash
mkdir -p public/assets
cp -r shpe-assets/logos public/assets/logos
cp -r shpe-assets/events public/assets/events
cp -r shpe-assets/conferences public/assets/conferences
cp -r shpe-assets/sponsors public/assets/sponsors
cp -r shpe-assets/volunteering public/assets/volunteering
mkdir -p public/assets/board
```

- [ ] **Step 2: Verify all expected files exist**

```bash
ls public/assets/logos public/assets/events public/assets/conferences public/assets/sponsors public/assets/volunteering
```

Expected: 3 files in logos, 9 in events, 2 in conferences, 7 in sponsors, 3 in volunteering. (The board/ dir is empty until headshots arrive.)

- [ ] **Step 3: Write `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://shpe.bu.edu/sitemap-index.xml
```

- [ ] **Step 4: Write `public/favicon.svg`**

A simple SHPE-orange "S" tile. Replace later with proper chapter mark.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#001F5B"/>
  <text x="32" y="44" font-family="Georgia, serif" font-size="38" font-weight="700"
        fill="#FD652F" text-anchor="middle">S</text>
</svg>
```

- [ ] **Step 5: Decide on `shpe-assets/` raw folder**

The raw `shpe-assets/` directory at repo root is the source-of-truth for asset originals. Keep it tracked (it's currently untracked). Add a short note in `README.md` later that explains this.

- [ ] **Step 6: Commit**

```bash
git add public/ shpe-assets/
git commit -m "feat: import chapter assets into public/ and keep raw originals"
```

---

### Task 3: Global styles, fonts, design tokens

**Files:**
- Create: `src/styles/global.css`

This task uses the editorial color/type system from the brief. Tailwind v4's `@theme` directive registers custom tokens as utility classes.

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";

/* ---------- Design tokens ---------- */
@theme {
  /* SHPE-adapted editorial palette */
  --color-bg:          #FAFAF8;   /* warm off-white page bg */
  --color-surface:     #FFFFFF;   /* cards, raised surfaces */
  --color-ink:         #001F5B;   /* SHPE navy — primary text */
  --color-ink-muted:   #626366;   /* SHPE gray — secondary text */
  --color-accent:      #FD652F;   /* SHPE orange — CTAs, highlights */
  --color-link:        #0070C0;   /* SHPE blue — interactive */
  --color-rule:        #72A9BE;   /* SHPE pale blue — dividers, tags */
  --color-cream:       #FCF0D6;   /* footer / dark-section text */
  --color-deep:        #001F5B;   /* dark sections (alias of ink for clarity) */

  /* Fonts (loaded via <link> in Base.astro) */
  --font-serif:  "Instrument Serif", ui-serif, Georgia, serif;
  --font-sans:   "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-cond:   "Barlow Condensed", "Helvetica Neue Condensed", sans-serif;

  /* Editorial rhythm */
  --radius-card: 12px;
  --shadow-card: 0 1px 2px rgba(0,31,91,.04), 0 12px 24px -12px rgba(0,31,91,.10);
  --shadow-card-hover: 0 2px 4px rgba(0,31,91,.06), 0 24px 40px -16px rgba(0,31,91,.18);
}

/* ---------- Base resets ---------- */
:root {
  color-scheme: light;
}

html {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  min-height: 100dvh;
}

::selection {
  background: var(--color-accent);
  color: white;
}

/* ---------- Typography utilities (editorial) ---------- */
.eyebrow {
  font-family: var(--font-cond);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  color: var(--color-ink-muted);
}

.display {
  font-family: var(--font-serif);
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.05;
}

.pullquote {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(1.4rem, 2.4vw, 2.1rem);
  line-height: 1.3;
  color: var(--color-ink);
}

/* ---------- Subtle grain overlay (apply via .grain) ---------- */
.grain { position: relative; isolation: isolate; }
.grain::after {
  content: "";
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: .08;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
}

/* ---------- Warm photo treatment for events/volunteering ---------- */
.photo-warm img {
  filter: saturate(1.05) contrast(1.02) sepia(0.04);
}

/* ---------- Accent rule (orange tag line above headings) ---------- */
.rule-accent::before {
  content: "";
  display: block;
  width: 44px;
  height: 3px;
  background: var(--color-accent);
  margin-bottom: 1rem;
}

/* ---------- Reveal-on-scroll (CSS-only via @starting-style) ---------- */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 1;
    translate: 0 0;
    transition: opacity .6s ease, translate .6s ease;
  }
  @starting-style {
    .reveal { opacity: 0; translate: 0 12px; }
  }
}
```

- [ ] **Step 2: Verify the stylesheet parses**

Run:

```bash
npm run check
```

Expected: 0 errors. (The file isn't imported anywhere yet, so it won't be included — but it must be valid CSS.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: design tokens, fonts, editorial type utilities, grain + warm-photo filters"
```

---

### Task 4: TypeScript content types + JSON data seeds

**Files:**
- Create: `src/types.ts`
- Create: `src/data/site.json`
- Create: `src/data/board.json`
- Create: `src/data/events.json`
- Create: `src/data/sponsors.json`
- Create: `src/data/conferences.json`
- Create: `src/data/volunteering.json`

JSON files use the real asset filenames migrated in Task 2. Roster names are placeholders the chapter fills in — that's the whole point of the JSON-driven approach.

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type SocialPlatform = "linkedin" | "instagram" | "facebook" | "shpe";

export interface SiteMeta {
  name: string;
  shortName: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  facultyAdvisorEmail: string;
  region: string;
  calendarEmbedUrl: string;
  donateUrl: string;
  sponsorshipPacketUrl: string;
  constitutionUrl: string;
  socials: Record<SocialPlatform, string>;
}

export interface BoardMember {
  name: string;
  role: string;
  major: string;
  year: string;
  hometown: string;
  bio: string;
  photo: string; // path under /assets/board/
}

export type EventCategory =
  | "Professional"
  | "Cultural"
  | "Social"
  | "Study Night"
  | "Volunteering"
  | "Conference";

export interface EventItem {
  title: string;
  date: string;   // ISO yyyy-mm or yyyy-mm-dd
  category: EventCategory;
  description: string;
  photo: string;  // path under /assets/events/
}

export interface Sponsor {
  name: string;
  logo: string;   // path under /assets/sponsors/
  url?: string;
  tier?: "Platinum" | "Gold" | "Silver" | "Partner";
}

export interface Conference {
  year: number;
  city: string;
  region?: string;
  description: string;
  photos: string[]; // paths under /assets/conferences/
}

export interface VolunteeringProgram {
  name: string;
  description: string;
  photos: string[]; // paths under /assets/volunteering/
}
```

- [ ] **Step 2: Write `src/data/site.json`**

```json
{
  "name": "SHPE-BostonU",
  "shortName": "SHPE BU",
  "tagline": "¡Bienvenidos a la Familia!",
  "mission": "SHPE changes lives by empowering the Hispanic community to realize its fullest potential and to impact the world through STEM awareness, access, support and development.",
  "contactEmail": "shpe@bu.edu",
  "facultyAdvisorEmail": "esgw@bu.edu",
  "region": "Region 4",
  "calendarEmbedUrl": "https://calendar.google.com/calendar/b/1/embed?height=600&wkst=1&bgcolor=%23FFFFFF&src=su3ufu2bs53q74amc9qg9kml7k%40group.calendar.google.com&color=%232952A3&ctz=America%2FNew_York",
  "donateUrl": "https://trusted.bu.edu/s/1759/2-bu/giving/interior.aspx?sid=1759&gid=2&pgid=412&cid=1044&dids=492&bledit=1&appealcode=WEBAGC",
  "sponsorshipPacketUrl": "https://drive.google.com/file/d/11UCqS11SdZRJClQxOOEe1bhlhLfPor3b/view?usp=sharing",
  "constitutionUrl": "/assets/logos/constitution-2020-2021.pdf",
  "socials": {
    "linkedin": "https://www.linkedin.com/company/shpebostonu",
    "instagram": "https://www.instagram.com/shpe.bostonu/",
    "facebook": "https://www.facebook.com/Boston-University-SHPE-318100551956450/",
    "shpe": "https://shpe.org/"
  }
}
```

- [ ] **Step 3: Write `src/data/board.json`**

Seed with one entry per documented role. `name`/`major`/`year`/`hometown`/`bio` use the literal string `"TBD"` so the chapter sees what to fill in — these are user-facing placeholders, not plan placeholders. `photo` points at a fallback silhouette under `/assets/board/placeholder.svg` (created next task).

```json
[
  { "name": "TBD", "role": "President", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "VP Corporate Affairs", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "VP University Affairs", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Secretary", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Treasurer", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Webmaster", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Director of Fundraising & Development", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Director of Public Relations", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "SHPEtina Representative", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "TBD", "role": "Undergraduate Representative", "major": "TBD", "year": "TBD", "hometown": "TBD", "bio": "TBD", "photo": "/assets/board/placeholder.svg" },
  { "name": "Enrique Gutierrez-Wing, Ph.D.", "role": "Faculty Advisor", "major": "Faculty", "year": "—", "hometown": "Boston, MA", "bio": "Faculty Advisor to SHPE-BostonU. Contact: esgw@bu.edu.", "photo": "/assets/board/placeholder.svg" }
]
```

- [ ] **Step 4: Create `public/assets/board/placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="#FCF0D6"/>
  <circle cx="120" cy="100" r="44" fill="#72A9BE"/>
  <path d="M40 220c0-44 36-80 80-80s80 36 80 80" fill="#72A9BE"/>
</svg>
```

- [ ] **Step 5: Write `src/data/events.json`**

Each entry maps to one of the 9 photos in `public/assets/events/`. Dates are best-guess from the recap context — chapter can refine.

```json
[
  { "title": "Splash 2022", "date": "2022-09", "category": "Social", "description": "Welcomed incoming engineering students at the College of Engineering's annual Splash recruiting event.", "photo": "/assets/events/splash-2022.jpeg" },
  { "title": "Resume Review with GE", "date": "2022-10", "category": "Professional", "description": "Three General Electric engineers gave one-on-one resume feedback to members ahead of fall recruiting.", "photo": "/assets/events/resume-review-ge.png" },
  { "title": "SHPE National Convention", "date": "2022-11", "category": "Conference", "description": "Charlotte, NC. Interviews, offers, workshops, and a two-day career fair with the largest gathering of Hispanics in STEM.", "photo": "/assets/events/national-convention-2022.jpg" },
  { "title": "Mechanical Workshop with EPIC", "date": "2022-11", "category": "Professional", "description": "Toured EPIC's Boston facility and laser-cut SHPE logos with the engineering team.", "photo": "/assets/events/mechanical-workshop-epic.jpg" },
  { "title": "Navidad En Familia", "date": "2022-12", "category": "Cultural", "description": "Annual Christmas celebration with a white-elephant gift exchange and traditional food.", "photo": "/assets/events/navidad-en-familia.jpg" },
  { "title": "Money Matters Workshop with Capital One", "date": "2023-02", "category": "Professional", "description": "Capital One led a personal-finance and budgeting workshop. Chick-fil-A catered.", "photo": "/assets/events/capital-one-workshop.jpg" },
  { "title": "Boston Scientific Company Visit", "date": "2023-03", "category": "Professional", "description": "Joint visit with BU BMES to Boston Scientific's Marlborough, MA campus.", "photo": "/assets/events/boston-scientific-visit.jpg" },
  { "title": "Indoor Field Day 2023", "date": "2023-04", "category": "Social", "description": "Games, food, and music — a familia-bonding afternoon.", "photo": "/assets/events/indoor-field-day.jpg" },
  { "title": "LeaderSHPE Live 2023", "date": "2023-04", "category": "Conference", "description": "Region 4 leadership development conference in Dallas, TX.", "photo": "/assets/events/leadershpe-live-2023.jpg" }
]
```

- [ ] **Step 6: Write `src/data/sponsors.json`**

```json
[
  { "name": "BU College of Engineering", "logo": "/assets/sponsors/bu-college-of-engineering.jpg", "url": "https://www.bu.edu/eng/" },
  { "name": "BU Student Activities Office", "logo": "/assets/sponsors/bu-sao.png", "url": "https://www.bu.edu/sao/" },
  { "name": "Capital One", "logo": "/assets/sponsors/capital-one.png", "url": "https://www.capitalonecareers.com/" },
  { "name": "Brooks", "logo": "/assets/sponsors/brooks.png", "url": "https://www.brooksrunning.com/" },
  { "name": "General Electric", "logo": "/assets/sponsors/general-electric.png", "url": "https://www.ge.com/" },
  { "name": "Akamai", "logo": "/assets/sponsors/akamai.png", "url": "https://www.akamai.com/" },
  { "name": "Vertex", "logo": "/assets/sponsors/vertex.png", "url": "https://www.vrtx.com/" }
]
```

- [ ] **Step 7: Write `src/data/conferences.json`**

```json
[
  {
    "year": 2023,
    "city": "Salt Lake City, UT",
    "region": "National Convention",
    "description": "Members received interviews and offers, attended professional-growth workshops, and deepened bonds within the BU-SHPE familia.",
    "photos": ["/assets/conferences/national-convention-2023-slc.jpeg"]
  },
  {
    "year": 2022,
    "city": "Charlotte, NC",
    "region": "National Convention",
    "description": "Two-day career fair, technical workshops, and onsite interviews with the country's largest gathering of Hispanic STEM professionals.",
    "photos": ["/assets/conferences/national-convention-2022-charlotte.jpg"]
  }
]
```

- [ ] **Step 8: Write `src/data/volunteering.json`**

```json
[
  {
    "name": "Museum of Science — Women's History Month",
    "description": "Hosted a hands-on station teaching kids about science and engineering during Women's History Month programming.",
    "photos": ["/assets/volunteering/museum-of-science-1.jpeg", "/assets/volunteering/museum-of-science-2.jpeg"]
  },
  {
    "name": "Swipes for Boston",
    "description": "Student-led project feeding the unhoused — 'Rhetty-to-Go' meals distributed in Kenmore and Back Bay.",
    "photos": ["/assets/volunteering/swipes-for-boston.jpg"]
  },
  {
    "name": "Greater Boston Food Bank",
    "description": "Sorted 16,000 lbs of food in three hours and got a private tour. GBFB's goal: a hunger-free Greater Boston by 2028.",
    "photos": []
  }
]
```

- [ ] **Step 9: Confirm JSON parses and types align**

Run:

```bash
npm run check
```

Expected: 0 errors. Files aren't yet imported by any page, so we're just confirming JSON validity here. (Astro auto-types `.json` imports via TS.)

- [ ] **Step 10: Commit**

```bash
git add src/types.ts src/data/ public/assets/board/placeholder.svg
git commit -m "feat: content types + JSON data seeds (site, board, events, sponsors, conferences, volunteering)"
```

---

## Phase 1 — Design System

### Task 5: Base layout (`Base.astro`)

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Write `src/layouts/Base.astro`**

```astro
---
import "@/styles/global.css";
import Nav from "@/components/Nav.astro";
import Footer from "@/components/Footer.astro";
import siteData from "@/data/site.json";

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  /** When true, the nav renders transparent over the hero until scrolled. */
  transparentNav?: boolean;
}

const {
  title,
  description = siteData.mission,
  ogImage = "/assets/logos/SHPE_logo_horiz_Boston-University_DKBG.png",
  transparentNav = false,
} = Astro.props;

const fullTitle = title ? `${title} — ${siteData.name}` : `${siteData.name} — ${siteData.tagline}`;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- OpenGraph -->
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap"
    />
  </head>
  <body class="min-h-dvh bg-bg text-ink antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
    >Skip to content</a>

    <Nav transparent={transparentNav} />

    <main id="main">
      <slot />
    </main>

    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Verify**

`Nav.astro` and `Footer.astro` don't exist yet — `astro check` will error. That's expected. Skip verification until Task 7 is done.

- [ ] **Step 3: Commit (after Task 7)**

Defer — bundle Tasks 5, 6, 7 into one commit so the project is in a buildable state.

---

### Task 6: `Nav.astro` component

**Files:**
- Create: `src/components/Nav.astro`

Mobile menu uses a native `<details>` element — no JS framework needed.

- [ ] **Step 1: Write `src/components/Nav.astro`**

```astro
---
import siteData from "@/data/site.json";

interface Props {
  transparent?: boolean;
}
const { transparent = false } = Astro.props;

const links = [
  { href: "/about",         label: "About" },
  { href: "/board",         label: "E-Board" },
  { href: "/events",        label: "Events" },
  { href: "/conferences",   label: "Conferences" },
  { href: "/volunteering",  label: "Volunteering" },
  { href: "/gallery",       label: "Gallery" },
  { href: "/sponsors",      label: "Sponsors" },
];

const currentPath = Astro.url.pathname.replace(/\/$/, "") || "/";
---
<header
  data-transparent={transparent}
  class="group/nav fixed inset-x-0 top-0 z-40 transition-colors duration-300
         data-[transparent=true]:bg-transparent
         data-[transparent=false]:bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)]
         data-[transparent=false]:backdrop-blur
         data-[transparent=false]:border-b data-[transparent=false]:border-rule/30"
  id="site-nav"
>
  <div class="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
    <a href="/" class="flex items-center gap-3" aria-label={`${siteData.name} home`}>
      <img
        src="/assets/logos/SHPE_logo_horiz_Boston-University_DKBG.png"
        alt=""
        width="180" height="40"
        class="h-9 w-auto"
      />
    </a>

    <nav aria-label="Primary" class="hidden md:block">
      <ul class="flex items-center gap-7">
        {links.map(({ href, label }) => (
          <li>
            <a
              href={href}
              class:list={[
                "eyebrow text-[0.72rem] transition-colors hover:text-accent",
                currentPath === href ? "text-accent" : "text-ink/80"
              ]}
            >{label}</a>
          </li>
        ))}
      </ul>
    </nav>

    <a
      href="/join"
      class="hidden md:inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >Join SHPE</a>

    <!-- Mobile menu (native <details>) -->
    <details class="md:hidden relative">
      <summary
        class="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-rule/40 text-ink list-none [&::-webkit-details-marker]:hidden"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </summary>
      <div
        class="fixed inset-0 top-[72px] z-30 grid place-items-center bg-bg/98 backdrop-blur"
      >
        <nav aria-label="Mobile" class="px-8 text-center">
          <ul class="flex flex-col gap-6">
            {links.map(({ href, label }) => (
              <li>
                <a href={href} class="display text-3xl text-ink hover:text-accent">{label}</a>
              </li>
            ))}
            <li>
              <a
                href="/join"
                class="mt-4 inline-flex items-center rounded-full bg-accent px-6 py-3 text-base font-medium text-white"
              >Join SHPE</a>
            </li>
          </ul>
        </nav>
      </div>
    </details>
  </div>
</header>

<!-- Push content below fixed nav (only when not transparent) -->
{!transparent && <div class="h-[72px]" aria-hidden="true" />}

<script>
  // Toggle the [data-transparent] flag after the user scrolls past the hero.
  const nav = document.getElementById('site-nav');
  if (nav && nav.dataset.transparent === 'true') {
    const onScroll = () => {
      nav.dataset.transparent = window.scrollY > 80 ? 'false' : 'true';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
</script>
```

- [ ] **Step 2: Defer commit (bundled with Task 7)**

---

### Task 7: `Footer.astro` component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write `src/components/Footer.astro`**

```astro
---
import siteData from "@/data/site.json";

const quickLinks = [
  { href: "/about", label: "About" },
  { href: "/board", label: "E-Board" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/join", label: "Join Us" },
];
---
<footer class="mt-32 bg-deep text-cream">
  <div class="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-3">
    <div>
      <img
        src="/assets/logos/SHPE_logo_horiz_Boston-University_DKBG.png"
        alt={siteData.name}
        width="220" height="48"
        class="h-12 w-auto"
      />
      <p class="mt-6 max-w-sm text-sm leading-relaxed text-cream/80">
        {siteData.mission}
      </p>
      <a
        href={siteData.socials.shpe}
        class="eyebrow mt-6 inline-block text-cream/60 hover:text-accent"
        rel="noopener"
      >Part of SHPE National →</a>
    </div>

    <div>
      <p class="eyebrow text-cream/60">Explore</p>
      <ul class="mt-4 space-y-2">
        {quickLinks.map(l => (
          <li><a href={l.href} class="text-cream hover:text-accent transition-colors">{l.label}</a></li>
        ))}
      </ul>
    </div>

    <div>
      <p class="eyebrow text-cream/60">Contact</p>
      <ul class="mt-4 space-y-2 text-cream">
        <li><a href={`mailto:${siteData.contactEmail}`} class="hover:text-accent">{siteData.contactEmail}</a></li>
        <li class="text-cream/70 text-sm">Faculty Advisor: <a href={`mailto:${siteData.facultyAdvisorEmail}`} class="hover:text-accent">{siteData.facultyAdvisorEmail}</a></li>
      </ul>

      <p class="eyebrow mt-8 text-cream/60">Follow</p>
      <ul class="mt-4 flex gap-4">
        <li><a href={siteData.socials.instagram} aria-label="Instagram" class="hover:text-accent" rel="noopener">Instagram</a></li>
        <li><a href={siteData.socials.linkedin} aria-label="LinkedIn" class="hover:text-accent" rel="noopener">LinkedIn</a></li>
        <li><a href={siteData.socials.facebook} aria-label="Facebook" class="hover:text-accent" rel="noopener">Facebook</a></li>
      </ul>

      <a
        href={siteData.donateUrl}
        rel="noopener"
        class="mt-8 inline-flex items-center rounded-full border border-accent px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
      >Donate to BU SHPE</a>
    </div>
  </div>

  <div class="border-t border-cream/10">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-2 px-6 py-6 text-xs text-cream/60 md:flex-row md:items-center md:justify-between">
      <p>© {new Date().getFullYear()} SHPE-BostonU. Designed con familia.</p>
      <p>{siteData.region} · Boston University</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Verify Tasks 5–7 together**

Even with no pages built yet, `astro check` should pass once all referenced files exist.

```bash
npm run check
```

Expected: 0 errors. (`astro build` will still fail with "no pages" — that's fine.)

- [ ] **Step 3: Commit Tasks 5–7**

```bash
git add src/layouts/Base.astro src/components/Nav.astro src/components/Footer.astro
git commit -m "feat: Base layout, sticky Nav with mobile drawer, navy Footer with donate CTA"
```

---

### Task 8: Shared composition components — `Hero`, `SectionHeading`, `SocialLinks`, `MailingListForm`

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/SectionHeading.astro`
- Create: `src/components/SocialLinks.astro`
- Create: `src/components/MailingListForm.astro`

- [ ] **Step 1: Write `src/components/Hero.astro`**

```astro
---
interface CTA {
  href: string;
  label: string;
  variant?: "primary" | "outline";
}

interface Props {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  headline: string;
  subtitle?: string;
  ctas?: CTA[];
  /** "full" = 100dvh hero (Home). "tall" = 70dvh (About/Conferences). "compact" = 40dvh (utility pages). */
  size?: "full" | "tall" | "compact";
}

const {
  image,
  imageAlt,
  eyebrow,
  headline,
  subtitle,
  ctas = [],
  size = "tall",
} = Astro.props;

const sizeClass = {
  full: "min-h-[100dvh]",
  tall: "min-h-[70dvh]",
  compact: "min-h-[40dvh]",
}[size];
---
<section class:list={["relative grain isolate w-full overflow-hidden", sizeClass]}>
  <img
    src={image}
    alt={imageAlt}
    class="absolute inset-0 -z-10 h-full w-full object-cover"
    fetchpriority="high"
  />
  <div class="absolute inset-0 -z-10 bg-gradient-to-t from-deep/85 via-deep/45 to-deep/15"></div>

  <div class="relative mx-auto flex h-full max-w-[1200px] flex-col justify-end px-6 pb-20 pt-32 text-cream md:pb-28">
    {eyebrow && <p class="eyebrow text-cream/80">{eyebrow}</p>}
    <h1 class="display mt-4 max-w-3xl text-cream text-5xl md:text-7xl lg:text-[5.5rem]">
      {headline}
    </h1>
    {subtitle && (
      <p class="mt-6 max-w-2xl text-lg leading-relaxed text-cream/90 md:text-xl">
        {subtitle}
      </p>
    )}
    {ctas.length > 0 && (
      <div class="mt-10 flex flex-wrap gap-4">
        {ctas.map(cta => (
          <a
            href={cta.href}
            class:list={[
              "inline-flex items-center rounded-full px-6 py-3 text-sm font-medium transition",
              cta.variant === "outline"
                ? "border border-cream/70 text-cream hover:bg-cream hover:text-deep"
                : "bg-accent text-white hover:-translate-y-0.5 hover:shadow-lg"
            ]}
          >{cta.label}</a>
        ))}
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 2: Write `src/components/SectionHeading.astro`**

```astro
---
interface Props {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
}
const { eyebrow, title, lede, align = "left" } = Astro.props;
const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";
---
<header class:list={["flex flex-col gap-4 max-w-3xl rule-accent", alignClass]}>
  {eyebrow && <p class="eyebrow">{eyebrow}</p>}
  <h2 class="display text-4xl md:text-5xl">{title}</h2>
  {lede && <p class="text-lg text-ink-muted leading-relaxed">{lede}</p>}
</header>
```

- [ ] **Step 3: Write `src/components/SocialLinks.astro`**

```astro
---
import siteData from "@/data/site.json";
const items = [
  { href: siteData.socials.instagram, label: "Instagram" },
  { href: siteData.socials.linkedin,  label: "LinkedIn" },
  { href: siteData.socials.facebook,  label: "Facebook" },
];
---
<ul class="flex flex-wrap gap-3">
  {items.map(({ href, label }) => (
    <li>
      <a
        href={href}
        rel="noopener"
        class="eyebrow inline-flex items-center rounded-full border border-rule/60 px-4 py-2 text-ink/80 transition hover:border-accent hover:text-accent"
      >{label}</a>
    </li>
  ))}
</ul>
```

- [ ] **Step 4: Write `src/components/MailingListForm.astro`**

v1 is a `mailto:` form — zero infra, works on a static deploy. Later this can be swapped for a Cloudflare Pages Function.

```astro
---
import siteData from "@/data/site.json";
---
<form
  method="post"
  action={`mailto:${siteData.contactEmail}?subject=Mailing%20List%20Signup`}
  enctype="text/plain"
  class="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"
>
  <label class="contents">
    <span class="sr-only">First name</span>
    <input
      name="First Name" required
      placeholder="First name"
      class="rounded-lg border border-rule/40 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
    />
  </label>
  <label class="contents">
    <span class="sr-only">Last name</span>
    <input
      name="Last Name" required
      placeholder="Last name"
      class="rounded-lg border border-rule/40 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
    />
  </label>
  <label class="contents">
    <span class="sr-only">Email</span>
    <input
      type="email" name="Email" required
      placeholder="you@bu.edu"
      class="rounded-lg border border-rule/40 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none"
    />
  </label>
  <button
    type="submit"
    class="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow"
  >Sign Up</button>
</form>
<p class="mt-3 text-xs text-ink-muted">
  Opens your email client. Prefer Instagram? <a href={siteData.socials.instagram} class="text-link underline">DM us @shpe.bostonu</a>.
</p>
```

- [ ] **Step 5: Verify**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.astro src/components/SectionHeading.astro src/components/SocialLinks.astro src/components/MailingListForm.astro
git commit -m "feat: shared composition components — Hero, SectionHeading, SocialLinks, MailingListForm"
```

---

### Task 9: Card components — `BoardCard`, `EventCard`, `ConferenceCard`, `SponsorGrid`, `Gallery`

**Files:**
- Create: `src/components/BoardCard.astro`
- Create: `src/components/EventCard.astro`
- Create: `src/components/ConferenceCard.astro`
- Create: `src/components/SponsorGrid.astro`
- Create: `src/components/Gallery.astro`

- [ ] **Step 1: Write `src/components/BoardCard.astro`**

```astro
---
import type { BoardMember } from "@/types";
interface Props { member: BoardMember }
const { member } = Astro.props;
---
<article class="group flex flex-col rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] overflow-hidden">
  <div class="aspect-[4/5] overflow-hidden bg-cream">
    <img
      src={member.photo}
      alt={member.name === "TBD" ? "" : member.name}
      class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      loading="lazy"
    />
  </div>
  <div class="flex flex-col gap-2 p-6">
    <p class="eyebrow text-accent">{member.role}</p>
    <h3 class="display text-2xl">{member.name}</h3>
    <p class="text-sm text-ink-muted">
      {member.major}{member.year && member.year !== "—" ? ` · ${member.year}` : ""}
      {member.hometown && member.hometown !== "TBD" ? ` · ${member.hometown}` : ""}
    </p>
    {member.bio && member.bio !== "TBD" && (
      <p class="mt-2 text-sm leading-relaxed text-ink-muted">{member.bio}</p>
    )}
  </div>
</article>
```

- [ ] **Step 2: Write `src/components/EventCard.astro`**

```astro
---
import type { EventItem } from "@/types";
interface Props { event: EventItem }
const { event } = Astro.props;

const dateLabel = new Date(event.date + (event.date.length === 7 ? "-01" : "")).toLocaleDateString("en-US", {
  month: "short",
  year: "numeric",
});
---
<article class="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
  <div class="aspect-[4/3] overflow-hidden photo-warm">
    <img
      src={event.photo}
      alt={event.title}
      class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      loading="lazy"
    />
  </div>
  <div class="flex flex-1 flex-col gap-3 p-6">
    <div class="flex items-center justify-between">
      <span class="eyebrow text-accent">{event.category}</span>
      <time class="text-xs text-ink-muted">{dateLabel}</time>
    </div>
    <h3 class="display text-2xl leading-tight">{event.title}</h3>
    <p class="text-sm leading-relaxed text-ink-muted">{event.description}</p>
  </div>
</article>
```

- [ ] **Step 3: Write `src/components/ConferenceCard.astro`**

```astro
---
import type { Conference } from "@/types";
interface Props { conference: Conference }
const { conference } = Astro.props;
const cover = conference.photos[0] ?? "/assets/conferences/national-convention-2023-slc.jpeg";
---
<article class="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] text-cream shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
  <img
    src={cover}
    alt={`${conference.region ?? "Conference"} ${conference.year} — ${conference.city}`}
    class="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
    loading="lazy"
  />
  <div class="absolute inset-0 -z-10 bg-gradient-to-t from-deep/90 via-deep/40 to-transparent"></div>
  <div class="flex flex-col gap-3 p-8">
    <p class="eyebrow text-cream/80">{conference.region ?? "Conference"} · {conference.year}</p>
    <h3 class="display text-3xl md:text-4xl">{conference.city}</h3>
    <p class="max-w-prose text-sm leading-relaxed text-cream/90">{conference.description}</p>
  </div>
</article>
```

- [ ] **Step 4: Write `src/components/SponsorGrid.astro`**

```astro
---
import type { Sponsor } from "@/types";
interface Props { sponsors: Sponsor[] }
const { sponsors } = Astro.props;
---
<ul class="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-rule/20 md:grid-cols-3 lg:grid-cols-4">
  {sponsors.map(s => (
    <li class="bg-surface">
      <a
        href={s.url ?? "#"}
        rel="noopener"
        class="group flex aspect-[4/3] items-center justify-center p-8 transition hover:bg-cream/40"
        aria-label={s.name}
      >
        <img
          src={s.logo}
          alt={s.name}
          class="max-h-20 w-auto max-w-[80%] object-contain opacity-70 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
          loading="lazy"
        />
      </a>
    </li>
  ))}
</ul>
```

- [ ] **Step 5: Write `src/components/Gallery.astro`**

CSS-columns masonry plus native `<dialog>` lightbox — no framework.

```astro
---
interface Props { photos: { src: string; alt: string }[] }
const { photos } = Astro.props;
---
<div
  class="gap-3 [column-count:1] sm:[column-count:2] lg:[column-count:3]"
  id="gallery-grid"
>
  {photos.map((p, i) => (
    <button
      type="button"
      class="mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
      data-gallery-index={i}
    >
      <img
        src={p.src} alt={p.alt} loading="lazy"
        class="w-full object-cover transition duration-500 hover:scale-[1.02]"
      />
    </button>
  ))}
</div>

<dialog
  id="gallery-lightbox"
  class="m-0 max-h-dvh max-w-screen-md p-0 backdrop:bg-deep/90 open:flex"
>
  <button
    type="button"
    id="lightbox-close"
    class="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink"
    aria-label="Close"
  >×</button>
  <img id="lightbox-image" alt="" class="max-h-dvh w-full object-contain" />
</dialog>

<script is:inline define:vars={{ photos }}>
  const dlg = document.getElementById('gallery-lightbox');
  const img = document.getElementById('lightbox-image');
  const close = document.getElementById('lightbox-close');
  document.querySelectorAll('[data-gallery-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-gallery-index'));
      img.src = photos[i].src;
      img.alt = photos[i].alt;
      dlg.showModal();
    });
  });
  close?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
</script>
```

- [ ] **Step 6: Verify**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/BoardCard.astro src/components/EventCard.astro src/components/ConferenceCard.astro src/components/SponsorGrid.astro src/components/Gallery.astro
git commit -m "feat: card library — Board, Event, Conference cards + SponsorGrid + Gallery lightbox"
```

---

## Phase 2 — Pages (Parallel Dispatch)

> **Dispatch instructions:** Once Tasks 1–9 are complete and committed, invoke `superpowers:dispatching-parallel-agents`. Spawn one subagent per page (9 total) — each agent's brief is below verbatim, plus this shared preamble. Use the `general-purpose` subagent type. Each agent invokes `frontend-design:frontend-design` (alias `impeccable craft`) once at the start of its page build so its taste calibrates to the design system already in place.
>
> **Shared preamble to copy into every page-subagent prompt:**
>
> > You are building one page of the BU SHPE editorial-style website. The project already has:
> > - Tailwind v4 + design tokens (`bg`, `surface`, `ink`, `ink-muted`, `accent`, `link`, `rule`, `cream`, `deep`) usable as `bg-*` / `text-*` / `border-*` classes
> > - Fonts: `font-serif` (Instrument Serif), `font-sans` (Instrument Sans), `font-cond` (Barlow Condensed) and the utility classes `.display`, `.eyebrow`, `.pullquote`, `.rule-accent`, `.grain`, `.photo-warm`, `.reveal`
> > - `Base.astro` layout (props: `title`, `description`, `transparentNav`)
> > - Components: `Hero`, `SectionHeading`, `SocialLinks`, `MailingListForm`, `BoardCard`, `EventCard`, `ConferenceCard`, `SponsorGrid`, `Gallery` (all in `@/components/*`)
> > - Data files in `@/data/*.json`, typed via `@/types`
> > - Asset paths under `/assets/{logos,events,conferences,sponsors,volunteering,board}/`
> >
> > Aesthetic rules (do NOT violate):
> > - Editorial, magazine-style. Generous whitespace. Asymmetric layouts where appropriate.
> > - Max content width 1200px (`max-w-[1200px]`); paragraph copy capped ~720px (`max-w-3xl`).
> > - No purple gradients, no glassmorphism, no SaaS landing-page patterns, no generic 1px gray card borders.
> > - Use `display` class for serif headlines; `eyebrow` for uppercase tracked labels; `pullquote` for italic mission callouts; `rule-accent` for the orange tick above section headings.
> > - Photo treatments: `.photo-warm` on event/volunteering, `.grain` on hero overlays.
> > - Subtle reveal-on-scroll via `class="reveal"` on major blocks (CSS-only).
> >
> > **Workflow:**
> > 1. Invoke `frontend-design:frontend-design` (alias `impeccable`) to ground in design system context.
> > 2. Build the page per the brief below.
> > 3. Run `npm run check` (must be 0 errors) and `npm run build` (must succeed).
> > 4. Report the path of the file you created and any tradeoffs you made.

The page-by-page tasks (10–18) below contain the per-page brief that gets pasted into each subagent's prompt.

---

### Task 10: Home page

**Files:** Create `src/pages/index.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Home (`src/pages/index.astro`):**
>
> Build the home page. Use `Base.astro` with `transparentNav={true}`.
>
> Sections in order:
> 1. **Full-bleed Hero** (`<Hero>` with `size="full"`, image `/assets/conferences/national-convention-2023-slc.jpeg`, eyebrow `"SHPE-BostonU"`, headline `siteData.tagline` (`"¡Bienvenidos a la Familia!"`), subtitle = the mission statement from `siteData.mission`, two CTAs: primary `{href:"/join", label:"Join SHPE"}` and outline `{href:"/events", label:"Upcoming Events"}`).
> 2. **Mission callout** — a wide section, navy ink on bg, with a `pullquote`-styled paragraph: `"SHPE-BostonU is dedicated to its community. Who is our community? Our community is YOU."` Below it, three short label-cards (eyebrow + one-line): "STEM Students", "Latinx Students", "Anyone who wants to empower the Hispanic community". Use CSS grid 3-col on desktop, 1-col on mobile. Generous spacing (`py-32`).
> 3. **Pillars strip** — 5 columns on desktop showing the 5 event categories from the brief (Professional, Cultural, Social, Study Nights, Volunteering). Each is an eyebrow label + 1-sentence description. Subtle horizontal divider lines, not card borders.
> 4. **Recent moments** — `SectionHeading` (eyebrow: "FROM THE FAMILIA", title: "Recent moments"). Grid of the 3 most recent items from `events.json` rendered via `EventCard`. Below the grid a link `"See all events →"` styled with eyebrow + `text-accent`.
> 5. **Sponsor strip** — narrow row of sponsor logos using `SponsorGrid` (limit to 4 with `.slice(0,4)`), with link `"Our sponsors →"`.
> 6. **Join CTA band** — full-width deep-navy band with display headline `"Become part of the familia."` + outline+primary CTAs (Join + Donate).
>
> All major sections should carry `class="reveal"`. Wrap content in `<section class="mx-auto max-w-[1200px] px-6 py-24">` unless full-bleed.
>
> Set page meta: `title="Home"`, default description.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Expected: 0 errors. Then `npm run dev` and open `http://localhost:4321/` — confirm hero, mission, pillars, recent events grid, sponsor strip, CTA band all render and the nav goes from transparent to filled on scroll.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): hero, mission callout, pillars, recent moments, sponsors, join band"
```

---

### Task 11: About page

**Files:** Create `src/pages/about.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — About (`src/pages/about.astro`):**
>
> Layout: editorial long-read.
>
> Sections:
> 1. **Compact Hero** — `<Hero size="tall">` with image `/assets/events/national-convention-2022.jpg`, eyebrow `"WHO WE ARE"`, headline `"A familia of Hispanic engineers at Boston University."`, subtitle: short version of the mission. No CTAs.
> 2. **Mission section** — Two-column asymmetric (`grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-12`). Left = SectionHeading (eyebrow "OUR MISSION", title "Empowering the Hispanic community through STEM."). Right = body copy paragraphs derived from "Mission at BU — accomplished through" list, prose-style not bullets, then a clean ordered list of the 6 mission items.
> 3. **Pull-quote** — full-width, centered, max-w-3xl, `pullquote` style: `"Familia · Service · Education · Resilience"` — render each value separated by a thin `text-rule` divider.
> 4. **Why Join SHPE at BU** — `SectionHeading` (eyebrow "WHY JOIN", title "Ten reasons to become a SHPE member."). Two-column list (10 numbered items). Numbers in `display` serif, large. Body in sans. Sourced verbatim from the brief's "Why Join SHPE at BU?" list.
> 5. **Event categories** — `SectionHeading` (eyebrow "WHAT WE DO", title "Five kinds of gatherings."). Five-column responsive grid (stacked on mobile). Each: eyebrow label + description.
> 6. **Constitution + faculty advisor** — small two-column footer block with a download link to `siteData.constitutionUrl` ("Read our Constitution (PDF)") and a paragraph about Faculty Advisor Enrique Gutierrez-Wing, Ph.D., with email link.
> 7. **CTA** — same Join CTA band pattern as Home.
>
> Use `class="reveal"` on each section. Page meta: `title="About"`, description = mission.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Then `npm run dev` and visit `/about`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat(about): mission, values, why-join, categories, constitution"
```

---

### Task 12: Board page

**Files:** Create `src/pages/board.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Board (`src/pages/board.astro`):**
>
> Import `board.json` and `BoardCard`.
>
> Sections:
> 1. **Compact Hero** — `<Hero size="compact">` with image `/assets/events/indoor-field-day.jpg`, eyebrow `"E-BOARD"`, headline `"Meet the team running SHPE-BostonU."`, subtitle: one sentence about service & familia.
> 2. **Roster grid** — `mx-auto max-w-[1200px] px-6 py-24`. Group members into two groups: officers (`role !== "Faculty Advisor"`) and faculty (`role === "Faculty Advisor"`). Render officers in `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`. Below officers, a thin divider, then a single Faculty Advisor card rendered larger (`max-w-md mx-auto`).
> 3. **Empty-roster note** — If every officer has `name === "TBD"`, render a small editorial note at the top of the grid section: `"We're updating the roster for the upcoming academic year. Check back in September — or reach out at shpe@bu.edu if you'd like to learn more about applying."`
> 4. **Recruitment CTA** — End with an editorial blockquote and a link to `/join`: `"Interested in joining the board?"`.
>
> Page meta: `title="E-Board"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/board`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/board.astro
git commit -m "feat(board): roster grid driven by board.json with placeholder-aware empty state"
```

---

### Task 13: Events page

**Files:** Create `src/pages/events.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Events (`src/pages/events.astro`):**
>
> Two halves: upcoming (calendar embed) and past (event archive).
>
> Sections:
> 1. **Compact Hero** — image `/assets/events/navidad-en-familia.jpg`, eyebrow `"EVENTS"`, headline `"What's coming up at SHPE-BostonU."`.
> 2. **Upcoming — Google Calendar embed** — `SectionHeading` (eyebrow "UPCOMING", title "On our calendar"). Render an iframe to `siteData.calendarEmbedUrl`, full width, `aspect-[4/3]` or `min-h-[600px]`, rounded, subtle shadow. Provide a fallback link below: `"Open the full calendar →"`.
> 3. **Past events archive** — `SectionHeading` (eyebrow "ARCHIVE", title "Recent events"). Above the grid, a row of category filter chips (Professional / Cultural / Social / Conference / Study Night / Volunteering). Build chips as `<a href="?cat=Professional">` style links with `data-active` based on `Astro.url.searchParams.get('cat')`. Server-side filter the array. Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`, sorted by `date` descending. Render via `EventCard`.
> 4. **Subscribe nudge** — bottom panel encouraging Instagram follow + mailing-list signup; reuse `MailingListForm`.
>
> Page meta: `title="Events"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/events`, click each chip, confirm filtering works.

- [ ] **Step 3: Commit**

```bash
git add src/pages/events.astro
git commit -m "feat(events): calendar embed + filterable past-events archive"
```

---

### Task 14: Conferences page

**Files:** Create `src/pages/conferences.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Conferences (`src/pages/conferences.astro`):**
>
> Sections:
> 1. **Tall Hero** — image `/assets/conferences/national-convention-2022-charlotte.jpg`, eyebrow `"CONFERENCES"`, headline `"Where the familia goes national."`, subtitle: one sentence about SHPE conferences as catalyst events.
> 2. **Intro paragraph** — short body in `max-w-3xl` explaining what the SHPE National Convention is, why it matters, what BU SHPE brings home each year (mentions Region 4 LeaderSHPE Live as a related regional event).
> 3. **Conference list** — Iterate `conferences.json` (already sorted newest-first). Render each as `ConferenceCard` in a `grid grid-cols-1 md:grid-cols-2 gap-8`.
> 4. **Stats strip** (optional, editorial flourish) — Three numeric callouts in `display` serif: "1974 · founded", "Region 4 · BU's home region", "10,000+ · annual convention attendance". Source: brief.
> 5. **Want to attend? CTA** — encourage joining the mailing list to hear about convention sign-ups.
>
> Page meta: `title="Conferences"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/conferences`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/conferences.astro
git commit -m "feat(conferences): national convention recap cards + stats strip"
```

---

### Task 15: Volunteering page

**Files:** Create `src/pages/volunteering.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Volunteering (`src/pages/volunteering.astro`):**
>
> Asymmetric image-text layout per program — this is the page that should feel most editorial.
>
> Sections:
> 1. **Tall Hero** — image `/assets/volunteering/museum-of-science-1.jpeg`, eyebrow `"VOLUNTEERING"`, headline `"Service is part of the SHPE familia."`.
> 2. **Intro pull-quote** — `pullquote` italic: `"Pay it forward. Build community. Show up for Greater Boston."` Centered, `max-w-3xl`.
> 3. **Program list** — Iterate `volunteering.json`. Each program is its own full-width section, alternating image-left / image-right:
>    - Container: `grid grid-cols-1 md:grid-cols-12 gap-10 items-center py-20`
>    - Image span: `md:col-span-7` (left or right based on index parity)
>    - Text span: `md:col-span-5`, contains eyebrow ("VOLUNTEERING"), `display` title (`program.name`), body copy.
>    - Photos use `.photo-warm`. If `photos.length > 1`, show the first as primary and the second as a small overlap-card lower-right.
>    - If `photos.length === 0`, replace image side with a deep-navy card containing a serif quote pulled from the description.
> 4. **Get involved CTA** — short panel encouraging members to suggest new volunteer partners; link to `mailto:shpe@bu.edu?subject=Volunteer%20Idea`.
>
> Page meta: `title="Volunteering"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/volunteering`. Verify alternating layout works at md+ and stacks cleanly on mobile.

- [ ] **Step 3: Commit**

```bash
git add src/pages/volunteering.astro
git commit -m "feat(volunteering): editorial program list with alternating image-text layout"
```

---

### Task 16: Gallery page

**Files:** Create `src/pages/gallery.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Gallery (`src/pages/gallery.astro`):**
>
> Aggregate all event, volunteering, and conference photos into one masonry gallery.
>
> Sections:
> 1. **Compact Hero** — image `/assets/events/leadershpe-live-2023.jpg`, eyebrow `"GALLERY"`, headline `"Moments from the familia."`.
> 2. **Filter chips** (optional) — All / Events / Volunteering / Conferences. Same `?cat=` query-string pattern as Events page.
> 3. **Masonry** — Build a flat photos array:
>    ```ts
>    import events from "@/data/events.json";
>    import volunteering from "@/data/volunteering.json";
>    import conferences from "@/data/conferences.json";
>    const photos = [
>      ...events.map(e => ({ src: e.photo, alt: e.title, group: "Events" })),
>      ...volunteering.flatMap(v => v.photos.map(src => ({ src, alt: v.name, group: "Volunteering" }))),
>      ...conferences.flatMap(c => c.photos.map(src => ({ src, alt: `${c.region ?? "Conference"} ${c.year} — ${c.city}`, group: "Conferences" }))),
>    ];
>    ```
>    Filter by `?cat=` if present. Pass the resulting array to `<Gallery photos={...} />`.
> 4. **Submit photos CTA** — small bottom panel with mailto link: `"Have photos from a SHPE event? Send them to shpe@bu.edu."`
>
> Page meta: `title="Gallery"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/gallery`, click a photo to confirm lightbox opens; press ESC to close.

- [ ] **Step 3: Commit**

```bash
git add src/pages/gallery.astro
git commit -m "feat(gallery): aggregated masonry gallery with native dialog lightbox"
```

---

### Task 17: Sponsors page

**Files:** Create `src/pages/sponsors.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Sponsors (`src/pages/sponsors.astro`):**
>
> Sections:
> 1. **Compact Hero** — image `/assets/events/capital-one-workshop.jpg`, eyebrow `"SPONSORS"`, headline `"Companies that invest in the SHPE familia."`.
> 2. **Thank-you copy** — short paragraph thanking current sponsors and acknowledging BU College of Engineering and SAO for chapter support.
> 3. **Sponsor grid** — `<SponsorGrid sponsors={sponsors} />`. If any entries have `tier`, group by tier under "Platinum / Gold / Silver / Partner" subheadings — otherwise render the flat grid.
> 4. **Become a sponsor** — two-column editorial section. Left column: `SectionHeading` (eyebrow "PARTNERSHIP", title "Sponsor BU SHPE."). Right column: bullet list of "What sponsors get" (recruiting access, branded events, mention in convention materials, etc. — write plausibly based on the brief). Below: primary CTA button linking to `siteData.sponsorshipPacketUrl` ("Download the 2023–2024 Sponsorship Packet") and a secondary mailto CTA to `shpe@bu.edu`.
> 5. **Donate alternative** — small note: "Prefer to give directly? Donate via the BU Trusted giving page →" linking to `siteData.donateUrl`.
>
> Page meta: `title="Sponsors"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/sponsors`. Confirm grayscale-to-color hover on logos.

- [ ] **Step 3: Commit**

```bash
git add src/pages/sponsors.astro
git commit -m "feat(sponsors): tiered-ready sponsor grid + sponsorship packet CTA"
```

---

### Task 18: Join page

**Files:** Create `src/pages/join.astro`

- [ ] **Step 1: Dispatch / build with this brief**

> **Page brief — Join (`src/pages/join.astro`):**
>
> Sections:
> 1. **Compact Hero** — image `/assets/events/splash-2022.jpeg`, eyebrow `"JOIN"`, headline `"Find your familia."`, subtitle one-sentence welcome.
> 2. **Three-step "How to join"** — three-column block (1. Subscribe to the mailing list · 2. Follow @shpe.bostonu on Instagram · 3. Show up to the next event). Big serif numerals in `display`, eyebrow label, one-sentence body each.
> 3. **Mailing list signup** — `SectionHeading` (eyebrow "MAILING LIST", title "Get event invites in your inbox."). Render `<MailingListForm />`.
> 4. **Stay social** — `SectionHeading` (eyebrow "FOLLOW", title "Stay close to the familia."). Render `<SocialLinks />` plus a paragraph linking to `siteData.socials.shpe` for the national org.
> 5. **Contact card** — small navy panel with `shpe@bu.edu` and the faculty-advisor email.
> 6. **Donate ribbon** — full-width band on cream bg with `pullquote` "Support the next generation of Hispanic engineers." + outline CTA to `siteData.donateUrl`.
>
> Page meta: `title="Join Us"`.

- [ ] **Step 2: Verify**

```bash
npm run check && npm run build
```

Visit `/join`. Submit the form once — confirms `mailto:` opens correctly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/join.astro
git commit -m "feat(join): how-to-join steps, mailing-list form, socials, contact, donate ribbon"
```

---

## Phase 3 — Polish & Quality Gates

### Task 19: Responsive pass with `adapt` skill

**Files:** Whatever the audit surfaces.

- [ ] **Step 1: Invoke the `adapt` skill**

Invoke `adapt` and feed it: "Audit the responsive behavior of every page at 360px (mobile), 768px (tablet), and 1280px+ (desktop). Use the dev server at http://localhost:4321. Report layout/typography issues by page, then apply fixes."

- [ ] **Step 2: Triage report**

Group findings by severity. P0 = broken layout / unreadable text / overflow. P1 = visual but not broken. P2 = polish.

- [ ] **Step 3: Apply P0 + P1 fixes**

Edit pages/components as needed. Re-run `npm run check && npm run build` after each.

- [ ] **Step 4: Commit**

```bash
git add -p
git commit -m "fix(responsive): adapt pass — mobile/tablet layout corrections"
```

---

### Task 20: Motion pass with `animate` skill

**Files:** Whatever the pass surfaces (mostly `src/styles/global.css` and component-level transitions).

- [ ] **Step 1: Invoke `animate`**

Brief: "We already have CSS-only reveal-on-scroll via `.reveal` + `@starting-style`, sticky-nav fill transition, card hover lift, and grayscale→color on sponsor logos. Audit what's missing and add tasteful editorial micro-interactions only — no over-animation. Honor `prefers-reduced-motion`."

- [ ] **Step 2: Implement recommendations**

Constrain scope: zero net-new JavaScript libraries; CSS-only or vanilla JS only.

- [ ] **Step 3: Verify**

```bash
npm run build
```

Confirm `prefers-reduced-motion: reduce` removes movement (test in browser devtools).

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(motion): tasteful editorial micro-interactions with reduced-motion fallbacks"
```

---

### Task 21: Design critique with `critique` skill

**Files:** Notes only; fixes flow into Task 22.

- [ ] **Step 1: Invoke `critique`**

Brief: "Critique the BU SHPE site against its design brief: editorial magazine aesthetic, SHPE-adapted palette, restraint over noise. Score visual hierarchy, info architecture, emotional resonance, cognitive load. Page-by-page. Flag any generic SaaS patterns we slipped into."

- [ ] **Step 2: Save report**

Append the critique output to `docs/superpowers/plans/2026-05-21-bu-shpe-rebuild.md` under a new `## Critique Notes` heading at the bottom. (Or save standalone if the executor prefers — track separately.)

- [ ] **Step 3: Commit critique notes**

```bash
git add docs/
git commit -m "docs: design critique notes"
```

---

### Task 22: Audit + polish gates

**Files:** Whatever surfaces.

- [ ] **Step 1: Invoke `audit`**

Brief: "Run technical audit (a11y, performance, theming, responsive, anti-patterns) on the BU SHPE site (`npm run dev` at http://localhost:4321). Produce P0–P3 scored report."

- [ ] **Step 2: Apply P0 + P1 audit fixes**

Common likely fixes: missing `alt`, contrast on cream-on-navy, missing `<title>` per page (Base.astro should already handle this — verify), focus-visible rings on cards, image dimensions to prevent CLS, lazy-loading discipline on non-above-the-fold images.

- [ ] **Step 3: Invoke `polish`**

Brief: "Final pre-ship pass. Check alignment, spacing rhythm, consistency between pages, micro-details. Apply fixes."

- [ ] **Step 4: Verify build is clean**

```bash
npm run check && npm run build
```

Expected: 0 errors, 0 warnings, all 9 pages emitted under `dist/`.

- [ ] **Step 5: Commit polish bundle**

```bash
git add -A
git commit -m "polish: a11y, contrast, focus states, alignment, pre-ship audit fixes"
```

---

## Phase 4 — Deploy

### Task 23: README + Cloudflare Pages setup

**Files:**
- Create: `README.md`
- (Optional) Create: `wrangler.toml`

- [ ] **Step 1: Write `README.md`**

```markdown
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

To add a board member: append an object to `board.json`, drop their headshot into `public/assets/board/`, set `photo` to its path, commit, deploy.

## Assets

Originals live under `shpe-assets/` (raw source-of-truth, kept in repo for archival). Web-served copies live under `public/assets/`.

## Deploy (Cloudflare Pages)

1. Cloudflare Dashboard → Pages → Connect to Git → select this repo.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Node version: 20
5. Save & deploy. Production branch = `main`.

No adapter is required — Cloudflare Pages serves the static `dist/` directly. If SSR is added later, install `@astrojs/cloudflare`, set `output: 'server'`, and update the adapter config.
```

- [ ] **Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: README — dev, content editing, Cloudflare Pages deploy"
```

- [ ] **Step 3: Decide on `wrangler.toml`**

Only create if the chapter prefers CLI deploys (`wrangler pages deploy dist`) over dashboard. If yes:

```toml
name = "bu-shpe"
compatibility_date = "2026-01-01"
pages_build_output_dir = "dist"
```

Otherwise skip — the dashboard-driven flow needs nothing in the repo.

- [ ] **Step 4: Push and confirm Pages picks up the repo**

```bash
git push -u origin main
```

Confirm the first Pages build succeeds and the site loads at the assigned `*.pages.dev` URL. Smoke-test every page in the browser.

---

## Self-Review (run before handoff)

**1. Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| Astro 5 static output | Task 1 |
| Tailwind v4 | Task 1, Task 3 |
| TypeScript | Task 1 |
| Cloudflare Pages deploy | Task 23 (adapter rationale documented) |
| All data in `src/data/*.json` | Task 4 |
| Editorial aesthetic / fonts / palette | Task 3 + brief preamble + Phase 2 briefs |
| Base layout w/ nav, footer, meta | Task 5 |
| Nav (sticky, transparent-over-hero, mobile drawer) | Task 6 |
| Footer (navy, 3-col, donate) | Task 7 |
| Hero, SectionHeading reusables | Task 8 |
| BoardCard, EventCard, SponsorGrid + Conference + Gallery | Task 9 |
| Home page (hero, mission, CTAs) | Task 10 |
| About | Task 11 |
| Board (JSON-driven) | Task 12 |
| Upcoming Events (calendar embed) + archive | Task 13 |
| Conferences | Task 14 |
| Volunteering (asymmetric layout) | Task 15 |
| Gallery (masonry + lightbox) | Task 16 |
| Sponsors (tiers + packet) | Task 17 |
| Join (mailing list + socials) | Task 18 |
| Responsive pass | Task 19 |
| Motion / View Transitions equivalent | Task 20 (CSS reveal already in Task 3) |
| Audit + polish | Tasks 21–22 |
| Deploy | Task 23 |

No gaps.

**2. Placeholder scan:** Searched for "TBD" / "TODO" / "fill in" in plan steps. The only "TBD" strings are the literal user-facing data values in `board.json` — those are intentional content placeholders, not plan placeholders.

**3. Type consistency:** Component prop names (`member`, `event`, `conference`, `sponsors`, `photos`) match the types in `src/types.ts`. Color/font tokens (`bg`, `ink`, `accent`, `cream`, `deep`, `rule`, `link`, `ink-muted`; `font-serif`, `font-sans`, `font-cond`) are referenced identically across `global.css`, components, and the Phase-2 brief preamble.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-bu-shpe-rebuild.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Phase 2 (pages 10–18) fans out as parallel subagents per the dispatching-parallel-agents skill.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
