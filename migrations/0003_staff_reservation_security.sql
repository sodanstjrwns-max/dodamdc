CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','reception','editor')),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE security_rate_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_security_rate_expiry ON security_rate_limits(expires_at);
CREATE TABLE staff_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES staff(id),
  action TEXT NOT NULL,
  target_id INTEGER,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE purge_receipts (
  receipt TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE reservations ADD COLUMN assignee_id INTEGER REFERENCES staff(id);
ALTER TABLE reservations ADD COLUMN contact_state TEXT NOT NULL DEFAULT 'uncontacted' CHECK(contact_state IN ('uncontacted','attempted','reached'));
ALTER TABLE reservations ADD COLUMN last_contacted_at TEXT;
ALTER TABLE reservations ADD COLUMN followup_at TEXT;
ALTER TABLE reservations ADD COLUMN updated_at TEXT;
ALTER TABLE reservations ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE reservations ADD COLUMN retention_hold INTEGER NOT NULL DEFAULT 0 CHECK(retention_hold IN (0,1));
CREATE INDEX idx_reservations_workflow ON reservations(status, contact_state, assignee_id, created_at);
CREATE TABLE reservation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES staff(id),
  outcome TEXT NOT NULL,
  before_state TEXT NOT NULL,
  after_state TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reservation_events_reservation ON reservation_events(reservation_id, id);
