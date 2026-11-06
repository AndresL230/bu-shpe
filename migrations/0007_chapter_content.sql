-- Chapter content that used to live in src/data/*.json, now edited from /admin
-- (and the bu-shpe-events MCP). SHPE years run Aug–Jul and are stored as the
-- starting calendar year (2026 = "26-27"); see src/lib/shpe-year.ts.
-- The JSON files stay in the repo for the hidden "classic" page variants.
-- Idempotent: tables use IF NOT EXISTS and seeds only run on an empty table.

-- Partners & sponsors, one row per company per SHPE year (renewed yearly,
-- like board terms). The site shows the newest year that has partners.
CREATE TABLE IF NOT EXISTS partners (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  shpe_year  INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  logo       TEXT    NOT NULL DEFAULT '',   -- /assets/... or /media/partners/...
  url        TEXT    NOT NULL DEFAULT '',
  tier       TEXT    NOT NULL DEFAULT '',   -- '' | Platinum | Gold | Silver | Bronze
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_partners_year ON partners(shpe_year, sort);

-- Where members and alumni work ("Where SHPE takes us"), grouped by industry.
-- Industries appear in the order of their lowest-sorted company.
CREATE TABLE IF NOT EXISTS employers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  industry   TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  domain     TEXT    NOT NULL DEFAULT '',   -- used to fetch a logo when none is uploaded
  logo       TEXT    NOT NULL DEFAULT '',
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_employers_sort ON employers(sort);

-- National Convention delegation record (/conferences/record), one per year.
-- year = convention calendar year; its SHPE year is the same (fall convention).
CREATE TABLE IF NOT EXISTS convention_records (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  year              INTEGER NOT NULL UNIQUE,
  city              TEXT    NOT NULL,
  region            TEXT    NOT NULL DEFAULT 'National Convention',
  description       TEXT    NOT NULL DEFAULT '',
  photos            TEXT    NOT NULL DEFAULT '[]',  -- JSON array of paths
  headcount         INTEGER NOT NULL DEFAULT 0,     -- 0 = unknown
  outcomes          TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
  quote_text        TEXT    NOT NULL DEFAULT '',
  quote_attribution TEXT    NOT NULL DEFAULT '',
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Volunteering programs (/volunteering). shpe_year NULL = ongoing / not dated.
CREATE TABLE IF NOT EXISTS volunteering_programs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  photos      TEXT    NOT NULL DEFAULT '[]',  -- JSON array of paths
  shpe_year   INTEGER,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_volunteering_sort ON volunteering_programs(sort);

-- seed partners
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'BU College of Engineering', '/assets/sponsors/bu-college-of-engineering.jpg', 'https://www.bu.edu/eng/', '', 10 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 0);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'BU Student Activities Office', '/assets/sponsors/bu-sao.png', 'https://www.bu.edu/sao/', '', 20 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 1);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'Capital One', '/assets/sponsors/capital-one.png', 'https://www.capitalonecareers.com/', '', 30 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 2);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'Brooks', '/assets/sponsors/brooks.png', 'https://www.brooksrunning.com/', '', 40 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 3);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'General Electric', '/assets/sponsors/general-electric.png', 'https://www.ge.com/', '', 50 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 4);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'Akamai', '/assets/sponsors/akamai.png', 'https://www.akamai.com/', '', 60 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 5);
INSERT INTO partners (shpe_year, name, logo, url, tier, sort) SELECT 2026, 'Vertex', '/assets/sponsors/vertex.png', 'https://www.vrtx.com/', '', 70 WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1 OFFSET 6);

-- seed employers
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Aerospace & Defense', 'Boeing', 'boeing.com', '/assets/employers/boeing.svg', 10 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 0);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Aerospace & Defense', 'Raytheon', 'rtx.com', '', 20 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 1);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Aerospace & Defense', 'NASA', 'nasa.gov', '', 30 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 2);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Aerospace & Defense', 'JPL', 'jpl.nasa.gov', '', 40 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 3);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Aerospace & Defense', 'Lockheed Martin', 'lockheedmartin.com', '/assets/employers/lockheed-martin.svg', 50 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 4);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Technology', 'Google', 'google.com', '', 60 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 5);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Technology', 'Microsoft', 'microsoft.com', '', 70 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 6);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Technology', 'Amazon', 'amazon.com', '', 80 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 7);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Technology', 'Akamai', 'akamai.com', '/assets/sponsors/akamai.png', 90 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 8);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Technology', 'Tesla', 'tesla.com', '', 100 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 9);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Energy', 'General Electric', 'ge.com', '/assets/sponsors/general-electric.png', 110 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 10);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Energy', 'Eversource', 'eversource.com', '/assets/employers/eversource.png', 120 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 11);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Energy', 'Schlumberger', 'slb.com', '', 130 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 12);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Energy', 'NextEra Energy', 'nexteraenergy.com', '/assets/employers/nextera-energy.svg', 140 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 13);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Biotech & Health', 'Vertex', 'vrtx.com', '/assets/sponsors/vertex.png', 150 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 14);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Biotech & Health', 'Moderna', 'modernatx.com', '', 160 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 15);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Biotech & Health', 'Genentech', 'gene.com', '', 170 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 16);
INSERT INTO employers (industry, name, domain, logo, sort) SELECT 'Biotech & Health', 'Pfizer', 'pfizer.com', '', 180 WHERE NOT EXISTS (SELECT 1 FROM employers LIMIT 1 OFFSET 17);

-- seed convention_records
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2026, 'Indianapolis, IN', 'National Convention', 'October 28–31, under the convention''s “STEM for the Bold” banner. The delegation suited up for the convention floor, lined up behind the giant FAMILIA letters, and closed a night in Indianapolis over deep-dish pizza.', '["/assets/conferences/national-convention-2026-indianapolis-familia-sign.jpg"]', 0, '[]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 0);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2025, 'Philadelphia, PA', 'National Convention', 'BU SHPE members joined the national familia in Philadelphia for the convention''s career fair, workshops and networking.', '[]', 0, '[]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 1);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2024, 'Anaheim, CA', 'National Convention', 'BU SHPE members traveled to Anaheim for the convention''s career fair, workshops and networking.', '[]', 0, '[]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 2);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2023, 'Salt Lake City, UT', 'National Convention', 'Members received interviews and offers, attended professional-growth workshops, and deepened bonds within the BU-SHPE familia.', '["/assets/conferences/national-convention-2023-slc.jpeg"]', 0, '["National STEM career fair — 150+ recruiters", "Technical workshops + onsite interviews"]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 3);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2022, 'Charlotte, NC', 'National Convention', 'Two-day career fair, technical workshops, and onsite interviews with the country''s largest gathering of Hispanic STEM professionals.', '["/assets/conferences/national-convention-2022-charlotte.jpg"]', 0, '["Two-day national career fair", "Technical workshops + onsite interviews"]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 4);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2021, 'Orlando, FL', 'National Convention', 'November 10–14 at the Orange County Convention Center, the first in-person nationals after SHPE''s fully virtual 2020 convention. A masked delegation lined up behind the FAMILIA letters and worked the career fair floor.', '["/media/events/archive/national-convention-2021/01.webp"]', 0, '[]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 5);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2019, 'Phoenix, AZ', 'National Convention', 'October 30 – November 3 at the Phoenix Convention Center. The delegation flew out together, lined up at the FAMILIA letters, and came home with a podium finish in the Cyber Security Challenge.', '["/media/events/archive/national-convention-2019/04.webp"]', 0, '["Cyber Security Challenge — 2nd place ($500)"]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 6);
INSERT INTO convention_records (year, city, region, description, photos, headcount, outcomes, quote_text, quote_attribution) SELECT 2018, 'Cleveland, OH', 'National Convention', 'November 7–11 at the Huntington Convention Center, under the theme “Better Together.” The delegation posed in business attire behind the FAMILIA letters.', '["/media/events/archive/jen-unlabeled/00.webp"]', 0, '[]', '', '' WHERE NOT EXISTS (SELECT 1 FROM convention_records LIMIT 1 OFFSET 7);

-- seed volunteering_programs
INSERT INTO volunteering_programs (name, description, photos, shpe_year, sort) SELECT 'Museum of Science — Women''s History Month', 'Hosted a hands-on station teaching kids about science and engineering during Women''s History Month programming.', '["/assets/volunteering/museum-of-science-1.jpeg", "/assets/volunteering/museum-of-science-2.jpeg"]', NULL, 10 WHERE NOT EXISTS (SELECT 1 FROM volunteering_programs LIMIT 1 OFFSET 0);
INSERT INTO volunteering_programs (name, description, photos, shpe_year, sort) SELECT 'Swipes for Boston', 'Student-led project feeding the unhoused — ''Rhetty-to-Go'' meals distributed in Kenmore and Back Bay.', '["/assets/volunteering/swipes-for-boston.jpg"]', NULL, 20 WHERE NOT EXISTS (SELECT 1 FROM volunteering_programs LIMIT 1 OFFSET 1);
INSERT INTO volunteering_programs (name, description, photos, shpe_year, sort) SELECT 'Greater Boston Food Bank', 'Sorted 16,000 lbs of food in three hours and got a private tour. GBFB''s goal: a hunger-free Greater Boston by 2028.', '[]', NULL, 30 WHERE NOT EXISTS (SELECT 1 FROM volunteering_programs LIMIT 1 OFFSET 2);
