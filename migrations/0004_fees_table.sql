-- ==========================================================================
-- 비급여 수가(진료비) 테이블 — 스키마 + 인덱스
-- 시드 데이터는 0005로 분리 (D1이 동일 트랜잭션에서 새 컬럼을 인식하지 못하는 이슈 우회)
-- 기존 하드코딩 데이터(src/data/pricing.ts) 구조를 그대로 담는다.
--   group_id(=fragment 앵커, /pricing#id 및 treatmentPricingUrl 딥링크와 일치)
--   group_name(=분류 표시명) / group_desc(=분류 설명, 선택)
--   name(=항목명) / price(=금액, NULL 이면 '상담 후 안내') / unit(=단위) / note(=비고)
--   is_published(=공개/비공개, 기본 공개) / sort_group·sort_order(=정렬)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS fees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id      TEXT    NOT NULL,
  group_name    TEXT    NOT NULL,
  group_desc    TEXT,
  name          TEXT    NOT NULL,
  price         INTEGER,
  unit          TEXT,
  note          TEXT,
  is_published  INTEGER NOT NULL DEFAULT 1,
  sort_group    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fees_group_order ON fees(sort_group, sort_order);
CREATE INDEX IF NOT EXISTS idx_fees_published   ON fees(is_published);
