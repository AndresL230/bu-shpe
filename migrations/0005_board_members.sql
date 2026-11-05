-- E-board roster, one row per person per academic year (term = "2026–2027").
-- Edited from /admin/board; /about/board shows the latest term (older terms
-- stay viewable via ?term=). Empty strings = "not filled in yet" and are hidden.
CREATE TABLE board_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  term       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  role       TEXT    NOT NULL,
  major      TEXT    NOT NULL DEFAULT '',
  class_year TEXT    NOT NULL DEFAULT '',
  hometown   TEXT    NOT NULL DEFAULT '',
  bio        TEXT    NOT NULL DEFAULT '',
  photo      TEXT    NOT NULL DEFAULT '',  -- /media/board/... (R2) or /assets/...; '' = placeholder
  is_advisor INTEGER NOT NULL DEFAULT 0,
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_board_members_term ON board_members(term, sort);

INSERT INTO board_members (term, name, role, sort, is_advisor, major, hometown, bio, photo) VALUES
  ('2026–2027', 'Kiefer Valenzuela',  'President',                     10, 0, '', '', '', '/media/board/2026/6ldQkBBm7dC8DJkV.jpg'),
  ('2026–2027', 'Rogelio Carbajal',   'VP of Internal Affairs',        20, 0, '', '', '', '/media/board/2026/kLChex8m9RdLHPOd.jpg'),
  ('2026–2027', 'Thomas Idrobo',      'VP of External Affairs',        30, 0, '', '', '', '/media/board/2026/f5VgbADBH_jw1YBi.jpg'),
  ('2026–2027', 'Glynnis Barron',     'Treasurer',                     40, 0, '', '', '', ''),
  ('2026–2027', 'Francisco Molina',   'Secretary',                     50, 0, '', '', '', '/media/board/2026/pp0gT1NXqevXjzqH.jpg'),
  ('2026–2027', 'Michelle Aponte',    'SHPEtina Representative',       60, 0, '', '', '', '/media/board/2026/0GZOjPHh9UiB7AnM.jpg'),
  ('2026–2027', 'Fer Rodriguez',      'Director of Public Relations',  70, 0, '', '', '', ''),
  ('2026–2027', 'Anthony Capraru',    'Event Coordinator',             80, 0, '', '', '', ''),
  ('2026–2027', 'Andres Lopez',       'Webmaster',                     90, 0, '', '', '', '/media/board/2026/07ZDWGK_aBInwo0h.jpg'),
  ('2026–2027', 'Ana Rodriguez',      'Underclassman Representative', 100, 0, '', '', '', ''),
  ('2026–2027', 'Enrique Gutierrez-Wing, Ph.D.', 'Faculty Advisor',   900, 1, 'Faculty', 'Boston, MA',
   'Faculty Advisor to SHPE-BostonU. Contact: esgw@bu.edu.', '');
