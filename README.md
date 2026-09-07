# 서울도담치과의원 홈페이지 (webapp)

## 프로젝트와 배포 상태
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 자연치아 보존 철학을 담은 브랜드 홈페이지와 환자 중심 진료·예약 안내
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2. Vanilla JS, GSAP/ScrollTrigger, Three.js WebGL.
- **경로 / 브랜치**: `/home/user/webapp` / `main`
- **최근 변경**: 2026-09-07 상황별 바로가기, 첫 방문 안내, 핵심 진료 상담 가이드, 개인정보 없는 전환 집계
- **미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/?v=13
- **첫 방문 안내**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/first-visit
- **기존 운영 주소**: https://seoul-dodam-dental.pages.dev
- **운영 반영**: 미배포. 운영 D1/R2, 도메인, Search Console·네이버 등록/제출을 변경하지 않았습니다. 이번 migration은 로컬에만 적용했습니다.
- 미리보기는 임시 서비스입니다. 배포 요청 시 사용자 Cloudflare와 Genspark Hosted 중 경로를 확인해야 합니다.

## 승인된 방향과 유지한 기능
신청서 XLSX의 서울도담치과 / 한휘림 원장 행과 홈페이지 제작 회신 PDF를 대조한 기존 방향을 유지합니다. 원문 자료는 `.artifacts/`에만 보관하며 공개 자산이나 Git에 포함하지 않습니다.

| 근거 | 방향 |
| --- | --- |
| 신청서 Q24 | 깔끔·모던, 따뜻·친근 |
| 신청서 Q25 + 회신 A9 | 블루 메인 + 자연을 상징하는 그린 포인트 |
| 신청서 Q23 + 회신 A5 | 이해될 때까지 설명하고, 필요한 만큼만 치료합니다 |
| 신청서 Q12–13 + 회신 A1 | VPT·크라운 → 치주치료 → 보존 불가 시 임플란트 |
| 회신 진료 철학 | 치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다 |
| 회신 A3 | 통증에 예민한 원장, 충분한 설명과 세심한 배려 |
| 회신 A6 | 도입 예정 장비를 실제 보유 장비로 표시하지 않음 |

“내 치아를 위한 조금 다른 생각, 도담”, Wanted Sans, 보호 고리와 `#0069B3`·`#B9E7A6`의 구체적 색상값은 디자인 해석입니다. 원장의 직접 지정 문구·서체·HEX로 표시하지 않습니다.

- 입체 치아·보호 고리, 마우스/펜 회전, 모바일 회전 버튼, 모션 토글, reduced-motion, SVG fallback.
- GSAP 스크롤과 PC 가로 갤러리, 모바일 네이티브 갤러리. 브라우저 스크롤을 가로채지 않습니다.
- 공통 헤더·푸터, 현재 메뉴, 진료 상세 reading-nav, FAQ·목차·44px 주요 조작 버튼.
- 회원·관리자 CMS, 기존 홈페이지 신청, 치료 후 사진의 서버 로그인 검사.
- 실제 사진 22장과 작은 WebP 22장. 원장 사진 크롭과 장비 매칭을 교정했으며 얼굴을 생성·변형하지 않았습니다. 실제 실내 촬영 원본을 사용하며 AI-retouched interior 폴더 사진을 사용하지 않습니다.
- 사진 재생성: `DODAM_PHOTO_SOURCE=/path/to/supplied/originals node scripts/process-images.mjs`. 기본 원본 경로는 `/home/user/dodam_src`; 원본은 Git 제외.
- 가짜 후기·사례·통계·게시물 추가 없음. 지도 좌표·주차 정보의 외부 자료와 차이, 원장 영상은 이번 선택 범위가 아니므로 수정하지 않았습니다.

## 이번 환자 동선 보강
### 상황별 바로가기
메인과 `/treatments`의 `#patient-situations`에서 다음 안내로 연결합니다.
1. 신경치료를 권유받았어요 → `/treatments/vpt-crown#consultation-guide`
2. 잇몸에서 피가 나요 → `/treatments/periodontal#consultation-guide`
3. 치아를 빼야 한다고 들었어요 → `/treatments/implant#consultation-guide`
4. 마취가 무서워요 → `/first-visit#anxiety`
5. 검진·스케일링을 받고 싶어요 → `/treatments/preventive#summary`

일반 링크 기반으로 JS 없이도 사용합니다. 진단·치료 추천 엔진이나 증상 입력 기능이 아닙니다. 상황 카드 선택 자체는 집계하지 않습니다.

### 첫 방문 안내
`/first-visit`에 예약 → 준비물 → 찾아오는 길 → 접수·문진 → 검사·상담 → 치료 계획의 여섯 단계를 제공합니다.
- 신분증, 약 목록, 기존 방사선·진료 자료 안내.
- 당일 치료 여부·시간·자료 전달 형식은 병원 확인이 필요함을 표시.
- 약 임의 중단 금지와 수면(진정) 진료 미시행 안내.
- 메인, PC/모바일 내원 메뉴, 예약 준비물, 진료 가이드, XML/HTML 사이트맵, llms에서 연결.
- FAQPage는 실제 본문 FAQ와 일치합니다. 새로운 의료 검토 완료 날짜를 넣지 않습니다.

### 핵심 진료 가이드
VPT·치주·임플란트 상세에 검사·상담에서 확인할 것, 상태에 따른 선택지, 환자가 물어볼 질문을 추가했습니다. 실제 장비·의료진·수가·첫 방문·진료별 신청 화면으로 연결합니다.
- VPT의 “실패해도 잃는 것이 없다” 등 단정적 표현을 추가 치료·비용·치아 보존 한계로 완화.
- 치주 관리 주기와 재생 한계를 개인 상태에 따른 안내로 조정.
- 임플란트 주위염의 “통증 없음 / 방사선만 유일한 발견 방법” 표현을 임상 검사와 필요한 영상 검사 안내로 교정.
- 임플란트 비용 FAQ의 중복 숫자 대신 수가 페이지와 포함 항목 확인으로 연결.
- **의료진 재검토 전**: 기존 자료의 검토일 `2026-09-03`은 원본 이력으로만 표시합니다. 수정된 핵심 진료 3개는 새 내용 전체를 검토했다고 오인하지 않도록 페이지 스키마의 `reviewedBy/lastReviewed`와 reviewer 기반 author 메타를 생략했습니다. 원장 자격·진료 담당 Person 스키마는 유지합니다.
- 기존 지역×진료 템플릿은 임의로 삭제하거나 대량 noindex하지 않았습니다.

## 예약·문의 집계 설계
### 사용 방법
`/admin/stats`에 로그인한 뒤 **운영** 또는 **미리보기·로컬**을 선택합니다. 기본은 운영입니다. 한국시간 최근 30일의 행동별 합계, 페이지·버튼 위치별 건수와 일별 클릭/접수를 봅니다. 과거 예약을 소급 집계하지 않습니다.

| 이벤트 | 의미 |
| --- | --- |
| `naver_click` | 공식 네이버 예약 링크 클릭. 실제 예약 완료 아님 |
| `phone_click` | 전화 링크 클릭. 통화 연결/완료 아님 |
| `kakao_click` | 카카오 채널 클릭. 상담 시작/완료 아님 |
| `reservation_click` | 홈페이지 신청 화면으로 이동하는 링크 클릭 |
| `form_completed` | 서버에서 홈페이지 예약 데이터 저장 성공. 병원의 예약 확정 아님 |

위치: header, mobile_menu, mobile_bar, floating, footer, hero, reading_nav, sidebar, consultation, cta_strip, home, reservation, content. 완료는 서버 전용 form 위치입니다.

### 데이터·제한
- 새 migration: `migrations/0002_conversion_aggregates.sql`.
- `conversion_daily`: KST 날짜 × 운영/미리보기 × 공개 페이지 분류 × 행동 × 위치의 합계만 저장.
- 진료 slug는 서버의 고정 목록만 허용합니다. 지역·칼럼·공지·용어·사례 상세는 각각의 루트 분류로 합칩니다.
- **수집 제외**: 이름·전화·이메일·증상·선택한 희망 진료·날짜·문의·기타 폼 입력값, IP·UA·referrer·query·회원/예약 ID. 이 집계를 GA4로 전송하지 않습니다.
- 외부 예약에 입력값을 전달하지 않습니다. 브라우저 추적 쿠키·localStorage·sessionStorage를 만들지 않습니다.
- 페이지별 무작위 서명 티켓에는 허용 페이지 분류·origin·scope·nonce·30분 만료만 포함합니다. 특정 사람이나 로그인 세션을 나타내지 않습니다.
- 클릭 payload는 **event, location, ticket 세 필드만** 허용. 다른 키, 임의 행동/위치, 클라이언트의 `form_completed`, 변조·만료 서명, 다른 origin을 거부합니다. JSON POST 2KB 제한, 동일 origin 검사, no-store 응답.
- `conversion_receipts`: `SHA-256(무작위 nonce + event + location)`와 만료 시각만 저장. 공통 nonce나 페이지/방문자/예약 식별자를 저장하지 않으므로 다른 행동·합계·환자 기록과 조인하지 않습니다.
- D1 원자적 batch의 receipt INSERT OR IGNORE → changes() 기반 합계 증가로 재전송·동시 요청 중복을 제한합니다. 브라우저에서도 같은 문서·종류·위치는 한 번만 전송합니다.
- 홈페이지 접수는 예약 INSERT와 합계 증가를 같은 D1 transaction에 넣습니다. 한쪽이 실패하면 둘 다 rollback. 성공 query 조회·새로고침으로 증가하지 않습니다. 폼 재제출로 별도 접수가 생성되면 별도 건수이며 고유 환자 수가 아닙니다.
- 운영/미리보기는 서버 request origin과 검증된 canonical origin을 비교하여 구분합니다. 클라이언트가 scope를 지정할 수 없습니다.
- UA로 추정한 봇·관리자·DNT/GPC 요청 제외. 브라우저 스크립트 차단·전송 실패·30분 이상 열린 화면의 클릭은 누락될 수 있습니다. JS 없는 신청 저장은 서버에서 집계됩니다.
- 클릭을 기다리지 않고 원래 링크 이동을 진행합니다. 전송 재시도는 하지 않습니다.
- 원시 방문자 추적이나 고유 사용자 전환율, 완전한 부정 클릭 차단 시스템이 아닙니다. 새로고침·새 창에는 새 티켓이 발급되므로 의도적 자동화로 수치가 왜곡될 수 있습니다.

### 보유와 정리
최근 90일 합계와 최대 30분 유효한 receipt만 사용합니다. 만료 데이터는 **다음 집계 요청 또는 관리자 통계 조회 시** 삭제합니다. cron은 사용하지 않으며, 요청이 없는 기간에는 만료 행이 남아 있을 수 있습니다. 조회 시 오래된 행은 통계에서 제외합니다.

기존 `page_views`는 별도의 기존 정책으로 pathname·UA·시각을 저장합니다. 신규 전환 집계의 개인정보 제외 정책을 기존 모든 분석 수단에 적용했다고 주장하지 않습니다. 개인정보처리방침에도 자체 집계와 외부 분석을 구분하여 안내했습니다. 운영 반영 전 병원의 정책 검수가 필요합니다.

## 네이버 예약 연결
- 공식 Place: `https://m.place.naver.com/hospital/13229580/booking`
- 예약: `https://m.booking.naver.com/booking/13/bizes/1258951?theme=place&lang=ko&area=ple`
- 이전 확인에서 수원 화서동·한휘림 원장·화양로 34·원문 슬로건을 대조했습니다. 실제 예약을 제출하지 않았습니다.
- 상단·모바일 하단·플로팅·푸터/CTA·메인·예약 화면에서 새 창으로 연결합니다. 네이버 가능 일정과 확정 조건은 외부 화면의 안내를 따릅니다.
- D1 예약과 네이버 예약을 동기화하는 API 연동이 아닙니다.
- `channels.naverBooking`은 관리자 기본정보에서 변경할 수 있습니다. HTTPS/정식 예약 도메인/경로를 검사하고 잘못된 링크는 주요 버튼을 홈페이지 신청으로 fallback합니다. 빈 설정은 기존 기본값으로 돌아가므로 비활성화 수단이 아닙니다.

## 모바일·SEO·AEO 기반
- Wanted Sans 원본 1,289,292 bytes → 초기 Core 136,256 bytes. 폰트 파일 약 89.4% 감소이며 전체 로딩 시간 개선율이 아닙니다.
- Core/Extended unicode-range와 가변 굵기를 유지하고 원본 전체 cmap을 보존합니다. 새 CMS 문자에 필요하면 Extended 다운로드. OFL·원본 폰트 유지.
- 재생성: `python3 -m pip install 'fonttools[woff]'` 및 `python3 scripts/optimize-fonts.py` (빌드 도구 전용).
- `build-image-manifest.mjs`로 실제 dimensions와 srcset 생성. 상단 사진 우선순위·하단 lazy load.
- Save-Data/2G는 SVG부터 보여주고 명시적으로 켜면 Three.js 다운로드. 일반 연결의 입체 경험 유지.
- 모바일 첫 제목을 애니메이션 때문에 감추지 않으며, 비급여 비고는 접근 가능한 가로 표 안에 유지.
- SSR title/description/canonical/OG/Twitter, H1 하나, CMS H1의 렌더링 시 H2 변환.
- 기본 운영 canonical은 `https://seoul-dodam-dental.pages.dev`; SITE_URL은 검증된 HTTPS 운영 origin만 사용. 다른 origin의 미리보기에는 noindex 적용.
- 페이지 번호는 자기 canonical 유지. 필터/빈 후속 페이지, 회원·관리자·API·예약 결과/오류는 noindex.
- 공개 GET/HEAD trailing slash 301. 사이트맵은 실제 DB 수정일만 lastmod로 사용하며 가짜 매일 갱신일을 넣지 않습니다.
- robots는 공통 봇 그룹으로 관리자·회원·사례 파일 제외. 공개 칼럼 이미지를 전체 차단하지 않습니다. robots는 인증 기능이 아닙니다.
- Dentist/WebSite/WebPage/MedicalWebPage/ProfilePage/Person/MedicalProcedure/BreadcrumbList/FAQPage/DefinedTerm/Article의 안정적인 @id 연결.
- 잘못된 NoninvasiveProcedure, Physician+Person 혼합, 근거 없는 가격범위·평점·창업일·신규환자 수용 상태·speakable 제거.
- FAQ 본문·스키마 일치, 점심을 분리한 영업시간. llms는 원문 철학·진료 순서·공식 안내 목차입니다.
- llms·스키마는 검색 순위/AI 인용을 보장하지 않습니다. Google은 FAQ 리치 결과를 2026-05-07 중단하고 2026-06 문서를 제거했다고 공지했습니다.
- 이전 공식 참고: https://developers.google.com/search/docs/appearance/ai-features · https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls · https://developers.google.com/search/updates

## 주요 진입 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/#patient-situations` | 상황별 안내 5개 |
| `/first-visit#visit-steps`, `#anxiety`, `#first-visit-faq` | 첫 방문 흐름·불안·FAQ |
| `/mission` | 진료 철학 |
| `/doctors`, `/doctors/han-hwirim` | 의료진 |
| `/treatments`, `/treatments/:slug` | 12개 진료. 핵심 3개에 `#consultation-guide` |
| `/floor-guide` | 장비·공간·감염관리 |
| `/reservation?treatment=implant` | 희망 진료 선택. POST `/reservation` 접수 |
| `/reservation?ok=1` | 접수 안내, 확정 아님, noindex |
| `/api/conversions` | 동일 origin JSON POST 전용 집계 |
| `/admin/stats?scope=production` 또는 `preview` | 로그인된 관리자 통계 |
| `/directions`, `/hours`, `/pricing` | 위치·시간·비급여 |
| `/faq`, `/encyclopedia`, `/encyclopedia/:slug` | 질문·용어 |
| `/column`, `/column/:slug`, `/column/rss.xml` | 칼럼 (`treatment`, `page`) |
| `/notice`, `/notice/:id` | 공지 (`page`) |
| `/cases/gallery`, `/cases/gallery/:slug` | 사례 (`treatment`, `doctor`, `page`) |
| `/auth/register`, `/auth/login`, `/auth/mypage` | 회원 |
| `/admin/login`, `/admin/*` | 관리자 CMS |
| `/files/:key`, `/api/regions?q=화서` | R2 파일·지역 자동완성 |
| `/area`, `/area/:slug` | 기존 지역 안내 |
| `/privacy`, `/terms`, `/sitemap` | 정책·HTML 사이트맵 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/health` | 검색·목차·상태 |

## 데이터와 개발
- D1 `DB`: site_settings, users, cases, columns, notices, reservations, page_views, uploads, conversion_daily, conversion_receipts.
- R2 `R2`: 사례·칼럼·공지 이미지. 치료 후 사진의 서버 권한 검사 유지.
- 기본 정보: `src/data/clinic.ts` + D1 관리자 설정. secrets는 `.dev.vars` 또는 운영 secrets에만 보관.
- 브라우저 입체 소스: `src/client/experience.ts`, `tooth-scene.ts`. 화면 밖/백그라운드 중지와 모바일 DPR 제한 유지.
- `public/static/experience/`, `dist/`, `.wrangler/`, `.artifacts/`는 Git 제외. build가 브라우저 번들과 Worker를 생성합니다.
- Worker 런타임은 Python/Node 파일시스템/장기 실행 프로세스를 사용하지 않습니다.

```bash
cd /home/user/webapp
npm ci
npm run db:migrate:local
npm run build
# 시작/재시작 전 기존 PM2 서비스와 포트 3000 정리
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
npm run typecheck
npm run test:journey
npm run test:seo
npm run test:mobile
npm run test:design
npm run test:kinetic
```

### 검증
- `test:journey`: 임시 Miniflare D1을 별도로 생성해 실제 SQL로 서명·재전송·동시 중복·scope·필드 제한·origin·만료·DNT/GPC·관리자 인증·보유기간·접수 transaction/rollback을 검사합니다. 실제 preview DB나 운영 DB에 예약 fixture를 저장하지 않습니다. 이메일 자격증명이 없는 테스트 env 사용.
- 브라우저 신규 페이지 24개 viewport 조합(320/390/768/1440), 상황 카드·상담 앵커·위치별 payload·JS 없는 첫 방문/FAQ. 집계 API와 외부 예약은 가로채 테스트 통계를 남기지 않습니다.
- SEO: 700개 공개 HTML + 로컬 운영 색인 정책 + 격리 CMS fixture 검사.
- Design: 기존 80개 화면 조합과 메뉴·FAQ·목차·Naver 링크·폼 검사.
- Mobile: 초기 Core만 다운로드, 절약모드·입체 opt-in·44px·작은 이미지·비급여 비고·메뉴.
- Kinetic: 실제 WebGL·회전·모션·갤러리·리사이즈·모바일·reduced-motion·fallback·no-JS 9개 그룹.
- 결과와 캡처는 `.artifacts/journey-audit.json`, `seo-audit.json`, `mobile-audit.json`, `design-smoke-results.json`, `kinetic-smoke-results.json` 등에 저장합니다.
- 로컬 기술 검사이며 실제 예약/통화/상담 완료, 검색 순위, 의료광고 적법성, 전체 관리자 CRUD나 실사용 성능을 보장하지 않습니다.

## 미구현·운영 전 다음 단계
1. 병원의 추가·수정 의료 문구와 개인정보 집계/보유 정책 최종 검토. 실제 재검토 후에만 검토일·reviewer 메타를 갱신합니다.
2. 사용자 요청 시 배포 경로 선택, 운영 D1 migration 0002 적용, SESSION_SECRET 및 HTTPS SITE_URL 확인, 실제 origin 분류와 예약 동선 검증. 현재 운영 migration/배포 미실행.
3. 네이버 실제 예약 완료 수는 외부 서비스에서 별도 확인해야 합니다. API 동기화, 고유 환자 attribution, 광고 성과/전환율, 정교한 부정 클릭 방지는 미구현입니다.
4. D1 lazy cleanup을 즉시 파기 작업으로 오인하지 않도록 운영 정책 확인. 기존 회원·예약 보유기간 파기 자동화도 별도 운영 점검 대상입니다.
5. Search Console·네이버 서치어드바이저 소유권 확인 및 사이트맵 제출, 실제 도메인 Schema Validator·PageSpeed·Core Web Vitals·Safari/Android 검증.
6. 지역×진료 페이지는 Search Console의 유입/중복 데이터를 확인한 뒤 조정. 이번에 대량 삭제/추가/noindex하지 않았습니다.
7. OAuth·Resend 발신 도메인/실제 알림·커스텀 도메인 연결은 별도 과제입니다. 지도·주차 정보 확인과 원장 영상도 이번 범위 밖입니다.
