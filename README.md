# 서울도담치과의원 홈페이지 (webapp)

## 프로젝트와 배포 상태
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 자연치아 보존 철학을 담은 브랜드 홈페이지와 환자 중심 진료·예약 안내
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2. Vanilla JS, GSAP/ScrollTrigger, Three.js WebGL.
- **경로 / 브랜치**: `/home/user/webapp` / `main`
- **최근 변경**: 2026-09-07 환자 동선 보강 후 내부 링크·첫 방문 목차·비교표·의료 표현 추가 마감
- **미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/?v=14
- **첫 방문**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/first-visit
- **기존 운영 주소**: https://seoul-dodam-dental.pages.dev
- **운영 반영**: 미배포. 운영 D1/R2·도메인·Search Console·네이버 등록/제출 미변경. migration 0002는 이전 단계에서 로컬에만 적용했고 이번 마감에서는 DB 구조를 변경하지 않았습니다.
- 미리보기는 임시 서비스입니다. 배포 요청 시 사용자 Cloudflare와 Genspark Hosted 중 경로를 확인해야 합니다.

## 승인된 방향과 보존한 기능
신청서 XLSX의 서울도담치과 / 한휘림 원장 행과 홈페이지 제작 회신 PDF를 대조한 방향을 유지합니다. 원문은 `.artifacts/`에만 보관하며 Git/공개 자산에 포함하지 않습니다.

| 근거 | 방향 |
| --- | --- |
| 신청서 Q24 | 깔끔·모던, 따뜻·친근 |
| 신청서 Q25 + 회신 A9 | 블루 메인 + 자연을 상징하는 그린 포인트 |
| 신청서 Q23 + 회신 A5 | 이해될 때까지 설명하고, 필요한 만큼만 치료합니다 |
| 신청서 Q12–13 + 회신 A1 | VPT·크라운 → 치주치료 → 보존 불가 시 임플란트 |
| 회신 진료 철학 | 치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다 |
| 회신 A3 / A6 | 통증 배려, 도입 예정 장비를 실제 보유로 표시하지 않음 |

“내 치아를 위한 조금 다른 생각, 도담”, Wanted Sans, 보호 고리와 구체적 HEX `#0069B3`·`#B9E7A6`는 디자인 해석이며 원장이 직접 지정한 값이 아닙니다.
- 입체 치아·보호 고리, 마우스/펜 회전, 모바일 회전 버튼, 모션 토글, reduced-motion, SVG fallback.
- GSAP 스크롤, PC 가로 갤러리, 모바일 네이티브 갤러리. 브라우저 스크롤을 가로채지 않습니다.
- 공통 헤더·푸터, 현재 메뉴, 상세 reading-nav, FAQ, 주요 버튼 44px.
- 회원·관리자 CMS, 홈페이지 신청, 치료 후 사진의 서버 로그인 검사.
- 실제 사진 22장+작은 WebP 22장. 장비 매칭과 원장 크롭 교정, 얼굴 생성/변형 없음. AI-retouched interior 폴더가 아닌 실제 실내 촬영 원본 사용.
- 사진 재생성: `DODAM_PHOTO_SOURCE=/path/to/supplied/originals node scripts/process-images.mjs`. 기본 원본 경로 `/home/user/dodam_src`, Git 제외.
- 가짜 후기·사례·성과 수치 추가 없음. 지도 좌표·주차의 외부 정보와 차이, 원장 영상은 선택 범위 밖이므로 수정하지 않았습니다.

## 환자 동선과 최신 마감
### 상황별 안내
메인과 `/treatments`의 `#patient-situations`에 일반 링크 5개를 제공합니다. JS 없이 사용 가능하며 진단·치료 추천 기능이 아닙니다. 카드 선택 자체는 집계하지 않습니다.
- 신경치료 권유 → `/treatments/vpt-crown#consultation-guide`
- 잇몸 출혈 → `/treatments/periodontal#consultation-guide`
- 발치 권유 → `/treatments/implant#consultation-guide`
- 마취 불안 → `/first-visit#anxiety`
- 검진·스케일링 → `/treatments/preventive#summary`

### 첫 방문
`/first-visit`에 준비물 요약과 예약 → 준비 → 이동 → 접수·문진 → 검사·상담 → 치료 계획의 6단계를 제공합니다.
- `#visit-preparation`, `#visit-steps`, `#anxiety`, `#first-visit-faq`로 바로 이동하는 고정 목차와 현재 읽는 위치 표시.
- 첫 방문에서 PC 내원 메뉴 활성 표시, 모바일 메뉴 내 현재 페이지 표시.
- 신분증·복용약 목록·기존 자료 안내. 당일 치료/시간·자료 전달 형식·본인 확인 예외는 병원 확인이 필요함을 명시.
- 약 임의 중단 금지, 수면(진정) 진료 미시행 안내.
- 메인·PC/모바일 메뉴·예약 준비물·진료 상세·XML/HTML 사이트맵·llms 연결. FAQ와 구조화 데이터 일치.

### 진료별 읽기와 비용 동선
- 핵심 3개 진료에 검사·상담 확인 사항, 상태별 선택지, 진료실에서 할 질문, 장비·의료진·진료비·첫 방문·신청 링크.
- 장비 링크는 각각 `/floor-guide#equip-보존`, `#equip-무통`, `#equip-진단`으로 직접 이동.
- 12개 진료의 비용 링크는 진료 표시명이 아닌 `treatmentPricingUrl()`의 고정 매핑 사용. VPT→`vpt`, 치주·예방·발치→`insured`, 임플란트→`implant`, 보철→`crown` 등.
- 수가표 고정 ID: `implant`, `crown`, `vpt`, `restorative`, `dentures`, `pediatric`, `other`, `whitening`, `insured`. 기존 한글/percent-encoded fragment는 별칭으로 보존.
- 비교표에 region 이름·설명·caption·열 헤더 scope·키보드 초점·가로 스크롤 안내 추가. 일반 비교이며 개별 진단이 아니라는 설명.
- 기존 수가 **숫자·단위·기준일은 그대로 유지**. 전체 항목이 동일 단위/면세라는 일괄 표현, 임플란트 식립+보철 포함 단정을 제거하고 항목별 조건 확인 안내로 정리. 실제 포함 범위·과세 고지는 병원 검수 필요.
- 예약 등 `data-once` 폼에서 BFCache 뒤로가기로 돌아왔을 때 제출 버튼이 계속 비활성화되지 않도록 원래 상태 복구. 이 복구는 접수나 집계 요청을 보내지 않습니다.

### 의료 표현 정리와 검수 상태
- VPT의 “실패해도 잃는 것이 없다”와 신경치료→발치의 단정적 흐름, 치아 삭제량·감각의 과도한 단순화, 밀봉만으로 회복 보장 표현 완화.
- 치수 반응 검사와 큐레이의 보조적 역할 구분. VPT 보험/비급여를 개별 항목으로 확인하도록 안내.
- 치주 관리 주기·재생 한계·마취 후 감각·나이별 치료 필요성을 개인 상태에 맞게 표현. 출처 없는 “시린 이유의 절반” 수치 삭제.
- 임플란트 주위염의 “방사선만 유일한 검사”, 통증 없음, 특정 관리 간격이 수명을 결정한다는 표현 완화. 임시치아는 상태에 따라 결정하도록 안내.
- 근거가 제시되지 않은 비교표 씹는 힘 비율·고정 수명 수치 대신 기능에 영향을 주는 요인과 관리 항목 제시. 약·주사 치료 임의 중단 금지 안내.
- **의료진 재검토 전**: 기존 `2026-09-03`은 원본 자료 검토 이력으로만 표시. 수정된 핵심 3개는 페이지 스키마 `reviewedBy/lastReviewed` 및 reviewer 기반 author 메타를 생략. 담당 Person 스키마 유지. 해당 자료를 사용하는 지역 페이지도 새 표현의 재검토 전 상태 표시.
- 문구 편집은 새로운 의학적 근거 검증이나 의료광고 적법성 보증이 아닙니다. 실제 원장의 최종 검토가 필요합니다. 기존 지역×진료 경로를 대량 삭제/추가/noindex하지 않았습니다.

## 예약·문의 집계
### 관리자 사용 방법
로그인 후 `/admin/stats`에서 운영 또는 미리보기·로컬을 선택합니다. 기본은 운영이며 KST 최근 30일의 행동별 합계, 페이지·버튼 위치별 건수, 일별 클릭/접수를 표시합니다. 기존 예약을 소급 집계하지 않습니다.

| 이벤트 | 의미 |
| --- | --- |
| `naver_click` | 네이버 예약 링크 클릭. 예약 완료 아님 |
| `phone_click` | 전화 링크 클릭. 연결/통화 완료 아님 |
| `kakao_click` | 채널 클릭. 상담 시작/완료 아님 |
| `reservation_click` | 홈페이지 신청 화면 이동 링크 클릭 |
| `form_completed` | 홈페이지 예약 데이터 저장 성공. 병원의 예약 확정 아님 |

위치 enum: header, mobile_menu, mobile_bar, floating, footer, hero, reading_nav, sidebar, consultation, cta_strip, home, reservation, content. 완료는 서버 전용 form.

### 저장과 안전장치
- migration `0002_conversion_aggregates.sql`: `conversion_daily`와 `conversion_receipts`.
- `conversion_daily`: KST 날짜 × scope × 공개 페이지 분류 × 행동 × 위치의 합계.
- 진료 slug는 고정 목록만 허용. 지역·칼럼·공지·용어·사례 상세는 루트 분류로 합침.
- **수집 제외**: 이름·전화·이메일·증상·희망 진료 선택값·날짜·문의·기타 입력값, IP·UA·referrer·query·회원/예약 ID. 이 집계는 GA4로 전송하지 않습니다.
- 별도 추적 쿠키·localStorage·sessionStorage 사용 없음. 페이지마다 생성한 무작위 서명 ticket에 허용 페이지·origin·scope·nonce·30분 만료만 포함하며 사람이나 세션 식별자가 아닙니다.
- JSON POST payload는 event/location/ticket 세 필드만 허용. 다른 키·임의 이벤트·클라이언트 완료·변조/만료 서명·다른 origin을 거부. 2KB 제한, no-store 응답.
- `conversion_receipts`: SHA-256(nonce+event+location)와 만료만 저장. 원본 nonce·페이지·환자 식별자를 저장하지 않아 다른 행동이나 합계·환자 기록과 조인하지 않습니다.
- D1 atomic batch의 receipt INSERT OR IGNORE와 changes()로 재전송·동시 요청 중복 제한. 클라이언트도 같은 문서·종류·위치를 한 번만 전송.
- 홈페이지 예약 INSERT와 접수 합계 증가는 같은 transaction. 실패하면 둘 다 rollback. 성공 query·새로고침으로 증가하지 않음. 별도의 재접수가 생성되면 별도 건수이며 고유 환자 수가 아닙니다.
- scope는 요청 origin과 검증된 canonical origin을 서버에서 비교해 구분. 클라이언트 지정 불가.
- UA로 추정한 봇·관리자·DNT/GPC 요청 제외. 스크립트 차단·전송 실패·30분 이상 지난 화면 클릭은 누락 가능. JS 없는 신청 저장은 서버 집계.
- 링크 이동은 집계를 기다리지 않으며 전송 재시도 없음. 새 화면은 새 ticket이므로 완전한 부정 클릭 방지·고유 방문자 분석·전환율 계산 시스템은 아닙니다.

### 보유와 정리
최근 90일 합계, 최대 30분 유효 receipt를 사용합니다. 만료분은 다음 집계 요청 또는 관리자 통계 조회 때 삭제하며 cron은 사용하지 않습니다. 요청이 없으면 만료 행이 남을 수 있습니다. 오래된 합계는 조회 범위에서 제외합니다.

기존 `page_views`의 pathname·UA·시각 저장 정책과 신규 집계는 별개입니다. 개인정보 제외 정책을 모든 기존 분석 수단에 적용했다고 주장하지 않습니다. 자체 집계와 외부 분석을 구분한 개인정보처리방침은 운영 전 병원 검수가 필요합니다.

## 네이버 예약
- 공식 Place: https://m.place.naver.com/hospital/13229580/booking
- 예약: https://m.booking.naver.com/booking/13/bizes/1258951?theme=place&lang=ko&area=ple
- 이전 확인에서 수원 화서동·한휘림 원장·화양로 34·슬로건 대조. 실제 예약 제출 없음.
- 상단·모바일 바·플로팅·푸터/CTA·메인·예약 화면에서 새 창 연결. 네이버 가능 일정·확정 조건은 외부 화면 확인.
- 홈페이지 입력값을 전달하거나 네이버 내역을 D1과 동기화하는 API 연동이 아닙니다.
- `channels.naverBooking`은 관리자 기본정보에서 수정 가능. HTTPS·정식 도메인·경로 검사, 잘못된 링크는 주요 버튼을 홈페이지 신청으로 fallback. 빈 설정은 기본값으로 돌아가므로 비활성화 수단이 아닙니다.

## 모바일·SEO·AEO 기반
- Wanted Sans 원본 1,289,292 bytes → 초기 Core v2 137,164 bytes (폰트 파일 약 89.4% 감소, 전체 속도 개선율 아님). Core/Extended unicode-range·가변 굵기·원본 cmap·OFL 보존. 새 CMS 문자에 필요하면 Extended 로딩. 첫 방문 등 새 정적 문자를 포함하도록 v2를 생성해 보조 폰트의 불필요한 다운로드를 막았습니다. 이전 v1 파일은 장기 캐시 호환을 위해 보존합니다.
- 폰트 재생성: `python3 -m pip install 'fonttools[woff]'`, `python3 scripts/optimize-fonts.py`. Python은 빌드 도구 전용. 글자 범위가 바뀌면 script의 VERSION을 올려 immutable 폰트 파일을 덮어쓰지 않습니다.
- 이미지 manifest의 실제 dimensions/srcset, 상단 우선 로딩·하단 lazy load. Save-Data/2G에서는 명시적 opt-in 전 Three.js 다운로드 안 함.
- 모바일 첫 제목을 모션 때문에 감추지 않음. 비급여 조건·비고는 접근 가능한 가로 표 안에 유지.
- SSR title/description/canonical/OG/Twitter, H1 하나, CMS H1의 렌더링 시 H2 변환.
- 기본 canonical: https://seoul-dodam-dental.pages.dev. SITE_URL은 검증된 HTTPS 운영 origin만 사용. 다른 origin은 preview noindex.
- 페이지 번호 자기 canonical 유지. 필터/빈 후속 페이지·회원·관리자·API·예약 결과/오류는 noindex.
- 공개 GET/HEAD trailing slash 301. sitemap은 실제 DB 수정일만 lastmod로 사용. robots 공통 그룹으로 관리자·회원·사례 파일 제외. 공개 칼럼 이미지를 전체 차단하지 않으며 robots는 인증 아님.
- Dentist/WebSite/WebPage/MedicalWebPage/ProfilePage/Person/MedicalProcedure/BreadcrumbList/FAQPage/DefinedTerm/Article의 안정적 @id 연결.
- 잘못된 NoninvasiveProcedure·Physician+Person 혼합, 근거 없는 가격범위·평점·창업일·신규환자 수용 상태·speakable 제거.
- FAQ 본문·스키마 일치, 점심을 분리한 영업시간. llms는 원문 철학·진료 순서·공식 안내 목차이며 순위·AI 인용 보장 아님.
- 이전 공식 확인: Google FAQ 리치 결과 2026-05-07 중단, 2026-06 문서 제거 공지.
- 참고: https://developers.google.com/search/docs/appearance/ai-features · https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls · https://developers.google.com/search/updates

## 주요 진입 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/#patient-situations` | 상황별 안내 |
| `/first-visit` | 준비물·순서·불안·FAQ 고정 목차 |
| `/mission`, `/doctors`, `/doctors/han-hwirim` | 철학·의료진 |
| `/treatments`, `/treatments/:slug` | 12개 진료, 핵심 3개 `#consultation-guide`, 비교표 `#compare` |
| `/floor-guide#equip-보존`, `#equip-무통`, `#equip-진단` | 관련 장비·재료 |
| `/pricing#vpt`, `#crown`, `#implant`, `#insured` 등 | 비용·보험 항목 직접 이동 |
| `/reservation?treatment=implant` | 진료 선택. POST `/reservation` 접수 |
| `/reservation?ok=1` | 접수 안내, 확정 아님, noindex |
| `/api/conversions` | 동일 origin JSON POST 집계 |
| `/admin/stats?scope=production` 또는 `preview` | 관리자 통계 |
| `/directions`, `/hours` | 위치·시간 |
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
- R2 `R2`: 사례·칼럼·공지 이미지. 치료 후 사진 서버 권한 검사 유지.
- 기본 정보: `src/data/clinic.ts` + D1 설정. secrets는 `.dev.vars` 또는 운영 secrets에만 저장.
- 브라우저 입체 소스: `src/client/experience.ts`, `tooth-scene.ts`. 화면 밖/백그라운드 중지·모바일 DPR 제한.
- `public/static/experience/`, `dist/`, `.wrangler/`, `.artifacts/`는 Git 제외. build가 브라우저 번들과 Worker를 생성.
- Worker 런타임에서 Python·Node 파일시스템·장기 실행 프로세스를 사용하지 않습니다.

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

### 검증 범위
- `test:journey`: 별도 임시 Miniflare D1으로 서명·동시/재전송 중복·scope·필드/origin/만료 제한·DNT/GPC·관리자·보유기간·접수 transaction/rollback 검사. 이메일 credentials 없음. 실제 preview/운영 DB에 예약 fixture를 넣지 않음.
- 브라우저 24개 신규 페이지/viewport 조합(320/390/768/1440), 상황 카드·앵커·위치별 payload·no-JS 첫 방문/FAQ. 집계 API와 외부 예약은 가로채 테스트 통계를 남기지 않음.
- 추가: 12개 진료의 비용·장비 링크 19개 실제 목적지 존재 검사, 고정 목차/내원 메뉴, 키보드 비교표 스크롤, no-JS 비용 앵커, 기존 한글 앵커, BFCache 제출 버튼 복원.
- SEO: 공개 HTML 700개 + 로컬 운영 정책 + 격리 CMS fixture.
- Design: 기존 80개 화면 조합과 메뉴·FAQ·목차·Naver·폼.
- Mobile: 메인과 첫 방문·핵심 진료 3개·수가표에서 Core v2만 로딩, 절약모드/입체 opt-in/44px/작은 이미지/비급여 비고/메뉴.
- Kinetic: WebGL·회전·모션·갤러리·리사이즈·모바일·reduced-motion·fallback·no-JS 9개 그룹.
- 캡처에서 고정 하단 바가 본문 위에 보이는 경우 실제 스크롤 후 text bounds/elementFromPoint로 내용이 가려지지 않음을 별도 확인. 전체 수가 숫자가 이전 commit과 같음을 비교.
- 결과: `.artifacts/journey-audit.json`, `seo-audit.json`, `mobile-audit.json`, `design-smoke-results.json`, `kinetic-smoke-results.json` 및 캡처.
- 로컬 검증이며 실제 외부 예약/통화/상담 완료, 검색 순위, 의료광고 적법성, 전체 관리자 CRUD나 실사용 성능을 보장하지 않습니다.

## 미구현·운영 전 다음 단계
1. 원장의 추가·수정 의료 문구, 수가 포함/과세 조건, 개인정보 집계/보유 정책 최종 검수. 실제 재검토 후에만 reviewer·검토일 갱신.
2. 배포 요청 시 경로 선택, 운영 D1 migration 0002, SESSION_SECRET·HTTPS SITE_URL, 실제 origin 분류 확인. 현재 운영 migration/배포 미실행.
3. 네이버 실제 예약 완료는 외부 서비스에서 별도 확인. API 동기화·고유 환자 attribution·광고 전환율·정교한 부정 클릭 방지 미구현.
4. lazy cleanup은 즉시 파기 작업이 아님. 기존 회원·예약 보유기간 파기 자동화도 별도 운영 점검 대상.
5. Search Console·네이버 소유권 확인/사이트맵 제출, 실제 도메인 Schema Validator·PageSpeed·Core Web Vitals·Safari/Android 검증.
6. 지역×진료 페이지는 Search Console 유입/중복을 확인한 뒤 조정. 이번에 대량 삭제/추가/noindex하지 않음.
7. OAuth·Resend 실제 알림/발신 도메인·커스텀 도메인, 지도·주차 확인, 원장 영상은 별도 과제.
