# 서울도담치과의원 홈페이지 (webapp)

## Project Overview
- **Name**: 서울도담치과의원 공식 홈페이지 (한휘림 대표원장 · 수원시 팔달구 화서동)
- **Goal**: bdbddc.com 급 인터랙티브 병원 홈페이지 — 의료광고법 준수, SEO/AEO 최적화, 회원제 치료 전후 사진, 예약, 관리자 CMS
- **Tech Stack**: Hono v4 + TypeScript + Cloudflare Pages/Workers, D1(SQLite), R2, Vanilla JS/CSS (Pretendard, 브랜드 블루 #006AB5 / 그린 #2FA37A)

## URLs
- **Sandbox (개발 미리보기)**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai
- **Production**: https://seoul-dodam-dental.pages.dev (Cloudflare Pages, BYOK · 계정 sodanstjrwns@gmail.com)
- **관리자**: `/admin/login` (비밀번호는 `.dev.vars`의 `ADMIN_PASSWORD`)

## 완료된 기능
- 페이지: `/`, `/mission`, `/doctors`, `/doctors/:slug`, `/treatments`, `/treatments/:slug`(임플란트·VPT·크라운·신경치료·잇몸·사랑니·미백 등), `/cases/gallery`, `/cases/:slug`, `/column`, `/column/:slug`, `/encyclopedia`(500+ 용어, 자동 인링크), `/faq`, `/pricing`, `/notice`, `/directions`, `/hours`, `/floor-guide`, `/reservation`, `/area/:region-:treatment`, 커스텀 404
- 회원: `/auth/register`(개인정보·마케팅 동의), `/auth/login`, Google OAuth, HMAC HttpOnly 세션, `/auth/mypage`
- 치료 전후: 사진 4슬롯, **AFTER 사진 로그인 게이팅(API·이미지 `/files/*`·SSR 3중)**, `x-robots-tag: noindex`, BA 슬라이더, 거주지역 자동완성
- 관리자 `/admin/*`: 대시보드, 치료전후·칼럼·공지(고정) CRUD, 리치 에디터(드래그·붙여넣기 이미지 업로드→R2, H2/H3/굵게/목록/링크, 글자·이미지·H2 카운터), 회원·예약 관리, 기본정보 편집, 봇 제외 조회통계
- 예약: D1 저장 + Resend 알림 메일
- SEO/AEO: JSON-LD(Dentist/FAQ/Article/Breadcrumb), `sitemap.xml`(DB 연동), `robots.txt`(AI 봇 허용), `llms.txt`, `_headers`, `site.webmanifest`
- 의료광고법 필터: 최상급·할인·단정 표현 없음(스윕 완료), 리뷰 수 표기 "네이버 방문자 리뷰 782개 (2026년 8월 기준)"
- 디자인: 스크롤 리빌/스태거/카운트업/스티키 시퀀스, `prefers-reduced-motion`, 모바일 가로 스크롤 0

## Data Architecture
- **D1 (binding `DB`, `seoul-dodam-dental-production`)**: users, sessions, cases, columns, notices, reservations, page_views, settings, encyclopedia inlink
- **R2 (binding `R2`, `seoul-dodam-dental-bucket`)**: 업로드 이미지 (`cases/before/*`, `cases/after/*`(게이팅), `columns/*`)
- **Migrations**: `migrations/0001_initial_schema.sql`, 시드 `seed.sql`

## 로컬 실행
```bash
npm run build
npx wrangler d1 migrations apply seoul-dodam-dental-production --local
pm2 start ecosystem.config.cjs      # wrangler pages dev dist --local --port 3000
```
테스트 계정: `member2@example.com / Passw0rd!23` (AFTER 사진 확인용)

## 프로덕션 후속 설정
1. Google OAuth: 콘솔에서 리디렉션 URI `https://seoul-dodam-dental.pages.dev/auth/google/callback` 등록 후 `wrangler pages secret put GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET`
2. Resend: 도메인 인증 후 `wrangler pages secret put RESEND_API_KEY`
3. 커스텀 도메인: `npx wrangler pages domain add <도메인> --project-name seoul-dodam-dental` 후 SITE_URL 시크릿 교체

## 미구현 / 다음 단계
- 실제 병원 사진·의료진 사진 교체(현재 플레이스홀더), 실제 비급여 비용표 검수
- 테스트 데이터 정리(`vpt-crown-20260903-test`, test@example.com)
- 프로덕션 배포 및 커스텀 도메인 연결

## Deployment
- **Platform**: Cloudflare Pages (프로젝트 `seoul-dodam-dental`) · **Status**: ✅ Active · **Last Updated**: 2026-09-03
- **D1**: `seoul-dodam-dental-production` (355781fd-…) · **R2**: `seoul-dodam-dental-bucket`
- **Secrets 설정됨**: ADMIN_PASSWORD, SESSION_SECRET, NOTIFICATION_EMAIL, SITE_URL · **미설정**: GOOGLE_CLIENT_ID/SECRET(구글 로그인), RESEND_API_KEY(예약 알림 메일)
- **재배포**: `npm run build && npx wrangler pages deploy dist --project-name seoul-dodam-dental --branch main`
