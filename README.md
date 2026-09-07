# 서울도담치과의원 홈페이지 (webapp)

## 프로젝트와 배포 상태
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 자연치아 보존 철학을 담은 브랜드 홈페이지와 환자 중심 진료·예약 안내
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2. Vanilla JS, GSAP/ScrollTrigger, Three.js WebGL.
- **작업 경로 / 브랜치**: `/home/user/webapp` / `main`
- **최근 변경**: 2026-09-07 모바일 리소스, 메타·헤딩·캐노니컬·스키마·AEO 정비
- **미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai/?v=11
- **기존 운영 주소**: https://seoul-dodam-dental.pages.dev
- **운영 반영**: 이번 개편은 미배포. 운영 사이트, 운영 D1/R2, 도메인은 수정하지 않았습니다.
- 미리보기는 임시 서비스입니다. 배포 요청 시 사용자 계정 Cloudflare 또는 Genspark Hosted 중 경로를 별도로 확인합니다.

## 원문과 디자인 해석
신청서 XLSX에서 서울도담치과 / 한휘림 원장 행을 확인하고 홈페이지 제작 질문 회신 PDF와 대조했습니다. 원문 자료는 `.artifacts/`에만 임시 보관하며 Git과 공개 자산에 포함하지 않습니다.

| 근거 | 확인 내용 | 반영 |
| --- | --- | --- |
| 신청서 Q24 | 깔끔·모던, 따뜻·친근 | 밝은 바탕, 한글 타이포, 둥근 보호 고리 |
| 신청서 Q25 + 회신 A9 | 블루 메인 + 자연을 상징하는 그린 포인트 | 로고 블루 `#0069B3`, 그린 `#B9E7A6` |
| 신청서 Q23 + 회신 A5 | 이해될 때까지 설명하고, 필요한 만큼만 치료합니다 | `clinic.slogan` 원문 유지 |
| 신청서 Q12–13 + 회신 A1 | VPT·크라운 → 치주치료 → 보존 불가 시 임플란트 | 핵심 진료 순서 유지 |
| 회신 진료 철학 | 치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다 | 원장 인용으로 사용 |
| 회신 A3 | 통증에 예민한 원장, 충분한 설명, 세심한 통증 배려 | 의료진과 보유 장비 안내 |
| 회신 A6 | 일부 장비는 도입 예정 | 도입 예정 장비를 실제 보유로 추가하지 않음 |
| 회신 A11 | 가족 이야기는 공개 가능한 표현 사용 | 사적인 세부 내용 추가 없음 |

“내 치아를 위한 조금 다른 생각, 도담” 헤드라인, Wanted Sans, 보호 고리, 구체적인 그린 HEX와 스크롤 연출은 디자인 해석입니다. 원장이 직접 지정한 문구·서체·색상값으로 표시하지 않습니다.

## 완료된 디자인과 기능
- 큰 한글 타이포와 원문 슬로건, 직접 제작한 입체 치아·보호 고리. 실제 해부 모형이 아닌 브랜드 그래픽임을 명시합니다.
- 마우스/펜 회전, 모바일 회전 버튼, 모션 토글, 시스템 모션 감소 설정, WebGL 미지원 SVG 폴백.
- GSAP 스크롤, PC 가로 갤러리, 모바일 네이티브 가로 갤러리. 브라우저 기본 스크롤을 가로채지 않습니다.
- 의료진·철학·진료·FAQ·백과사전·내원·예약·회원 화면의 공통 스타일.
- 현재 메뉴 표시, 상세 진료의 활성 목차, 고정 헤더 아래 앵커 정렬, FAQ 들여쓰기·포커스, 최소 44px 주요 조작 버튼.
- 기존 회원·관리자 CMS, 예약 저장, 서버 측 치료 후 사진 로그인 확인 유지.
- 가짜 후기·사례·게시물 생성 없음. 빈 목록에는 진료 가이드 동선을 제공합니다.

## 실제 사진 보완
- 제공된 실제 촬영 원본 22장과 작은 WebP 22개를 사용합니다. 파일명 `-v2`로 구분하며 기존 사진을 보존합니다.
- 진료복 메인 원장 사진, 흰 가운 소개 사진, 작은 프로필용 크롭을 구분했습니다. 얼굴 생성·변형은 하지 않았습니다.
- 대기실·진료실·소독 공간은 AI 수정 interior 폴더가 아닌 실제 촬영 원본입니다.
- 마취액 워머, DENOPS, EXARO, PHL 등의 잘못된 사진 매칭과 소독 공간 설명을 교정했습니다.
- 재생성: `DODAM_PHOTO_SOURCE=/path/to/supplied/originals node scripts/process-images.mjs`. 기본 원본 경로는 `/home/user/dodam_src`이며 원본은 Git에 포함하지 않습니다.

## 모바일 최적화
- **글꼴 초기 파일**: 기존 1,289,292 bytes → Core 136,256 bytes (약 89.4% 감소). 같은 Wanted Sans와 가변 굵기를 유지합니다.
- `unicode-range`로 Core/Extended를 분리했습니다. 원본 cmap의 모든 문자는 두 파일 합집합으로 보존됩니다. 드문 글자나 새 CMS 콘텐츠에 필요하면 Extended를 추가로 받습니다. 사이트 전체 전송량이나 로딩 시간이 89% 줄었다는 의미는 아닙니다.
- 글꼴 재생성: `python3 -m pip install 'fonttools[woff]'` 후 `python3 scripts/optimize-fonts.py`. OFL 원문과 원본 폰트를 보존합니다. 파이썬은 빌드 도구이며 Worker 런타임에서 사용하지 않습니다.
- `scripts/build-image-manifest.mjs`가 실제 이미지 픽셀 크기와 srcset을 생성합니다. `npm run build`에 포함되어 있고 서버에서는 파일시스템을 읽지 않습니다.
- 메인·진료·의료진 사진은 `srcset/sizes`로 작은 화면에 적절한 파일을 선택합니다. 상단 이미지는 높은 우선순위, 아래 사진은 lazy loading을 유지합니다.
- Save-Data / 2G에서는 SVG를 먼저 보여주고 사용자가 “입체 모형 켜기”를 누를 때 Three.js를 내려받습니다. 일반 연결에서는 기존 입체 경험을 유지합니다.
- 모바일 첫 화면의 제목을 진입 애니메이션 때문에 감추지 않습니다. 이후 섹션 모션은 유지합니다.
- 비급여 표는 모바일에서도 조건·비고를 숨기지 않고 키보드 접근 가능한 가로 스크롤 영역으로 제공합니다.
- CSS/JS처럼 내용이 바뀌는 고정 URL은 캐시 재검증, 버전 고정 폰트는 장기 캐시를 사용합니다. 개인화 HTML은 `private, no-store`입니다.

## SEO: 메타·헤딩·캐노니컬·색인
- SSR `<head>`에 페이지별 title, description, 단일 canonical, robots, OG/Twitter 메타를 출력합니다. 이미지 크기는 실제 자산 정보가 있을 때만 출력하며 대체 설명과 실제 게시/수정일을 지원합니다.
- 본문 H1은 한 개를 유지하고 H2/H3 흐름을 검사합니다. CMS 본문의 H1은 렌더링 시 H2로 바꾸며 저장 원문은 수정하지 않습니다.
- 운영 canonical 기본값은 `https://seoul-dodam-dental.pages.dev`. `SITE_URL`에는 검증된 HTTPS 운영 origin을 설정해야 합니다. localhost/HTTP 설정은 canonical에 쓰지 않습니다.
- 요청 origin이 canonical origin과 다르면 메타 robots와 X-Robots-Tag에 `noindex, follow`를 출력합니다. 따라서 현재 sandbox 미리보기는 검색 색인 대상이 아닙니다.
- 운영에서도 회원·관리자·API, 예약 완료/오류 응답은 색인에서 제외합니다. robots는 인증 장치가 아니며 기존 서버 권한 검사는 별도로 유지합니다.
- 추적/미리보기 파라미터는 canonical에서 제거합니다. 페이지 번호는 실제 다른 내용이므로 자기 URL을 유지하며, 데이터가 있는 목록 2페이지는 indexable입니다. 필터 결과와 빈 후속 페이지는 noindex입니다.
- 공개 URL의 마지막 `/` 중복은 GET/HEAD에서 301 정규화합니다. POST/R2/관리자·회원 경로는 대상에서 제외합니다.
- 사이트맵은 매일의 가짜 lastmod를 제거했습니다. 실제 DB 수정일이 있는 항목에만 날짜를 기입하고 XML을 이스케이프합니다. priority/changefreq는 출력하지 않습니다.
- robots는 단일 `User-agent: *` 그룹을 사용해 특정 봇의 관리자·회원 경로 예외를 없앴습니다. 공개 칼럼 이미지는 크롤링할 수 있고 사례 파일은 보수적으로 제외합니다.

## AEO와 구조화 데이터
- 병원 `Dentist`, 사이트 `WebSite`, 페이지 `WebPage/MedicalWebPage/ProfilePage`, 의료진 `Person`, 진료 `MedicalProcedure`, `BreadcrumbList`, `FAQPage`, `DefinedTerm`, 칼럼 `Article`을 역할별로 구성합니다.
- 병원·의료진·진료·페이지는 동일한 canonical origin의 안정적인 `@id`로 연결됩니다. 검토자와 기존 검토일은 눈에 보이는 본문과 연결하며 신규 의료 검토일을 만들어 넣지 않습니다.
- 진료 요약 상단에 “어떤 진료인가요?”와 기존 `t.short`의 직접 답변을 추가했습니다. 치료 과정·주의사항·FAQ와 의료진 검토 링크를 유지합니다.
- 모든 진료를 NoninvasiveProcedure로 표시하던 오류를 제거했습니다. 원장 개인은 의료기관형 Physician과 혼합하지 않고 Person으로 표현합니다.
- 진료시간 스키마는 점심시간을 나누어 표현합니다. 확인되지 않은 가격 범위·평점·신규환자 수용 여부와 창업일 추정을 제거했습니다.
- FAQ 마크업의 질문/답변이 공개 HTML과 일치하는지 검사합니다. 통합 FAQ에서는 병원 이용 질문을, 각 진료에서는 해당 진료 질문을 마크업합니다. 지역 템플릿의 반복 FAQ 스키마는 제거했습니다.
- 불필요한 speakable 태그를 제거했습니다. `llms.txt`는 원문 철학, VPT → 치주 → 임플란트 순서, 실제 진료시간·주차·예약 조건과 공식 링크로 갱신했습니다. 과거 리뷰 수를 최신 사실처럼 안내하지 않습니다.
- **중요**: llms.txt나 스키마 추가로 검색 순위·AI 인용이 보장되지 않습니다. Google은 FAQ 리치 결과를 2026-05-07부터 중단했고 2026-06에 문서를 제거했다고 공지했습니다. FAQPage는 의미 전달용이지 Google 리치 결과 보장이 아닙니다.

### 참고한 공식 가이드 (2026-09-07 확인)
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/updates (FAQ rich result 종료 및 llms.txt 안내)

## 주요 진입 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/` | 입체 메인, 진료 탭, 공간, FAQ, 내원 |
| `/mission` | 진료 철학 |
| `/doctors`, `/doctors/han-hwirim` | 의료진 목록 / 상세 |
| `/treatments`, `/treatments/:slug` | 12개 진료 안내 |
| `/floor-guide` | 장비·감염관리·공간 |
| `/reservation?treatment=implant` | 희망 진료 선택, POST `/reservation` 접수 |
| `/reservation?ok=1` | 접수 안내, 예약 확정 아님, noindex |
| `/directions`, `/hours`, `/pricing` | 위치·시간·비급여 |
| `/faq`, `/encyclopedia`, `/encyclopedia/:slug` | 질문·용어 |
| `/column`, `/column/:slug`, `/column/rss.xml` | 칼럼 (`treatment`, `page`) |
| `/notice`, `/notice/:id` | 공지 (`page`) |
| `/cases/gallery`, `/cases/gallery/:slug` | 치료 전후 (`treatment`, `doctor`, `page`) |
| `/auth/register`, `/auth/login`, `/auth/mypage` | 회원 |
| `/admin/login`, `/admin/*` | 기존 관리자 CMS |
| `/files/:key`, `/api/regions?q=화서` | R2 파일 / 지역 자동완성 |
| `/area`, `/area/:slug` | 기존 지역별 안내 |
| `/privacy`, `/terms`, `/sitemap` | 정책·HTML 사이트맵 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | 검색·참고 목차 |

## 데이터와 런타임
- **D1 `DB`**: site_settings, users, cases, columns, notices, reservations, page_views, uploads.
- **R2 `R2`**: 실제 사례·칼럼·공지 이미지. 치료 후 사진의 서버 로그인 검사를 유지합니다.
- 기본 정보는 `src/data/clinic.ts` + 관리자 D1 설정입니다. 비밀값은 `.dev.vars` 또는 운영 secrets에만 저장합니다.
- `src/client/experience.ts`, `tooth-scene.ts`는 브라우저 코드입니다. 화면 밖·백그라운드 렌더링 중지, 모바일 DPR/프레임 제한을 유지합니다.
- `public/static/experience/`는 Git 제외 생성물입니다. 빌드 때 esbuild가 생성하고 Vite가 `dist`로 복사합니다.
- `.artifacts/` 원문 자료·QA 캡처·테스트 JSON은 Git/공개 폴더에 넣지 않습니다.

## 실행과 검증
```bash
cd /home/user/webapp
npm ci
npm run db:migrate:local
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000
npm run typecheck
npm run test:seo
npm run test:mobile
npm run test:design
npm run test:kinetic
```
- 최초/재시작 시 포트 3000을 정리한 후 PM2를 시작합니다. 실행 중인 Wrangler는 빌드 결과 변경을 감지합니다.
- **SEO 감사**: 현재 sitemap 경로 + 정책/지역 목차 등 699개 공개 HTML의 메타·H1·헤딩 순서·canonical·OG·스키마 ID·FAQ 본문 일치·이미지 검사. 운영 색인 정책은 로컬 in-process 요청으로 검사하며 운영 사이트에는 요청하지 않습니다.
- **CMS 감사**: 메모리 내 격리된 테스트 fixture로 칼럼 스키마·날짜·H1·페이지 나누기를 검사합니다. D1이나 미리보기에 테스트 글을 저장하지 않습니다.
- **모바일 검사**: 절약모드/2G 번들 지연, 명시적 WebGL 켜기, 44px 버튼, 실제 작은 사진 선택, 비급여 비고 유지, 320/768px 짧은 화면 메뉴·예약 접근.
- **회귀 검사**: 32개 주요 페이지를 320/390/768/1024/1440/1920px로 총 80개 조합 검사하고 목차·FAQ·키보드·필수 입력·비로그인 파일 차단을 추가 검사합니다.
- **인터랙션 검사**: WebGL·회전·모션 토글·PC 갤러리·리사이즈·모바일 메뉴·모션 감소·SVG·JS 없는 화면 등 9개 그룹.
- 결과: `.artifacts/seo-audit.json`, `mobile-audit.json`, `design-smoke-results.json`, `kinetic-smoke-results.json`.
- 이전 작업에서 예약 POST → 로컬 D1 저장 후 테스트 레코드 삭제를 확인했습니다. 이번 작업에서는 예약을 제출하거나 이메일을 보내지 않았습니다.

## 미구현·다음 단계
1. 운영 배포 경로 선택 후 배포. 실제 운영 origin에 `SITE_URL`을 맞추고 canonical/noindex/사이트맵을 재확인해야 합니다.
2. Google Search Console·네이버 서치어드바이저 소유권 확인과 sitemap 제출. 현재 인증·제출을 실행하지 않았습니다.
3. 실제 도메인에서 Rich Results Test/Schema.org Validator, PageSpeed와 실사용 Core Web Vitals, Safari/Android 기기를 재검증합니다. 현재 수치는 로컬 기술 검사이며 검색 순위·의료광고 적법성·전체 관리자 CRUD·실사용 속도를 보증하지 않습니다.
4. 기존 지역×진료 템플릿은 URL/색인 정책을 임의로 대량 삭제하지 않았습니다. Search Console 유입·중복 정보를 확인한 뒤 진료 중심 통합이나 지역별 고유 접근 정보 보강을 결정하는 것이 좋습니다.
5. Google OAuth, Resend 발신 도메인·API, 커스텀 도메인 연결은 기존 후속 과제입니다.
6. 진료비·의료 문구·개인정보 보유/파기·환자 동의는 병원 최종 검수가 필요합니다. SEO 작업으로 의료 근거를 새로 검증하거나 실제 리뷰를 추가한 것은 아닙니다.
