#!/usr/bin/env node
/**
 * Step 2 of the Drive archive import (local only, no network).
 *
 * Reads import/drive-photos/manifest.json (written by the Chrome download
 * session) and, for each folder:
 *   - derives the event date from the photos' EXIF capture dates (median),
 *     falling back to Drive's created date, then to the crawl's date
 *   - converts every photo to WebP: auto-orient, max 1600px long edge,
 *     quality 80, and -strip (removes GPS location + camera metadata
 *     before anything is published)
 *   - writes import/processed/<slug>/<nn>.webp (00 = cover)
 * and writes import/processed/plan.json for the upload + migration steps.
 *
 * Re-runnable: existing outputs are skipped.
 * Usage: node scripts/process-drive-photos.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const IN = join(ROOT, "import/drive-photos");
const OUT = join(ROOT, "import/processed");
const manifest = JSON.parse(readFileSync(join(IN, "manifest.json"), "utf8"));
const crawl = JSON.parse(readFileSync(join(ROOT, "import/drive-crawl-2026-11-03.json"), "utf8"));
const crawlByName = new Map(crawl.withPhotos.map((e) => [e.name, e]));

/** "2022:11:04 18:32:00" | "2022-11-04T18:32:00" → "2022-11-04" */
function isoDay(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})[:-](\d{2})[:-](\d{2})/);
  if (!m || m[1] < "2010" || m[1] > "2030") return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function median(days) {
  const sorted = [...days].sort();
  return sorted[Math.floor(sorted.length / 2)] ?? null;
}

mkdirSync(OUT, { recursive: true });
const plan = [];

for (const folder of manifest) {
  const crawlEntry = crawlByName.get(folder.name) ?? {};
  const files = [...(folder.files ?? [])].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));
  const outDir = join(OUT, folder.slug);
  mkdirSync(outDir, { recursive: true });

  const photos = [];
  files.forEach((f, i) => {
    const src = join(IN, folder.slug, f.file);
    if (!existsSync(src)) {
      console.warn(`  missing ${folder.slug}/${f.file}, skipped`);
      return;
    }
    const name = `${String(i).padStart(2, "0")}.webp`;
    const dest = join(outDir, name);
    if (!existsSync(dest)) {
      execFileSync("magick", [
        src + "[0]", "-auto-orient", "-resize", "1600x1600>", "-strip", "-quality", "80", dest,
      ]);
    }
    photos.push({ file: name, isCover: i === 0, takenAt: isoDay(f.takenAt) ?? isoDay(f.driveCreated) });
  });

  const exifDays = photos.map((p) => p.takenAt).filter(Boolean);
  const date = median(exifDays) ?? crawlEntry.date ?? null;
  plan.push({
    slug: folder.slug,
    name: folder.suggestedName || folder.name,
    crawlName: folder.name,
    category: crawlEntry.category ?? null,
    semester: crawlEntry.semester ?? null,
    date,
    dateSource: exifDays.length ? "exif" : crawlEntry.date ? "crawl" : "unknown",
    nameVerified: folder.nameVerified ?? null,
    notes: folder.notes ?? "",
    photos,
  });
  console.log(`${folder.slug}: ${photos.length} photos, date ${date ?? "?"} (${plan.at(-1).dateSource})`);
}

writeFileSync(join(OUT, "plan.json"), JSON.stringify(plan, null, 2));
console.log(`\nWrote ${join(OUT, "plan.json")} (${plan.length} folders, ${plan.reduce((n, p) => n + p.photos.length, 0)} photos)`);
