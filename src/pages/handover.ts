import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'

export function handoverPage(c: Context<Env>) {
  const body = html`<article class="handover-document handover-letter">
    <header class="handover-hero">
      <a class="handover-brand" href="/">SEOUL DODAM <span>서울도담치과</span></a>
      <p class="handover-eyebrow">A LETTER FROM THE MAKER · 문석준 드림</p>
      <h1>원장님,<br>정말 <em>하얗게 불태웠습니다.</em></h1>
      <p class="handover-intro">서울도담치과의 다음 성장을 위해.<br>홈페이지가 아니라, 오래 쌓아갈 자산을 전합니다.</p>
      <div class="handover-opening"><p>한휘림 원장님, 안녕하세요.<br>늦은 밤까지 한 줄 한 줄 다듬은 <strong>서울도담치과 공식 홈페이지</strong>를 전달드립니다.</p><p>그저 예쁜 화면을 만드는 것으로 끝내고 싶지 않았습니다. 원장님이 자연치아를 지키기 위해 고민하는 마음, 진료를 설명하는 방식, 환자가 안심하고 병원을 선택하는 과정까지 담고 싶었습니다.</p><p><strong>병원의 미래 성장을 함께 만들어갈 홈페이지라고 자신합니다.</strong><br>이 설명서에는 무엇을 만들었는지보다, 왜 이렇게 만들었고 앞으로 어떻게 써주셨으면 하는지를 담았습니다.</p></div>
      <div class="handover-actions"><a class="btn btn-primary" href="/">완성된 홈페이지 보기</a><a class="btn btn-outline" href="#delivery-payment">결제 안내</a><button class="btn btn-outline" type="button" id="handover-print">설명서 인쇄 · PDF</button></div>
    </header>
    <nav class="handover-toc" aria-label="납품 설명서 목차"><a href="#delivery-scope">세 가지 목적</a><a href="#delivery-search">숨은 설계</a><a href="#delivery-growth">앞으로의 운영</a><a href="#delivery-operations">관리자 사용법</a><a href="#delivery-limits">피드백 · 수정</a><a href="#delivery-payment">결제 안내</a></nav>

    <section id="delivery-scope" class="handover-section">
      <p class="handover-eyebrow">01 / CORE PURPOSE</p><h2>이 홈페이지는<br>세 가지를 담고 있습니다.</h2>
      <div class="handover-pillars">
        <section class="handover-card"><span class="pillar-number">01</span><h3>SEO<span>검색엔진이 찾고 이해하도록</span></h3><p>네이버·구글 등 검색엔진이 병원과 진료 내용을 수집하고, 각각의 페이지가 어떤 질문에 답하는지 이해할 수 있도록 설계했습니다.</p></section>
        <section class="handover-card"><span class="pillar-number">02</span><h3>AEO<span>AI가 참고할 수 있도록</span></h3><p>환자가 AI에게 치과와 치료에 관해 물을 때 참고할 수 있는 공개 설명을 쌓았습니다. 질문·답변, 의료진과 진료 정보의 관계를 명확히 했습니다.</p></section>
        <section class="handover-card"><span class="pillar-number">03</span><h3>체류시간<span>사람이 보고 내원을 결정하도록</span></h3><p>발견되는 것만으로는 부족합니다. 환자가 머물며 원장님을 이해하고, 신뢰를 쌓아 상담과 내원으로 이어질 수 있는 흐름을 만들었습니다.</p></section>
      </div>
      <blockquote class="handover-quote">검색엔진과 AI가 이해하고,<br><strong>결국 사람이 선택하는 홈페이지.</strong></blockquote>
      <p>이 세 가지 중 하나만 좋아서는 아쉽습니다. 검색에 발견되지만 읽고 싶지 않은 홈페이지도, 아름답지만 아무도 찾아오지 않는 홈페이지도 원한 결과가 아닙니다. <strong>발견 → 이해 → 신뢰 → 상담</strong>이 이어지도록 설계했습니다.</p>
    </section>

    <section id="delivery-search" class="handover-section">
      <p class="handover-eyebrow">02 / HIGHLIGHTS & HIDDEN GEMS</p><h2>말하지 않으면 모를,<br>이번 홈페이지의 자랑들.</h2>
      <section class="handover-feature"><span class="pillar-number">01</span><div><h3>‘조금 다른 생각, 도담’이 먼저 전해집니다.</h3><p>자연치아를 살릴 수 있는 방법부터 고민하는 철학을 첫 화면부터 이어지게 했습니다. 실제 원장님과 병원 사진, 보존·치주·임플란트 순서의 진료 설명, 공간과 장비까지 하나의 이야기로 연결했습니다.</p><p>입체 치아 모형과 움직임도 장식만을 위한 것은 아닙니다. 첫인상을 만들되 본문 읽기를 방해하지 않도록 조정했고, 모션을 줄이거나 3D를 사용할 수 없는 환경에는 대체 화면을 준비했습니다.</p></div></section>
      <section class="handover-feature"><span class="pillar-number">02</span><div><h3>길고 자세한 설명에는 이유가 있습니다.</h3><p>“왜 이렇게 글이 많지?” 싶은 페이지가 있을 겁니다. 모든 환자가 모든 글을 끝까지 읽을 것이라고 기대한 구성은 아닙니다. 어떤 분은 신경치료가 걱정되고, 어떤 분은 잇몸치료의 과정이나 임플란트의 주의사항이 궁금합니다.</p><p><strong>서로 다른 질문으로 들어온 환자가 필요한 답을 만날 수 있도록</strong> 진료 안내·FAQ·치과 백과사전·내원 안내를 나눴습니다. 검색엔진과 AI도 이 내용을 수집하고 이해할 수 있도록 제목, 대표주소, 구조화 데이터와 내부 링크를 정리했습니다.</p><p>단순히 페이지 수를 늘리는 것이 목적은 아닙니다. 환자의 질문에 정확히 답하는 내용이 쌓여야 진짜 자산이 됩니다.</p></div></section>
      <section class="handover-feature"><span class="pillar-number">03</span><div><h3>케이스와 칼럼이 자라날 자리를 만들었습니다.</h3><p>사례와 칼럼을 게시하면 개별 페이지가 생기고 공개 게시물이 사이트맵에 반영됩니다. 칼럼은 작성 원장과 관련 진료를 연결하고, 검색용 제목·설명도 직접 관리할 수 있습니다.</p><p>편집 도구도 함께 손봤습니다. 이미지 설명 수정, 모바일·PC 폭 미리보기, 저장 오류 시 입력 유지, 전후 사진의 구분·교체·삭제까지 준비했습니다. <strong>원장님의 진료 경험을 꾸준히 남길 수 있는 공간</strong>입니다.</p></div></section>
      <div class="handover-numbers"><div><strong>706</strong><span>운영 HTML 점검 페이지</span></div><div><strong>80</strong><span>PC·모바일 디자인 검사 화면</span></div><div><strong>3</strong><span>실사용 점검한 게시물 유형<br>사례 · 칼럼 · 공지</span></div></div>
      <p class="handover-caption">직전 납품 릴리스의 기술 검사 기준입니다. 706은 점검한 HTML 수이며, 검색엔진에 실제 색인된 페이지 수를 뜻하지 않습니다.</p>
      <details class="handover-reference"><summary>보이지 않는 기술 설계도 궁금하시다면</summary><dl class="handover-specs"><div><dt>검색 기본기</dt><dd>고유 제목·설명, H1과 하위 제목 구조, 정식 도메인 canonical, Open Graph, robots.txt와 XML 사이트맵.</dd></div><div><dt>의미를 연결하는 정보</dt><dd>병원·의료진·진료·칼럼·공지·FAQ·탐색 경로의 구조화 데이터와 공개 정보를 안내하는 llms.txt 목차.</dd></div><div><dt>모바일 · 읽기</dt><dd>반응형 사진·폰트 경량화·긴 글과 표의 가로 넘침 방지·확대 허용·모션 감소 대응.</dd></div><div><dt>예약 · 운영</dt><dd>네이버 예약 연결, 홈페이지 신청 저장, 직원별 권한과 예약 응대 업무판, 콘텐츠·비급여 관리.</dd></div></dl><p class="handover-caption">검색 순위·AI 인용·수집 시점은 각 서비스가 결정합니다. llms.txt는 Google 검색의 필수 요건이 아니며, FAQ 구조는 검색결과의 특정 노출 형식을 보장하지 않습니다.</p></details>
    </section>

    <section id="delivery-growth" class="handover-section">
      <p class="handover-eyebrow">03 / HOW TO GROW</p><h2>딱 하나, 부탁드립니다.<br><em>그냥 내버려두지 마세요.</em></h2>
      <p class="handover-lead">홈페이지의 진짜 가치는 오늘 납품하는 순간보다,<br><strong>앞으로 무엇을 쌓아가느냐</strong>에 달려 있습니다.</p>
      <p>진료실에서 좋은 케이스가 생기면 남겨주세요. 환자분께 같은 설명을 여러 번 하고 있다면 그 질문을 칼럼으로 적어주세요. 치료를 선택한 이유, 환자가 궁금해했던 점, 치료 후 주의할 사항이 모두 좋은 콘텐츠입니다.</p>
      <div class="handover-grid"><section class="handover-card"><h3>케이스 하나는, 진료의 근거가 됩니다.</h3><p>왜 이 치료가 필요했는지, 무엇을 고려했는지 설명해 주세요. 사진만 있는 게시물보다 원장님의 판단이 담긴 사례가 환자에게 더 많은 것을 전할 수 있습니다. 환자 동의와 공개 가능 여부는 먼저 확인해 주세요.</p></section><section class="handover-card"><h3>칼럼 한 편은, 또 하나의 입구가 됩니다.</h3><p>‘찬물에 시린 치아’, ‘신경치료가 꼭 필요한가요’처럼 실제 질문에서 시작해 주세요. 구체적인 질문에 답하는 글은 새로운 검색어로 병원을 발견할 기회를 만듭니다.</p></section></div>
      <aside class="handover-growth-note"><p>저는 이 홈페이지를<br><strong>돈값의 100배를 목표로 키워갈 만한 자산</strong>이라고 생각합니다.</p><p>순위나 매출을 보장한다는 뜻은 아닙니다. 그만큼 오래, 제대로 써주셨으면 하는 마음입니다. 검색 반영에는 시간이 걸리고 정해진 수확 시점도 없습니다. 그래서 더더욱 지금부터 차근차근 쌓는 일이 중요합니다.</p></aside>
      <blockquote class="handover-quote">이 홈페이지를 만드신 목적을<br><strong>절대 잊지 말아 주세요.</strong></blockquote><p>예쁜 홈페이지를 갖는 것이 목적이 아닙니다. <strong>좋은 진료가 필요한 환자에게 발견되고 선택받는 것.</strong> 그 목적을 기억하며 케이스 하나, 글 한 편씩 함께 채워갔으면 합니다.</p>
    </section>

    <section id="delivery-operations" class="handover-section">
      <p class="handover-eyebrow">04 / ADMIN GUIDE</p><h2>원장님이 직접<br>채워가실 수 있습니다.</h2>
      <a class="btn btn-primary" href="/admin/login">관리자 페이지 열기</a><p class="handover-caption">https://dodamdc.kr/admin/login · 아이디 입력이나 계정 생성 없이 관리자 비밀번호로 바로 로그인합니다.</p>
      <div class="handover-guide-list">
        <details open><summary>비포&애프터 · 치료 사례 올리기</summary><p><a href="/admin/cases">관리자 → 치료 전후 → 새 사례</a>에서 제목·진료·담당 의료진·연령대·치료 기간·설명을 입력하고 사진을 올려주세요. 설명은 ‘내원 계기 → 진단 → 치료를 선택한 이유 → 과정과 주의사항’ 순서로 적어주시면 좋습니다.</p><p>치료 전 / 치료 후 슬롯을 구분해 주세요. 새 글은 비공개로 시작합니다. 동의·비식별화·의료광고 검토를 마친 뒤 공개를 선택해 저장하세요. <strong>치료 후 사진은 회원 전용</strong>이며, 일반 칼럼 이미지로 다시 올리지 마세요.</p></details>
        <details><summary>원장 칼럼 쓰기</summary><p><a href="/admin/columns">관리자 → 원장 칼럼 → 새 칼럼</a>에서 제목·요약·본문·작성자·관련 진료를 입력합니다. 검색용 제목·설명은 직접 설정할 수 있으며, 비워두면 기본 내용이 사용됩니다.</p><p>본문은 큰 소제목(H2)부터 시작하세요. 이미지를 선택하면 설명을 수정하거나 삭제할 수 있습니다. ‘작성 내용 미리보기’에서 모바일 폭을 확인하고 저장해 주세요. 공개를 선택해야 환자에게 보입니다.</p></details>
        <details><summary>공지사항과 진료비 관리하기</summary><p><a href="/admin/notices">공지사항</a>에는 휴진·진료시간 변경·병원 소식을 올려주세요. 제목·내용·이미지를 입력하고 필요하면 대표 공지를 선택합니다. 별도의 팝업이나 예약발행 기능과는 다릅니다.</p><p>관리책임자는 <a href="/admin/fees">비급여 수가</a>에서 금액과 공개 여부를 관리할 수 있습니다. 변경 후 공개 페이지와 원내 고지 내용이 일치하는지 확인해 주세요.</p></details>
        <details><summary>예약 문의 확인하기</summary><p><a href="/admin/reservations">예약 응대 업무판</a>에서 신규 신청을 확인하고 담당자·연락 결과·재연락 일정·처리 상태를 기록합니다. 홈페이지 신청은 병원의 확인 연락 후 확정합니다. 네이버 예약은 네이버 관리자에서 별도로 확인해 주세요.</p></details>
        <details><summary>사진 업로드와 저장할 때 알아두실 점</summary><p>JPG·PNG·WebP·GIF, 파일당 8MB를 지원합니다. HEIC는 JPG 등으로 변환해 주세요. 작성 중 미리보기는 저장 전 확인용이며, 저장 후 목록의 완료 안내와 공개 상태를 확인해야 합니다.</p><p>오류가 나면 JavaScript 작성 화면의 입력 내용은 유지됩니다. 연결이 끊겼다면 중복 등록을 피하도록 목록에서 저장 여부를 먼저 확인해 주세요. 자동 저장·브라우저 종료 후 초안 복구·동시 공동편집·예약발행은 지원하지 않습니다.</p></details>
      </div>
      <p class="handover-caption">자동 이메일 알림과 Google 로그인은 현재 미활성화 상태입니다. 새 접수는 업무판에서 확인해 주세요. 외부 통합통계 연결은 인증정보 재설정 후 확인이 필요하며, 로컬 조회·예약 동선 통계는 사용할 수 있습니다.</p>
    </section>

    <section id="delivery-limits" class="handover-section">
      <p class="handover-eyebrow">05 / SUPPORT & FEEDBACK</p><h2>당분간은 원장님도<br>저와 함께 베타테스터입니다.</h2>
      <p>버그와 오류를 잡으려고 정말 열심히 확인했습니다. 그래도 기기와 브라우저마다 반응이 달라, 제가 혼자 모든 경우를 확인할 수는 없습니다. 원장님의 도움을 빌리고 싶습니다.</p><p>여러 페이지를 열어보시고 관리자 기능도 직접 써보세요. 잘 안 되는 부분이 보이면 <strong>화면 캡처와 사용한 기기, 어느 페이지에서 어떤 동작을 했는지</strong>를 함께 알려주시면 수정에 큰 도움이 됩니다. 어떤 방식의 피드백도 환영합니다.</p>
      <div class="handover-grid"><section class="handover-card"><h3>고치고 싶은 점은 편하게 말씀해 주세요.</h3><p>문구·디자인·구성·기능까지, 원장님이 생각하시는 대부분의 사항은 수정하거나 구현할 방법을 함께 찾아볼 수 있습니다. ‘이런 것도 되나요?’ 싶어도 일단 말씀해 주세요.</p></section><section class="handover-card"><h3>딱 하나, 제게 없는 실제 사진입니다.</h3><p>없는 진료 사진이나 병원 사진을 대신 만들어 사실처럼 넣어드릴 수는 없습니다. 하지만 좋은 사진이나 영상이 생기면 언제든 전달해 주세요. 동의와 공개 가능 여부를 확인한 자료를 홈페이지에 잘 담아드리겠습니다.</p></section></div>
      <div class="handover-promise"><span>수정 기한이 언제까지냐면,</span><strong>영원히입니다.</strong><p>어디 가지 않고 항상 있을 테니,<br>걱정 마시고 편하게 연락 주세요.</p><small>문석준 드림</small></div>
    </section>

    <section id="delivery-payment" class="handover-section">
      <p class="handover-eyebrow">06 / PAYMENT</p><h2>결제 안내드립니다.</h2><p>계좌이체로 부탁드립니다.<br>입금 확인 후 <strong>2주 이내에 세금계산서를 발급</strong>해 드립니다.</p>
      <div class="handover-payment-card"><div class="payment-amount"><span>홈페이지 납품 금액</span><strong>15,000,000<span>원</span></strong><p>일천오백만 원 · 1,500만 원</p></div><div class="payment-account"><span>NH 농협</span><strong id="payment-account-number">1085-02-007634</strong><p>예금주 <b>문석준</b></p><button type="button" class="btn btn-outline" data-copy-target="payment-account-number">계좌번호 복사</button></div></div>
      <p>본격적인 사업화보다는 직접 만드는 일에 집중하다 보니, 카드나 다른 결제 수단이 준비되어 있지 않습니다. 너그러운 양해 부탁드립니다.</p><p class="handover-signoff">아무쪼록 좋은 밤 되시고,<br><strong>앞으로도 편하게 연락 주세요.</strong></p><p>서울도담치과의 좋은 진료가 더 많은 환자에게 전해지기를 바랍니다.<br>감사합니다. <strong>문석준 드림</strong></p>
    </section>

    <section id="delivery-checklist" class="handover-section handover-closing">
      <p class="handover-eyebrow">ADMIN ACCESS</p>
      <h2>관리자 페이지 접속 안내</h2>
      <p><a href="https://dodamdc.kr/admin/login">https://dodamdc.kr/admin/login</a></p>
      <p>관리자 비밀번호를 입력하면 바로 관리 화면으로 들어갑니다.<br>아이디 입력이나 최초 계정 생성은 필요하지 않습니다.</p>
      <p id="handover-copy-status" role="status" aria-live="polite"></p>
      <div class="handover-actions"><a href="/" class="btn btn-primary">서울도담치과 둘러보기</a><a href="/admin/login" class="btn btn-outline">관리자 페이지</a></div>
    </section>
  </article><script src="/static/handover.js?v=3" defer></script>`
  return c.html(Layout(c, { title: '서울도담치과 홈페이지 납품 설명서', description: '문석준이 전하는 서울도담치과 홈페이지의 가치, SEO·AEO·환자 경험 설계, 콘텐츠 운영과 지속적인 수정 지원, 결제 안내.', path: '/handover', noindex: true, bodyClass: 'handover-page', crumbs: [{ name: '홈', href: '/' }, { name: '납품 설명서', href: '/handover' }] }, body))
}
