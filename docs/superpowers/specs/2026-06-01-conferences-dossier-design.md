# Conferences "Delegation Dossier" — Design Spec

**Date:** 2026-06-01
**Status:** Approved (design); plan pending
**Scope:** Rebuild the single `/conferences` page into a hub + 3 spokes, refresh stale data, and apply a section-local "delegation dossier" visual treatment built on the existing design tokens.

---

## 1. Goal & intent

Split the current single `/conferences` page into a **hub + three spokes**, update all stale convention information against verified SHPE sources, and apply a distinctive but **token-consistent** "delegation dossier" design — a confident field briefing for the team BU sends to nationals. Technical, warm, bold. No accessibility or Lighthouse regressions.

The 2026 theme is **"STEM for the BOLD"** — lean into bold condensed type, flat color blocking, and hard editorial structure. **No** new global design system: we adapt the existing editorial tokens (decision below) so the section reads as part of the site, not a bolt-on.

---

## 2. Verified facts (web-checked 2026-06-01)

These replace the inflated/uncertain numbers in the original prompt. Sources are recorded as comments in the data files for the next maintainer.

| Fact | Verified value | Source |
|---|---|---|
| 2026 convention | SHPE National Convention 2026, **Indianapolis, IN**, **Oct 28–31 2026**, **Indiana Convention Center** | shpe.org/2026-shpe |
| 2026 theme | **"STEM for the BOLD"** (nods to Indianapolis "Indiana for the BOLD") | SHPE National (Facebook) |
| Latest convention scale | **~12,000 attendees**, **150+ companies** (2025, Philadelphia) | AccessNewswire press release, 2025-09 |
| Recruiter count | **No verified "1,700" figure** — omit or mark `TODO-confirm` | — |
| Competitions (real) | **Academic Olympiad**, **Extreme Engineering Challenge (XEC, 24-hour)**, **Engineering Science Symposium**, **Hackathon / Innovators Challenge**, **Nissan Design Competition**, **MAES Intern Tournament** | convention.shpe.org/programs |

**Rule:** never fabricate. Company logos, delegate quotes, headcounts, and chapter competition results are placeholders marked `TODO-confirm` with a comment pointing the maintainer to chapter records.

---

## 3. Architecture & routing

Follows the established hub-spoke pattern already used by `/support` (`support.astro` + `support/corporate.astro` + `support/individual.astro`) and `/about` (`about.astro` + `about/history.astro` + `about/governance.astro`).

```
src/pages/conferences.astro              # HUB — rebuilt in place
src/pages/conferences/prep.astro         # spoke 01 — career fair prep
src/pages/conferences/competitions.astro # spoke 02 — competitions
src/pages/conferences/delegations.astro  # spoke 03 — past delegations archive
```

- **Nav:** `/conferences` gains a 4-item submenu in `Nav.astro` (mirrors the `submenu` shape on `/support` and `/about`, `Nav.astro:43-50`): all conferences / prep / competitions / delegations.
- **Breadcrumb:** each spoke renders a mono breadcrumb back to the hub (`01 — CAREER FAIR PREP` style), matching how `/about/history.astro` links back.
- **Internal links are relative.** No hardcoded `http://localhost:4321/*`.

### Content mapping (migrate, do not delete)

| Source (current hub) | Destination |
|---|---|
| "what it is" intro, banner, stats, travel-logistics block | **Hub** |
| Career-fair-prep ZigZag block + prep-guide link | **Prep** |
| Competitions ZigZag block + record quote | **Competitions** |
| Past delegations grid (2022, 2023 cards) | **Delegations** |

Hub additionally gains: key-dates timeline, cost + funding, eligibility, FAQ, two CTAs.

---

## 4. Design system — "delegation dossier" on existing tokens

**Decision: adapt existing tokens** (least divergence; consistent with CLAUDE.md "don't change fonts site-wide"). The dossier feel comes from layout, scale, mono data, and color blocking — not from swapping the type system.

### Type
- **Display / pull-stats:** Barlow Condensed Bold — existing `.display` utility, set at poster scale (`clamp` up to ~`8rem` for hero stats).
- **Body:** Inter — unchanged.
- **Mono (NEW):** **IBM Plex Mono**, loaded site-wide via the existing Google Fonts `<link>` in `Base.astro` (one additional family, weights 400/500/600). Used for **all data**: dates, stats labels, `01 — TRAVEL` section indices, route slugs, badge text, table headers. Exposed as:
  - `--font-mono` token in `@theme` (`global.css`) → enables `font-mono` Tailwind utility.
  - `.mono-label` utility: mono, uppercase, tracked, small — the dossier section-index/label style.

### Color
- Add **one** token: `--color-scarlet: #CC0000` (BU scarlet) → `text-scarlet` / `bg-scarlet` / `border-scarlet`. Used **sparingly** (one accent per page max) so pages read as BU × SHPE.
- `--color-accent` (SHPE orange `#FD652F`) remains the **dominant spine accent** and the full-bleed block fill.
- Warm paper bg (`--color-bg #FAFAF8`) and ink (`--color-ink #001F5B`) already exist. **Never pure white** for page bg.
- **Flat fills only. No gradients anywhere.**

### Texture
- `.blueprint` utility (NEW, CSS-only): low-contrast engineering grid via repeating linear-gradients. Used in **1–2 spots only** (e.g. behind the hub badge / trip manifest), never as full-page wallpaper. Respects nothing dynamic — pure CSS.

### Layout language (all four pages share this vocabulary)
- Asymmetric editorial grid (`md:grid-cols-12`), deliberate symmetry breaks — no dead-centered single column top-to-bottom.
- Oversized pull-stats (the `12,000+` set huge).
- Numbered mono section labels (`01 — TRAVEL`, `02 — CAREER FAIR`) tying pages together.
- Hairline rules (`border-outline-soft`) to structure sections like a printed program.
- Generous negative space against a few dense data zones.

---

## 5. Data model (extend JSON + types fully)

JSON stays the source of truth (CLAUDE.md). New/extended files:

```
src/data/conventions.json   # NEW
src/data/recruiters.json    # NEW — EmployerGroup[] (interface already exists in types.ts:79)
src/data/competitions.json  # NEW
src/data/conferences.json   # EXTEND existing entries
src/types.ts                # + interfaces
```

### `conventions.json` (single object — the current/2026 convention + shared hub data)
```ts
interface Convention {
  year: number;
  name: string;            // "SHPE National Convention 2026"
  theme: string;           // "STEM for the BOLD"
  city: string;            // "Indianapolis, IN"
  venue: string;           // "Indiana Convention Center"
  startDate: string;       // ISO "2026-10-28"
  endDate: string;         // ISO "2026-10-31"
  countdownTarget: string; // ISO datetime for the live countdown
  scaleStats: SupportStat[];   // reuse existing SupportStat {value,label}: 12,000+ / 150+ / ...
  keyDates: KeyDate[];
  costFunding: { heading: string; detail: string }[];
  eligibility: string[];
  faq: { q: string; a: string }[];
}
interface KeyDate { date: string; label: string; note?: string; } // mono timeline rows
```

### `recruiters.json` → `EmployerGroup[]` (interface already exists)
Industry-tagged groups: aerospace, energy, consulting, software, consumer goods, automotive. Company entries are **placeholders** (`TODO-confirm` — maintainer drops in real logos/domains). No invented named companies presented as fact.

### `competitions.json`
```ts
interface CompetitionTrack {
  name: string;            // real SHPE names (Academic Olympiad, XEC, ...)
  blurb: string;
  format: string;          // team size / time commitment — TODO-confirm specifics
  prize?: string;          // TODO-confirm
}
interface CompetitionsData {
  tracks: CompetitionTrack[];
  record: { stat: string; label: string }[]; // trophy stat block — TODO-confirm
}
```

### `conferences.json` — extend each entry
```ts
interface Conference {            // EXTENDED
  year: number;
  city: string;
  region?: string;
  description: string;
  photos: string[];
  headcount?: number;             // NEW — TODO-confirm
  outcomes?: string[];            // NEW — bullet outcomes, TODO-confirm
  quote?: { text: string; attribution: string }; // NEW — delegate quote, TODO-confirm
}
```

---

## 6. Signature component per page

Each page gets its own component vocabulary so the section never reads as three identical card rows.

### Hub (`conferences.astro`)
- **Credential badge** — `BU SHPE · DELEGATE · INDIANAPOLIS '26`, mono, flat-blocked, optional `.blueprint` backing. (`ConventionBadge.astro`)
- **Live countdown** — ticking `DD : HH : MM : SS` to `countdownTarget`, mono, JS-driven, reduced-motion shows a static "Oct 28, 2026" fallback. (`Countdown.astro`)
- **Key-dates timeline** — vertical mono timeline from `keyDates[]`. (`KeyDatesTimeline.astro`)
- **Trip manifest** — travel-logistics block styled as a manifest (mono labels, hairline rows). (`TripManifest.astro`)
- Plus: cost/funding, eligibility, FAQ (`<details>`/`<summary>`, no JS), two CTAs (reuse `CtaBand`).

### Prep (`conferences/prep.astro`)
- **Recruiter logo wall** — grid from `recruiters.json` with industry tag chips (mono, not rainbow). (`RecruiterWall.astro`)
- **Bootcamp checklist** — real checklist component (custom checkbox marks, not emoji). (`Checklist.astro`)
- **"What to bring" loadout** — itemized loadout list. (can reuse `Checklist.astro` variant)
- Plus: professional attire guidance, prep-guide download link (`siteData.sponsorshipPacketUrl`), "day in the career fair" walkthrough.

### Competitions (`conferences/competitions.astro`)
- **Scorecard / standings table** — tracks rendered as a dossier standings table (mono headers, hairline rules). (`Scorecard.astro`)
- **Trophy stat block** — chapter record as oversized pull-stats. (reuse `StatsStrip` or a `TrophyStats.astro`)
- Plus: how to sign up / team up / time commitment / prizes (from `competitions.json`).

### Delegations (`conferences/delegations.astro`)
- **Dossier-entry cards** — one per year from `conferences.json`, leading with outcomes (headcount, outcomes[], delegate quote, photos). Structured so a new year = one new JSON entry, zero code change. (`DossierEntry.astro`)
- Year-by-year archive log ordering (newest first).

### Shared new components
- `SectionIndex.astro` — the `01 — TRAVEL` numbered mono label (used across all four pages).

---

## 7. Motion (JS exception, all reduced-motion guarded)

CLAUDE.md says "no JS unless strictly necessary." The countdown genuinely needs it; we keep the footprint to small inline scripts, each guarded by `prefers-reduced-motion`.

- **Count-up** on big pull-stats when scrolled into view — IntersectionObserver, same pattern as the existing `[data-reveal]` observer in `Base.astro:70-84`. Reduced motion → final value rendered immediately.
- **Ticking countdown** to Oct 28 2026 — `setInterval`, mono digits. Reduced motion → static date string, no ticking.
- **Scroll reveals** — reuse existing `.reveal` / `<Reveal>` (CSS + `[data-reveal]`). No new mechanism.
- **No** parallax, **no** animated mesh gradient, nothing heavy.

Scripts live as `is:inline` blocks in their components (consistent with `Gallery.astro` lightbox + `Base.astro` observer). No framework added.

---

## 8. Fixes & audits baked in

- Replace hardcoded `http://localhost:4321/join` (current `conferences.astro:125`) with relative `/join`.
- Audit all four new pages for any absolute dev URLs before completion.
- `npm run check` → 0 errors. `npm run build` → all pages clean (page count rises from 9 to 12). Visual confirmation in dev server.

---

## 9. Quality bar

- Semantic HTML, correct heading hierarchy per page (one `<h1>`), real landmarks.
- Fully responsive; asymmetric grid collapses cleanly to single column on mobile.
- `prefers-reduced-motion: reduce` respected by every animated element.
- Keep/improve Lighthouse perf, a11y, best-practices.
- Reuse existing components/tokens where they fit; add new only when needed.

---

## 10. Execution model (parallel / subagent-driven)

Detailed in the implementation plan. Shape:

1. **Foundation phase (main thread, sequential):** add `--font-mono` + IBM Plex Mono link, `--color-scarlet`, `.mono-label` / `.blueprint` utilities, all `types.ts` interfaces, all data JSON files (with verified facts + `TODO-confirm` placeholders), `Nav.astro` submenu, shared `SectionIndex.astro`. This unblocks everything else.
2. **Parallel build phase:** 4 subagents in isolation — one per page (hub, prep, competitions, delegations) — each building its page + its signature components against the now-stable foundation. Worktree isolation so file writes don't collide.
3. **Integration + verification phase (main thread):** merge, resolve any shared-component overlap, run `check` + `build`, visual pass, localhost-URL audit, commit.

---

## Open `TODO-confirm` items handed to maintainer
- Real recruiter company names + logos (placeholders only).
- Delegate quotes, per-year headcounts, outcome bullets.
- Chapter competition record / results.
- Exact recruiter count for 2025 (no verified figure).
- Competition team sizes, time commitments, prizes.
