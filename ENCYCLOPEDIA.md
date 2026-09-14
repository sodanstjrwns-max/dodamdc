# 치과 백과사전 편집·검증

2026-09-14 보강: 기존 512개 주소를 유지하고 각 항목에 진료 맥락, 오해·주의점, 상담 질문과 직접 선정한 연관 용어를 추가했다. 기존 정의 229개를 정리했으며 12개 주요 항목의 추가 해설과 6개 비교표를 제공한다.

## 파일

- `src/data/encyclopedia/part1.ts`~`part6.ts`: 용어·영문·분류·짧은 정의·관련 진료. 기존 slug를 임의로 변경하지 않는다.
- `editorial-*.ts`: 항목별 고유 해설. `slug|진료 맥락|구별할 점|상담 질문|연관 slug들` 형식이며 빈 항목이나 공통 문구로 대체하지 않는다.
- `details.ts`: 추가 해설과 실제 판단 기준의 비교표.
- `guides.ts`: 주제별 안내, 상황별 읽기, 검색 별칭, 공식 참고자료. 자료의 적용 범위·발행 시점·국가를 확인한다.
- `src/pages/encyclopedia.ts`: 목록·상세 SSR. `public/static/encyclopedia.css`, `encyclopedia.js`: 해당 경로에서만 로드하는 화면·검색 코드.

## 편집 기준

짧다는 사실만으로 스팸이 되는 것은 아니며 Google에 권장 글자 수는 없다. 분량 목표 대신 해당 개념에서 환자가 구분할 점과 진료 판단에 도움이 되는 정보를 쓴다. 다른 용어의 문장을 이름만 바꿔 재사용하거나 키워드·지역명을 반복하지 않는다.

이번 추가 해설은 의료진 개별 감수가 아직 완료되지 않았다. 실제 검토 전에는 원장 감수·의료진 저자·검토일을 표시하거나 구조화 데이터에 넣지 않는다. 감수 기록이 생기면 검토한 항목과 날짜에 한해 반영한다. 공식 자료 링크는 표시된 관련 주제의 일반 정보를 위한 것으로 모든 문장이나 제품 효과를 입증한다는 뜻이 아니다.

약물 중단·재개, 항생제, 영상 촬영 주기, 치료 성공률을 일률적으로 정하지 않는다. 아동과 성인, 유치와 영구치, 치수 보존과 근관치료, 식립 시기와 하중 시기를 구별한다. 보험은 현재 공단의 자격·적용 조건을 확인하고 오래된 안내만으로 재료·횟수·부담률을 확정하지 않는다.

`EDITORIAL_UPDATED`는 이번 전체 개편의 실제 내용 수정일이다. 단순 빌드 시 오늘 날짜로 바꾸지 않는다. 향후 일부 항목만 수정할 경우 항목별 수정일로 확장하여 수정하지 않은 항목까지 날짜를 바꾸지 않는다.

## 검사

```sh
npm run test:encyclopedia
npm run typecheck
npm run build
```

Playwright Chromium이 설치되어 있어야 한다. 별도 설치본을 쓸 때 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`에 실행 파일 경로를 지정할 수 있다.

검사는 외부 요청·분석 수집·운영 DB 쓰기 없이 로컬 DB 대역으로 실행한다. 513개 SSR 페이지, 고유 제목·설명·canonical·구조화 데이터·앵커·관련 용어·사이트맵·404, 한글/영문/초성/별칭 검색과 필터, 4개 폭의 28개 화면, JavaScript 비활성 상태, 기존 5개 경로를 확인한다. 결과는 Git에서 제외한 `.artifacts/encyclopedia-audit.json` 및 `.artifacts/encyclopedia/`에 저장된다. 이 검사는 의료진 감수나 검색 성과 검증을 대체하지 않는다.

사이트 변경 전 루트 `./pfwe check dodamdc`로 젠스파크의 원격 변경을 확인한다. 도담만 푸시할 때는 루트에서 `./pfwe push "커밋 메시지" dodamdc`를 사용한다. 다른 병원에 남은 변경을 함께 푸시하지 않는다.

## 검색 품질 참고

- [Google: 사람에게 도움이 되는 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: 대규모 콘텐츠 악용 정책](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content)
