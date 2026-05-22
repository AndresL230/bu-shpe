# Custom calendar component backed by Google Calendar ICS

**Date:** 2026-05-22
**Status:** Approved — implementation pending
**Author:** chapter member + Claude (brainstorming session)

## Problem

The `/events` page currently embeds Google Calendar via `<iframe>` (`src/pages/events.astro:53`). The iframe:

- Carries Google's UI, colors, and typography — visually incongruous with the editorial design system.
- Can't be styled (cross-origin iframe).
- Adds a third-party render dependency on every page load.
- Is not mobile-friendly out of the box.

We want a custom-styled component that reads from the same Google Calendar (so officers keep their existing event-creation workflow) but renders in the site's editorial typography and palette.

## Goals

1. Replace the iframe with a native Astro component styled to match the rest of the site.
2. Keep Google Calendar as the single source of truth for events. No second system to maintain.
3. Make event uploads a one-step workflow (create event in GCal → it appears on the site).
4. Match the existing static-site architecture (build-time fetch, no runtime JS framework, no client-side data fetching).

## Non-goals

- No month grid / week view. Editorial upcoming-events list only.
- No event editing / RSVP UI on the site. GCal stays authoritative.
- No client-side calendar JS library (FullCalendar, etc.).
- No live-syncing infra beyond a daily scheduled rebuild. Near-real-time updates are not required.
- No auth. Calendar must remain public-readable (it already is).

## Architecture

### Data flow

```
Google Calendar (calendar.google.com)
       │  officers create / edit events here
       ▼
Public iCal feed (.ics)
  https://calendar.google.com/calendar/ical/<id>/public/basic.ics
       │  fetched at Astro build time
       ▼
src/lib/calendar.ts
  fetch + parse + filter + sort
       │  returns CalendarEvent[]
       ▼
src/pages/events.astro
  awaits getUpcomingEvents() at frontmatter level
       │  passes events as prop
       ▼
src/components/UpcomingCalendar.astro
  renders static HTML
```

Rebuild cadence: Cloudflare Pages "build hook" URL triggered daily by a Cloudflare Worker cron (6:00 AM America/New_York). New GCal events visible within ~24h. For immediate publish: any git push, or click "Retry deployment" in Cloudflare Pages dashboard.

### Components

**`src/lib/calendar.ts`** (new) — data layer

- Exports `getUpcomingEvents(limit?: number): Promise<CalendarEvent[]>`.
- Reads `calendarIcsUrl` from `src/data/site.json`.
- Uses `node-ical` (new dev dep) to parse the feed. `node-ical` handles:
  - VEVENT entries
  - All-day vs timed events
  - Timezone conversion (the chapter calendar's events have TZ context; we render in `America/New_York`)
  - RRULE recurring events (expanded to concrete instances)
- Filters to events where `start >= now`, sorts ascending by `start`, returns the first `limit` (default 6).
- On fetch/parse failure: log a warning to the build console, return `[]`. The page falls back to its empty-state UI rather than failing the build.
- Build-time only. Module is never bundled to the client (Astro tree-shakes).

**`src/types.ts`** — add `CalendarEvent` interface

```ts
export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay: boolean;
  url?: string; // htmlLink from gcal, if present
}
```

**`src/components/UpcomingCalendar.astro`** (new) — UI

- Props: `events: CalendarEvent[]`. (Slicing happens in `getUpcomingEvents`; the component renders whatever it's handed.)
- Empty-list state: editorial pull-quote — *"Nothing scheduled right now — check back soon."*
- Per-row layout, with `border-t border-rule/30` divider above each row except the first:

```
┌──────────────────────────────────────────────────────────┐
│  SEP        Title in .display 2xl text-ink               │
│  18         THU 6:00–7:30 PM · Photonics Bldg 906        │
│             Short description, line-clamp-2,             │
│             text-ink-muted                               │
│                                            [View →]     │
└──────────────────────────────────────────────────────────┘
```

- Date glyph (left column, ~80px wide on desktop, stacked on mobile):
  - Month: Barlow Condensed SemiBold uppercase, `text-xs`, `text-ink-muted`, tracked
  - Day numeral: Barlow Condensed Bold, `text-5xl`, `text-ink`, line-height 1
- Title: `.display`, `text-2xl md:text-3xl`, `text-ink`
- Meta row (under title): eyebrow style — weekday short + time range + location, separated by `·`
  - All-day events: replace time range with `ALL DAY`
- Description: `text-ink-muted`, `text-base`, `line-clamp-2`, `max-w-2xl`
- "View →" link: `text-accent`, `eyebrow`, links to `event.url` (Google Calendar event page) if present, else hidden

### Page wiring

**`src/pages/events.astro`** — replace lines 49–73 (the existing iframe block) with:

```astro
---
import UpcomingCalendar from "@/components/UpcomingCalendar.astro";
import { getUpcomingEvents } from "@/lib/calendar";
// ...existing imports...

const upcomingEvents = await getUpcomingEvents(6);
---

<section class="reveal mx-auto max-w-[1200px] px-6 py-24">
  <SectionHeading eyebrow="UPCOMING" title="On our calendar." />
  <div class="mt-10">
    <UpcomingCalendar events={upcomingEvents} />
  </div>
  <div class="mt-8 flex justify-end">
    <a href={siteData.calendarEmbedUrl} target="_blank" rel="noopener"
       class="eyebrow text-accent hover:underline underline-offset-4">
      Open the full calendar →
    </a>
  </div>
</section>
```

Archive grid + filter chips below this section remain unchanged (still driven by `events.json`).

### Config

Add to `src/data/site.json`:

```json
"calendarIcsUrl": "https://calendar.google.com/calendar/ical/su3ufu2bs53q74amc9qg9kml7k%40group.calendar.google.com/public/basic.ics"
```

Keep `calendarEmbedUrl` — still used by the "Open the full calendar" link.

### Scheduled rebuild (deferred — code ready, not deployed)

Cloudflare Worker with a cron trigger that pings the Pages build hook URL. Files:

- `workers/calendar-cron/wrangler.toml` — `crons = ["0 10 * * *"]` (10:00 UTC = 6:00 AM ET in summer, 5:00 AM ET in winter; acceptable drift)
- `workers/calendar-cron/src/index.ts` — `scheduled()` handler that does `fetch(env.BUILD_HOOK_URL, { method: "POST" })`
- Build hook URL stored as a Wrangler secret (`wrangler secret put BUILD_HOOK_URL`), not committed.

User is holding deployment for now — these files are scaffolded and documented but no real account is touched and no secrets are stored. Deployment doc in `CLAUDE.md` will note: "When you're ready to deploy, generate a Pages build hook in the Cloudflare dashboard, then `cd workers/calendar-cron && wrangler secret put BUILD_HOOK_URL && wrangler deploy`."

### Documentation

Add to `CLAUDE.md` (and a brief mirror in `README.md`):

> **Adding an event:** Open Google Calendar → switch to the *SHPE-BostonU* calendar → click the date → fill title / time / location / description → save. It will appear on the site within ~24h after the next scheduled rebuild. For immediate publish, push any commit or click "Retry deployment" in the Cloudflare Pages dashboard.

## Error handling

| Failure mode | Behavior |
|---|---|
| ICS fetch network error | `getUpcomingEvents` returns `[]`, warning logged to build console. Page shows empty state. Build succeeds. |
| ICS parse error | Same as above. |
| Calendar contains zero future events | Empty state pull-quote. |
| Single event missing optional field (description, location, url) | Field hidden in the rendered row; event still displays. |
| Event missing required field (title or start) | Skipped silently (defensive — should not happen for valid GCal data). |

## Testing & verification

Static marketing site — no unit tests (per CLAUDE.md).

Verification checklist:

- [ ] `npm run check` — 0 errors / 0 warnings / 0 hints
- [ ] `npm run build` — all 9 pages build, no warnings about calendar fetch
- [ ] `npm run dev` — visit `/events`, confirm upcoming list renders with real GCal data
- [ ] Resize to mobile width (375px) — date glyph + content stack cleanly, no overflow
- [ ] Temporarily break the ICS URL → confirm graceful empty state, build still succeeds
- [ ] Confirm iframe is gone from page source
- [ ] Confirm "Open the full calendar →" link still works

## Things explicitly out of scope

- Server-rendered calendar API (no Pages Functions, no edge runtime).
- Client-side polling or live updates.
- Authentication / private calendars.
- ICS file generation (we only consume, never produce).
- Migrating the historical archive in `events.json` to GCal. The archive stays in JSON; the upcoming list is GCal-driven. The two co-exist on the page.
- Replacing `calendarEmbedUrl` — kept for the outbound "Open the full calendar" link, which deep-links into GCal's interactive view (better UX than a flat link to the .ics file).

## Open follow-ups (not part of this spec)

- If the chapter wants the upcoming list to grow beyond 6 events: trivially raise the `limit` prop default.
- If officers prefer a different rebuild cadence (e.g., hourly): change the cron expression.
- If recurring-event handling reveals edge cases (e.g., "every other Thursday" rrules), revisit `node-ical` config or swap to `ical.js`.
