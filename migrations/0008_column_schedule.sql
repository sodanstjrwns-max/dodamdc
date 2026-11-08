-- 2026-11-08 칼럼 자동 등록 API: 예약 발행 시각(UTC 'YYYY-MM-DD HH:MM:SS').
-- published=0 이고 scheduled_at 이 지나면 공개 요청 처리 중 published=1 로 바뀐다(src/routes/column-api.ts publishDueColumns).
ALTER TABLE columns ADD COLUMN scheduled_at TEXT;
CREATE INDEX IF NOT EXISTS idx_columns_scheduled ON columns(published, scheduled_at);
