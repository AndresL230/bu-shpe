-- Extra photos per event (the cover stays in events.photo).
-- Used by the event detail page's photo roll and the /gallery grid.
CREATE TABLE event_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,              -- /media/events/... (R2) or /assets/...
  sort       INTEGER NOT NULL DEFAULT 0,
  taken_at   TEXT,                          -- yyyy-mm-dd from EXIF, when known
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (event_id, url)
);
CREATE INDEX idx_event_photos_event ON event_photos(event_id, sort);
