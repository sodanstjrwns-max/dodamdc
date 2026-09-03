# 서울도담치과의원 홈페이지 (webapp)

## Project Overview
- **Name**: 서울도담치과의원 공식 홈페이지 (수원시 팔달구 화서동 · 한휘림 대표원장)
- **Goal**: 의료광고법 준수 + SEO/AEO 최적화 + 회원 전용 치료 전후 열람 + 관리자 CMS를 갖춘 고급 인터랙티브 치과 웹사이트
- **Tech**: Hono v4 + TypeScript · Cloudflare Pages · D1(SQLite) · R2 · Vite · Vanilla JS/CSS (Pretendard, #006AB5 / #2FA37A)

## URLs
- **Sandbox (dev)**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai
- **Production**: 미배포 (배포 경로 선택 필요 — BYOK Cloudflare / Genspark Hosted)
- **Admin**: `/admin/login` (기본 비밀번호 `.dev.vars` → `ADMIN_PASSWORD`)

## Completed Features
- 홈(히어로·기둥·핵심진료 스티키 시퀀스·카운트업·의료진·리뷰 밴드·최신 칼럼·방문 안내), 병원미션, 진료실/장비 안내(19개 장비)
- 진료 12과목 상세(요약박스/단계/비교표/부작용/관련사례/FAQ/백과 자동 인링크), 의료진 상세
- 치과 용어 백과 512개(DefinedTerm LD, 자동 인링크), 통합 FAQ(검색/필터, FAQPage LD), 진료비 고지(의료법 45조)
- 지역 SEO 페이지 `/area/[지역]-[진료]`, 오시는 길(지도·네이버/카카오/구글 링크), 진료시간
- 회원가입/로그인(PBKDF2 + HMAC HttpOnly 세션), Google OAuth(환경변수 설정 시), 마이페이지, 탈퇴
- 치료 전후 사례: 4개 사진 슬롯, **After 사진 3중 게이팅(SSR/API/R2 이미지 401)**, 비교 슬라이더, 지역 자동완성
- 원장 칼럼(SEO 에디터, 드래그드롭 이미지, Article LD, RSS), 공지(대표 고정), 예약(D1 + Resend 메일, 허니팟)
- 관리자: 대시보드·기본정보 편집·사례/칼럼/공지 CRUD·예약 상태·회원·통계(봇 제외 조회)
- SEO/AEO: 고유 title/meta/canonical, JSON-LD(Dentist/Physician/MedicalProcedure/FAQPage/Breadcrumb/Article/Speakable/DefinedTerm), `sitemap.xml`, `robots.txt`(AI 봇 허용), `llms.txt`, `_headers`, webmanifest
- 리뷰 표기 고정 문구: "네이버 방문자 리뷰 782개 (2026년 8월 기준)" — 관리자 기본정보에서 수정 가능

## Functional Entry Points
| Path | 설명 |
|---|---|
| `/`, `/mission`, `/floor-guide`, `/doctors[/:slug]` | 소개 |
| `/treatments[/:slug]`, `/faq`, `/encyclopedia[/:slug]`, `/pricing` | 진료 정보 |
| `/directions`, `/hours`, `/area[/:slug]` | 안내/지역 |
| `/cases/gallery[/:slug]?treatment=&doctor=&page=` | 치료 전후 |
| `/column[/:slug]?treatment=&page=`, `/column/rss.xml`, `/notice[/:id]` | 콘텐츠 |
| `/reservation` (GET/POST) | 예약 |
| `/auth/register|login|logout|google|mypage|delete` | 회원 |
| `/admin/*` (`settings, cases, columns, notices, reservations, members, stats, api/upload`) | 관리자 |
| `/files/*` | R2 파일 (`cases/*/(pano|intra)_after*` 로그인 필수) |
| `/api/regions?q=` | 지역 자동완성 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/site.webmanifest`, `/health` | SEO/시스템 |

## Data Architecture
- **D1 (`DB`)**: `site_settings`, `users`, `cases`, `columns`, `notices`, `reservations`, `page_views`, `uploads` — `migrations/0001_initial_schema.sql`
- **R2 (`R2`)**: 업로드 이미지 (`cases/<id>/…`, `columns/…`, `notices/…`)
- **정적 데이터**: `src/data/` (clinic, doctors, treatments, encyclopedia 512, pricing, areas)
- **환경변수** (`.dev.vars` / Cloudflare secrets): `ADMIN_PASSWORD`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL`, `SITE_URL`

## Local Development
```bash
npm run build
npx wrangler d1 migrations apply webapp-production --local
npx wrangler d1 execute webapp-production --local --file=./seed.sql   # 샘플 칼럼/공지
pm2 start ecosystem.config.cjs   # wrangler pages dev dist --local (바인딩은 wrangler.jsonc)
curl http://localhost:3000
```

## Not Yet Implemented / Next Steps
1. **프로덕션 배포** — BYOK(cf-byok-deploy) 또는 Genspark Hosted(gsk-hosted-deploy) 선택 후 D1/R2 생성, secrets 등록, 마이그레이션
2. Google OAuth 클라이언트 발급 및 `GOOGLE_CLIENT_ID/SECRET` 설정, Resend 도메인 인증
3. 실제 치료 전후 사진·원장 칼럼 등록(관리자), 네이버 지도 SDK 키(현재 Google Maps embed)
4. GA4/GSC 코드 → 관리자 기본정보에서 입력
5. 브라우저 실기기 QA(모바일 GNB·슬라이더·에디터) 및 Lighthouse 점검

## Deployment
- **Platform**: Cloudflare Pages (Hono) · **Status**: 🟡 Sandbox only · **Last Updated**: 2026-09-03
