#!/usr/bin/env node
/**
 * Step 4 of the Drive archive import: writes migrations/0004_drive_archive.sql
 * from import/processed/plan.json (photos, EXIF dates), the Chrome session's
 * manifest (verification + suggested names) and the original crawl list.
 *
 *   - 8 Drive folders that match existing events: swap in the high-res Drive
 *     cover and attach the extra photos (no duplicate events).
 *   - Other photo folders become published events, dated from EXIF.
 *   - Crawl entries without photos become DRAFTS (published = 0) for the
 *     e-board to finish in /admin.
 *   - Non-event folders (random/loose/unlabeled/e-board/chapters) are skipped.
 *
 * Photo URLs point at R2 (uploaded by upload-r2-photos.mjs):
 *   /media/events/archive/<folder-slug>/<nn>.webp   (00 = cover)
 *
 * Usage: node scripts/build-archive-migration.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const plan = JSON.parse(readFileSync(join(ROOT, "import/processed/plan.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "import/drive-photos/manifest.json"), "utf8"));
const crawl = JSON.parse(readFileSync(join(ROOT, "import/drive-crawl-2026-11-03.json"), "utf8"));
const manifestBySlug = new Map(manifest.map((f) => [f.slug, f]));

/** Folders that aren't a single event: photos stay in R2, no event row. */
const SKIP = new Set([
  "random-2021-22", "random-2019-20", "2020-21-loose-photos-incl-spring-2021-first-gbm",
  "shpe-chapters", "e-board-2019-20", "jen-unlabeled", "2018-19-loose-photos", "general-2018-19-photos",
]);

/** Drive folder → existing event slug (already on the site since the WordPress import). */
const EXISTING = {
  "splash": "splash-2022",
  "resume-review-with-ge": "resume-review-with-ge",
  "mechanical-workshop-with-epic": "mechanical-workshop-with-epic",
  "national-convention-2022-charlotte": "shpe-national-convention",
  "navidad-en-familia": "navidad-en-familia",
  "boston-scientific-visit": "boston-scientific-company-visit",
  "indoor-field-day": "indoor-field-day-2023",
  "spring-conference": "leadershpe-live-2023",
};
const EXISTING_SLUGS = [
  "boston-scientific-company-visit", "fall-career-workshop", "indoor-field-day-2023", "leadershpe-live-2023",
  "mechanical-workshop-with-epic", "money-matters-workshop-with-capital-one", "navidad-en-familia",
  "resume-review-with-ge", "shpe-national-convention", "shpe-national-convention-2026", "splash-2022",
  "welcome-back-mixer-2026",
];

/** Title / date fixes from the Chrome session's checks. */
const OVERRIDES = {
  // EXIF / filenames date these photos to Sep 2023: the Fall 2023 technical
  // workshop from the attendance list, not the Feb 2023 Money Matters event.
  "capital-one-workshop": { title: "Capital One Technical Workshop", date: "2023-09-07", category: "professional" },
  // A graphic in the folder reads "NILA 2020, August 7-9, 2020".
  "nila-2021": { title: "NILA 2020", date: "2020-08-07" },
  "networking-night": { title: "Networking @ Night 2020" },
  "national-convention-2019": { title: "SHPE National Convention 2019" },
  "national-convention-2021": { title: "SHPE National Convention 2021" },
  "rldc": { title: "Regional Leadership Development Conference (RLDC) 2020" },
  "volunteering-2021-22": { date: "2022-04" }, // no EXIF; Drive upload month
  // Two visits in one folder (2019-11-02 and 2020-02-22); date it by the first.
  "greater-boston-food-bank": { date: "2019-11-02" },
};
/** The draft this photo folder fulfils, so it isn't also imported as a draft. */
const FULFILS_DRAFT = { "capital-one-workshop": "Capital One Technical Workshop|Fall 2023" };

const SITE_CATEGORY = (cat, title) => {
  if (/navidad|shpetina|latinx/i.test(title)) return "Cultural";
  if (/workshop|resume|interview|info ?session|professional|networking|office visit|panel/i.test(title)) return "Professional";
  return {
    volunteering: "Volunteering", conference: "Conference", professional: "Professional",
    academic: "Study Night",
  }[cat] ?? "Social"; // gbm, social, collab, outreach, intramural, chapter
};

function semesterOf(date) {
  const [y, m] = date.split("-").map(Number);
  return m <= 5 ? `Spring ${y}` : m <= 8 ? `Summer ${y}` : `Fall ${y}`;
}
/** Draft sort date from a semester label: Fall → Oct, Spring → Mar, Summer → Jul. */
function dateFromSemester(sem) {
  const m = sem.match(/(Spring|Summer|Fall) (\d{4})/);
  if (m) return `${m[2]}-${{ Spring: "03", Summer: "07", Fall: "10" }[m[1]]}`;
  const ay = sem.match(/(\d{4})-(\d{4})/); // academic year only
  return ay ? `${ay[2]}-01` : null;
}
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const q = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const media = (slug, file) => `/media/events/archive/${slug}/${file}`;

const taken = new Set(EXISTING_SLUGS);
const uniqueSlug = (title) => {
  const base = slugify(title) || "event";
  let s = base;
  for (let n = 2; taken.has(s); n++) s = `${base}-${n}`;
  taken.add(s);
  return s;
};

const sql = [
  "-- Drive archive import (generated by scripts/build-archive-migration.mjs; do not edit by hand).",
  "-- Photos live in R2 under events/archive/<folder>/; see import/ (git-ignored) for sources.",
  "",
];
const report = { updated: 0, created: 0, drafts: 0, photos: 0, skipped: [] };

/* 1. Photo folders */
const newEvents = [];
for (const p of plan) {
  if (SKIP.has(p.slug)) { report.skipped.push(p.slug); continue; }
  if (!p.photos.length) { report.skipped.push(`${p.slug} (no photos)`); continue; }
  const cover = media(p.slug, p.photos[0].file);
  const extras = p.photos.slice(1).map((ph, i) => ({ url: media(p.slug, ph.file), sort: i + 1, takenAt: ph.takenAt }));

  if (EXISTING[p.slug]) {
    const slug = EXISTING[p.slug];
    sql.push(`-- ${p.crawlName} → existing event ${slug}`);
    sql.push(`UPDATE events SET photo = ${q(cover)}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE slug = ${q(slug)};`);
    for (const e of extras) {
      sql.push(`INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, ${q(e.url)}, ${e.sort}, ${q(e.takenAt)} FROM events WHERE slug = ${q(slug)};`);
    }
    report.updated++;
    report.photos += p.photos.length;
    continue;
  }

  const o = OVERRIDES[p.slug] ?? {};
  const m = manifestBySlug.get(p.slug);
  const title = o.title ?? m?.suggestedName ?? p.crawlName;
  // Priority: manual fix > date recorded in the crawl (slide decks /
  // attendance sheets) > median EXIF capture date.
  const crawlDate = crawl.withPhotos.find((c) => c.name === p.crawlName)?.date ?? null;
  const date = o.date ?? crawlDate ?? p.date;
  if (!date) { report.skipped.push(`${p.slug} (no date)`); continue; }
  const category = SITE_CATEGORY(o.category ?? p.category, title);
  newEvents.push({ folder: p.slug, title, date, category, cover, extras });
}

/* 2. Drafts (no photos) */
const fulfilled = new Set(Object.values(FULFILS_DRAFT));
const drafts = crawl.needsPhotos
  .filter(([name, sem]) => !fulfilled.has(`${name}|${sem}`))
  .map(([name, sem, date, cat]) => ({ name, sem, date: date ?? dateFromSemester(sem), cat }));

// Disambiguate repeated titles ("First GBM", "Election Night", …) with the semester.
const allTitles = [...newEvents.map((e) => e.title), ...drafts.map((d) => d.name)];
const repeats = new Set(allTitles.filter((t, i) => allTitles.indexOf(t) !== i));
for (const e of newEvents) if (repeats.has(e.title)) e.title = `${e.title} (${semesterOf(e.date)})`;

sql.push("", "-- New events from Drive photo folders (published)");
for (const e of newEvents) {
  const slug = uniqueSlug(e.title);
  const description = `From the chapter photo archive · ${semesterOf(e.date)}.`;
  sql.push(`INSERT INTO events (slug, title, date, category, description, photo, published) VALUES (${[slug, e.title, e.date, e.category, description, e.cover].map(q).join(", ")}, 1);`);
  for (const x of e.extras) {
    sql.push(`INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, ${q(x.url)}, ${x.sort}, ${q(x.takenAt)} FROM events WHERE slug = ${q(slug)};`);
  }
  report.created++;
  report.photos += 1 + e.extras.length;
}

sql.push("", "-- Events from the attendance/slide records with no photos yet (drafts)");
for (const d of drafts) {
  if (!d.date) { report.skipped.push(`draft ${d.name} (no date)`); continue; }
  const title = repeats.has(d.name) ? `${d.name} (${d.sem})` : d.name;
  const slug = uniqueSlug(title);
  sql.push(`INSERT INTO events (slug, title, date, category, description, photo, published) VALUES (${[slug, title, d.date, SITE_CATEGORY(d.cat, d.name), "", ""].map(q).join(", ")}, 0);`);
  report.drafts++;
}

const out = join(ROOT, "migrations/0004_drive_archive.sql");
writeFileSync(out, sql.join("\n") + "\n");
console.log(`Wrote ${out}`);
console.log(report);
