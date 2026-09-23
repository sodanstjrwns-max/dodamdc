-- 언론보도 (원장 요청 2026-09-23): 날짜·매체·제목·요약·원문 링크만 보관. 기사 본문은 저작권상 저장하지 않는다.
CREATE TABLE IF NOT EXISTS press (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                     -- YYYY-MM-DD (보도일)
  outlet TEXT NOT NULL,                   -- 매체명
  title TEXT NOT NULL,                    -- 기사 제목
  summary TEXT,                           -- 2~3줄 요약
  url TEXT NOT NULL,                      -- 원문 링크 (https)
  published INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,        -- 같은 날짜 안에서의 순서 (클수록 위)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_press_published_date ON press(published, date DESC, sort DESC);

-- 첫 항목: 스포츠경향 2026-09-23 인터뷰 기사
INSERT INTO press (date, outlet, title, summary, url, published, sort)
SELECT '2026-09-23', '스포츠경향', '치과 과잉진료 걱정된다면…치료 전 ''두 번째 의견'' 들어봐야 하는 이유',
  '치과마다 진단이 다를 수 있는 이유와, 치료를 권유받았을 때 사진·검사 수치로 근거를 확인하는 방법, 두 번째 의견을 받아볼 시점을 한휘림 원장이 설명했습니다.',
  'https://n.news.naver.com/mnews/article/144/0001140027?sid=103', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM press WHERE url = 'https://n.news.naver.com/mnews/article/144/0001140027?sid=103');
