-- Core schema: events, admin allowlist, sessions, mailing list, campaigns.
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  date        TEXT    NOT NULL,               -- ISO yyyy-mm or yyyy-mm-dd
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  body        TEXT,
  photo       TEXT    NOT NULL DEFAULT '',     -- /assets/events/... or /media/events/...
  location    TEXT,
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_events_date ON events(date DESC);

CREATE TABLE admins (
  email      TEXT PRIMARY KEY COLLATE NOCASE,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','editor')),
  added_by   TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sessions (
  id         TEXT    PRIMARY KEY,             -- SHA-256 hex of the cookie token
  email      TEXT    NOT NULL COLLATE NOCASE,
  name       TEXT,
  picture    TEXT,
  expires_at INTEGER NOT NULL,                -- unix ms
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_email ON sessions(email);

CREATE TABLE subscribers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  first_name        TEXT,
  last_name         TEXT,
  status            TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  source            TEXT NOT NULL DEFAULT 'website',  -- website | admin | import
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unsubscribed_at   TEXT
);

CREATE TABLE campaigns (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,              -- plain text / light markdown as authored
  sent_by         TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','partial','failed')),
  error           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  sent_at         TEXT
);

INSERT INTO admins (email, name, role, added_by)
VALUES ('andreslopez.23061@gmail.com', 'Andres Lopez', 'owner', 'seed');
