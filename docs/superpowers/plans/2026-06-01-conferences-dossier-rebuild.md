# Conferences "Delegation Dossier" Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `/conferences` page into a hub + three spokes (prep, competitions, delegations) with a "delegation dossier" treatment built on existing design tokens, JSON-extended data, and verified 2026 convention facts.

**Architecture:** Astro 5 static site, Tailwind v4 `@theme` tokens, TypeScript strict. Follows the established hub-spoke pattern of `/support` and `/about`. A sequential **foundation phase** (tokens, fonts, types, data, nav, one shared component) unblocks a **parallel phase** where 4 isolated subagents each build one page + its signature components, followed by an **integration + verification phase**.

**Tech Stack:** Astro 5, Tailwind v4, TypeScript, IBM Plex Mono (new font), Google Fonts, native `<dialog>`/`<details>`, IntersectionObserver, `setInterval`. No JS framework. No test runner.

**Verification model (NO unit tests — this is a static marketing site):**
- `npm run check` → MUST be 0 errors (astro check = TS + template validation).
- `npm run build` → MUST succeed; page count rises from **9 to 12**.
- `npm run dev` → visual confirmation at http://localhost:4321/conferences and the three spokes.
- Every task's "verify" step uses these, not a test framework.

**Execution-order rule:** Phase A (Tasks 1–8) is sequential on the main thread and MUST complete before Phase B. Phase B (Tasks 9–12) is 4 independent page builds — safe to run as parallel subagents in worktree isolation because they touch disjoint files (each owns its page + its own components). Phase C (Tasks 13–15) is sequential integration.

**Shared contracts (locked in Phase A — Phase B agents MUST NOT change these):**
- Token names: `--font-mono`, `--color-scarlet`.
- Utility classes: `.mono-label`, `.blueprint`, `.section-index` (component), existing `.display` / `.eyebrow` / `.reveal`.
- Data shapes: the `types.ts` interfaces from Task 4.
- Shared component: `SectionIndex.astro` (Task 8) — props `{ index: string; label: string; accent?: "orange" | "scarlet" }`.

---

## File Structure

**Created:**
```
src/pages/conferences/prep.astro              # spoke 01
src/pages/conferences/competitions.astro      # spoke 02
src/pages/conferences/delegations.astro       # spoke 03
src/data/conventions.json                     # 2026 hub facts + shared
src/data/recruiters.json                      # EmployerGroup[]
src/data/competitions.json                    # tracks + record
src/lib/conferences.ts                        # countdown/format helpers
src/components/conferences/SectionIndex.astro     # shared: 01 — LABEL
src/components/conferences/ConventionBadge.astro  # hub credential badge
src/components/conferences/Countdown.astro        # hub live countdown
src/components/conferences/KeyDatesTimeline.astro # hub mono timeline
src/components/conferences/TripManifest.astro     # hub travel manifest
src/components/conferences/StatCountUp.astro      # poster stat w/ count-up
src/components/conferences/RecruiterWall.astro    # prep logo wall
src/components/conferences/Checklist.astro        # prep checklist/loadout
src/components/conferences/Scorecard.astro        # competitions standings table
src/components/conferences/TrophyStats.astro      # competitions record block
src/components/conferences/DossierEntry.astro     # delegations year card
```

**Modified:**
```
src/styles/global.css        # + --font-mono, --color-scarlet, .mono-label, .blueprint
src/layouts/Base.astro:42-45 # + IBM Plex Mono in Google Fonts link
src/types.ts                 # + Convention, KeyDate, CompetitionTrack, CompetitionsData; extend Conference
src/data/conferences.json    # + headcount, outcomes, quote per entry
src/pages/conferences.astro  # rebuilt as hub
src/components/Nav.astro:31   # /conferences gains submenu
```

A new `src/components/conferences/` subfolder keeps the ~11 new components out of the flat top-level `components/` dir. This is a deliberate, scoped grouping (the section is large); it does not restructure existing components.

---

# PHASE A — Foundation (sequential, main thread)

### Task 1: Add IBM Plex Mono font + `--font-mono` token

**Files:**
- Modify: `src/layouts/Base.astro:42-45`
- Modify: `src/styles/global.css` (`@theme` block, after line 30)

- [ ] **Step 1: Add IBM Plex Mono to the Google Fonts link**

In `src/layouts/Base.astro`, replace the stylesheet `<link>` (lines 42-45) with:

```astro
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
    />
```

- [ ] **Step 2: Add the `--font-mono` token**

In `src/styles/global.css`, inside `@theme {}`, immediately after the `--font-serif` line (line 30), add:

```css
  --font-mono:    "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
```

- [ ] **Step 3: Verify check + build**

Run: `npm run check`
Expected: 0 errors.
Run: `npm run build`
Expected: success, 9 pages (no new pages yet).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/styles/global.css
git commit -m "feat(conferences): add IBM Plex Mono + --font-mono token"
```

---

### Task 2: Add `--color-scarlet` token + dossier utilities

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add the scarlet token**

In `@theme {}`, after the `--color-deep` line (line 15), add:

```css
  --color-scarlet:     #CC0000;   /* BU scarlet — sparing accent, BU×SHPE */
```

- [ ] **Step 2: Add the `.mono-label` and `.blueprint` utilities**

At the end of `src/styles/global.css`, append:

```css
/* ---------- Dossier section-local utilities (conferences/*) ---------- */
.mono-label {
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: var(--color-ink-muted);
}

/* Low-contrast engineering grid — use in 1–2 spots only, never full-page */
.blueprint {
  background-image:
    linear-gradient(to right, rgba(0, 31, 91, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 31, 91, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}
.blueprint-deep {
  background-image:
    linear-gradient(to right, rgba(252, 240, 214, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(252, 240, 214, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Count-up: hide nothing; JS overwrites textContent. Reduced motion = final value as authored. */
@media (prefers-reduced-motion: reduce) {
  [data-countup], [data-countdown] { /* JS checks this and renders final/static value */ }
}
```

- [ ] **Step 3: Verify check + build**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, 9 pages.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(conferences): add --color-scarlet + .mono-label/.blueprint utilities"
```

---

### Task 3: Add conference helper functions

**Files:**
- Create: `src/lib/conferences.ts`

- [ ] **Step 1: Write the helper module**

Create `src/lib/conferences.ts`:

```ts
// Helpers for the conferences section. Pure functions, no DOM.

/** Format an ISO date range like "Oct 28–31, 2026" or "Oct 28 – Nov 1, 2026". */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const mon = (d: Date) => d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const startMon = mon(start);
  const endMon = mon(end);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();
  if (startMon === endMon) {
    return `${startMon} ${startDay}–${endDay}, ${year}`;
  }
  return `${startMon} ${startDay} – ${endMon} ${endDay}, ${year}`;
}

/** Format a single ISO date like "Oct 28, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
```

Note: `formatDateRange` covers the verified 2026 dates (Oct 28–31, same month) and is robust to cross-month ranges. ISO `yyyy-mm-dd` strings still sort with `localeCompare` elsewhere — these helpers are display-only.

- [ ] **Step 2: Verify check**

Run: `npm run check` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/conferences.ts
git commit -m "feat(conferences): add date-format helpers"
```

---

### Task 4: Extend `types.ts` with all conference interfaces

**Files:**
- Modify: `src/types.ts` (extend `Conference` at lines 55-61; append new interfaces)

- [ ] **Step 1: Extend the `Conference` interface**

Replace the existing `Conference` interface (lines 55-61) with:

```ts
export interface Conference {
  year: number;
  city: string;
  region?: string;
  description: string;
  photos: string[];
  headcount?: number;                              // TODO-confirm from chapter records
  outcomes?: string[];                             // TODO-confirm — bullet outcomes
  quote?: { text: string; attribution: string };  // TODO-confirm — delegate quote
}
```

- [ ] **Step 2: Append the new interfaces**

At the end of `src/types.ts`, append:

```ts
export interface KeyDate {
  date: string;   // ISO yyyy-mm-dd
  label: string;
  note?: string;
}

export interface Convention {
  year: number;
  name: string;            // "SHPE National Convention 2026"
  theme: string;           // "STEM for the BOLD"
  city: string;            // "Indianapolis, IN"
  venue: string;           // "Indiana Convention Center"
  startDate: string;       // ISO yyyy-mm-dd
  endDate: string;         // ISO yyyy-mm-dd
  countdownTarget: string; // ISO datetime, e.g. "2026-10-28T09:00:00-05:00"
  scaleStats: SupportStat[];        // reuse {value,label}
  keyDates: KeyDate[];
  costFunding: { heading: string; detail: string }[];
  eligibility: string[];
  faq: { q: string; a: string }[];
}

export interface CompetitionTrack {
  name: string;
  blurb: string;
  format: string;   // team size / time commitment — TODO-confirm specifics
  prize?: string;   // TODO-confirm
}

export interface CompetitionsData {
  tracks: CompetitionTrack[];
  record: { stat: string; label: string }[];  // trophy stat block — TODO-confirm
}
```

`EmployerGroup` (already defined at `types.ts:79`) is reused for recruiters — no new type needed.

- [ ] **Step 3: Verify check**

Run: `npm run check`
Expected: 0 errors. (No consumers yet; this only adds types.)

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat(conferences): extend types — Convention, KeyDate, CompetitionsData, Conference fields"
```

---

### Task 5: Create `conventions.json` (verified 2026 facts)

**Files:**
- Create: `src/data/conventions.json`

- [ ] **Step 1: Write the data file**

Create `src/data/conventions.json`. All figures web-verified 2026-06-01 except where marked `TODO-confirm`. Sources in `_sources`.

```json
{
  "_sources": "Verified 2026-06-01: shpe.org/2026-shpe (city/venue/dates/theme); AccessNewswire 2025-09 press release (12,000 attendees / 150+ companies, Philadelphia 2025). Recruiter count: no verified figure — omitted. TODO-confirm: cost numbers, key dates beyond convention, eligibility specifics.",
  "year": 2026,
  "name": "SHPE National Convention 2026",
  "theme": "STEM for the BOLD",
  "city": "Indianapolis, IN",
  "venue": "Indiana Convention Center",
  "startDate": "2026-10-28",
  "endDate": "2026-10-31",
  "countdownTarget": "2026-10-28T09:00:00-05:00",
  "scaleStats": [
    { "value": "12,000+", "label": "Attendees (2025)" },
    { "value": "150+", "label": "Companies recruiting" },
    { "value": "4", "label": "Days, Oct 28–31" }
  ],
  "keyDates": [
    { "date": "2026-06-15", "label": "Chapter interest form opens", "note": "TODO-confirm date" },
    { "date": "2026-08-01", "label": "Early registration deadline", "note": "TODO-confirm date" },
    { "date": "2026-09-15", "label": "Travel + hotel block locked", "note": "TODO-confirm date" },
    { "date": "2026-10-28", "label": "Convention begins — Indianapolis" }
  ],
  "costFunding": [
    { "heading": "Registration", "detail": "Student registration rates and BU SHPE subsidy tiers — TODO-confirm current numbers." },
    { "heading": "Travel & lodging", "detail": "Group flights and a convention-center hotel block; subsidy applied per registered member — TODO-confirm amounts." },
    { "heading": "Funding sources", "detail": "Chapter fundraising, ENG/Student Activities support, and corporate sponsorship offset member cost — TODO-confirm breakdown." }
  ],
  "eligibility": [
    "Active BU SHPE member in good standing",
    "Enrolled BU undergraduate or graduate student",
    "Completed the delegation interest form by the deadline",
    "Attended the pre-trip logistics briefing"
  ],
  "faq": [
    { "q": "Do I need to be an engineering major?", "a": "No — SHPE welcomes all STEM majors. The career fair recruits across engineering, computing, and the sciences." },
    { "q": "What does BU SHPE cover?", "a": "The chapter subsidizes registration, group travel, and lodging for registered delegates. Exact subsidy depends on funding each year. TODO-confirm." },
    { "q": "I've never been to a convention. Is it for me?", "a": "Especially for you. We run a prep bootcamp beforehand and travel as a group — first-timers are the reason the prep track exists." },
    { "q": "When do I need to commit?", "a": "Watch the key-dates timeline above and the chapter mailing list. Early registration saves the most money." }
  ]
}
```

- [ ] **Step 2: Verify it parses (check)**

Run: `npm run check` → 0 errors (no consumer yet; JSON is valid).

- [ ] **Step 3: Commit**

```bash
git add src/data/conventions.json
git commit -m "data(conferences): add conventions.json — verified 2026 facts + TODO-confirm placeholders"
```

---

### Task 6: Create `recruiters.json` + `competitions.json`

**Files:**
- Create: `src/data/recruiters.json`
- Create: `src/data/competitions.json`

- [ ] **Step 1: Write `recruiters.json`** (`EmployerGroup[]` — industry-tagged, placeholder companies)

Create `src/data/recruiters.json`. **No invented company names presented as confirmed** — these are illustrative placeholders the maintainer replaces with real career-fair recruiters and logos.

```json
[
  {
    "industry": "Aerospace & Defense",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  },
  {
    "industry": "Energy",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  },
  {
    "industry": "Consulting",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  },
  {
    "industry": "Software",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  },
  {
    "industry": "Consumer Goods",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  },
  {
    "industry": "Automotive",
    "companies": [
      { "name": "TODO-confirm recruiter" },
      { "name": "TODO-confirm recruiter" }
    ]
  }
]
```

- [ ] **Step 2: Write `competitions.json`** (real SHPE competition names, verified 2026-06-01)

Create `src/data/competitions.json`:

```json
{
  "_sources": "Competition names verified 2026-06-01 via convention.shpe.org/programs. Formats/prizes/record are TODO-confirm against chapter participation.",
  "tracks": [
    { "name": "Academic Olympiad", "blurb": "FE-exam-style questions in written and Jeopardy-style rounds across math, the engineering disciplines, and SHPE history.", "format": "Team — TODO-confirm size", "prize": "TODO-confirm" },
    { "name": "Extreme Engineering Challenge (XEC)", "blurb": "A 24-hour continuous sprint taking an innovative idea to market under deadlines, reviews, and presentations.", "format": "Team, 24-hour — TODO-confirm size", "prize": "TODO-confirm" },
    { "name": "Engineering Science Symposium", "blurb": "Present technical research to judges in a formal symposium setting.", "format": "Individual or team — TODO-confirm", "prize": "TODO-confirm" },
    { "name": "Hackathon / Innovators Challenge", "blurb": "Build a working prototype against a themed problem statement over the convention weekend.", "format": "Team — TODO-confirm size", "prize": "TODO-confirm" },
    { "name": "Nissan Design Competition", "blurb": "Sponsor-run design challenge judged on engineering, creativity, and presentation.", "format": "Team — TODO-confirm", "prize": "TODO-confirm" }
  ],
  "record": [
    { "stat": "TODO", "label": "Best chapter finish — TODO-confirm" },
    { "stat": "TODO", "label": "Competitions entered — TODO-confirm" },
    { "stat": "TODO", "label": "Members competed — TODO-confirm" }
  ]
}
```

- [ ] **Step 3: Verify check**

Run: `npm run check` → 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/recruiters.json src/data/competitions.json
git commit -m "data(conferences): add recruiters.json + competitions.json (real track names, placeholder companies)"
```

---

### Task 7: Extend `conferences.json` delegation entries

**Files:**
- Modify: `src/data/conferences.json`

- [ ] **Step 1: Add the new fields to both entries**

Replace the whole file `src/data/conferences.json` with:

```json
[
  {
    "year": 2023,
    "city": "Salt Lake City, UT",
    "region": "National Convention",
    "description": "Members received interviews and offers, attended professional-growth workshops, and deepened bonds within the BU-SHPE familia.",
    "photos": ["/assets/conferences/national-convention-2023-slc.jpeg"],
    "headcount": 0,
    "outcomes": [
      "TODO-confirm: interviews / offers count",
      "TODO-confirm: standout workshop or moment"
    ],
    "quote": { "text": "TODO-confirm — drop in a real delegate quote from chapter records.", "attribution": "TODO-confirm — Name, Class of ’YY" }
  },
  {
    "year": 2022,
    "city": "Charlotte, NC",
    "region": "National Convention",
    "description": "Two-day career fair, technical workshops, and onsite interviews with the country's largest gathering of Hispanic STEM professionals.",
    "photos": ["/assets/conferences/national-convention-2022-charlotte.jpg"],
    "headcount": 0,
    "outcomes": [
      "TODO-confirm: interviews / offers count",
      "TODO-confirm: standout workshop or moment"
    ],
    "quote": { "text": "TODO-confirm — drop in a real delegate quote from chapter records.", "attribution": "TODO-confirm — Name, Class of ’YY" }
  }
]
```

Note `headcount: 0` is a sentinel meaning "unknown" — the `DossierEntry` component (Task 12) hides the headcount stat when it is `0` or absent.

- [ ] **Step 2: Verify the existing `/conferences` page still builds**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, 9 pages (the current page reads `description`/`photos`/`year`/`city`/`region`, all still present).

- [ ] **Step 3: Commit**

```bash
git add src/data/conferences.json
git commit -m "data(conferences): extend delegation entries with headcount/outcomes/quote (TODO-confirm)"
```

---

### Task 8: Shared `SectionIndex` component + Nav submenu

**Files:**
- Create: `src/components/conferences/SectionIndex.astro`
- Modify: `src/components/Nav.astro:31`

- [ ] **Step 1: Write the shared `SectionIndex` component**

Create `src/components/conferences/SectionIndex.astro`. This is the `01 — TRAVEL` mono section label used by ALL four pages. Phase B agents import it, never redefine it.

```astro
---
interface Props {
  index: string;                       // "01"
  label: string;                       // "TRAVEL"
  accent?: "orange" | "scarlet";       // tick color, default orange
}
const { index, label, accent = "orange" } = Astro.props;
const tick = accent === "scarlet" ? "bg-scarlet" : "bg-accent";
---
<div class="flex items-center gap-3">
  <span class={`inline-block h-2.5 w-2.5 ${tick}`} aria-hidden="true"></span>
  <span class="mono-label text-ink">{index}</span>
  <span class="mono-label">—</span>
  <span class="mono-label text-ink">{label}</span>
</div>
```

- [ ] **Step 2: Add the `/conferences` submenu in `Nav.astro`**

In `src/components/Nav.astro`, replace line 31:

```astro
  { href: "/conferences",   label: "Conferences" },
```

with:

```astro
  {
    href: "/conferences",
    label: "Conferences",
    submenu: [
      { href: "/conferences",              label: "all conferences" },
      { href: "/conferences/prep",         label: "career fair prep" },
      { href: "/conferences/competitions", label: "competitions" },
      { href: "/conferences/delegations",  label: "past delegations" },
    ],
  },
```

- [ ] **Step 3: Verify check + build + visual**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, 9 pages.
Visual: `npm run dev`, hover "Conferences" in nav → dropdown shows 4 links (the spoke routes 404 until Phase B — expected).

- [ ] **Step 4: Commit**

```bash
git add src/components/conferences/SectionIndex.astro src/components/Nav.astro
git commit -m "feat(conferences): shared SectionIndex component + nav submenu"
```

---

**🚩 PHASE A GATE:** Confirm `npm run check` = 0 errors and `npm run build` = 9 pages before starting Phase B. All tokens, types, data, and the shared component now exist and are frozen.

---

# PHASE B — Parallel page builds (4 independent subagents)

Each task below is self-contained: it owns one page + that page's components, imports only the frozen Phase A contracts, and touches no file another Phase B task touches. Dispatch as 4 parallel subagents in worktree isolation (or run sequentially). Each agent runs `npm run check` for ITS page and commits independently.

**Shared rules for all Phase B agents:**
- Wrap the whole page in `<Base title="..." description="...">`.
- One `<h1>` per page. Correct heading hierarchy.
- All internal links relative (`/join`, `/conferences`, etc.) — NEVER `http://localhost:...`.
- Reuse existing components where they fit: `CtaBand`, `StatsStrip`, `Reveal`, `Icon`, `SectionHeading`, `PageHero`.
- Use `SectionIndex` (Task 8) for numbered section labels.
- Mono (`font-mono` / `.mono-label`) for all data/labels; `.display` for headlines/pull-stats; `.blueprint`/`.blueprint-deep` in at most 1 spot per page.
- Scarlet (`text-scarlet`/`bg-scarlet`) at most once per page.
- Flat fills only — NO gradients, NO glassmorphism, NO soft shadow on everything, NO emoji icons, NO rainbow tags.
- Every animation guarded by `prefers-reduced-motion`.
- Spoke pages open with a `SectionIndex` breadcrumb linking back to `/conferences`.

---

### Task 9: Hub page — `conferences.astro` (rebuild in place) + 4 components

**Owns files:**
- Modify (rebuild): `src/pages/conferences.astro`
- Create: `src/components/conferences/ConventionBadge.astro`
- Create: `src/components/conferences/Countdown.astro`
- Create: `src/components/conferences/KeyDatesTimeline.astro`
- Create: `src/components/conferences/TripManifest.astro`
- Create: `src/components/conferences/StatCountUp.astro`

- [ ] **Step 1: `ConventionBadge.astro` — credential badge**

```astro
---
import conventionData from "@/data/conventions.json";
import type { Convention } from "@/types";
const c = conventionData as Convention;
const yy = String(c.year).slice(2);
const cityShort = c.city.split(",")[0].toUpperCase();
---
<div class="blueprint-deep inline-block bg-deep px-6 py-5 border border-cream/20">
  <p class="font-mono text-cream/60 text-[0.7rem] tracking-[0.2em] uppercase mb-2">Credential</p>
  <p class="font-mono text-cream text-sm md:text-base tracking-[0.15em] uppercase">
    BU SHPE <span class="text-accent">·</span> Delegate <span class="text-accent">·</span> {cityShort} ’{yy}
  </p>
</div>
```

- [ ] **Step 2: `Countdown.astro` — live ticking countdown (reduced-motion safe)**

```astro
---
import conventionData from "@/data/conventions.json";
import type { Convention } from "@/types";
import { formatDate } from "@/lib/conferences";
const c = conventionData as Convention;
const staticFallback = formatDate(c.startDate);
---
<div data-countdown data-target={c.countdownTarget} class="font-mono">
  <p class="mono-label mb-3">Countdown to Indianapolis</p>
  <div class="flex gap-4 md:gap-6" data-countdown-display>
    <!-- JS fills these; reduced-motion replaces with static date -->
    <div class="text-center"><span class="display text-4xl md:text-6xl text-ink" data-unit="days">—</span><span class="block mono-label mt-1">days</span></div>
    <div class="text-center"><span class="display text-4xl md:text-6xl text-ink" data-unit="hours">—</span><span class="block mono-label mt-1">hrs</span></div>
    <div class="text-center"><span class="display text-4xl md:text-6xl text-ink" data-unit="minutes">—</span><span class="block mono-label mt-1">min</span></div>
    <div class="text-center"><span class="display text-4xl md:text-6xl text-ink" data-unit="seconds">—</span><span class="block mono-label mt-1">sec</span></div>
  </div>
  <p class="mono-label mt-3" data-countdown-static hidden>{staticFallback}</p>
</div>

<script is:inline define:vars={{ staticFallback }}>
  (function () {
    const root = document.querySelector("[data-countdown]");
    if (!root) return;
    const target = new Date(root.getAttribute("data-target")).getTime();
    const display = root.querySelector("[data-countdown-display]");
    const staticEl = root.querySelector("[data-countdown-static]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      if (display) display.hidden = true;
      if (staticEl) staticEl.hidden = false;
      return;
    }
    const units = {
      days: root.querySelector('[data-unit="days"]'),
      hours: root.querySelector('[data-unit="hours"]'),
      minutes: root.querySelector('[data-unit="minutes"]'),
      seconds: root.querySelector('[data-unit="seconds"]'),
    };
    const pad = (n) => String(n).padStart(2, "0");
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        Object.values(units).forEach((u) => u && (u.textContent = "00"));
        clearInterval(timer);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (units.days) units.days.textContent = String(d);
      if (units.hours) units.hours.textContent = pad(h);
      if (units.minutes) units.minutes.textContent = pad(m);
      if (units.seconds) units.seconds.textContent = pad(s);
    }
    tick();
    const timer = setInterval(tick, 1000);
  })();
</script>
```

- [ ] **Step 3: `KeyDatesTimeline.astro` — vertical mono timeline**

```astro
---
import conventionData from "@/data/conventions.json";
import type { Convention } from "@/types";
import { formatDate } from "@/lib/conferences";
const c = conventionData as Convention;
const dates = [...c.keyDates].sort((a, b) => a.date.localeCompare(b.date));
---
<ol class="relative border-l border-outline-soft pl-6 space-y-8">
  {dates.map((kd) => (
    <li class="relative">
      <span class="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 bg-accent" aria-hidden="true"></span>
      <p class="font-mono text-sm text-ink tracking-wide">{formatDate(kd.date)}</p>
      <p class="display text-xl text-ink leading-tight mt-1">{kd.label}</p>
      {kd.note && <p class="text-ink-muted text-sm mt-0.5">{kd.note}</p>}
    </li>
  ))}
</ol>
```

- [ ] **Step 4: `TripManifest.astro` — travel logistics as a manifest**

```astro
---
const rows = [
  { k: "Departure", v: "Group flights from Boston Logan (BOS)", note: "TODO-confirm carrier/time" },
  { k: "Lodging", v: "Convention-center hotel block", note: "TODO-confirm hotel" },
  { k: "Ground", v: "Chapter-coordinated transfers on arrival", note: "TODO-confirm" },
  { k: "Briefing", v: "Mandatory pre-trip logistics meeting", note: "TODO-confirm date" },
];
---
<div class="border border-outline-soft">
  <div class="bg-deep px-5 py-3 flex items-center justify-between">
    <p class="font-mono text-cream text-sm tracking-[0.15em] uppercase">Trip Manifest</p>
    <p class="font-mono text-cream/60 text-xs tracking-[0.15em] uppercase">BU SHPE · IND ’26</p>
  </div>
  <dl class="divide-y divide-outline-soft">
    {rows.map((r) => (
      <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 px-5 py-4">
        <dt class="mono-label">{r.k}</dt>
        <dd class="text-ink">{r.v} <span class="text-ink-muted text-sm">· {r.note}</span></dd>
      </div>
    ))}
  </dl>
</div>
```

- [ ] **Step 5: `StatCountUp.astro` — poster stat with count-up**

Parses the leading number out of values like `12,000+`, counts up to it, re-appends the suffix. Reduced motion renders the final value immediately.

```astro
---
interface Props { value: string; label: string; accent?: boolean; }
const { value, label, accent = false } = Astro.props;
---
<div>
  <span
    class:list={["display block text-5xl md:text-7xl leading-none", accent ? "text-accent" : "text-ink"]}
    data-countup
    data-value={value}
  >{value}</span>
  <span class="mono-label mt-2 block">{label}</span>
</div>

<script is:inline>
  (function () {
    const els = document.querySelectorAll("[data-countup]");
    if (!els.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // authored final value already in the DOM
    const parse = (s) => {
      const m = String(s).match(/^([\d.,]+)(.*)$/);
      if (!m) return null;
      const num = parseFloat(m[1].replace(/,/g, ""));
      return { num, suffix: m[2], hasComma: m[1].includes(",") };
    };
    const fmt = (n, hasComma) => hasComma ? Math.round(n).toLocaleString("en-US") : String(Math.round(n));
    const animate = (el) => {
      const p = parse(el.getAttribute("data-value"));
      if (!p) return;
      const dur = 1100;
      const start = performance.now();
      el.textContent = "0" + p.suffix;
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(p.num * eased, p.hasComma) + p.suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  })();
</script>
```

- [ ] **Step 6: Rebuild `conferences.astro` (the hub) composing everything**

Replace the whole file `src/pages/conferences.astro` with:

```astro
---
import Base from "@/layouts/Base.astro";
import CtaBand from "@/components/CtaBand.astro";
import Reveal from "@/components/Reveal.astro";
import SectionIndex from "@/components/conferences/SectionIndex.astro";
import ConventionBadge from "@/components/conferences/ConventionBadge.astro";
import Countdown from "@/components/conferences/Countdown.astro";
import KeyDatesTimeline from "@/components/conferences/KeyDatesTimeline.astro";
import TripManifest from "@/components/conferences/TripManifest.astro";
import StatCountUp from "@/components/conferences/StatCountUp.astro";

import siteData from "@/data/site.json";
import conventionData from "@/data/conventions.json";
import type { Convention } from "@/types";
import { formatDateRange } from "@/lib/conferences";

const c = conventionData as Convention;
const dateRange = formatDateRange(c.startDate, c.endDate);
---
<Base title="Conferences" description="BU SHPE sends a delegation to the SHPE National Convention each year. Indianapolis, Oct 28–31 2026.">

  <!-- HERO -->
  <header class="relative w-full bg-deep blueprint-deep py-24 md:py-32 px-6 overflow-hidden">
    <div class="max-w-[1200px] mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
      <div class="md:col-span-8">
        <p class="font-mono text-cream/60 text-sm tracking-[0.18em] uppercase mb-5">{c.name} · {c.city}</p>
        <h1 class="display text-5xl md:text-7xl text-cream leading-[1.02] max-w-3xl">
          STEM for the <em class="font-serif italic font-normal lowercase tracking-normal text-accent">bold</em>.
        </h1>
        <p class="mt-7 text-cream/80 max-w-xl text-lg">
          The largest gathering of Hispanic STEM students and professionals in the country. BU SHPE travels as a delegation — career fair, competitions, and familia. {dateRange}, {c.venue}.
        </p>
        <div class="mt-8"><ConventionBadge /></div>
      </div>
      <div class="md:col-span-4 flex md:justify-end">
        <Countdown />
      </div>
    </div>
  </header>

  <!-- 01 — SCALE (count-up stats) -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="01" label="The Convention" />
    <div class="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-10">
      {c.scaleStats.map((s, i) => <StatCountUp value={s.value} label={s.label} accent={i === 0} />)}
    </div>
    <p class="mt-8 max-w-3xl text-ink-muted">
      {/* SOURCE: 2025 Philadelphia figures, AccessNewswire 2025-09. TODO-confirm latest. */}
      A four-day national convention spanning a STEM career fair, technical competitions, leadership workshops, and a graduate-school and professional track.
    </p>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- 02 — KEY DATES -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
    <div class="md:col-span-4">
      <SectionIndex index="02" label="Key Dates" />
      <p class="mt-5 text-ink-muted max-w-sm">The road to Indianapolis. Dates marked TODO-confirm — watch the mailing list for the locked calendar.</p>
    </div>
    <div class="md:col-span-7 md:col-start-6">
      <Reveal><KeyDatesTimeline /></Reveal>
    </div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- 03 — TRAVEL (trip manifest) -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
    <div class="md:col-span-5">
      <SectionIndex index="03" label="Travel" />
      <h2 class="display text-3xl md:text-4xl text-ink mt-5">Coordinated, subsidized, group travel.</h2>
      <p class="mt-4 text-ink-muted max-w-md">We fly as a delegation. BU SHPE coordinates flights, a hotel block at the convention center, and ground transport for registered members.</p>
    </div>
    <div class="md:col-span-7"><Reveal><TripManifest /></Reveal></div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- 04 — COST & FUNDING -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="04" label="Cost & Funding" />
    <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-soft border border-outline-soft">
      {c.costFunding.map((cf) => (
        <div class="bg-bg p-7">
          <p class="font-mono text-sm text-accent tracking-wide uppercase mb-3">{cf.heading}</p>
          <p class="text-ink">{cf.detail}</p>
        </div>
      ))}
    </div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- 05 — ELIGIBILITY + FAQ -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
    <div class="md:col-span-5">
      <SectionIndex index="05" label="Eligibility" />
      <ul class="mt-6 space-y-3">
        {c.eligibility.map((e) => (
          <li class="flex gap-3 text-ink">
            <span class="font-mono text-accent" aria-hidden="true">›</span><span>{e}</span>
          </li>
        ))}
      </ul>
    </div>
    <div class="md:col-span-6 md:col-start-7">
      <SectionIndex index="06" label="FAQ" />
      <div class="mt-6 divide-y divide-outline-soft border-t border-outline-soft">
        {c.faq.map((f) => (
          <details class="group py-4">
            <summary class="display text-xl text-ink cursor-pointer list-none flex justify-between items-center [&::-webkit-details-marker]:hidden">
              {f.q}<span class="font-mono text-accent transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>

  <!-- SPOKES NAV -->
  <section class="max-w-[1200px] mx-auto px-6 pb-20 md:pb-28">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-soft border border-outline-soft">
      {[
        { href: "/conferences/prep", idx: "→", label: "Career fair prep", desc: "Bootcamp, recruiters, what to bring." },
        { href: "/conferences/competitions", idx: "→", label: "Competitions", desc: "Tracks, sign-up, the chapter record." },
        { href: "/conferences/delegations", idx: "→", label: "Past delegations", desc: "Year-by-year archive." },
      ].map((s) => (
        <a href={s.href} class="bg-bg p-7 group hover:bg-surface-soft transition-colors">
          <p class="display text-2xl text-ink group-hover:text-accent transition-colors">{s.label} <span aria-hidden="true">→</span></p>
          <p class="mt-2 text-ink-muted text-sm">{s.desc}</p>
        </a>
      ))}
    </div>
  </section>

  <!-- CTA -->
  <CtaBand
    heading="Ready to represent BU?"
    body="Join our delegation and take the next step. Interest forms open ahead of the national convention."
    primaryCta={{ label: "Register interest", href: "/join" }}
    secondaryCta={{ label: "Email leadership", href: `mailto:${siteData.contactEmail}` }}
  />

</Base>
```

> Note: this fixes the original `http://localhost:4321/join` bug → relative `/join`.

- [ ] **Step 7: Verify check + build + visual**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, **10 pages**.
Visual: `npm run dev` → `/conferences`: countdown ticks, stats count up on scroll, FAQ toggles, no localhost URLs. Toggle OS reduced-motion → countdown shows static date, stats show final values.

- [ ] **Step 8: Commit**

```bash
git add src/pages/conferences.astro src/components/conferences/ConventionBadge.astro src/components/conferences/Countdown.astro src/components/conferences/KeyDatesTimeline.astro src/components/conferences/TripManifest.astro src/components/conferences/StatCountUp.astro
git commit -m "feat(conferences): rebuild hub — badge, countdown, timeline, trip manifest, count-up stats"
```

---

### Task 10: Prep spoke — `conferences/prep.astro` + 2 components

**Owns files:**
- Create: `src/pages/conferences/prep.astro`
- Create: `src/components/conferences/RecruiterWall.astro`
- Create: `src/components/conferences/Checklist.astro`

- [ ] **Step 1: `Checklist.astro` — reusable checklist / loadout**

```astro
---
interface Props { items: string[]; variant?: "check" | "loadout"; }
const { items, variant = "check" } = Astro.props;
---
<ul class="space-y-3">
  {items.map((item) => (
    <li class="flex items-start gap-3">
      {variant === "check" ? (
        <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-accent text-accent" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
        </span>
      ) : (
        <span class="mt-1 h-3 w-3 shrink-0 border border-ink-muted" aria-hidden="true"></span>
      )}
      <span class="text-ink">{item}</span>
    </li>
  ))}
</ul>
```

- [ ] **Step 2: `RecruiterWall.astro` — industry-tagged logo wall**

```astro
---
import recruitersData from "@/data/recruiters.json";
import type { EmployerGroup } from "@/types";
const groups = recruitersData as EmployerGroup[];
---
<div class="space-y-10">
  {groups.map((g) => (
    <div>
      <div class="flex items-center gap-3 mb-4">
        <span class="font-mono text-xs tracking-[0.12em] uppercase text-ink bg-surface-soft border border-outline-soft px-2.5 py-1">{g.industry}</span>
        <span class="flex-1 border-t border-outline-soft"></span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-soft border border-outline-soft">
        {g.companies.map((co) => (
          <div class="bg-bg aspect-[3/2] grid place-items-center p-4">
            {co.logo
              ? <img src={co.logo} alt={co.name} class="max-h-10 w-auto object-contain" loading="lazy" />
              : <span class="font-mono text-sm text-ink-muted text-center">{co.name}</span>}
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: `prep.astro` — the page**

```astro
---
import Base from "@/layouts/Base.astro";
import CtaBand from "@/components/CtaBand.astro";
import Reveal from "@/components/Reveal.astro";
import SectionIndex from "@/components/conferences/SectionIndex.astro";
import RecruiterWall from "@/components/conferences/RecruiterWall.astro";
import Checklist from "@/components/conferences/Checklist.astro";
import siteData from "@/data/site.json";

const bootcamp = [
  "Résumé audit with corporate-partner reviewers",
  "30-second elevator pitch, drilled",
  "Mock interviews (behavioral + technical)",
  "Company research + target list",
  "LinkedIn + handshake profile polish",
];
const loadout = [
  "15–20 printed résumés on quality stock",
  "Professional or business-casual attire",
  "Padfolio + working pen",
  "Phone charger / power bank",
  "Water bottle + comfortable shoes",
  "Business cards (optional)",
];
const walkthrough = [
  { t: "Before", d: "Map your target booths from the app. Hit reach companies first, while energy is high." },
  { t: "At the booth", d: "Open with the pitch, hand over a résumé, ask one specific question, get the recruiter's name." },
  { t: "After", d: "Note who to follow up with. Same-day thank-you beats a perfect-but-late one." },
];
---
<Base title="Career Fair Prep — Conferences" description="How BU SHPE prepares its delegation for the SHPE national career fair: bootcamp, recruiters, attire, and a booth walkthrough.">

  <!-- HERO -->
  <header class="bg-deep py-20 md:py-28 px-6">
    <div class="max-w-[1200px] mx-auto">
      <a href="/conferences" class="inline-block"><SectionIndex index="01" label="Career Fair Prep" /></a>
      <h1 class="display text-5xl md:text-6xl text-cream mt-5 max-w-2xl leading-[1.04]">
        Walk in <em class="font-serif italic font-normal lowercase tracking-normal text-accent">ready</em>.
      </h1>
      <p class="mt-6 text-cream/80 max-w-xl text-lg">The national career fair is high-stakes and fast. We run a bootcamp so you arrive sharp — not figuring it out at the booth.</p>
    </div>
  </header>

  <!-- BOOTCAMP CHECKLIST -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
    <div class="md:col-span-5">
      <SectionIndex index="02" label="Bootcamp" />
      <h2 class="display text-3xl md:text-4xl text-ink mt-5">The prep bootcamp.</h2>
      <p class="mt-4 text-ink-muted max-w-md">Run in the weeks before the trip with our corporate partners. TODO-confirm session dates.</p>
      <a href={siteData.sponsorshipPacketUrl} class="mt-6 inline-flex items-center gap-2 font-sans font-semibold text-accent hover:text-accent-deep">
        Download the prep guide <span aria-hidden="true">→</span>
      </a>
    </div>
    <div class="md:col-span-6 md:col-start-7"><Reveal><Checklist items={bootcamp} variant="check" /></Reveal></div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- RECRUITER WALL -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="03" label="Who's Recruiting" />
    <p class="mt-5 max-w-2xl text-ink-muted">{/* TODO-confirm: replace placeholders with real career-fair recruiters + logos from chapter records. */}A snapshot of the industries on the floor. 150+ companies recruit onsite each year.</p>
    <div class="mt-10"><Reveal><RecruiterWall /></Reveal></div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- ATTIRE + LOADOUT -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
    <div class="md:col-span-6">
      <SectionIndex index="04" label="What To Bring" />
      <h2 class="display text-3xl md:text-4xl text-ink mt-5">The loadout.</h2>
      <p class="mt-4 text-ink-muted max-w-md">Business or business-casual attire. Pack the night before — the floor opens early.</p>
      <div class="mt-6"><Checklist items={loadout} variant="loadout" /></div>
    </div>
    <div class="md:col-span-5 md:col-start-8">
      <SectionIndex index="05" label="Day In The Fair" />
      <div class="mt-6 space-y-6">
        {walkthrough.map((w, i) => (
          <div class="border-l-2 border-accent pl-5">
            <p class="font-mono text-xs tracking-[0.12em] uppercase text-accent">{String(i + 1).padStart(2, "0")} · {w.t}</p>
            <p class="text-ink mt-1">{w.d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  <CtaBand
    heading="Prep starts before the plane."
    body="Join the chapter to get bootcamp invites and the delegation interest form."
    primaryCta={{ label: "Join SHPE", href: "/join" }}
    secondaryCta={{ label: "Back to conferences", href: "/conferences" }}
  />

</Base>
```

- [ ] **Step 4: Verify check + build + visual**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, **11 pages**.
Visual: `/conferences/prep` renders; recruiter wall shows placeholder tiles; breadcrumb links to `/conferences`; no localhost URLs.

- [ ] **Step 5: Commit**

```bash
git add src/pages/conferences/prep.astro src/components/conferences/RecruiterWall.astro src/components/conferences/Checklist.astro
git commit -m "feat(conferences): prep spoke — recruiter wall, bootcamp checklist, loadout, walkthrough"
```

---

### Task 11: Competitions spoke — `conferences/competitions.astro` + 2 components

**Owns files:**
- Create: `src/pages/conferences/competitions.astro`
- Create: `src/components/conferences/Scorecard.astro`
- Create: `src/components/conferences/TrophyStats.astro`

- [ ] **Step 1: `Scorecard.astro` — standings/scorecard table**

```astro
---
import competitionsData from "@/data/competitions.json";
import type { CompetitionsData } from "@/types";
const { tracks } = competitionsData as CompetitionsData;
---
<div class="border border-outline-soft overflow-hidden">
  <div class="hidden md:grid grid-cols-[1.4fr_2fr_1fr_0.8fr] bg-deep">
    {["Track", "What it is", "Format", "Prize"].map((h) => (
      <span class="font-mono text-xs tracking-[0.12em] uppercase text-cream px-5 py-3">{h}</span>
    ))}
  </div>
  <div class="divide-y divide-outline-soft">
    {tracks.map((t, i) => (
      <div class="grid grid-cols-1 md:grid-cols-[1.4fr_2fr_1fr_0.8fr] gap-2 md:gap-0 px-5 py-5 hover:bg-surface-soft transition-colors">
        <div class="flex items-baseline gap-3">
          <span class="font-mono text-accent text-sm">{String(i + 1).padStart(2, "0")}</span>
          <span class="display text-xl text-ink leading-tight">{t.name}</span>
        </div>
        <p class="text-ink-muted text-sm md:px-5">{t.blurb}</p>
        <p class="font-mono text-xs text-ink-muted md:px-2">{t.format}</p>
        <p class="font-mono text-xs text-ink-muted">{t.prize ?? "—"}</p>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 2: `TrophyStats.astro` — record stat block**

```astro
---
import competitionsData from "@/data/competitions.json";
import type { CompetitionsData } from "@/types";
const { record } = competitionsData as CompetitionsData;
---
<div class="bg-deep blueprint-deep p-8 md:p-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
  {record.map((r) => (
    <div>
      <span class="display block text-5xl md:text-6xl text-cream leading-none">{r.stat}</span>
      <span class="mono-label mt-2 block text-cream/60">{r.label}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 3: `competitions.astro` — the page**

```astro
---
import Base from "@/layouts/Base.astro";
import CtaBand from "@/components/CtaBand.astro";
import Reveal from "@/components/Reveal.astro";
import SectionIndex from "@/components/conferences/SectionIndex.astro";
import Scorecard from "@/components/conferences/Scorecard.astro";
import TrophyStats from "@/components/conferences/TrophyStats.astro";

const howto = [
  { t: "Sign up", d: "Registration opens through the SHPE convention portal. The chapter posts deadlines on the mailing list. TODO-confirm." },
  { t: "Team up", d: "Most tracks are team-based. We help match members into teams at a pre-convention meeting." },
  { t: "Time commitment", d: "Ranges from a single judged session to a 24-hour continuous build (XEC). Plan around it." },
  { t: "Prizes", d: "Cash, recognition, and recruiter visibility. Exact prizes vary by track and year. TODO-confirm." },
];
---
<Base title="Competitions — Conferences" description="The named SHPE national competition tracks BU SHPE competes in, how to sign up, and the chapter's record.">

  <!-- HERO -->
  <header class="bg-deep py-20 md:py-28 px-6">
    <div class="max-w-[1200px] mx-auto">
      <a href="/conferences" class="inline-block"><SectionIndex index="02" label="Competitions" accent="scarlet" /></a>
      <h1 class="display text-5xl md:text-6xl text-cream mt-5 max-w-2xl leading-[1.04]">
        Compete on the <em class="font-serif italic font-normal lowercase tracking-normal text-accent">national</em> stage.
      </h1>
      <p class="mt-6 text-cream/80 max-w-xl text-lg">From the Academic Olympiad to a 24-hour engineering sprint, BU competes against the strongest Hispanic STEM talent in the country.</p>
    </div>
  </header>

  <!-- TRACKS SCORECARD -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="01" label="The Tracks" />
    <p class="mt-5 max-w-2xl text-ink-muted">{/* Track names verified 2026-06-01 via convention.shpe.org/programs. Formats/prizes TODO-confirm. */}The competition slate at the national convention. Mark the ones that fit your discipline.</p>
    <div class="mt-10"><Reveal><Scorecard /></Reveal></div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- HOW IT WORKS -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="02" label="How It Works" />
    <div class="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-outline-soft border border-outline-soft">
      {howto.map((h, i) => (
        <div class="bg-bg p-7">
          <p class="font-mono text-accent text-sm">{String(i + 1).padStart(2, "0")}</p>
          <p class="display text-2xl text-ink mt-2">{h.t}</p>
          <p class="mt-2 text-ink-muted text-sm">{h.d}</p>
        </div>
      ))}
    </div>
  </section>

  <div class="max-w-[1200px] mx-auto px-6"><div class="border-t border-outline-soft"></div></div>

  <!-- RECORD -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="03" label="The Record" accent="scarlet" />
    <h2 class="display text-3xl md:text-4xl text-ink mt-5 mb-8 max-w-xl">BU's showing at nationals.</h2>
    <Reveal><TrophyStats /></Reveal>
    <p class="mt-4 font-mono text-xs text-ink-muted">TODO-confirm: replace with real chapter competition results.</p>
  </section>

  <CtaBand
    heading="Think you can place?"
    body="Join the chapter, find a team, and represent BU at nationals."
    primaryCta={{ label: "Join SHPE", href: "/join" }}
    secondaryCta={{ label: "Back to conferences", href: "/conferences" }}
  />

</Base>
```

- [ ] **Step 4: Verify check + build + visual**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, **12 pages** (if Task 10 already landed) or 11 (if running before it — count is additive, order-independent).
Visual: `/conferences/competitions` renders; scorecard table responsive; trophy block on navy; breadcrumb works.

- [ ] **Step 5: Commit**

```bash
git add src/pages/conferences/competitions.astro src/components/conferences/Scorecard.astro src/components/conferences/TrophyStats.astro
git commit -m "feat(conferences): competitions spoke — scorecard table, trophy stats, how-it-works"
```

---

### Task 12: Delegations spoke — `conferences/delegations.astro` + 1 component

**Owns files:**
- Create: `src/pages/conferences/delegations.astro`
- Create: `src/components/conferences/DossierEntry.astro`

- [ ] **Step 1: `DossierEntry.astro` — year dossier card**

```astro
---
import type { Conference } from "@/types";
interface Props { conf: Conference; index: number; }
const { conf, index } = Astro.props;
const idx = String(index + 1).padStart(2, "0");
---
<article class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
  <div class="md:col-span-5">
    <div class="aspect-[16/10] overflow-hidden border border-outline-soft photo-warm">
      <img src={conf.photos[0]} alt={`SHPE convention ${conf.year} in ${conf.city}`} class="w-full h-full object-cover" loading="lazy" />
    </div>
  </div>
  <div class="md:col-span-7">
    <div class="flex items-center gap-3 mb-3">
      <span class="mono-label text-ink">{idx}</span>
      <span class="font-mono text-accent text-sm tracking-[0.12em] uppercase">{conf.region ?? "National Convention"} · {conf.year}</span>
    </div>
    <h3 class="display text-3xl md:text-4xl text-ink">{conf.city}</h3>
    <p class="mt-3 text-ink-muted max-w-xl">{conf.description}</p>

    <div class="mt-5 flex flex-wrap gap-x-10 gap-y-3">
      {conf.headcount && conf.headcount > 0 && (
        <div><span class="display text-3xl text-ink">{conf.headcount}</span><span class="mono-label ml-2">delegates</span></div>
      )}
      {conf.outcomes?.map((o) => (
        <div class="flex items-center gap-2 text-ink"><span class="font-mono text-accent" aria-hidden="true">›</span><span class="text-sm">{o}</span></div>
      ))}
    </div>

    {conf.quote && (
      <blockquote class="mt-6 border-l-2 border-accent pl-5">
        <p class="pullquote text-ink">“{conf.quote.text}”</p>
        <cite class="mono-label not-italic mt-2 block">— {conf.quote.attribution}</cite>
      </blockquote>
    )}
  </div>
</article>
```

- [ ] **Step 2: `delegations.astro` — the page**

```astro
---
import Base from "@/layouts/Base.astro";
import CtaBand from "@/components/CtaBand.astro";
import Reveal from "@/components/Reveal.astro";
import SectionIndex from "@/components/conferences/SectionIndex.astro";
import DossierEntry from "@/components/conferences/DossierEntry.astro";
import conferencesData from "@/data/conferences.json";
import type { Conference } from "@/types";

const delegations = [...(conferencesData as Conference[])].sort((a, b) => b.year - a.year);
---
<Base title="Past Delegations — Conferences" description="BU SHPE's year-by-year archive of national convention delegations — outcomes, headcounts, and delegate voices.">

  <!-- HERO -->
  <header class="bg-deep py-20 md:py-28 px-6">
    <div class="max-w-[1200px] mx-auto">
      <a href="/conferences" class="inline-block"><SectionIndex index="03" label="Past Delegations" /></a>
      <h1 class="display text-5xl md:text-6xl text-cream mt-5 max-w-2xl leading-[1.04]">
        The <em class="font-serif italic font-normal lowercase tracking-normal text-accent">archive</em>.
      </h1>
      <p class="mt-6 text-cream/80 max-w-xl text-lg">Every delegation BU SHPE has sent to nationals — outcomes first. A new entry lands here each year.</p>
    </div>
  </header>

  <!-- ARCHIVE LOG -->
  <section class="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
    <SectionIndex index="01" label="The Log" />
    <div class="mt-12 space-y-16 md:space-y-24">
      {delegations.map((conf, i) => (
        <Reveal>
          <DossierEntry conf={conf} index={i} />
        </Reveal>
      ))}
    </div>
    <p class="mt-16 font-mono text-xs text-ink-muted border-t border-outline-soft pt-6">
      TODO-confirm: headcounts, outcomes, and delegate quotes are placeholders. Add one new entry to src/data/conferences.json per year — the page extends automatically.
    </p>
  </section>

  <CtaBand
    heading="Add your year to the log."
    body="Join the next delegation and help write the chapter's record."
    primaryCta={{ label: "Register interest", href: "/join" }}
    secondaryCta={{ label: "Back to conferences", href: "/conferences" }}
  />

</Base>
```

- [ ] **Step 3: Verify check + build + visual**

Run: `npm run check` → 0 errors.
Run: `npm run build` → success, **12 pages**.
Visual: `/conferences/delegations` shows both year cards; headcount stat hidden (sentinel `0`); quote/outcomes render placeholders; breadcrumb works.

- [ ] **Step 4: Commit**

```bash
git add src/pages/conferences/delegations.astro src/components/conferences/DossierEntry.astro
git commit -m "feat(conferences): delegations spoke — extensible dossier-entry archive"
```

---

# PHASE C — Integration & verification (sequential, main thread)

### Task 13: Full-section build + page-count check

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run check`
Expected: **0 errors, 0 warnings, 0 hints.**
Run: `npm run build`
Expected: success, **12 pages** total. Confirm `dist/conferences/index.html`, `dist/conferences/prep/index.html`, `dist/conferences/competitions/index.html`, `dist/conferences/delegations/index.html` all exist.

- [ ] **Step 2: localhost / absolute-URL audit**

Run: `grep -rn "localhost" src/pages/conferences.astro src/pages/conferences/ src/components/conferences/`
Expected: **no matches.**
Run: `grep -rn "http://" src/pages/conferences.astro src/pages/conferences/ src/components/conferences/`
Expected: no internal-navigation `http://` (external/source-note comments OK; internal links must be relative).

- [ ] **Step 3: If anything fails, fix and re-run.** No commit if nothing changed.

---

### Task 14: Reduced-motion + accessibility pass

**Files:** fix inline only if issues found

- [ ] **Step 1: Reduced-motion verification**

In `npm run dev`, enable OS "reduce motion" (or DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`). Reload `/conferences`:
- Countdown shows the static date string (`Oct 28, 2026`), no ticking.
- Count-up stats display final values (`12,000+` etc.) immediately.
- `.reveal` blocks appear without translate.

- [ ] **Step 2: Heading + landmark check**

For each of the 4 pages confirm: exactly one `<h1>`; section headings descend logically; nav/main/footer landmarks present (from `Base.astro`); all `<img>` have `alt`; the countdown/stat decorative marks use `aria-hidden`.

- [ ] **Step 3: Keyboard check**

Tab through `/conferences`: nav submenu reachable, FAQ `<details>` toggle with Enter, all CTAs focusable with the global `:focus-visible` ring. Fix any gaps inline.

- [ ] **Step 4: Commit (only if fixes were made)**

```bash
git add -A -- src/pages/conferences.astro src/pages/conferences/ src/components/conferences/
git commit -m "fix(conferences): reduced-motion + a11y polish"
```

---

### Task 15: Update CLAUDE.md routes table + finish

**Files:**
- Modify: `CLAUDE.md` (Routes table + "Things NOT to do" note about section-local mono)

- [ ] **Step 1: Update the routes table**

In `CLAUDE.md`, replace the `/conferences` row with the hub + three spoke rows, e.g.:

```markdown
| `/conferences` | `pages/conferences.astro` | Dossier hub — credential badge, live countdown, count-up stats, key-dates timeline, trip manifest, cost/funding, eligibility, FAQ, spoke links, CTA |
| `/conferences/prep` | `pages/conferences/prep.astro` | Career fair prep — bootcamp checklist, industry-tagged recruiter wall, loadout, booth walkthrough |
| `/conferences/competitions` | `pages/conferences/competitions.astro` | Competition tracks scorecard, how-it-works, trophy record block |
| `/conferences/delegations` | `pages/conferences/delegations.astro` | Year-by-year dossier-entry archive (extensible via conferences.json) |
```

Also update the "9 routes total" / "9 pages" references to **12**, and add a one-line note under the design system that IBM Plex Mono (`--font-mono`) + `--color-scarlet` are section-local to `/conferences/*` (dossier treatment).

- [ ] **Step 2: Final verify**

Run: `npm run check` → 0 errors.
Run: `npm run build` → 12 pages.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md routes for conferences hub+spokes (12 pages)"
```

- [ ] **Step 4:** Use `superpowers:finishing-a-development-branch` to decide merge/PR/cleanup.

---

## TODO-confirm handoff (surface to the user at completion)

Items intentionally left as labeled placeholders for the chapter to fill from real records:
- Real career-fair recruiter names + logos (`recruiters.json`).
- Per-year delegate quotes, headcounts, outcome bullets (`conferences.json`).
- Chapter competition record / results (`competitions.json` → `record`).
- Competition team sizes, time commitments, prizes (`competitions.json` → `tracks`).
- Exact 2025 recruiter count (no verified figure exists — omitted, not invented).
- Cost/funding numbers and the locked key-dates calendar (`conventions.json`).

---

## Self-Review (completed by plan author)

**Spec coverage:** Hub (badge/countdown/timeline/manifest/cost/eligibility/FAQ/CTAs) → Task 9 ✓. Prep (bootcamp/recruiter wall/attire/loadout/prep-guide/walkthrough) → Task 10 ✓. Competitions (tracks scorecard/sign-up/record) → Task 11 ✓. Delegations (extensible dossier archive) → Task 12 ✓. Design tokens (mono/scarlet/blueprint) → Tasks 1–2 ✓. Data model → Tasks 4–7 ✓. Nav → Task 8 ✓. Motion (countdown/count-up/reveal, reduced-motion) → Tasks 9, 14 ✓. localhost fix → Tasks 9, 13 ✓. Verified facts → Tasks 5–6 ✓. No fabrication → placeholders throughout ✓.

**Placeholder scan:** No code-step placeholders. Content `TODO-confirm` markers are intentional design (maintainer data), not plan gaps.

**Type consistency:** `Convention`, `KeyDate`, `CompetitionTrack`, `CompetitionsData`, extended `Conference`, reused `EmployerGroup`/`SupportStat` — names match across Task 4 definitions and Task 9–12 consumers. `SectionIndex` props `{index,label,accent}` consistent. Data attributes `data-countup`/`data-countdown` consistent between CSS (Task 2) and components (Task 9).
