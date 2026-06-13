-- D1 schema for the MBR booking backend.
-- Apply with:  npx wrangler d1 execute mbr-bookings --file=./schema.sql --remote

CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_date   TEXT    NOT NULL,           -- YYYY-MM-DD
  slot_window INTEGER NOT NULL,           -- 0..5 (arrival-window index)
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  address     TEXT    NOT NULL,
  service     TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL,
  -- One booking per window per day → prevents double-booking.
  UNIQUE (slot_date, slot_window)
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (slot_date);
