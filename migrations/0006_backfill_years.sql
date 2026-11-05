-- Year backfill: put every year the chapter has photos for on the logbook.
--
-- * 2026 National Convention (Indianapolis): real delegation photos replace
--   the 2022 stand-in cover; copy moves from future to past tense.
--   Photos live in the repo (public/assets/conferences/), not R2.
-- * 2024 / 2025 National Conventions (known only from the Drive attendance
--   records): date corrected to the official convention start date
--   (Anaheim Oct 30 – Nov 3, 2024; Philadelphia Oct 29 – Nov 1, 2025, per
--   shpe.org) and location added. No photos exist; published state untouched.
-- * New archive events for photos already uploaded to R2 under
--   events/archive/<folder>/ (both local and remote buckets) that
--   0004_drive_archive.sql skipped because they sat in mixed "loose" folders.
--   Dates are the photos' EXIF dates; names come from signage in the photos.
-- * Existing photo-less events whose date matches a loose-folder photo get
--   those photos (First GBM Spring 2022, Marshmallow Tower).
--
-- Idempotent: inserts use OR IGNORE / NOT EXISTS, updates are keyed by slug.

-- 2026 National Convention ------------------------------------------------
UPDATE events SET
  photo = '/assets/conferences/national-convention-2026-indianapolis-familia-sign.jpg',
  location = 'Indianapolis, IN',
  description = 'Indianapolis, IN. The chapter''s delegation spent October 28–31 at the largest gathering of Hispanic STEM students and professionals in the country, under the convention''s “STEM for the Bold” banner.',
  body = 'The delegation suited up for the convention floor and lined up behind the giant FAMILIA letters in front of the “STEM for the Bold” wall, then closed a night in Indianapolis over deep-dish pizza.

Thinking about going next year? Start at the conferences page — cost, funding, and eligibility are all documented there.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'shpe-national-convention-2026';
INSERT OR IGNORE INTO event_photos (event_id, url, sort) SELECT id, '/assets/conferences/national-convention-2026-indianapolis-familia-sign-candid.jpg', 1 FROM events WHERE slug = 'shpe-national-convention-2026';
INSERT OR IGNORE INTO event_photos (event_id, url, sort) SELECT id, '/assets/conferences/national-convention-2026-indianapolis-deep-dish-dinner.jpg', 2 FROM events WHERE slug = 'shpe-national-convention-2026';

-- 2024 / 2025 National Conventions (attendance records, no photos) --------
UPDATE events SET date = '2024-10-30', location = 'Anaheim, CA', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'national-convention-2024-anaheim';
UPDATE events SET date = '2025-10-29', location = 'Philadelphia, PA', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'national-convention-2025-philadelphia';

-- Fall 2018 (Drive "Jen_ (unlabeled)" folder) -----------------------------
-- Delegation at the "SHPE 2018 Better Together National Convention ·
-- Cleveland, OH · November 7–11" step-and-repeat.
INSERT INTO events (slug, title, date, category, description, photo, location, published)
SELECT 'shpe-national-convention-2018', 'SHPE National Convention 2018', '2018-11-07', 'Conference',
       'Cleveland, OH · “Better Together.” From the chapter photo archive · Fall 2018.',
       '/media/events/archive/jen-unlabeled/00.webp', 'Cleveland, OH', 1
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'shpe-national-convention-2018');
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/jen-unlabeled/06.webp', 1, NULL FROM events WHERE slug = 'shpe-national-convention-2018';

-- "2018 SHPE Boston Sub-Region Summit" sign in frame; EXIF 2018-09-29.
INSERT INTO events (slug, title, date, category, description, photo, published)
SELECT 'shpe-boston-sub-regional-summit-2018', 'SHPE Boston Sub-Regional Summit 2018', '2018-09-29', 'Conference',
       'From the chapter photo archive · Fall 2018.',
       '/media/events/archive/jen-unlabeled/05.webp', 1
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'shpe-boston-sub-regional-summit-2018');

-- SHPE tabling under the Boston University banner; EXIF 2018-09-08 (same
-- early-September outdoor tabling as Splash 2022).
INSERT INTO events (slug, title, date, category, description, photo, published)
SELECT 'splash-2018', 'Splash 2018', '2018-09-08', 'Social',
       'From the chapter photo archive · Fall 2018.',
       '/media/events/archive/jen-unlabeled/02.webp', 1
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'splash-2018');

-- Spring 2019 (Drive "2018-2019" loose photos) ----------------------------
-- Washington, DC trip, EXIF 2019-02-28 – 03-01: SHPE Region 4 RLDC
-- ("Shaping Cornerstones", Washington, DC, Feb 28 – Mar 3, 2019).
INSERT INTO events (slug, title, date, category, description, photo, location, published)
SELECT 'regional-leadership-development-conference-rldc-2019', 'Regional Leadership Development Conference (RLDC) 2019', '2019-02-28', 'Conference',
       'Washington, DC. From the chapter photo archive · Spring 2019.',
       '/media/events/archive/2018-19-loose-photos/04.webp', 'Washington, DC', 1
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'regional-leadership-development-conference-rldc-2019');
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/2018-19-loose-photos/01.webp', 1, '2019-03-01' FROM events WHERE slug = 'regional-leadership-development-conference-rldc-2019';
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/2018-19-loose-photos/00.webp', 2, '2019-03-01' FROM events WHERE slug = 'regional-leadership-development-conference-rldc-2019';

-- Spring 2022 (Drive "Random 2021-22") -> existing photo-less events --------
-- Classroom meeting with a SHPE slide, EXIF 2022-01-27 = First GBM (Spring 2022).
UPDATE events SET photo = '/media/events/archive/random-2021-22/00.webp', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'first-gbm-spring-2022' AND photo = '';
-- Spaghetti-and-marshmallow tower build, EXIF 2022-02-24 = Marshmallow Tower (Eng Week).
UPDATE events SET photo = '/media/events/archive/random-2021-22/03.webp', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug = 'marshmallow-tower-eng-week' AND photo = '';
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/random-2021-22/05.webp', 1, '2022-02-24' FROM events WHERE slug = 'marshmallow-tower-eng-week';
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/random-2021-22/06.webp', 2, '2022-02-24' FROM events WHERE slug = 'marshmallow-tower-eng-week';
INSERT OR IGNORE INTO event_photos (event_id, url, sort, taken_at) SELECT id, '/media/events/archive/random-2021-22/01.webp', 3, '2022-02-24' FROM events WHERE slug = 'marshmallow-tower-eng-week';
