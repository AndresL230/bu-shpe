# Support Page — Design Spec

**Date:** 2026-05-27
**Route:** `/support` (renamed from `/sponsors`)
**Status:** Approved for implementation (subagent-driven build)

## Purpose

Replace the existing `/sponsors` page with a broader `/support` page that serves
three audiences at once: **corporate partners** (sponsorship), **individual
givers** (donations), and a **credibility/pride display** of where BU SHPE
members and alumni work. Tone: grateful but confident — community-framed, not
desperate.

## Design decisions (locked)

- **Colors:** Use the existing `@theme` tokens only — navy `#001F5B` (`ink`/`deep`),
  orange `#FD652F` (`accent`), etc. Do NOT introduce the prompt's `#002855` /
  `#FF6C0E`. No inline hex anywhere (project rule).
- **Hero title:** "The People Behind the Mission" with an italic Playfair accent
  word ("Mission").
- **Where We Work display:** static grayscale-→-color grid grouped by industry.
  No marquee, no motion beyond hover.
- **Smooth scroll:** pure CSS, **page-scoped** to `/support` only — a
  `<style>` block in `support.astro` setting `html { scroll-behavior: smooth }`
  (only loaded on this page, so other pages' anchor jumps are untouched) +
  `scroll-margin-top` on the section anchors for the 72px fixed nav. No JS.
- **Tiers vs logos:** the tier **benefits** are their own comparison; the
  **current-partner logos** are grouped Institutional (BU CoE + SAO) vs Corporate
  (the 5 companies), NOT force-assigned to invented Platinum/Gold tiers.
- **Tier names:** Platinum / Gold / Silver / Bronze. `"Bronze"` replaces the
  existing `"Partner"` value in the `Sponsor` tier union.
- **Tech:** Astro 5, Tailwind v4, TypeScript strict. Match existing component
  patterns. Minimal JS (modals + trigger wiring only).

## Route & rename

1. `git mv src/pages/sponsors.astro src/pages/support.astro`
2. `src/components/Nav.astro:43` — `{ href: "/support", label: "Support" }`
3. `src/components/Footer.astro:8` — `{ href: "/support", label: "Support" }`
4. No other internal links reference `/sponsors` (verified via grep; only the
   `types.ts` asset-path comment mentions `/assets/sponsors/`, which is unrelated
   and stays).

## Data files (source of truth)

### New: `src/data/support.json`
```jsonc
{
  "stats": [
    { "value": "7+",  "label": "Corporate & institutional partners" },
    { "value": "100+","label": "Students supported each year" },
    { "value": "20+", "label": "Events per year" }
  ],
  "tiers": [
    {
      "name": "Platinum",
      "benefits": [
        "Premier logo placement on website + all event materials",
        "Priority recruiting access at chapter events AND the National Convention",
        "Up to 2 branded company-led workshops, panels, or site visits",
        "Direct introductions to engineering students + BU College of Engineering",
        "Dedicated feature on Instagram (@shpe.bostonu) + every newsletter"
      ]
    },
    { "name": "Gold",   "benefits": [ /* scaled down from Platinum */ ] },
    { "name": "Silver", "benefits": [ /* scaled down further */ ] },
    { "name": "Bronze", "benefits": [ /* entry-level */ ] }
  ],
  "donationFunds": [
    "SHPE National Convention travel and registration",
    "Professional development workshops and materials",
    "Networking and social events",
    "Chapter operations and supplies"
  ],
  "givingImpact": [
    { "amount": "$25",  "outcome": "Covers supplies for a resume workshop" },
    { "amount": "$50",  "outcome": "Funds a student's convention registration" },
    { "amount": "$100", "outcome": "Sponsors a company visit trip" },
    { "amount": "$200", "outcome": "Funds a full semester of professional development events" }
  ]
}
```
All numbers are placeholders the chapter can edit later.

Benefit scaling by tier (clear differentiation):
- **Platinum:** all benefits, premier placement, 2 workshops, convention + chapter recruiting, dedicated IG feature + every newsletter.
- **Gold:** prominent logo, 1 workshop, convention + chapter recruiting, IG feature + newsletter mentions.
- **Silver:** logo on site + materials, recruiting at chapter events, shared IG feature, newsletter mention.
- **Bronze:** logo on site, recruiting at chapter events, newsletter mention.

### New: `src/data/employers.json`
"Where We Work" — member/alumni employers, NOT sponsors. Grouped by industry,
~18 placeholder slots. Text wordmark tiles (no logo files in repo).
```jsonc
[
  { "industry": "Aerospace & Defense", "companies": ["Boeing","Raytheon","NASA","JPL","Lockheed Martin"] },
  { "industry": "Technology",          "companies": ["Google","Microsoft","Amazon","Akamai","Tesla"] },
  { "industry": "Energy",              "companies": ["GE","Eversource","Schlumberger","NextEra"] },
  { "industry": "Biotech & Health",    "companies": ["Vertex","Moderna","Genentech","Pfizer"] }
]
```
Placeholder company names — editable. `logo` field optional per company for a
future swap to real image logos.

### Edit: `src/types.ts`
Add interfaces:
```ts
export interface SupportStat { value: string; label: string; }
export interface SponsorTier { name: "Platinum" | "Gold" | "Silver" | "Bronze"; benefits: string[]; }
export interface GivingImpact { amount: string; outcome: string; }
export interface EmployerGroup { industry: string; companies: { name: string; logo?: string }[]; }
```
And change `Sponsor.tier` union: `"Platinum" | "Gold" | "Silver" | "Bronze"`
(was `... | "Partner"`). Update `support.astro`'s `tierOrder` accordingly — but
note the current-partners grid groups Institutional/Corporate, so tier grouping
of logos is optional/unused for now.

## Page structure (`src/pages/support.astro`)

Order: **Hero → Corporate (`#corporate`) → Individual (`#individual`) →
Where We Work (`#employers`)**. Each major section is its own component for
isolation + parallel builds. Section anchors get `scroll-mt-[88px]`.

### 1. `SupportHero.astro`
- `PageHero` with eyebrow `SUPPORT`, headline `The People Behind the Mission`,
  `headlineAccent="Mission"`, subtitle = community paragraph:
  > "BU SHPE exists because people show up — with funding, mentorship, open
  > doors, and belief in what this community can become. Our supporters are the
  > companies, alumni, faculty, and friends who invest in Hispanic engineers,
  > alongside the BU College of Engineering and the Student Activities Office."
- Below the hero band: **stats strip** (3 `support.json` stats — reuse
  `StatsStrip.astro` if its API fits, else inline) + **3 anchor cards** linking
  to `#corporate`, `#individual`, `#employers`. Cards visually distinct
  (different accent treatment each) so visitors self-select. Cards are `<a>`
  elements — smooth scroll handled by CSS.

### 2. `CorporateSection.astro` (`id="corporate"`)
- Value pitch prose (access to Hispanic STEM talent at a top engineering school;
  visibility at chapter events + SHPE National Convention; direct student pipeline).
- 4 **tier cards** (Platinum/Gold/Silver/Bronze) from `support.json.tiers`,
  benefits listed per card, Platinum visually emphasized. Responsive: 4-up on
  desktop, stacked on mobile.
- **Current partners** grid: reuse `SponsorGrid.astro`. Group into "Institutional"
  (BU College of Engineering, BU Student Activities Office) and "Corporate"
  (Capital One, Brooks, General Electric, Akamai, Vertex). ~7 slots.
- CTAs: "Download the Sponsorship Packet" → `siteData.sponsorshipPacketUrl`
  (target=_blank, rel=noopener); "Become a Partner" → `data-open-modal="corporate"`.

### 3. `IndividualSection.astro` (`id="individual"`)
- Header "Support a Student".
- "What your gift funds" — `support.json.donationFunds` list.
- 4 **impact cards** from `support.json.givingImpact` ($25/$50/$100/$200 → outcome).
- CTAs: "Donate via BU Trusted" → `siteData.donateUrl` (target=_blank,
  rel=noopener, primary button); "Get in Touch" → `data-open-modal="individual"`.

### 4. `EmployersSection.astro` (`id="employers"`)
- Header "Where SHPE Takes Us" + subtext: "BU SHPE members and alumni have gone
  on to work at companies shaping the future of engineering, technology, and
  science."
- Static grid grouped by industry (`employers.json`). Each company = a wordmark
  tile: muted ink text on `surface`, → full `ink`/`accent` on hover (mirrors the
  `SponsorGrid` grayscale-→-color hover idea, adapted for text). Visually distinct
  from `SponsorGrid` (text tiles, industry headers) so nobody confuses these with
  sponsors. **No CTA.**

## Modals — `ContactModal.astro`

One reusable component, native `<dialog>` (same pattern as `Gallery.astro`
lightbox). Rendered twice in `support.astro` (corporate + individual variants).

**Props:** `id` ("corporate" | "individual"), `title`, `formspreeId` (default
`"PLACEHOLDER"`). Field markup passed via default `<slot>`.

**Shell behavior (shared):**
- `<dialog id={`modal-${id}`}>`, opened by global trigger script.
- Close on: close button, backdrop click (`e.target === dialog`), ESC (free with
  `<dialog>`).
- CSS open/close transition (opacity + slight translate; respects
  `prefers-reduced-motion`).
- HTML5 `required` validation on required fields.
- Submit handler: `fetch(`https://formspree.io/f/${formspreeId}`, {method:POST,
  body:FormData, headers:{Accept:'application/json'}})`. On ok → swap form for
  success state ("Thanks! We'll be in touch."). On failure → show error +
  `mailto:shpe@bu.edu` fallback link. A persistent "or email us directly"
  `mailto:shpe@bu.edu` link is always visible in the modal footer.

**Trigger contract (decouples sections from modal internals):**
One small global script (in Wave 0, lives in `support.astro` or a shared snippet):
```js
document.querySelectorAll('[data-open-modal]').forEach(btn =>
  btn.addEventListener('click', () =>
    document.getElementById('modal-' + btn.dataset.openModal)?.showModal()
  )
);
```
Sections only emit `<button data-open-modal="corporate">`. They never import the
modal.

**Corporate modal fields:** Company Name (text, required), Contact Name (text,
required), Email (email, required), Role (select: Recruiter / Engineering Manager
/ Diversity & Inclusion Lead / Other), Interest (checkbox group: Sponsorship Tier
Info, Host a Workshop, Attend an Event, Convention Recruiting, General Inquiry),
Message (textarea, optional), Submit.

**Individual modal fields:** Name (text, required), Email (email, required),
Connection to BU (select: Alum / Parent / Faculty / Friend of SHPE / Other),
Message (textarea, optional), Submit.

All inputs styled to match `MailingListForm.astro` (rounded, `border-rule/40`,
`focus:border-accent`).

## Component inventory

| File | New/Edit | Purpose |
|---|---|---|
| `src/pages/support.astro` | rename of sponsors.astro, rewrite | assembles sections + 2 modals + trigger script |
| `src/components/SupportHero.astro` | new | hero + stats + anchor cards |
| `src/components/CorporateSection.astro` | new | pitch + tiers + partner logos + CTAs |
| `src/components/IndividualSection.astro` | new | giving copy + impact cards + CTAs |
| `src/components/EmployersSection.astro` | new | where-we-work grid |
| `src/components/ContactModal.astro` | new | reusable dialog modal + Formspree submit |
| `src/components/Nav.astro` | edit | /support label |
| `src/components/Footer.astro` | edit | /support label |
| `src/data/support.json` | new | stats, tiers, funds, impact |
| `src/data/employers.json` | new | where-we-work companies |
| `src/types.ts` | edit | new interfaces + tier union |
| reuse: `PageHero`, `StatsStrip`, `SectionHeading`, `SponsorGrid`, `Icon` | — | — |

## Subagent waves (dependency-ordered)

- **Wave 0** (1 agent, sequential foundation): route rename, Nav/Footer edits,
  `types.ts`, `support.json`, `employers.json`. Define + place the modal-trigger
  global script and smooth-scroll CSS scaffolding. Leaves `support.astro`
  compiling with placeholders for sections.
- **Wave 1** (parallel): `ContactModal.astro` · `SupportHero.astro` ·
  `EmployersSection.astro` (independent; build against data + trigger contract).
- **Wave 2** (parallel): `CorporateSection.astro` · `IndividualSection.astro`
  (consume trigger contract + data).
- **Wave 3** (1 agent, sequential): assemble `support.astro` in final order, wire
  modals, then `npm run check` (0 errors) + `npm run build` (9→still builds all
  routes) + visual QA in dev server. Verify external links, smooth scroll, both
  modals open/validate/submit/success, responsive, no broken `/sponsors` links.

## Verification (no test runner — static site)
- `npm run check` → 0 errors/warnings/hints.
- `npm run build` → succeeds, emits `/support` route, no dangling `/sponsors`.
- Visual confirm in `npm run dev`: hero anchors smooth-scroll; both modals open,
  validate required fields, show success state; grayscale grid hover; mobile +
  desktop layouts; external links (packet, BU Trusted, mailto) resolve.

## Out of scope
- Real employer/sponsor logo files (placeholders only).
- A live Formspree endpoint (placeholder ID; chapter swaps `formspreeId` later).
- Per-sponsor tier assignment (grouped Institutional/Corporate for now).
- Final stat numbers (placeholders).
