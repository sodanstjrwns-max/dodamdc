# 서울도담치과의원 홈페이지 (webapp)

## 프로젝트 개요
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 원장님의 자연치아 보존 철학을 시각화한 반응형 브랜드 홈페이지와 환자 중심 예약 동선
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2. 프런트엔드는 Vanilla JS, GSAP/ScrollTrigger, Three.js WebGL.
- **작업 경로 / 브랜치**: `/home/user/webapp` / `main`
- **최근 변경**: 2026-09-06 원문 재대조 및 인터랙티브 브랜드 디자인 개편

## URL과 배포 상태
- **개편 미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai
- **기존 프로덕션 URL**: https://seoul-dodam-dental.pages.dev
- **이번 개편 프로덕션 상태**: 미배포. 운영 DB/R2 및 기존 프로덕션은 수정하지 않았습니다.
- 미리보기는 임시 sandbox 서비스이며 영구 운영 주소가 아닙니다.
- Cloudflare 프로젝트 설정은 `seoul-dodam-dental`. 실제 운영 반영 방식은 별도 확인해야 합니다.

## 원장님 입력안과 디자인 해석의 구분
Google Drive의 신청서 XLSX에서 **서울도담치과 / 한휘림 원장 행만** 확인하고, 홈페이지 제작 질문 회신 PDF와 대조했습니다. 원문 자료는 `.artifacts/`에만 임시 보관하며 공개 자산이나 Git에 포함하지 않습니다.

| 근거 | 확인한 원문 방향 | 반영 |
| --- | --- | --- |
| 신청서 Q24 | 깔끔하고 모던한, 따뜻하고 친근한 | 큰 한글 타이포, 밝은 바탕, 둥근 보호 고리 형태, 절제된 모션 |
| 신청서 Q25 + 회신 A9 | 블루 메인 유지 + 생명·자연의 그린 포인트 | 기존 로고 블루 `#0069B3`, 자연스러운 그린 `#B9E7A6` |
| 신청서 Q23 + 회신 A5 | 이해될 때까지 설명하고, 필요한 만큼만 치료합니다 | 메인 슬로건은 `clinic.slogan` 원문 유지 |
| 신청서 Q12–13 + 회신 A1 | VPT·크라운 → 치주치료 → 보존 불가 시 임플란트 | 핵심 진료 순서와 안내 유지 |
| 회신 진료 철학 | 치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다 | 철학 섹션에서 원장 인용으로 표기 |
| 회신 A3 | 통증에 예민한 원장, 충분한 설명과 세심한 통증 배려 | 의료진 소개와 보유 장비 안내 |
| 회신 A6 | 일부 장비는 도입 예정 | 신규 그래픽에 도입 예정 장비를 보유 장비처럼 추가하지 않음 |
| 회신 A11 | 가족 이야기를 공개 가능한 표현으로 정리 | 기존 일반화된 의료진 소개 유지, 사적인 세부 내용 추가 없음 |

**디자인 해석인 부분**: “내 치아를 위한 조금 다른 생각, 도담”이라는 헤드라인, 영어 보조 카피, 원티드 산스 선택, 보호 고리 모티프, 그린의 구체적인 HEX, 스크롤 연출은 입력안의 철학을 바탕으로 재구성한 것입니다. 원장이 직접 지정한 문구·서체·색상값으로 표시하지 않습니다.

## 완료된 디자인·기능
1. **첫 화면**: Wanted Sans 가변 서체와 큰 한글 헤드라인, 원문 슬로건, 자체 제작한 입체 치아·보호 고리 그래픽.
2. **실제 입체 상호작용**: Three.js WebGL2 렌더링, 마우스/펜 드래그와 포인터 반응, 키보드 접근 가능한 좌우 회전 버튼. 실제 해부 모형이 아닌 브랜드 그래픽임을 명시.
3. **스크롤 경험**: GSAP 글자 등장·철학 문구 채움·고리 회전, PC 공간 갤러리의 고정 가로 전환, 의료진 이미지 패럴랙스, 푸터 타이포 전환.
4. **동작 제어**: 모션 토글, 시스템 모션 감소 설정 준수. 모션을 끄거나 태블릿/모바일 크기이면 고정 가로 스크롤을 해제하고 일반 가로 갤러리를 사용.
5. **폴백**: WebGL 미지원 또는 컨텍스트 손실 시 SVG 그래픽. JavaScript가 없어도 주요 내용·진료 안내·기본 메뉴·가로 갤러리를 이용 가능.
6. **모바일**: 세로 터치 스크롤 유지, 회전 버튼, 공간 갤러리 가로 스와이프, 메뉴 포커스 순환·Escape 닫기, 하단 전화·카카오·예약 바.
7. **전체 페이지 통일**: 의료진, 철학, 진료 목록과 상세, FAQ·백과사전, 위치·시간·수가, 예약·회원 화면의 서체·컬러·컨트롤 정비.
8. **기존 기능 유지**: 기존 URL, 구조화 데이터, 회원·관리자 CMS, 예약 저장, 치료 후 사진의 서버 측 로그인 제한.
9. **콘텐츠 처리**: 가짜 후기·사례·게시물 생성 없음. 게시물이 없으면 진료 가이드와 안내 동선을 제공.

## 사진 보완 — 2026-09-06
- 승인된 서체, 블루·그린 색상, 레이아웃, WebGL 및 GSAP 동작은 유지하고 사진 선택·크롭·설명만 개선했습니다.
- 제공된 실제 촬영 원본에서 22장을 선정해 전체 크기 WebP 22개와 작은 이미지 22개를 생성했습니다. 기존 public 이미지는 보존하고 새 파일은 `-v2`로 구분합니다.
- 원장 사진은 진료복 메인 사진, 흰 가운 소개 사진, 작은 원형 프로필용 얼굴 크롭으로 구분했습니다. 얼굴 생성·변형은 하지 않았습니다.
- 공간 갤러리는 실제 대기실·채광 진료실·독립 소독 공간으로 연결했습니다. AI 수정 interior 폴더 대신 실제 촬영 원본을 사용했습니다.
- 마취액 워머, DENOPS, EXARO 휴대용 엑스레이, PHL 장비의 사진 오매칭을 교정하고, 소독 공간 사진 설명도 실제 내용에 맞췄습니다. 세로형 장비는 사진별 contain 처리로 주요 부분이 잘리지 않도록 했습니다.
- `scripts/process-images.mjs`가 원본 선택과 크롭 정보를 보관합니다. 재생성: `DODAM_PHOTO_SOURCE=/path/to/supplied/originals node scripts/process-images.mjs`. 기본 원본 경로는 `/home/user/dodam_src`이며 원본 자료는 저장소에 포함하지 않습니다. 변경 후 `npm run build`가 필요합니다.
- 사진 변경 후 공개 페이지 80개 화면 조합 검증을 통과했습니다. 운영 사이트에는 배포하지 않았습니다.

## 자산·런타임 구조
- `src/client/experience.ts`: 스크롤, 갤러리, 모션 제어, 버튼 반응.
- `src/client/tooth-scene.ts`: 원본 절차적 치아 조형·보호 고리. 첫 화면에서만 지연 로드.
- `public/static/kinetic.css`: 새 브랜드 테마. `style.css`의 기존 기능 스타일과 함께 사용.
- `public/static/fonts/WantedSansVariable.woff2`: 로컬 호스팅 가변 서체. `OFL-WantedSans.txt`에 SIL Open Font License 포함.
- `public/static/experience/`: esbuild 결과물. Git 제외. `npm run build`가 재생성한 후 Vite가 `dist`로 복사.
- 입체 그래픽 계산은 **방문자 브라우저**에서 수행합니다. Worker에서 GPU/Node 프로세스를 실행하지 않으며 유료 그래픽 API를 호출하지 않습니다.
- WebGL은 화면 밖·백그라운드 탭에서 렌더링 중단, 모바일 DPR/프레임 빈도 제한. 애니메이션을 위해 휠 이벤트나 브라우저 기본 스크롤을 가로채지 않습니다.
- 병원·의료진 사진은 기존 제공 자료를 사용. 새로운 상업용 스톡 또는 AI 생성 사진을 추가하지 않았습니다.

## 주요 기능 진입 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/` | 입체 메인, 진료 탭, 공간 갤러리, FAQ, 내원 안내 |
| `/mission` | 도담의 진료 철학 |
| `/doctors`, `/doctors/han-hwirim` | 의료진 목록 / 상세 |
| `/treatments`, `/treatments/:slug` | 진료 안내 (`vpt-crown`, `periodontal`, `implant` 등) |
| `/floor-guide` | 장비·감염관리·실제 공간 |
| `/reservation?treatment=implant` | 희망 진료 선택. POST `/reservation`으로 접수 |
| `/reservation?ok=1` | 접수 안내 (확정 예약 아님) |
| `/directions`, `/hours`, `/pricing` | 위치·시간·비급여 |
| `/faq`, `/encyclopedia`, `/encyclopedia/:slug` | FAQ·용어 검색 |
| `/column`, `/column/:slug`, `/column/rss.xml` | 칼럼 (`treatment`, `page`) |
| `/notice`, `/notice/:id` | 공지 |
| `/cases/gallery`, `/cases/gallery/:slug` | 치료 전후 (`treatment`, `doctor`, `page`) |
| `/auth/register`, `/auth/login`, `/auth/mypage` | 회원 |
| `/admin/login`, `/admin/*` | 기존 관리자 CMS |
| `/files/:key`, `/api/regions?q=화서` | R2 파일 / 지역 자동완성 |
| `/area`, `/area/:slug` | 지역별 안내 |
| `/privacy`, `/terms`, `/sitemap` | 정책·사이트맵 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | 검색엔진 안내 |

## 데이터와 보안
- **D1 `DB`**: `site_settings`, `users`, `cases`, `columns`, `notices`, `reservations`, `page_views`, `uploads`.
- **R2 `R2`**: 업로드한 사례·칼럼·공지 이미지. 치료 후 이미지의 서버 측 접근 제어 유지.
- 병원 기본정보는 `src/data/clinic.ts` 기본값 + 기존 D1 설정 방식 유지. 메인 원문 슬로건도 공통 설정을 참조.
- 비밀값은 `.dev.vars` 또는 프로덕션 secrets에만 저장합니다.
- 원문 신청서·회신 파일과 QA 스크린샷은 `.artifacts/`에만 저장하며 Git/공개 폴더에 넣지 않습니다.

## 로컬 실행·검증
```bash
npm ci
npm run db:migrate:local
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000

npm run typecheck
npx playwright install chromium
npm run test:kinetic
npm run test:design
```
- `npm run build`는 클라이언트 경험 번들 생성 → Hono/Vite 빌드 순서입니다.
- PM2 서버는 `wrangler pages dev dist --local --ip 0.0.0.0 --port 3000`입니다.
- **인터랙션 검증**: 9개 그룹 통과. 원문 슬로건/색상, Wanted Sans, WebGL, 좌우 회전, 모션 토글, PC 가로 스크롤, 모바일 리사이즈·메뉴, 모션 감소, WebGL 차단/SVG 폴백, JS 없는 콘텐츠 확인.
- **공개 페이지 회귀 검증**: 32개 페이지, 320 / 390 / 768 / 1024 / 1440 / 1920px의 총 80개 조합 통과. 모바일 검색 입력창의 가로 넘침을 수정 후 재검증했습니다. 폭별 매트릭스는 SVG 폴백으로 실행하고 실제 WebGL은 별도 `test:kinetic`에서 검증합니다. 결과는 `.artifacts/design-smoke-results.json`과 `.artifacts/kinetic-smoke-results.json`에 기록합니다.
- 이전 개편에서 예약 POST → 로컬 D1 저장 1건을 확인 후 테스트 레코드 삭제. 이번 변경은 해당 서버 처리 로직을 변경하지 않았습니다.
- 스크린샷과 상세 JSON은 `.artifacts/`에 생성하며 커밋하지 않습니다.
- 모든 실제 기기, 정량 Core Web Vitals, 전체 관리자 CRUD, 의료광고 적법성을 전수 보증한 검사는 아닙니다.

## 사용 안내
- PC 첫 화면의 치아 그래픽은 드래그 또는 좌우 버튼으로 돌릴 수 있습니다. 모바일은 좌우 버튼을 사용하며 세로 스크롤은 방해하지 않습니다.
- 첫 화면의 모션 버튼으로 자동 움직임과 스크롤 연출을 끌 수 있습니다.
- 핵심 진료 탭 → 상세·주의사항·의료진 → 예약으로 이동합니다.
- 예약은 병원 확인 연락 후 확정됩니다. 실제 게시물·후기·사례는 원장 검수와 필요한 동의 후 등록합니다.

## 미구현·운영 전 확인 / 다음 단계
1. 원장님 디자인 확인 후 별도로 선택한 배포 방식으로 운영 반영. 현재 개편은 미리보기만 제공.
2. 운영 콘텐츠와 새 화면 조합, 실제 Safari/Android 기기, PageSpeed/Core Web Vitals 확인.
3. 기존 후속 과제인 Google OAuth, Resend 발신 도메인·API 설정, 커스텀 도메인·검색 콘솔 연결.
4. 비급여 금액, 의료 문구, 개인정보 보유·파기, 환자 동의 등은 병원 최종 검수 필요. 일부 원문을 대조했다고 사이트 전체의 법적 적합성을 보증하지 않습니다.
