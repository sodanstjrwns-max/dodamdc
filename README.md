# 서울도담치과의원 홈페이지 (webapp)

## 관리자 비밀번호 전용 로그인 (2026-09-13)
- 접속: https://dodamdc.kr/admin/login → 기존 관리자 비밀번호 입력 → `/admin` 대시보드. 아이디 입력·최초 책임자 계정 생성은 요구하지 않습니다. 아래 과거 릴리스의 초기 계정 생성 설명보다 이 안내가 우선합니다.
- 기존 운영 `ADMIN_PASSWORD`·`SESSION_SECRET`은 유지합니다. 평문 비밀번호를 조회·공개·변경하지 않으며 `/handover`에는 접속 주소와 사용법만 제공합니다. 하단 기술 점검 기록을 관리자 접속 안내로 교체하고 결제 금액·계좌·지원 약속을 유지합니다.
- 성공 로그인 시 D1 `staff`에 내부 감사 식별자 `!shared-admin`을 자동으로 한 개만 생성합니다. 사용자가 생성/입력하는 ID가 아니며 비밀번호 사본을 저장하지 않습니다. 기존 직원·회원·예약·사진은 변환하거나 삭제하지 않고 새 migration도 필요 없습니다.
- 공용 로그인 작업은 ‘관리자’로 기록되어 실제 작업자 개인을 구분할 수 없습니다. 공용 관리자 로그아웃 시 같은 식별자의 다른 기기 세션도 해제됩니다. 민감한 작업은 같은 관리자 비밀번호로 재인증합니다.
- HttpOnly/SameSite 쿠키(24시간), CSRF/Origin, 로그인 시도 제한, 세션 용도·버전 검증을 유지합니다. 현재 설정 비밀번호와 연결된 HMAC 태그로 비밀번호 변경 후 기존 공용 세션을 거부하며 과거 bootstrap 세션도 거부합니다.
- 기존 개인 직원 세션·명시적인 ID 포함 POST 로그인은 호환 유지하지만 기본 로그인 화면에는 ID 입력란을 제공하지 않습니다. 직원 계정 관리는 선택적 기존 기능이며 로그인 선행 조건이 아닙니다.
- 검사는 폐기 가능한 D1/R2와 테스트 전용 비밀번호로 수행합니다. 운영에서 환자 등록/파기·사진 변경·비밀번호 재설정 시험을 하지 않습니다. typecheck/build, 보안 10그룹, 환자 동선 8그룹, Chromium/Linux WebKit 실제 비밀번호 전용 로그인 및 CMS 10그룹, 납품 안내 6뷰를 통과했습니다. 운영 배포 확인은 아래에 별도 기록합니다.

## 납품 설명서 톤 재작성
- `/handover`를 운영 체크리스트 중심에서 제작자 문석준의 편지·가치 설명 중심으로 재작성했습니다. SEO/AEO/체류시간, 도담의 철학, 콘텐츠 축적, 관리자 사용법, 베타테스트 요청, ‘수정 기한은 영원히’ 약속을 담았습니다.
- 사용자 명시 요청대로 페이지에 **1,500만 원, 농협 1085-02-007634, 예금주 문석준, 입금 확인 후 2주 이내 세금계산서 발급**을 포함합니다. 부가세 포함 여부는 임의로 추가하지 않았습니다. 계좌 복사와 인쇄/PDF 기능을 제공합니다.
- 고객용 페이지에 잘못 포함했던 제작자 발송용 안내문/복사 UI와 원문 상수를 소스에서 삭제했습니다. 발송 안내문은 대화에서만 별도로 전달하고 고객용 HTML에는 넣지 않습니다. HTML 원문에도 발송용 문구가 없음을 검사합니다.
- 예시 병원의 비밀번호·미구현 기능·색인 수치·성과 보장을 가져오지 않았습니다. 기존 납품의 기술 검사 수치는 과거 점검 기록으로 구분합니다. 홈페이지·CMS·DB·환자 데이터는 이번 설명서 수정의 대상이 아닙니다.
- 이전 설명서 배포 기록: 소스 `cbbd209`, 배포 `86f53e74` (https://86f53e74.seoul-dodam-dental.pages.dev), 정식 주소 https://dodamdc.kr/handover. Chromium/Linux WebKit 각각 320·390·1440px에서 결제 금액·농협 계좌·예금주·발송문 복사·인쇄·noindex·가로 넘침·JS 오류 검사를 통과했습니다. 실제 운영 HTML에서도 농협/문석준/1,500만 원/2주 이내 발급 문구를 확인했으며 부가세 포함 여부는 추가하지 않았습니다.
- 설명서 CSS v2 / JS v3. noindex·사이트맵 제외·분석 제외는 유지합니다. 링크 열람자는 결제 안내를 볼 수 있으며, 이는 사용자가 명시적으로 요청한 공개 범위입니다.

## 최신 납품 마감 — SEO / 정식 도메인 / 모바일 CMS

- **정식 홈페이지 / 안내 / 관리자**: https://dodamdc.kr/ · https://dodamdc.kr/handover · https://dodamdc.kr/admin/login
- **상태**: 운영 배포 및 실주소 검증 완료. 앱 소스 `11e1f9f`, 배포 `fcb5932c` (https://fcb5932c.seoul-dodam-dental.pages.dev). 기존 BYOK Pages 프로젝트의 main을 갱신했고 SITE_URL을 https://dodamdc.kr 로 설정했습니다. 운영 DB·R2·가격표는 변경하지 않았습니다.
- **운영 검증**: https://dodamdc.kr 의 공개 HTML 706페이지와 이미지 36개, GET/HEAD·canonical·스키마·헤딩·내부 앵커 검사 오류·경고 0. www/기존 Pages 공개 경로 301, immutable 미리보기 noindex, 관리자 비로그인 302, 무인증 통계 API 404 확인. 납품 안내는 실제 운영 URL에서 Chromium/Linux WebKit 각각 320·390·1440px·인쇄 동작·JavaScript 오류 없음을 확인했습니다.
- **회귀 결과**: 로컬 SEO 701페이지/이미지 36개 오류·경고 0; 디자인 80화면, 모바일 8그룹, 모션 9그룹, 예약 동선 8그룹, 보안 9그룹, 안내 6뷰, CMS 8그룹 통과. CMS는 실제 격리 Worker HTTP multipart를 통해 Chromium·Linux WebKit 모두 작성/오류 복구/저장/재조회/공개·비공개/본문 이미지 설명/전후 교체·삭제를 확인했습니다. 각 엔진별 작성 폼 12화면과 긴 본문·표 공개 화면 6개를 검사했습니다.
- 인수 요약보다 최신이었던 GitHub `e7d9a0a`, `b732242`, `01e29be`를 보존·통합했습니다. 비급여 편집기, 통합통계 화면과 분석 연동을 덮어쓰지 않았습니다. 운영에는 이미 0004/0005 migration과 fees 테이블이 있음을 읽기 전용으로 확인했으며, 이번에 운영 migration을 재실행하거나 가격·환자 데이터를 변경하지 않습니다.
- Cloudflare에 `dodamdc.kr`·`www.dodamdc.kr`이 이미 연결돼 있었지만 canonical은 Pages 주소, 정식 도메인은 noindex였음을 실제 응답으로 확인했습니다. `https://dodamdc.kr`을 대표주소로 정리하고 www/기존 Pages의 공개 GET·HEAD를 301 연결합니다. 인증·API·R2 경로의 origin-bound 세션은 강제 이동하지 않습니다. 기존 도메인 세션은 새 도메인에서 재로그인이 필요할 수 있습니다.
- SEO: GET/HEAD 검색 정책 일치, HEAD 조회수 제외, 정규화된 페이지 번호와 metadata 일치, 실제로 지원하는 필터만 canonical 반영, 날짜 유효성 검사, Article 작성자와 검토자 분리, 공지 Article·날짜, sitemap DB 장애 시 503/no-store. 정적 sitemap에 허위 lastmod를 넣지 않습니다. FAQ는 의미 구조로 유지하며 Google FAQ 리치결과 종료와 llms.txt의 비필수성을 안내합니다.
- 모바일: 긴 CMS 제목·본문·표가 페이지 폭을 늘리지 않도록 처리(CSS v17). 관리자 입력 16px, 44px 이상 주요 도구, 가로 스크롤 서식 도구, 하단 저장 도구, 목록 내부 스크롤, 전후 사진 contain 미리보기, 모바일/PC 본문 미리보기.
- 에디터: 사례·칼럼·공지 새 글은 기본 비공개. 칼럼·공지 공통 H2/H3·목록·인용·링크·해제·실행 취소/다시 실행. 본문 이미지 업로드·설명 수정·삭제, 전후 슬롯별 교체·삭제. JavaScript 저장은 서버 오류 시 현재 폼/선택 파일을 유지하며 성공 후 완료 안내로 이동합니다. 한국시간 게시일 입력을 UTC 저장하고 다시 한국시간으로 표시합니다. 공지 고정 해제와 저장은 단일 batch입니다.
- 에디터 한계: 자동 초안 저장/브라우저 종료 후 복구, 동시 공동편집, 예약발행 기능은 없습니다. 연결 오류 시 중복 등록 방지를 위해 목록부터 확인하도록 안내합니다. 파일 연결 해제는 R2 원본 영구삭제가 아니며, 실패한 업로드의 고아 파일 정리는 별도 운영 과제입니다. HEIC 미지원, JPG/PNG/WebP/GIF 8MB 및 파일 시그니처 검사, 전체 이미지 악성파일 검사·EXIF 제거를 보장하지 않습니다.
- 비급여 공개 경계: 모든 항목 비공개/삭제 시 과거 기본 수가를 되살리지 않습니다. 명시적 빈 목록과 미설치 legacy 테이블을 구분하고, 잘못된 저장 payload·음수 금액·중복 그룹 ID를 거부합니다. DB 기반 수가에 과거 고정 기준일을 붙이지 않습니다.
- **외부 통계 보안 후속조치 필요**: 통합한 외부 커밋에는 통계 접근 인증값이 코드에 포함돼 있었습니다. 현재 소스에서 제거하고 직원 세션을 요구하며, 서버간 집계는 `LOCAL_STATS_TOKEN` Bearer 헤더만 받습니다. 외부 통계 조회는 `STATS_API_TOKEN` secret 설정 후 작동합니다. 공개된 이전 인증값은 중앙 서비스에서 폐기·재발급해야 하며, 이 작업은 중앙 서비스의 키를 변경하거나 GitHub history를 강제 재작성하지 않았습니다. 과거 커밋에는 값이 남을 수 있으므로 일반 Git-history 백업 대신 현재 추적 소스만 별도 archive로 제공합니다. 로컬 조회·전환 통계는 계속 사용 가능합니다.
- Clarity/방문 분석은 공개 운영 페이지에서만 유지하고 예약·회원·관리·사례·납품 안내/로그인 사용자/관리자/봇/DNT/GPC에 제외 조건을 적용했습니다. 개인정보 페이지의 외부 분석 안내를 보정했으며 위탁·이전·보유기간·동의 요건의 최종 검토는 병원 책임입니다.
- 미설정: 자동 이메일 알림, Google OAuth, 재발급한 외부 통계 인증정보. 운영 GSC/Naver 소유확인 meta 태그는 모두 존재함을 확인했습니다(로컬 설정과 다름). 태그 존재만으로 소유확인 성공·사이트맵 제출·실제 색인을 확인할 수 없으므로 검색서비스 계정에서 별도 확인해야 합니다. 검색 순위·AI 인용·의료광고 적법성·네이티브 iPhone/Kakao 지원은 보장하지 않습니다.
- `/handover`: 공개 가능한 내용만 담은 noindex 안내. 사이트맵에서 제외하고 분석 티켓·외부 분석을 넣지 않습니다. 납품 범위·직원 사용법·인수 체크리스트·미설정 연동·인쇄/PDF 저장을 제공합니다. noindex는 접근통제가 아닙니다.
- 추가 검사: `TEST_WEBKIT=1 npm run test:cms`는 실제 multipart 전송을 받는 일회용 Miniflare Worker/D1/R2에서 작성·수정·이미지 업로드·오류 복구·공개/비공개·파일 접근권한을 브라우저로 검사합니다. WebKit의 route interception은 파일 bytes를 누락하므로 이를 앱 오류로 오인하지 않도록 실제 로컬 HTTP 전송을 사용합니다. 실운영 게시물·환자·사진을 시험 데이터로 변경하지 않습니다.
- SEO 운영 검사: `SEO_BASE_URL=https://dodamdc.kr npm run test:seo`. 안내 브라우저 검사: `DELIVERY_BASE_URL=https://dodamdc.kr TEST_WEBKIT=1 npm run test:delivery`. 결과는 Git 제외 `.artifacts/`에 저장합니다.

## 이전 프로젝트·배포 상태 (2026-09-07 기록)
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 자연치아 보존 철학을 담은 브랜드 홈페이지, 환자 중심 진료 안내, 홈페이지 예약 응대 관리.
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2. Vanilla JS, GSAP/ScrollTrigger, Three.js WebGL.
- **경로 / 브랜치**: `/home/user/webapp` / `main`
- **GitHub**: https://github.com/sodanstjrwns-max/dodamdc (`main`, 공개 저장소). 코드·마이그레이션·테스트·배포 기록만 관리하며 `.dev.vars`, `.env*`, `.artifacts/`의 운영 DB 백업과 비공개 원본은 제외합니다.
- **최근 작업**: 2026-09-07 디자인 제안 1~6 전체 반영 — 차분한 히어로, CTA 위계, 압축된 읽기 동선, 원장 중심 편집, 실제 사진 표시 톤/크롭, 공통 궤도·모션. **사용자 승인 후 최신 디자인 운영 배포 완료.**
- **현재 운영 소스**: `619e80e` / 배포 `2be6ab04`. 모바일 스크린샷 피드백 수정분까지 운영 반영했습니다. 이전 디자인 배포는 `d62ed212`이며 이번에도 DB migration·예약 데이터·secret 변경이 없습니다.
- **최신 디자인 미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/?v=16
- **운영 관리자**: https://seoul-dodam-dental.pages.dev/admin/login
- **운영 첫 방문**: https://seoul-dodam-dental.pages.dev/first-visit
- **운영 주소**: https://seoul-dodam-dental.pages.dev
- **이번 배포 URL**: https://2be6ab04.seoul-dodam-dental.pages.dev (별도 검색 제외)
- **운영 반영: 배포 완료.** 기존 Pages 프로젝트 `seoul-dodam-dental`의 `main`을 업데이트했습니다. 운영 D1 migration 0002/0003 적용 완료. 기존 DB/R2 연결과 secret은 유지했으며 커스텀 도메인·검색 서비스 등록은 변경하지 않았습니다.
- 실제 환자 파기, 미리보기 DB의 테스트 직원/환자 생성, 외부 예약·전화·카카오·메일 발송은 실행하지 않았습니다. 보안 테스트는 별도 폐기 가능한 D1/R2를 사용합니다.
- 배포 경로는 사용자가 선택한 **본인 Cloudflare 계정(BYOK)** 입니다. Hosted 접근 규칙/신원 연동은 설정하지 않았으며, 현재 권한은 애플리케이션 내부 RBAC입니다. 샌드박스 미리보기와 운영 DB는 서로 별개입니다.

## 모바일 스크린샷 피드백 반영 (CSS v16)
- 사용자 iOS 인앱브라우저 화면의 모형/캡션 겹침과 회전 화살표 문자 선택 현상에 대응했습니다. 모바일 모형과 조작부를 별도 grid 행으로 배치하고 장식 캡션은 모바일에서 숨깁니다. 안내 문구는 유지하고 버튼은 48px로 확대했습니다.
- 회전 화살표는 선택 가능한 문자 대신 aria-hidden SVG, 버튼에는 기존 aria-label을 유지합니다. 조작 버튼에만 user-select/touch-callout 억제를 적용하고 본문·주소·입력 필드의 선택 기능은 유지합니다. 모형 위 세로 스크롤과 pinch zoom을 허용합니다.
- 철학 문장과 3개 원칙은 그대로 두고 모바일 제목/여백/목록 간격을 정리했습니다. 하단 예약 바는 56px 높이와 safe-area를 사용하며 footer/맨 위로 버튼/root scroll-padding-bottom에 여유를 확보합니다.
- PC 배치는 유지하며 예약·회원·관리자·DB·secret은 변경하지 않습니다. 스타일 버전은 `/static/kinetic.css?v=16`입니다.
- `TEST_WEBKIT=1 npm run test:mobile`로 Chromium + Linux WebKit 모바일 에뮬레이션을 검사합니다. WebKit 설치: `npx playwright install --with-deps webkit`. 기본 `npm run test:mobile`은 Chromium만 필요합니다.
- 검사 항목: 320/390/430px, WebGL 터치 회전, 모형/조작부 경계, SVG 무문자 버튼/user-select, 철학 원칙 보존, 뷰포트 높이 500px 전후 변화와 예약 바 위치, 메뉴 동작, 기존 폰트/절약모드.
- **검증 한계**: Linux WebKit은 실제 iPhone/Kakao 브라우저 UI가 아니며 iOS 전용 `-webkit-touch-callout`을 지원하지 않습니다. 지원 여부를 결과에 기록하며 이를 native long-press/키보드/홈 인디케이터 실기기 검증으로 주장하지 않습니다. 사용자의 인앱브라우저에서 최종 확인이 필요합니다.
- 캡처: `.artifacts/mobile-fix-{chromium,webkit}-{hero,philosophy}.png`. 모바일 8그룹(Chromium/WebKit 포함), 모션 9그룹, 환자 동선 8그룹, 디자인 80화면, SEO 700페이지, 보안 8그룹을 통과했습니다. 운영 배포 `2be6ab04`에 반영 완료. 실제 운영 URL의 CSS v16과 WebKit 390px에서 모형/조작부 분리, 캡션 숨김, SVG 회전 조작, 가로 넘침 없음, JavaScript 오류 없음을 확인했습니다. 네이티브 iOS/Kakao long-press 실기기 확인은 별개입니다.

## 디자인 1~6 전체 마감 — 운영 반영 완료
1. 히어로: 첫 제목 줄은 작고 차분하게, 주요 두 줄은 크게 구성. 작은 영문 배지/떠다니는 라벨을 줄이고, 입체 치아 뒤 은은한 타원 배경과 단일 캡션 사용. 원문 슬로건과 ‘도담의 다른 생각’ 링크 유지.
2. CTA: 상단 네이버 예약은 테두리형, 우측 문의 도구는 중립 톤. 모바일 하단 네이버 예약은 기존 선명한 그린 유지. 44px 이상 터치 영역·원래 href·외부 링크 속성·집계 로직 유지.
3. 읽기 동선: 홈의 상황 안내만 압축형 5링크로 변경. 진료 목록의 자세한 안내는 유지. 철학 → 원장 → 핵심 진료 순서, 빠른 내원 안내는 방문 정보 앞에 배치. 공간 사진 3장/버튼/진행률/키보드·모바일 가로 스크롤을 유지하면서 PC pin 거리 비율 1.05 → 0.62로 축소.
4. 원장 소개: 실제 한휘림 원장 사진을 비대칭으로 크게 배치하고, 원문 ‘살릴 수 있는 방법이 하나라도 남아 있으면, 그것부터 합니다’를 중심 문장으로 사용. 약력은 보조 정보로 정돈. 얼굴 생성·변형 없음.
5. 사진: 실제 v2 이미지 URL/파일/원본은 그대로 유지. 홈의 공간과 인물 이미지에만 소폭 brightness/saturation CSS 필터를 적용하고 역할별 object-position/프레임을 조정. CT는 contain으로 장비 전체를 표시. 이는 원본 픽셀·촬영 메타데이터를 수정하거나 색 교정을 인증한 것이 아닙니다. 치료 사례와 CMS 업로드에는 필터를 적용하지 않습니다.
6. 공통 디자인: 얇은 궤도 선·일부 모서리 곡선·공통 캡션으로 연결. 보존/치주/임플란트 패널은 이미지 위치와 프레임을 구분. 튀는 elastic 모션을 부드러운 power3 감속으로 바꾸고, 치아의 부유·회전·보조광·그림자를 절제. reduced-motion·일시정지·no-JS/SVG fallback 유지.

- 1440px 초기 시각 확인에서 홈 상황 안내는 약 272px, 철학 약 665px입니다. 특정 테스트 viewport/폰트 상태의 측정치이며 모든 기기의 길이/성능 개선율을 의미하지 않습니다.
- CSS `/static/kinetic.css?v=15`, 브라우저 경험 `/static/experience/main.js?v=12`. 기존 폰트 v2와 사진은 보존합니다.
- 예약/회원/관리자/집계/파일 보안 라우트·DB migration·운영 secret은 이번 작업에서 변경하지 않았습니다.
- 새 회귀 검사: 상황 링크 5개와 최소 높이, 원장 섹션 순서, 상단/하단 예약 버튼의 대비 위계, 사진 원본 URL, 짧아진 갤러리 pin과 전체 사진 탐색. 기존 SEO·모바일·모션·환자 동선·보안 검사와 함께 확인합니다.
- 검증 완료: typecheck/build, 모바일 6그룹, 모션 9그룹, 환자 동선 8그룹, 공개 HTML 700개, 디자인 80개 화면 조합과 신규 편집 디자인 검사, 보안 8그룹 모두 통과. 320/390px 원장 아바타의 34px 폭/컨테이너 내 배치도 별도 확인했습니다. 원장·CT·공간·모바일 구간 시각 검수에서 중대한 겹침/잘림을 발견하지 않았습니다.
- 현재 Worker 543.02kB (gzip 172.13kB). 정적 사진·폰트 파일은 변경하지 않았고 초기 Core v2만 로딩되는 기존 모바일 조건을 유지했습니다.
- 결과와 캡처는 `.artifacts/quiet-*.png` 및 기존 `*-audit.json`/`*-results.json`에 보관합니다. 코드 백업에는 민감한 운영 DB export나 테스트 산출물을 포함하지 않습니다. 최신 디자인은 운영 배포 `d62ed212`에 반영했습니다.

## 최신 디자인 배포 검증 (2026-09-07)
- 기존 사용자 Cloudflare Pages `seoul-dodam-dental`, production branch `main`에 소스 `2ece8da` 배포. URL: https://seoul-dodam-dental.pages.dev/
- 실제 운영 HTML에서 압축 상황 안내, 원장 소개 우선 배치, CSS v15 적용 확인. 주요 페이지·새 JS/CSS/3D chunk HTTP 200 및 관리자 비로그인 접근 302 확인.
- 실제 운영 홈 Chromium 1440/390px 모두 입체 치아 WebGL 로딩, 제목 표시, 가로 넘침 없음, 페이지 JavaScript 오류 없음. 테스트 전환/외부 분석 요청 차단, 실제 예약 제출/직원 생성/환자 삭제는 실행하지 않았습니다.
- 디자인 배포만 수행했으며 DB/R2 콘텐츠나 secret은 변경하지 않았습니다. 아래 기록은 이전 예약·보안 릴리스의 배포 이력입니다.

## 이전 운영 배포 기록 (2026-09-07)
- 배포 시각: 약 16:32 KST. 운영 앱 소스 commit `637bbdf`, 배포 식별자 `6c4eab5e`. 이 이후 README만 변경한 문서 commit은 운영 앱 재배포가 아닙니다.
- 배포 전 운영 D1 SQL export와 Time Travel 복구 지점을 확보했습니다. SQL은 개인정보를 포함할 수 있어 `.artifacts/dodam-production-predeploy-2026-09-07.sql`에 권한 0600으로 저장하고 Git/일반 코드 백업에서 제외했습니다. 복구 지점은 `.artifacts/production-recovery-point-2026-09-07.json`에 기록했습니다.
- 기존 회원·예약·업로드 메타데이터·게시물의 건수를 마이그레이션 전후/배포 후 대조하여 유지됨을 확인했습니다. 개인정보 원문을 검증 결과나 Git에 기록하지 않았습니다. 테스트 직원·회원·예약 생성, 기존 환자 삭제, R2 변경은 실행하지 않았습니다.
- 운영 secret `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_URL`, `NOTIFICATION_EMAIL`이 배포 후에도 유지됩니다. 값 자체를 로그/문서에 기록하거나 개발용 값으로 덮어쓰지 않았습니다.
- `RESEND_API_KEY`와 Google OAuth credentials는 운영에 설정돼 있지 않습니다. 자동 메일 알림·Google 로그인은 현재 활성화되지 않았고 실제 발송/인증 테스트도 하지 않았습니다. 새 접수는 관리자 업무판에서 확인하세요.
- 실주소 검사 25항목: 주요 페이지/정적 자산 HTTP 200, 관리자 비로그인 302, canonical/검색 제외 분리, 정상 CSRF를 가진 빈 예약 폼의 입력 검증, 외부 origin 변경 요청 403. 빈 폼은 저장하지 않았습니다.
- 운영 홈을 Chromium 1440/390px에서 확인: H1 1개·표시 정상, 가로 넘침 0, 공식 네이버 링크 존재, 페이지 JavaScript 오류 없음. 테스트 분석 요청은 차단했고 실제 외부 예약/전화/카카오 동작은 실행하지 않았습니다.
- 운영 직원 계정은 배포 검증 시 0개입니다. 기존 관리자 비밀번호로 첫 개인 관리책임자 계정을 만든 후 업무판을 사용해야 합니다. 기존 구형 세션은 재로그인이 필요합니다.
- 이전 Pages 배포는 `41f295a0-af00-45dd-b586-16cb59c53689`입니다. 복구 시 코드 rollback을 먼저 검토하고, 전체 DB 복원은 이후 접수 손실 위험을 확인한 책임자 승인 없이는 실행하지 마세요. 이번 migration은 추가형이며 DB 복원/rollback 훈련을 실행한 것은 아닙니다.
- 실주소 검증 기록: `.artifacts/production-release-audit-2026-09-07.json`. 모든 민감한 백업·원본 키 inventory는 비공개/Git 제외입니다.

## 승인된 디자인·자료와 보존한 기능
신청서 XLSX의 서울도담치과/한휘림 원장 행 및 회신 PDF에 근거합니다. 원문은 비공개 `.artifacts/`에 보관하며 Git/공개 자산에 넣지 않습니다.

| 근거 | 유지하는 방향 |
| --- | --- |
| 신청서 Q24 | 깔끔·모던, 따뜻·친근 |
| 신청서 Q25 + 회신 A9 | 블루 메인 + 자연을 상징하는 그린 포인트 |
| 신청서 Q23 + 회신 A5 | 이해될 때까지 설명하고, 필요한 만큼만 치료합니다 |
| 신청서 Q12–13 + 회신 A1 | VPT·크라운 → 치주치료 → 보존 불가 시 임플란트 |
| 회신 철학 | 치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다 |
| 회신 A3/A6 | 통증 배려, 도입 예정 장비를 실제 보유로 표시하지 않음 |

“내 치아를 위한 조금 다른 생각, 도담”, Wanted Sans, 보호 고리와 HEX `#0069B3`·`#B9E7A6`는 디자인 해석입니다.
- 실제 사진 22장+작은 WebP 22장. 실제 실내 촬영·장비 매칭·원장 크롭 유지. 얼굴 생성/변형 없음.
- 원본 재처리: `DODAM_PHOTO_SOURCE=/path/to/originals node scripts/process-images.mjs`. 기본 원본 경로 `/home/user/dodam_src`, Git 제외.
- 입체 치아/보호 고리, 마우스·펜 회전, 모바일 회전 버튼, 모션 토글, reduced-motion, SVG fallback.
- GSAP 스크롤, PC 가로 갤러리, 모바일 네이티브 갤러리. 브라우저 스크롤을 가로채지 않습니다.
- 공통 메뉴·푸터·읽기 목차·FAQ·주요 44px 버튼. 공개 화면의 승인된 디자인은 이번 업무판 작업에서 변경하지 않았습니다.
- 가짜 후기·사례·성과 수치 추가 없음. 지도·주차 정보의 외부 자료 차이와 원장 영상은 별도 검토 범위입니다.

## 직원용 사용 안내
### 관리자 접속
1. `/admin/login`에서 기존 관리자 비밀번호 하나를 입력합니다.
2. 로그인하면 `/admin` 대시보드에서 예약·사례·칼럼·공지를 바로 관리합니다. 최초 계정 생성은 필요 없습니다.
3. 민감 작업의 재인증에는 동일한 관리자 비밀번호를 입력합니다.
4. 작업 후 로그아웃합니다. 공용 관리자 로그인은 작업자 개인을 구분하지 않으며 로그아웃 시 다른 공용 관리자 세션도 해제됩니다.

기존 직원 계정·역할 기능은 호환 유지합니다. 다음 표는 개인 직원 세션에 적용되는 접근 범위이며 기본 비밀번호 전용 로그인은 전체 관리 권한입니다.

| 역할 | 접근 범위 |
| --- | --- |
| 관리책임자 `owner` | 전체 관리, 직원·통계·회원·설정·파기 승인 |
| 예약 담당 `reception` | 예약 업무판·상세·담당/연락/상태 수정 |
| 콘텐츠 담당 `editor` | 사례·칼럼·공지·이미지 업로드. 예약/회원 접근 불가 |

- 권한 검사는 메뉴 숨김이 아니라 서버 라우트에서 적용합니다.
- 마지막 활성 관리책임자를 비활성화하거나 다른 역할로 내릴 수 없습니다.
- 이름·역할·활성 상태·비밀번호 변경 시 해당 직원의 기존 세션을 무효화합니다. 본인 계정을 수정하면 재로그인합니다.
- 계정은 삭제 대신 비활성화하여 작업 이력의 연결을 유지합니다.
- 관리자 비밀번호 분실 복구 UI는 없습니다. 변경이 필요하면 운영 책임자의 승인 후 Cloudflare의 `ADMIN_PASSWORD` secret을 갱신해야 합니다. 공개 문서·화면·Git에 비밀번호를 기록하지 마세요.

### 예약 응대 업무판
1. `/admin/reservations`에서 확인 대기·일정 확정·처리 완료·취소 접수를 확인합니다.
2. 예약 상태·연락 상태·담당자로 필터링합니다. 페이지당 최대 50건이며 상단 요약은 전체 데이터 기준입니다.
3. 카드를 열어 원문 문의를 확인하고 담당자·이번 연락 결과·예약 상태·다음 연락 예정 시각을 저장합니다. 입력/표시 시각은 한국시간, DB 저장은 UTC입니다.
4. 같은 연락처의 최근 30일 접수는 최대 5건까지 중복 가능성으로 표시합니다. 동일인 확정이나 자동 병합은 하지 않습니다.
5. 두 직원이 동시에 저장하면 예약 버전이 일치하는 첫 저장만 처리하고 뒤 요청은 409로 중단합니다. 최신 화면을 확인하고 다시 저장하세요.

- 연락 상태: 연락 기록 없음 / 연락 시도 / 통화 확인. 기존 예약의 과거 연락 여부는 추정하지 않습니다.
- 처리 결과: 상태·담당만 변경 / 전화 부재 / 전화 연결 / 카카오 안내 발송 **기록**. 실제 전화나 메시지를 자동 실행하지 않습니다.
- 목록에는 전화 끝자리만 표시하며 문의/증상 원문은 권한이 있는 상세 화면에서만 표시합니다.
- 응대 이력은 수정 세션의 관리자/직원 식별자, 상태·담당 계정·연락 상태·재연락 시각·보존 검토 표시의 전후 값으로 구성합니다. 공용 관리자 세션은 실제 작업자 개인을 구분하지 못합니다. 별도 자유 메모에 환자 건강 정보를 중복 저장하지 않습니다. 최근 100개 이력을 표시합니다.
- 네이버 예약·전화·카카오 기록을 가져오는 통합 CRM이 아닙니다. 홈페이지 접수만 관리합니다. 상태 변경으로 접수 전환 집계를 추가하지 않습니다.

### 보유기간 확인과 승인 파기
`/admin/privacy`는 관리책임자 전용이며 **자동 삭제하지 않습니다**.
- 후보: 처리 완료 또는 취소, 보존 검토 표시 없음, 접수일과 유효한 희망일 중 늦은 날에서 1년 경과. 확인 대기·일정 확정·미래 일정·접수일 확인 불가·보존 검토 대상은 제외합니다.
- 최대 50건 미리보기 → 현재 비밀번호 재확인 → `만료 예약 삭제` 문구 입력 → 승인 실행.
- 서명된 미리보기는 직원 ID/세션 버전·origin·예약 ID/버전·nonce와 10분 만료에 묶입니다. 토큰에 이름·전화·문의는 넣지 않습니다.
- 미리보기 이후 대상이 바뀌면 전체 작업을 중단합니다. single-use receipt와 D1 transaction을 사용하며 FK cascade로 응대 이력도 함께 삭제합니다. 예약 건수는 `DELETE ... RETURNING id` 결과로 계산합니다.
- 파기 감사 기록에는 직원·건수·범위만 남기며 삭제한 환자 정보나 예약 ID 목록을 기록하지 않습니다.
- **삭제하지 않는 것**: 회원 계정, 의무기록, 사례/R2 사진, 네이버 예약, 외부 이메일, 백업. 이들은 별도 보존·파기 절차가 필요합니다.
- 1년 기준은 구현된 홈페이지 접수 검토 기준이지 모든 의료 정보의 법정 보유기간이라는 뜻이 아닙니다. 병원 책임자의 개인정보·법적 보존 정책 승인 후 운영해야 합니다. 실제 환자 파기는 테스트하지 않았습니다.

## 보안 구현과 한계
### 세션·회원 소유권
- 회원/직원 토큰은 purpose와 DB session version을 검증합니다. 매 요청 현재 계정 존재·활성·버전을 확인하며 구형 토큰은 거부합니다.
- 회원 세션에 이름/이메일을 담지 않습니다. 회원 30일, 직원 24시간 유효. HttpOnly 쿠키, HTTPS Secure, 직원 Strict/회원 Lax SameSite.
- 로그아웃도 세션 버전을 증가시켜 해당 계정의 기존 세션들을 무효화합니다. 비밀번호 변경/탈퇴/직원 비활성화 후 오래된 토큰을 재사용할 수 없습니다.
- 회원 예약 조회는 `user_id` 일치만 허용합니다. 같은 이메일로 가입했다고 익명 접수를 볼 수 없습니다. 탈퇴 시 예약의 회원 연결을 분리합니다.
- 회원 비밀번호 변경/탈퇴는 현재 비밀번호 확인. Google 계정 탈퇴는 15분 이내 로그인 확인을 사용합니다.
- Google OAuth state는 HttpOnly 브라우저 쿠키와 일치해야 합니다. 검증된 이메일·provider subject를 요구하며 같은 이메일의 로컬 계정을 자동 연결하지 않습니다. 실제 Google 왕복 인증은 검증하지 않았습니다.
- 비밀번호는 기존 salted PBKDF2-SHA256 100,000회 단방향 해시를 유지합니다. MFA·passkey·외부 비밀번호 초기화 발송은 미구현입니다.

### 변경 요청·로그인 보호
- unsafe method는 정확한 동일 origin을 요구하며 `Sec-Fetch-Site`가 있으면 same-origin이어야 합니다.
- HttpOnly CSRF seed 쿠키와 origin에 결합된 8시간 서명 토큰을 사용합니다. 서버 POST form에 `_csrf`, 관리자 AJAX에 `X-CSRF-Token`을 사용합니다.
- `/api/conversions`는 자체 origin-bound 서명 ticket/2KB 검사가 있어 일반 CSRF 토큰 검사에서 제외합니다.
- 요청 본문 일반 64KiB, 관리자 업로드/CMS multipart 34MiB, 개별 파일 8MiB 제한.
- D1 atomic fixed-window 로그인 예산: 행위별 15분 동안 계정 식별자 10회·주소 40회. 성공도 예산에 포함합니다. 만료 행은 관련 요청에서 정리합니다.
- rate table에는 HMAC 키·횟수·만료만 저장합니다. 원문 IP/로그인 ID/비밀번호를 기록하지 않습니다. 플랫폼의 CF-Connecting-IP를 사용하며 X-Forwarded-For를 신뢰하지 않습니다. 로컬에서는 공용 fallback을 사용합니다.
- 완전한 분산 봇 방어나 독립 보안 인증이 아닙니다. 실제 운영 호스트의 프록시 헤더 신뢰 경계를 확인해야 합니다.

### CMS·파일·설정
- 서버는 Workers 호환 `xss` whitelist, 브라우저는 DOMPurify를 사용합니다. 저장과 표시 모두 검사하며 paste/drop/HTML 삽입·링크 scheme을 제한합니다.
- script/handler/form/SVG/MathML/iframe 등과 외부 본문 추적 이미지를 제거합니다. `_blank` 링크는 noopener/noreferrer를 적용합니다.
- JPG/PNG/WebP/GIF의 MIME·실제 헤더 signature·크기·허용 경로를 검사하고 서버에서 고유 파일명을 만듭니다. 새 첨부는 사용자 제출 hidden key만으로 교체하지 않습니다. 저장 실패 시 신규 R2 객체를 정리합니다.
- **파일 검사 한계**: 완전한 악성코드 검사·이미지 디코딩/재인코딩·EXIF 제거는 아닙니다.
- R2는 게시물 참조와 공개 여부를 확인합니다. 비공개/미참조 파일은 일반 방문자에게 404, 치료 후 사진은 회원 인증이 추가로 필요합니다. 책임자/콘텐츠 담당은 편집 목적으로 검토할 수 있습니다.
- R2 응답은 nosniff, same-origin, private/no-store를 유지합니다. 공개 이미지라도 브라우저/CDN 장기 캐시를 허용하지 않아 다음 요청에서 게시 여부와 권한을 다시 확인합니다. 이미지 검색 허용과 캐시 허용은 별개입니다. 승인된 `/static/img/` 실제 사진·정적 캐시는 변경하지 않았습니다.
- 운영 origin과 정확히 일치하는 요청에서 **공개 칼럼/공지의 대표 이미지 또는 실제 렌더링되는 본문 이미지**만 `index, follow`입니다. canonical Link 헤더는 쿼리를 제외한 운영 파일 URL입니다. 실제 검색 수록/순위는 보장하지 않습니다.
- 미리보기·초안/미참조 이미지의 직원 열람·진료 사례 이미지는 `noindex, noimageindex`를 유지합니다. 진료 사례 파일의 robots 규칙도 유지합니다. robots/noindex는 접근제어가 아니며 파일 라우트가 별도로 권한을 검사합니다.
- 본문 URL 문자열 포함 여부만으로 공개하지 않습니다. 표시용 sanitizer를 통과한 실제 img/src의 정확한 경로 일치를 추가 검사하므로 일반 텍스트·링크·주석·제거된 script/template·긴 파일명의 접두어 일치는 공개 근거가 아닙니다.
- 파일이 사례의 치료 후 슬롯으로 참조되면 칼럼 대표 이미지로도 쓰이더라도 회원 인증이 우선입니다. 비공개 치료 후 참조에 공개 치료 전 참조가 섞여 있어도 회원에게 공개하지 않습니다. 책임자/콘텐츠 담당만 검토할 수 있습니다. 대소문자가 다른 cases/after 경로도 보호합니다.
- 공개 글 여러 개가 같은 이미지를 사용하면 그중 하나만 비공개로 바꾸어도 다른 공개 참조에 의해 계속 공개될 수 있습니다. 검색 결과·이미 내려받은 외부 복제본을 즉시 회수할 수는 없습니다. 새 키로 다시 업로드한 동일 사진은 자동으로 인식하지 않습니다. 편집 화면에도 이 안내를 표시합니다.
- 허용 키는 cases/before, cases/after, columns, notices, uploads 하위 영문·숫자·밑줄·하이픈 단일 파일명과 jpg/jpeg/png/webp/gif 확장자입니다. 중첩 폴더·이름 중간의 점·SVG·미지원/없는 Content-Type은 임의로 허용하지 않고 차단합니다.
- 지원하는 MIME의 대소문자 차이와 과거 파라미터(예: `IMAGE/PNG`, `image/jpeg; charset=binary`)는 안전한 기본 image Content-Type으로 정규화합니다. 미지원/미지정 형식을 확장자로 추정해 열어주지 않습니다.
- 과거 일반 img 태그의 작은따옴표·따옴표 생략·태그 대문자는 격리 fixture에서 검사했습니다. 키 일부를 HTML entity로 인코딩한 과거 본문은 후보 조회에서 제외될 수 있어 검토 후 정상 CMS 저장이 필요합니다. 새 CMS 저장은 sanitizer가 경로를 정규화합니다.
- 배포 전 운영 게시물 5건과 등록된 업로드 키를 비공개 조회했습니다. 공개 게시물의 업로드 파일 참조는 없었으며 본문 sanitizer 결과도 기존 내용과 같았습니다. 지원하지 않는 미참조 업로드 키 1건은 발견했지만 삭제/변경하지 않았습니다. R2 bucket 통계는 0개 객체였으며 원본 이미지 단위의 동의/메타데이터 전수 검수를 대신하지 않습니다. 이후 업로드와 별도 원본은 운영자가 검토해야 합니다.
- 관리자 설정은 허용 키만 저장하며 GA4 ID·연락처·URL 등을 검증하고 잘못된 과거 값도 읽기에서 제외합니다. GA4는 `/admin`, `/auth`, `/reservation`에서 로딩하지 않습니다.
- 일반 `staff_audit` 보유기간 정리, 보안 알림/모니터링, 복구 자동화는 미구현입니다. 최근 작업 화면은 30개만 표시하지만 나머지 행을 자동 파기하지 않습니다.

## 환자 동선·진료 안내
- 메인과 `/treatments#patient-situations`에 신경치료 권유, 잇몸 출혈, 발치 권유, 마취 불안, 검진/스케일링 안내 링크. JS 없는 일반 탐색이며 진단·치료 추천 엔진이 아닙니다.
- `/first-visit`: 준비물 요약, 예약→준비→이동→접수·문진→검사·상담→치료 계획 6단계, 불안 안내, FAQ. `#visit-preparation`, `#visit-steps`, `#anxiety`, `#first-visit-faq` 고정 목차와 가림 방지 여백.
- 신분증·복용약·기존 자료 안내, 약 임의 중단 금지, 수면(진정) 진료 미시행. 당일 치료/소요시간을 보장하지 않습니다.
- 핵심 3개 진료에 검사 확인 사항·선택지·질문·관련 장비/비용/예약 링크. 비교표는 caption·열 scope·region·키보드 가로 스크롤과 일반 비교라는 설명을 제공합니다.
- 12개 진료 비용 링크는 `treatmentPricingUrl()`의 고정 매핑 사용. 수가표 ID: implant, crown, vpt, restorative, dentures, pediatric, other, whitening, insured. 기존 한글/percent-encoded fragment 별칭 유지.
- 장비 바로가기: `/floor-guide#equip-보존`, `#equip-무통`, `#equip-진단`. VPT 안내에는 별도 크라운 비용 링크도 있습니다.
- 기존 수가 숫자·단위·기준일은 보존했습니다. 일괄 면세/동일 단위/임플란트 식립+보철 포함 단정을 제거했으며 포함 범위·과세 고지는 병원 검수 대상입니다.
- BFCache 복귀 시 `data-once` 폼의 제출 버튼을 복원하되 자동 재접수/집계하지 않습니다.
- VPT 실패·치아 삭제량·밀봉 효과, 치주 재생/관리 주기, 임플란트 통증/수명/진단 관련 단정과 근거 없는 수치 비교를 완화했습니다.
- **의료진 재검토 전**: `2026-09-03`은 원본 자료 검토 이력으로만 표시합니다. 수정 핵심 3개 및 관련 지역 페이지에 새 의료 검수가 있었다고 표시하지 않으며 해당 reviewer 기반 메타를 생략합니다. 의료진 Person 스키마는 유지합니다. 원장의 최종 의료·의료광고 검수가 필요합니다.

## 예약·문의 집계와 네이버
- `/admin/stats?scope=production` 또는 `preview`: 관리책임자만 조회. KST 최근 30일 합계·일별·페이지/위치별 행동, 기본 운영 scope. 기존 예약을 소급 집계하지 않습니다.
- 이벤트: `naver_click`, `phone_click`, `kakao_click`, `reservation_click`, 서버 전용 `form_completed`.
- 클릭은 예약/통화/상담 완료가 아니며 홈페이지 접수 저장도 병원의 일정 확정이 아닙니다. 상태 변경은 추가 전환을 만들지 않습니다.
- API payload는 `{event, location, ticket}`만 허용합니다. 고정 page/위치 enum, 30분 origin-bound per-render ticket, 원자적 receipt dedup. 접수 INSERT와 완료 집계는 같은 D1 transaction입니다.
- 집계에는 이름·전화·이메일·증상·입력값·IP·UA·referrer·query·회원/예약 ID를 수집하지 않습니다. 별도 추적 쿠키/localStorage/sessionStorage를 사용하지 않고 GA4로 전달하지 않습니다.
- nonce/event/location의 SHA-256 receipt와 만료만 저장합니다. 같은 화면의 재전송/동시 요청을 제한하되 새로운 화면·재접수는 별개이며 고유 환자/완전한 부정 클릭 방지 기능은 아닙니다.
- 봇 추정·관리자·DNT/GPC 요청 제외, navigation은 집계를 기다리지 않으며 재시도 없음. 차단/만료로 누락될 수 있습니다.
- 합계 90일, receipt 30분. 다음 관련 요청/통계 조회 시 lazy cleanup하므로 요청이 없으면 만료 행이 남을 수 있습니다. cron은 사용하지 않습니다.
- 기존 `page_views`의 pathname·UA·시각 저장과 별개입니다. 신규 최소수집 설명을 기존 모든 분석에 확대 적용하지 않습니다.
- 공식 Place: https://m.place.naver.com/hospital/13229580/booking
- 공식 예약: https://m.booking.naver.com/booking/13/bizes/1258951?theme=place&lang=ko&area=ple
- 이전 확인에서 수원 화서동·한휘림 원장·화양로 34·슬로건 대조. 실제 예약 제출 없음. 상단·모바일 바·플로팅·푸터/CTA·메인·예약 화면에서 외부 새 창으로 연결합니다.
- `channels.naverBooking`은 정식 HTTPS 도메인·경로 검증 후 사용합니다. 잘못된 링크는 홈페이지 신청으로 fallback, 빈 설정은 기본값으로 돌아가며 비활성화 수단이 아닙니다. 입력값 전달/API 동기화는 하지 않습니다.

## 모바일·SEO·AEO
- Wanted Sans 원본 1,289,292 bytes → 초기 Core v2 137,164 bytes. 폰트 파일 약 89.4% 감소이지 전체 속도 개선율은 아닙니다. Extended가 전체 문자/가변 축을 보완하고 OFL·v1 파일을 보존합니다.
- 폰트 재생성: `python3 scripts/optimize-fonts.py` (FontTools/Brotli 필요). 문자 범위를 바꾸면 VERSION을 올려 immutable 파일을 덮어쓰지 않습니다. Python은 빌드용입니다.
- 실제 dimensions/srcset, 상단 우선/하단 lazy image. Save-Data/2G에서는 opt-in 이전 3D bundle 미다운로드, 화면 밖/백그라운드 중지·모바일 DPR 제한.
- SSR title/description/canonical/OG/Twitter, H1 하나, CMS H1→H2 렌더링, FAQ 본문/스키마 일치, 점심을 분리한 영업시간.
- 기본 canonical은 기존 운영 주소. SITE_URL은 검증된 HTTPS 운영 origin만 사용하며 다른 origin은 preview noindex입니다. 페이지 번호 자기 canonical, 필터/빈 후속/회원/관리자/API/결과는 noindex.
- 공개 GET/HEAD trailing slash 301, 실제 DB 수정일만 sitemap lastmod. robots는 인증 기능이 아닙니다.
- Dentist/WebSite/WebPage/MedicalWebPage/ProfilePage/Person/MedicalProcedure/BreadcrumbList/FAQPage/DefinedTerm/Article의 안정적 @id. 근거 없는 평점·가격범위·창업일·신규환자 수용·speakable 제거.
- llms는 원문 철학과 공식 목차이며 검색 순위/AI 인용 보장이 아닙니다. 기존 지역×진료 페이지를 대량 삭제/추가/noindex하지 않았습니다.
- 참고: https://developers.google.com/search/docs/appearance/ai-features · https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls · https://developers.google.com/search/updates

## 주요 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/`, `/first-visit`, `/treatments`, `/treatments/:slug` | 상황별·첫 방문·12개 진료, 핵심 `#consultation-guide` |
| `/mission`, `/doctors`, `/doctors/han-hwirim`, `/floor-guide` | 철학·의료진·공간/장비 |
| `/pricing`, `/directions`, `/hours` | 수가·위치·시간 |
| `/reservation?treatment=implant` | 진료 선택, POST 접수, `?ok=1`은 접수 안내이며 확정 아님 |
| `/api/conversions` | 동일 origin 서명 JSON POST 집계 |
| `/admin/login`, POST `/admin/logout` | 최초 설정/직원 인증, 로그아웃 |
| `/admin/reservations` | GET 필터 `status`, `contact`, `assignee`, `page` |
| `/admin/reservations/:id` | GET 상세, POST 응대 저장 (`version`, `status`, `assignee_id`, `outcome`, `followup_at`, owner의 `retention_hold`) |
| `/admin/staff`, `/admin/staff/:id` | 직원 목록/생성·변경, 변경 시 현재 비밀번호 |
| `/admin/privacy`, POST `/admin/privacy/preview`, POST `/admin/privacy/purge` | 보유기간 후보·승인형 파기 |
| `/admin/stats?scope=production` 또는 `preview` | 책임자 집계 |
| `/admin/cases`, `/admin/columns`, `/admin/notices`, `/admin/api/upload` | CMS·파일 업로드 |
| `/admin/settings`, `/admin/members` | 책임자 기본정보·회원 관리 |
| `/auth/register`, `/auth/login`, `/auth/mypage`, POST `/auth/delete` | 회원 가입·로그인·예약 조회·탈퇴 |
| `/auth/google`, `/auth/google/callback` | Google OAuth, 실제 연동 검증 별도 |
| `/cases/gallery`, `/cases/gallery/:slug` | 사례 (`treatment`, `doctor`, `page`) |
| `/column`, `/column/:slug`, `/column/rss.xml`, `/notice`, `/notice/:id` | 공개 게시물 (`treatment`, `page`) |
| `/files/:key`, `/api/regions?q=화서` | 권한 검사 R2 이미지·지역 자동완성 |
| `/faq`, `/encyclopedia`, `/encyclopedia/:slug`, `/area`, `/area/:slug` | FAQ·용어·지역 |
| `/privacy`, `/terms`, `/sitemap`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/health` | 정책·검색·상태 |

## 데이터·개발·검증
- D1 `DB`: site_settings, users, cases, columns, notices, reservations, page_views, uploads.
- migration 0002: conversion_daily, conversion_receipts.
- migration 0003: staff, security_rate_limits, staff_audit, purge_receipts, reservation_events. users에 session_version, reservations에 담당/연락/일시/version/retention_hold 필드 추가.
- R2 `R2`: 사례·칼럼·공지 이미지. 설정 기본값은 `src/data/clinic.ts` + 검증된 D1 설정입니다.
- secrets는 `.dev.vars`/운영 secrets에만 저장합니다. node_modules, dist, .wrangler, .artifacts, 생성된 experience/admin-sanitizer bundle은 Git 제외입니다.
- Worker 런타임에서 Python·Node 파일시스템·장기 실행 프로세스를 사용하지 않습니다. 테스트의 Node/esbuild/Miniflare는 개발 전용입니다.

```bash
cd /home/user/webapp
npm ci
npm run db:migrate:local
npm run typecheck
npm run build
# 처음 시작: 기존 PM2 서비스·포트 3000 정리 후 실행
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
# 무거운 브라우저/Miniflare 검사는 동시에 돌리지 않습니다.
npm run test:security
npm run test:journey
npm run test:seo
npm run test:mobile
npm run test:design
npm run test:kinetic
```

### 최종 검증 기록 (2026-09-07)
- 이미지 정책 보강 후 TypeScript/build 통과. Worker 542.15kB (gzip 172.00kB), 관리자 sanitizer 약 29.1kB.
- Security 8그룹 통과: CSRF/origin, 최초 설정/직원 권한/마지막 owner, 잘못된 설정, 동시 응대 저장, 회원 소유권/세션 무효화, OAuth state 거부, CMS/파일 검사, 파기 재확인·stale snapshot·replay·cascade, 로그인 제한, 320/390/768/1440 fixture 업무판, 외부 추적 이미지 제거. 추가 경계 검사에서도 잘못된 담당 ID·존재하지 않는 날짜/시각을 저장하지 않음, 위조 hidden 첨부 키 무시, 파기 감사 건수에 이력 삭제 건수가 섞이지 않음을 확인했습니다.
- 추가 이미지 정책 검사: 운영/미리보기 origin별 검색 헤더, 정확한 img/src와 대표 이미지 참조, 텍스트/주석/스크립트/접두어 거부, 비공개 전환 후 조건부 요청, HEAD·쿼리 없는 canonical, 여러 게시물/임상 슬롯 공유, 치료 후 회원/직원 권한, 과거 파일명·MIME 경계. 운영 origin은 `app.fetch`의 가상 요청으로만 검사하며 실서버에 요청하지 않습니다. 칼럼·공지의 게시 안내도 320/390/1440px에서 확인했습니다.
- Journey 8그룹 통과: ticket/dedup/scope/필드/만료/DNT/GPC, 접수 transaction/rollback, 24개 화면 조합, 12개 진료의 비용/장비 링크 19개, 키보드 표, no-JS, BFCache 복원.
- SEO: 공개 HTML 700개 및 격리 CMS/운영 canonical 정책 검사, 오류/경고 없음.
- Mobile: 절약모드·opt-in WebGL·작은 이미지·수가 비고·작은 화면 메뉴와 첫 방문/핵심 3개/수가표 Core v2 로딩, 6그룹 통과.
- Design: 80개 화면 조합, 문제 없음. Kinetic: WebGL/회전/모션/갤러리/리사이즈/모바일/reduced-motion/fallback/no-JS 9그룹 통과. 앞선 예약 보안 보강 단계에서는 로컬 Wrangler 재시작으로 디자인 검사가 중단되어 전체 재검사 후 통과한 이력이 있습니다. 이번 이미지 정책의 최종 검사는 typecheck/build → security → SEO → journey → mobile → design → kinetic 순으로 모두 완료했습니다.
- 보안/예약 테스트는 이메일 자격 증명 없는 별도 임시 D1/R2 사용. fixture 캡처에 실제 환자 데이터가 아님을 표시합니다. 실제 미리보기에서 직원/응대 이력/파기 감사/업로드 자산 참조 각 0건 확인.
- HTTPS 미리보기에서 실제 CSRF 토큰을 사용한 빈 이름/전화 POST가 정상 입력 검증까지 도달하는 것을 확인했습니다. 예약 저장/이메일 발송 없음.
- `npm audit --omit=dev`: 알려진 운영 의존성 취약점 0건. 패키지 advisory 확인일 뿐 침투검사/보안 인증을 의미하지 않습니다.
- 결과 파일: `.artifacts/security-audit.json`, `journey-audit.json`, `seo-audit.json`, `mobile-audit.json`, `design-smoke-results.json`, `kinetic-smoke-results.json`, fixture 캡처. 비공개·Git 제외.
- 이 검사는 전체 CRUD·실기기·부하/운영 가용성·독립 침투검사·법적 적합성을 보증하지 않습니다. 외부 인증/발송/예약 완료는 테스트하지 않았습니다.

## 배포 후 인수 체크리스트·미구현
1. 병원 책임자의 의료 표현·수가 포함/과세·환자 동의·개인정보 보유/파기 정책 검수. 실제 검토 이후에만 의료 reviewer/날짜 갱신.
2. 직원 계정 발급, 역할 배정, 퇴사 비활성화, 마지막 owner 복구, 외부 이메일/백업 파기, 감사 로그 보유기간의 책임자와 절차 확정.
3. 실제 운영 R2 키/객체 존재/MIME/게시 참조의 비공개 inventory 대조. 구현한 공개 CMS 검색 허용·임상 이미지 검색 제외·전체 업로드 no-store 정책의 병원 승인, 이미지 원본 환자 동의·비식별화·메타데이터 점검. 새 파일로 재업로드한 동일 사진의 자동 식별은 미구현입니다.
4. BYOK 운영 배포와 migration 0002/0003, 기존 secret 유지, 실주소 origin/CSRF 검증은 완료했습니다. 첫 관리책임자 계정 생성·역할 발급과 기존 회원의 재로그인은 운영자가 진행해야 합니다. 실제 예약 생성/응대/메일의 종단 간 업무 수용 검사는 별도 승인 후 진행합니다.
5. 백업 복구 훈련·모니터링·장애 알림·MFA·비밀번호 복구·일반 감사 로그 자동 정리는 별도 개발 범위입니다. 코드 백업은 운영 D1/R2 데이터 복구 체계를 대체하지 않습니다.
6. 실제 Safari/iOS/Android·저속 네트워크·부하·독립 보안 검사, OAuth/Resend와 발신 도메인 검증. 로컬 Wrangler 재시작 이력은 운영 가용성 검증과 별개입니다.
7. Search Console·네이버 소유권/사이트맵, 실제 도메인 구조화 데이터·PageSpeed/Core Web Vitals 검증. 지역 페이지는 유입/중복 데이터를 보고 조정합니다.
8. 네이버 API 동기화·고유 환자 attribution·광고 전환율·전체 CMS 승인 워크플로·지도/주차 재확인·원장 영상은 미구현/별도 범위입니다.
