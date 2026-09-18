-- Web Push 구독 (관리자 기기별 예약 알림)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  label TEXT,
  staff_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_ok_at DATETIME,
  fail_count INTEGER DEFAULT 0
);
