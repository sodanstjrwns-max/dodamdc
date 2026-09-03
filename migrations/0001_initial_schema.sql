-- 서울도담치과 PF Web Engine — initial schema

-- 병원 기본정보 (한 곳에서 수정 → 전체 반영)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 회원 (이메일 + 전화 동시 수집, 마케팅 동의)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT,
  provider TEXT DEFAULT 'local',          -- local | google
  provider_id TEXT,
  agree_privacy INTEGER NOT NULL DEFAULT 1,
  agree_marketing INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',    -- member | admin
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 비포/애프터 케이스
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  treatment_slug TEXT NOT NULL,           -- 진료 카테고리 (treatments 데이터 slug)
  doctor_slug TEXT NOT NULL DEFAULT 'han-hwirim',
  age_group TEXT,                         -- 20대/30대/...
  gender TEXT,                            -- 남성/여성
  region TEXT,                            -- 수원시 팔달구 화서동
  duration TEXT,                          -- 치료 기간
  pano_before TEXT,                       -- R2 key
  pano_after TEXT,
  intra_before TEXT,
  intra_after TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cases_treatment ON cases(treatment_slug);
CREATE INDEX IF NOT EXISTS idx_cases_doctor ON cases(doctor_slug);

-- 원장 칼럼 (SEO 포스팅)
CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  thumbnail TEXT,                         -- R2 key
  author_slug TEXT NOT NULL DEFAULT 'han-hwirim',
  treatment_slug TEXT,                    -- 관련 진료 (인링크)
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT,                              -- comma separated
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_columns_treatment ON columns(treatment_slug);
CREATE INDEX IF NOT EXISTS idx_columns_published ON columns(published, published_at);

-- 공지사항
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,
  image TEXT,                             -- R2 key
  pinned INTEGER NOT NULL DEFAULT 0,      -- 대표 공지
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 예약 접수
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  treatment TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | done | cancelled
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 조회수 로그 (봇 제외 실측)
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  entity_type TEXT,                       -- case | column | notice | page
  entity_id INTEGER,
  is_bot INTEGER NOT NULL DEFAULT 0,
  ua TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

-- 업로드 파일 메타
CREATE TABLE IF NOT EXISTS uploads (
  key TEXT PRIMARY KEY,
  filename TEXT,
  content_type TEXT,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
