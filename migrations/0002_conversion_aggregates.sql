-- No visitor, patient, IP, UA, referrer, form values or query-string columns.
CREATE TABLE IF NOT EXISTS conversion_daily (
  day TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('production', 'preview')),
  page TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('naver_click', 'phone_click', 'kakao_click', 'reservation_click', 'form_completed')),
  location TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, scope, page, event, location)
);
-- One-way random per-render/action receipts, not user or session identifiers.
-- These cannot be joined to the daily aggregates. Expire with the 30-minute ticket.
CREATE TABLE IF NOT EXISTS conversion_receipts (
  receipt TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversion_receipts_expiry ON conversion_receipts(expires_at);
