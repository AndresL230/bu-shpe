# Custom Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the iframe Google Calendar embed on `/events` with a custom editorial-styled Astro component fed by the public iCal feed at build time.

**Architecture:** Build-time fetch + parse of the public `.ics` URL using `node-ical`, exposed via a typed helper (`src/lib/calendar.ts`) that the Astro page awaits at frontmatter level and renders through a new `UpcomingCalendar.astro` component. A Cloudflare Worker cron is scaffolded (not deployed) for later daily auto-rebuilds.

**Tech Stack:** Astro 5, TypeScript strict, Tailwind v4, `node-ical` (new dev dep). Worker scaffolding uses plain TS + `wrangler.toml`.

**Spec:** [`docs/superpowers/specs/2026-05-22-custom-calendar-design.md`](../specs/2026-05-22-custom-calendar-design.md)

## Project conventions (read before starting)

This is a static marketing site. Per `CLAUDE.md`:

- **No unit tests.** Verification is `npm run check` (must be 0 errors / 0 warnings / 0 hints) + `npm run build` (must produce 9 pages cleanly) + visual confirmation in `npm run dev`.
- **No client-side JS framework.** The new component renders to static HTML.
- **Path alias:** `@/*` → `src/*`.
- **No inline hex colors.** Use existing tokens (`text-ink`, `text-ink-muted`, `text-accent`, `border-rule`, `bg-surface`, etc.).
- **Commit messages:** descriptive, no Co-Authored-By trailer pre-baked — let each executing agent attribute its own work. Use heredoc for multi-line messages.

## File map

| Path | Action | Purpose |
|---|---|---|
| `package.json` | modify | Add `node-ical` as a dev dependency. |
| `src/data/site.json` | modify | Add `calendarIcsUrl` field. |
| `src/types.ts` | modify | Add `CalendarEvent` interface; update `SiteMeta` to include `calendarIcsUrl`. |
| `src/lib/calendar.ts` | create | Fetch + parse the ICS feed at build time, return typed `CalendarEvent[]`. |
| `src/components/UpcomingCalendar.astro` | create | Editorial list view of upcoming events. |
| `src/pages/events.astro` | modify | Replace the iframe block with `<UpcomingCalendar />`. |
| `tsconfig.json` | modify | Exclude `workers/` so worker scaffolding doesn't fail `astro check`. |
| `workers/calendar-cron/wrangler.toml` | create | Cron config (deferred deploy). |
| `workers/calendar-cron/src/index.ts` | create | `scheduled()` handler that POSTs to the Pages build hook. |
| `workers/calendar-cron/README.md` | create | Deploy instructions for when the user is ready. |
| `CLAUDE.md` | modify | Document event-upload workflow + worker deploy steps. |
| `README.md` | modify | Brief user-facing mirror of the upload workflow. |

---

## Task 1: Add `node-ical` dev dep + `calendarIcsUrl` to site config

**Files:**
- Modify: `package.json`
- Modify: `src/data/site.json`

- [ ] **Step 1: Install `node-ical` as a dev dep**

Run:
```bash
npm install --save-dev node-ical
```

Expected: `package.json` now has `"node-ical": "^<version>"` under `devDependencies`. `package-lock.json` updated.

- [ ] **Step 2: Add `calendarIcsUrl` to `src/data/site.json`**

Edit `src/data/site.json` — insert the new field directly after the existing `calendarEmbedUrl` line. Final shape:

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
  "calendarIcsUrl": "https://calendar.google.com/calendar/ical/su3ufu2bs53q74amc9qg9kml7k%40group.calendar.google.com/public/basic.ics",
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

- [ ] **Step 3: Verify build still works**

Run:
```bash
npm run check && npm run build
```

Expected: `check` reports 0 errors / 0 warnings / 0 hints. `build` produces 9 pages, no warnings.

Note: `check` may now flag a type mismatch because `SiteMeta` doesn't yet have `calendarIcsUrl`. If so, that's expected — it'll be fixed in Task 2. If `check` does fail with this specific error, proceed to Task 2 and re-verify there.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/data/site.json
git commit -m "deps+config: add node-ical and calendarIcsUrl for custom calendar"
```

---

## Task 2: Add `CalendarEvent` type and extend `SiteMeta`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `calendarIcsUrl` to `SiteMeta` and add `CalendarEvent` interface**

Edit `src/types.ts`. Add `calendarIcsUrl: string;` to `SiteMeta` (directly after `calendarEmbedUrl`). Add the new `CalendarEvent` interface at the bottom of the file. Final relevant sections:

```ts
export interface SiteMeta {
  name: string;
  shortName: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  facultyAdvisorEmail: string;
  region: string;
  calendarEmbedUrl: string;
  calendarIcsUrl: string;
  donateUrl: string;
  sponsorshipPacketUrl: string;
  constitutionUrl: string;
  socials: Record<SocialPlatform, string>;
}
```

```ts
export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay: boolean;
  url?: string;
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
npm run check
```

Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "types: add CalendarEvent and calendarIcsUrl on SiteMeta"
```

---

## Task 3: Implement build-time ICS fetcher (`src/lib/calendar.ts`)

**Files:**
- Create: `src/lib/calendar.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/calendar.ts` with the following exact content:

```ts
import ical from "node-ical";
import type { CalendarComponent, VEvent } from "node-ical";

import site from "@/data/site.json";
import type { CalendarEvent } from "@/types";

const WINDOW_DAYS = 180;
const FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export async function getUpcomingEvents(limit = 6): Promise<CalendarEvent[]> {
  const url = site.calendarIcsUrl;
  if (!url) {
    console.warn("[calendar] site.calendarIcsUrl is empty; returning no events");
    return [];
  }

  const text = await fetchIcs(url);
  if (text === null) return [];

  const parsed = parseIcs(text);
  if (parsed === null) return [];

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const events: CalendarEvent[] = [];
  for (const item of Object.values(parsed)) {
    if (!isVEvent(item)) continue;
    if (!item.summary || !item.start) continue;

    for (const start of expandInstances(item, now, windowEnd)) {
      events.push(buildEvent(item, start));
    }
  }

  return events
    .filter((e) => e.start >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, limit);
}

async function fetchIcs(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      console.warn(`[calendar] fetch returned HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn("[calendar] fetch failed:", err);
    return null;
  }
}

function parseIcs(text: string): Record<string, CalendarComponent> | null {
  try {
    return ical.parseICS(text);
  } catch (err) {
    console.warn("[calendar] parse failed:", err);
    return null;
  }
}

function isVEvent(item: CalendarComponent): item is VEvent {
  return item.type === "VEVENT";
}

function expandInstances(ev: VEvent, windowStart: Date, windowEnd: Date): Date[] {
  if (!ev.rrule) return [ev.start];
  return ev.rrule.between(windowStart, windowEnd, true);
}

function buildEvent(ev: VEvent, start: Date): CalendarEvent {
  const baseDurationMs =
    ev.end && ev.start ? ev.end.getTime() - ev.start.getTime() : DEFAULT_DURATION_MS;
  const end = new Date(start.getTime() + baseDurationMs);

  return {
    uid: typeof ev.uid === "string" ? ev.uid : `${start.getTime()}`,
    title: String(ev.summary),
    description: typeof ev.description === "string" ? ev.description : "",
    location: typeof ev.location === "string" ? ev.location : "",
    start,
    end,
    allDay: ev.datetype === "date",
    url: typeof ev.url === "string" ? ev.url : undefined,
  };
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
npm run check
```

Expected: 0 errors / 0 warnings / 0 hints.

If `node-ical`'s types complain about `parseICS` import shape, switch the import to `import * as ical from "node-ical";` and re-check.

- [ ] **Step 3: Commit**

```bash
git add src/lib/calendar.ts
git commit -m "feat: add build-time ICS fetcher in src/lib/calendar.ts"
```

---

## Task 4: Build the `UpcomingCalendar.astro` component

**Files:**
- Create: `src/components/UpcomingCalendar.astro`

- [ ] **Step 1: Create the component file**

Create `src/components/UpcomingCalendar.astro` with the following exact content:

```astro
---
import type { CalendarEvent } from "@/types";

interface Props {
  events: CalendarEvent[];
}

const { events } = Astro.props;

const TZ = "America/New_York";
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TZ });
const fmtDay = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: TZ });
const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ });
const fmtTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TZ,
});

function timeRange(ev: CalendarEvent): string {
  if (ev.allDay) return "ALL DAY";
  return `${fmtTime.format(ev.start)}–${fmtTime.format(ev.end)}`;
}
---

{events.length === 0 ? (
  <div class="flex items-center justify-center rounded-[var(--radius-card)] border border-rule/30 bg-surface py-20 text-center">
    <p class="pullquote mx-auto max-w-md">Nothing scheduled right now — check back soon.</p>
  </div>
) : (
  <ul class="divide-y divide-rule/30 border-t border-b border-rule/30">
    {events.map((event) => (
      <li class="grid grid-cols-[72px_1fr] gap-6 py-8 md:grid-cols-[96px_1fr] md:gap-10">
        <div class="flex flex-col items-start">
          <span class="eyebrow text-ink-muted">{fmtMonth.format(event.start).toUpperCase()}</span>
          <span class="display text-5xl leading-none text-ink md:text-6xl">
            {fmtDay.format(event.start)}
          </span>
        </div>
        <div class="min-w-0">
          <h3 class="display text-2xl text-ink md:text-3xl">{event.title}</h3>
          <p class="eyebrow mt-2 text-ink-muted">
            {fmtWeekday.format(event.start).toUpperCase()} {timeRange(event)}
            {event.location && <> · {event.location}</>}
          </p>
          {event.description && (
            <p class="mt-3 line-clamp-2 max-w-2xl text-base text-ink-muted">
              {event.description}
            </p>
          )}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener"
              class="eyebrow mt-4 inline-block text-accent underline-offset-4 hover:underline"
            >
              View →
            </a>
          )}
        </div>
      </li>
    ))}
  </ul>
)}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
npm run check
```

Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 3: Commit**

```bash
git add src/components/UpcomingCalendar.astro
git commit -m "feat: add UpcomingCalendar editorial list component"
```

---

## Task 5: Wire the component into `/events` and remove the iframe

**Files:**
- Modify: `src/pages/events.astro`

- [ ] **Step 1: Add imports and frontmatter fetch**

In `src/pages/events.astro`, update the frontmatter imports to add the new component + helper, and call the helper. The relevant top section becomes:

```astro
---
import Base from "@/layouts/Base.astro";
import PageHero from "@/components/PageHero.astro";
import SectionHeading from "@/components/SectionHeading.astro";
import EventCard from "@/components/EventCard.astro";
import MailingListForm from "@/components/MailingListForm.astro";
import UpcomingCalendar from "@/components/UpcomingCalendar.astro";

import siteData from "@/data/site.json";
import eventsRaw from "@/data/events.json";

import { getUpcomingEvents } from "@/lib/calendar";

import type { EventItem, EventCategory } from "@/types";

// All possible filter chips (in display order)
const ALL_CHIPS: { label: string; value: string }[] = [
  { label: "All",          value: ""            },
  { label: "Professional", value: "Professional" },
  { label: "Cultural",     value: "Cultural"     },
  { label: "Social",       value: "Social"       },
  { label: "Conference",   value: "Conference"   },
  { label: "Study Night",  value: "Study Night"  },
  { label: "Volunteering", value: "Volunteering" },
];

// Read active category from URL
const activeCat = Astro.url.searchParams.get("cat") ?? "";

// Sort all events descending by date, then filter
const allEvents = [...(eventsRaw as EventItem[])].sort((a, b) =>
  b.date.localeCompare(a.date)
);
const filteredEvents = activeCat
  ? allEvents.filter((e) => e.category === (activeCat as EventCategory))
  : allEvents;

// Upcoming events from the public Google Calendar ICS feed
const upcomingEvents = await getUpcomingEvents(6);
---
```

- [ ] **Step 2: Replace the iframe section with the new component**

In the same file, replace the entire "② Upcoming — Google Calendar embed" section (currently lines 48–73, the `<section>...</section>` block containing the `<iframe>`) with:

```astro
  <!-- ② Upcoming — pulled live from Google Calendar at build time -->
  <section class="reveal mx-auto max-w-[1200px] px-6 py-24">
    <SectionHeading eyebrow="UPCOMING" title="On our calendar." />

    <div class="mt-10">
      <UpcomingCalendar events={upcomingEvents} />
    </div>

    <div class="mt-8 flex justify-end">
      <a
        href={siteData.calendarEmbedUrl}
        target="_blank"
        rel="noopener"
        class="eyebrow text-accent underline-offset-4 hover:underline transition-opacity hover:opacity-80"
      >
        Open the full calendar →
      </a>
    </div>
  </section>
```

Leave the rest of the page (archive grid, filter chips, mailing-list nudge) untouched.

- [ ] **Step 3: Verify type-check passes**

Run:
```bash
npm run check
```

Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 4: Verify the build produces all 9 pages with live calendar data**

Run:
```bash
npm run build
```

Expected: build completes successfully, "9 page(s) built" reported, no warnings about the calendar fetch. (If the build console shows `[calendar] fetch failed:` it means the public ICS endpoint is unreachable from this machine — that's a network issue, not a code issue. The build should still succeed because the helper returns `[]` on failure.)

- [ ] **Step 5: Visual confirmation in the dev server**

Run:
```bash
npm run dev
```

Open `http://localhost:4321/events` in a browser. Confirm:
1. The old iframe (Google's grey/blue chrome) is gone.
2. An editorial list of upcoming events is rendered — with date glyph on the left, title in `.display`, eyebrow meta row, optional description and "View →" link.
3. Resize the window to ~375px wide; date glyph stacks cleanly to the left, content does not overflow.
4. The "Open the full calendar →" link still works and opens GCal in a new tab.

If the calendar list shows zero events, double-check the public visibility of the GCal at `https://calendar.google.com/calendar/ical/su3ufu2bs53q74amc9qg9kml7k%40group.calendar.google.com/public/basic.ics` (paste in browser; should download an `.ics` file).

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 6: Commit**

```bash
git add src/pages/events.astro
git commit -m "$(cat <<'EOF'
feat(events): replace GCal iframe with custom UpcomingCalendar

Live event data pulled from the public iCal feed at build time.
The "Open the full calendar" outbound link still uses the
interactive GCal view.
EOF
)"
```

---

## Task 6: Scaffold deferred Cloudflare Worker cron (no deploy)

The user is holding off on deploying the daily rebuild. Scaffold the files so they're committed and ready, but do not run `wrangler deploy` or create any secrets.

**Files:**
- Create: `workers/calendar-cron/wrangler.toml`
- Create: `workers/calendar-cron/src/index.ts`
- Create: `workers/calendar-cron/README.md`
- Modify: `tsconfig.json` (exclude `workers/` from astro check)

- [ ] **Step 1: Exclude `workers/` from the Astro tsconfig**

Edit `tsconfig.json` so `workers/` is excluded. The final file should be:

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
  "exclude": ["dist", "workers"]
}
```

- [ ] **Step 2: Create the Worker source**

Create `workers/calendar-cron/src/index.ts`:

```ts
interface Env {
  BUILD_HOOK_URL: string;
}

export default {
  async scheduled(_event: unknown, env: Env): Promise<void> {
    if (!env.BUILD_HOOK_URL) {
      console.error("BUILD_HOOK_URL not set");
      return;
    }
    const res = await fetch(env.BUILD_HOOK_URL, { method: "POST" });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Build hook returned ${res.status}: ${body}`);
      return;
    }
    console.log("Pages build triggered");
  },
};
```

- [ ] **Step 3: Create the wrangler config**

Create `workers/calendar-cron/wrangler.toml`:

```toml
name = "shpe-bu-calendar-cron"
main = "src/index.ts"
compatibility_date = "2026-05-22"

# 10:00 UTC daily = 6:00 AM ET (summer) / 5:00 AM ET (winter).
# Site rebuilds before most members are awake.
[triggers]
crons = ["0 10 * * *"]
```

- [ ] **Step 4: Create the worker README with deploy instructions**

Create `workers/calendar-cron/README.md`:

```markdown
# calendar-cron Worker

Daily cron that triggers a Cloudflare Pages rebuild so new Google Calendar
events appear on the site without a manual git push.

## When to deploy

After the site is live on Cloudflare Pages. Until then, the events page
will only refresh on git push.

## Deploy steps

1. In the Cloudflare Pages dashboard, open the bu-shpe project →
   Settings → Builds & deployments → Deploy hooks → "Add deploy hook".
   Copy the generated URL.

2. From this directory:

   ```bash
   cd workers/calendar-cron
   npx wrangler secret put BUILD_HOOK_URL
   # paste the deploy hook URL when prompted
   npx wrangler deploy
   ```

3. Verify the cron registered:

   ```bash
   npx wrangler triggers list
   ```

## Schedule

`0 10 * * *` = every day at 10:00 UTC (6:00 AM ET in summer, 5:00 AM
in winter). Adjust in `wrangler.toml` if you want a different cadence.
```

- [ ] **Step 5: Verify check still passes (workers/ is now excluded)**

Run:
```bash
npm run check && npm run build
```

Expected: both succeed, 0 errors / 0 warnings / 0 hints, 9 pages built.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json workers/
git commit -m "$(cat <<'EOF'
chore: scaffold calendar-cron Worker (deploy deferred)

Adds wrangler.toml + scheduled handler that POSTs to a Pages build
hook on a daily cron. Not deployed yet — README documents the steps
to wire it up when the site goes live. Excludes workers/ from the
Astro tsconfig so npm run check stays clean without
@cloudflare/workers-types installed in the root.
EOF
)"
```

---

## Task 7: Document the upload workflow

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Add upload + deploy section to `CLAUDE.md`**

In `CLAUDE.md`, add a new top-level section directly after the `## Quick commands` section, with the following content:

```markdown
## Editing events

The `/events` "Upcoming" list is fed live from the chapter Google
Calendar at build time (`src/lib/calendar.ts`). The `events.json`
file backs the historical *archive* below — it is NOT the upcoming
list.

**To add or edit an upcoming event:**

1. Open Google Calendar.
2. Switch to the *SHPE-BostonU* calendar (calendar ID
   `su3ufu2bs53q74amc9qg9kml7k@group.calendar.google.com`).
3. Click the date, fill in title / time / location / description, save.

The event appears on the site after the next build:
- Once the Pages cron Worker is deployed (see
  `workers/calendar-cron/README.md`): within ~24h, automatically.
- Before then, or for immediate publish: push any commit, or click
  "Retry deployment" in the Cloudflare Pages dashboard.

The ICS feed must remain public for this to work. Don't flip the
calendar to private.
```

- [ ] **Step 2: Add a short events-upload note to `README.md`**

In `README.md`, add a section (location: alongside any other "how to edit content" notes; if there are none, near the top under the intro). Content:

```markdown
## Adding an event to the site

Upcoming events are pulled from the chapter's Google Calendar. To add
one: open Google Calendar, switch to the *SHPE-BostonU* calendar,
create the event with title / time / location / description, save.
It will appear on `/events` after the next site build.

See `CLAUDE.md` "Editing events" for details on rebuild timing.
```

- [ ] **Step 3: Verify check + build still pass**

Run:
```bash
npm run check && npm run build
```

Expected: both succeed cleanly.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: explain GCal event upload workflow and rebuild cadence"
```

---

## Final verification

After all tasks are complete, run the full verification once more from a clean state:

```bash
npm run check && npm run build
```

Both must report 0 errors / 0 warnings / 0 hints, and the build must produce all 9 pages cleanly.

Then `npm run dev`, open `/events`, and re-confirm visually:
- No iframe in DevTools.
- Upcoming list renders with the editorial style.
- Mobile width (375px) layout holds.
- "Open the full calendar →" still works.

If all green, the feature is shippable. Deployment + cron Worker remain deferred per user instruction.
