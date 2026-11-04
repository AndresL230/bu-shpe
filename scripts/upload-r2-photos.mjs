#!/usr/bin/env node
/**
 * Step 3 of the Drive archive import: paced, resumable upload of
 * import/processed/<slug>/*.webp to the R2 bucket bu-shpe-media under
 * events/archive/<slug>/<nn>.webp (served at /media/events/archive/...).
 *
 * Pacing: one upload at a time with a delay between files (default 1.5s,
 * ~200 per 5 min) so we stay far below the Cloudflare API's ~1,200
 * requests / 5 min. On failure it backs off (5s, 15s, 45s) then moves on.
 * Every success is appended to import/uploaded-<target>.json, so a re-run
 * skips what's done.
 *
 * Usage:
 *   node scripts/upload-r2-photos.mjs --local                 # dev R2 (wrangler local state)
 *   node scripts/upload-r2-photos.mjs --remote --year 2022    # production, one year at a time
 *   options: --only <slug>  --delay <ms>  --dry-run
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

const target = flag("--remote") ? "remote" : flag("--local") ? "local" : null;
if (!target) {
  console.error("Pass --local or --remote.");
  process.exit(1);
}
const delayMs = Number(opt("--delay") ?? 1500);
const year = opt("--year");
const only = opt("--only");
const dryRun = flag("--dry-run");

const ROOT = new URL("..", import.meta.url).pathname;
const PROCESSED = join(ROOT, "import/processed");
const plan = JSON.parse(readFileSync(join(PROCESSED, "plan.json"), "utf8"));
const logPath = join(ROOT, `import/uploaded-${target}.json`);
const done = new Set(existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : []);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const queue = plan
  .filter((p) => !only || p.slug === only)
  .filter((p) => !year || (p.date ?? "").startsWith(year) || (p.semester ?? "").includes(year))
  .flatMap((p) => p.photos.map((ph) => ({ key: `events/archive/${p.slug}/${ph.file}`, file: join(PROCESSED, p.slug, ph.file) })))
  .filter((j) => !done.has(j.key));

console.log(`${queue.length} files to upload to ${target} R2 (${done.size} already done), ${delayMs}ms apart`);

let ok = 0, failed = 0;
for (const [i, job] of queue.entries()) {
  const cmd = ["wrangler", "r2", "object", "put", `bu-shpe-media/${job.key}`, "--file", job.file, "--content-type", "image/webp", `--${target}`];
  if (dryRun) { console.log("npx " + cmd.join(" ")); continue; }
  let success = false;
  for (const backoff of [0, 5000, 15000, 45000]) {
    if (backoff) { console.log(`  retrying in ${backoff / 1000}s…`); await sleep(backoff); }
    try {
      execFileSync("npx", cmd, { stdio: "pipe", cwd: ROOT });
      success = true;
      break;
    } catch (err) {
      console.warn(`  failed: ${String(err.stderr ?? err.message).split("\n").find((l) => /error|✘/i.test(l)) ?? "unknown error"}`);
    }
  }
  if (success) {
    done.add(job.key);
    writeFileSync(logPath, JSON.stringify([...done], null, 2));
    ok++;
    console.log(`[${i + 1}/${queue.length}] ${job.key}`);
  } else {
    failed++;
    console.error(`[${i + 1}/${queue.length}] GAVE UP on ${job.key}; re-run later to retry`);
  }
  await sleep(delayMs);
}
console.log(`\nDone: ${ok} uploaded, ${failed} failed. Log: ${logPath}`);
