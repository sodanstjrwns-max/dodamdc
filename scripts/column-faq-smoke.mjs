// 칼럼 본문 → FAQPage 자동 추출 검증 (원장 요청 2026-10-03). 로컬 계산만, 네트워크·DB 쓰기 없음.
// 선택: COLUMN_FAQ_DUMP=<wrangler d1 --json 결과 파일> 이면 실제 칼럼 전체에 대해 통계를 출력한다.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const compiled = await build({ stdin: { resolveDir: process.cwd(), contents: `
export { faqsFromArticleHtml, withFaqLd, faqLd } from './src/lib/seo';
export { sanitizeArticle } from './src/lib/content-safety';
` }, bundle: true, write: false, format: 'esm', platform: 'node' })
const { faqsFromArticleHtml, withFaqLd, faqLd, sanitizeArticle } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const render = (s) => sanitizeArticle(String(s).replace(/<(\/?)(h1)(?=[\s>])/gi, '<$1h2'))

// 1) 기본: 질문형 h3 + 다음 블록, 꼬리(※·참고문헌 소제목)·다음 h2에서 멈춤, 각주 제거, 엔티티 해제
const html = render(`<h2>본문</h2><p>설명</p><p><strong>자주 묻는 질문</strong></p>
<h3>Q. 발치 후 운전해도 되나요?</h3><p>마취 상태에 따라 다릅니다. <a href="/x">안내</a>를 확인하세요. [2]</p><ul><li>보호자 동반 &amp; 휴식</li></ul>
<h3>준비물</h3><p>질문형이 아니므로 제외되어야 하는 충분히 긴 문장입니다.</p>
<h3>비용은 어디서 확인하나요?</h3><p>상담에서 보험 적용과 본인부담 항목을 확인합니다.</p><p>※ 이 글은 일반 정보입니다.</p><p><strong>참고문헌</strong></p><ol><li>NHS</li></ol>
<h3>통증은 얼마나 가나요</h3><p>보통 며칠 안에 줄어들지만 개인차가 있습니다.</p><h2>참고문헌</h2><ol><li>REF</li></ol>
<h3>스크립트가 섞이면 어떻게 되나요?</h3><p>안전하게 &lt;/script&gt; 문자열도 텍스트로 처리됩니다.</p><script>alert(1)</script>`)
const faqs = faqsFromArticleHtml(html)
assert.deepEqual(faqs.map(f => f.q), ['발치 후 운전해도 되나요?', '비용은 어디서 확인하나요?', '통증은 얼마나 가나요', '스크립트가 섞이면 어떻게 되나요?'])
assert.equal(faqs[0].a, '마취 상태에 따라 다릅니다. 안내를 확인하세요. 보호자 동반 & 휴식')
assert.equal(faqs[1].a, '상담에서 보험 적용과 본인부담 항목을 확인합니다.')
assert.equal(faqs[2].a, '보통 며칠 안에 줄어들지만 개인차가 있습니다.')
assert.match(faqs[3].a, /<\/script> 문자열/)
assert.doesNotMatch(faqs[3].a, /alert/)
// Layout과 같은 직렬화로 </script> 탈출 불가 확인
const serialized = JSON.stringify(faqLd(faqs, 'https://dodamdc.kr/column/x')).replace(/</g, '\\u003c')
assert.doesNotMatch(serialized, /<\/script/i)
assert.equal(JSON.parse(serialized).mainEntity.length, 4)

// 2) 질문형 h3이 없으면 생성하지 않음
assert.deepEqual(faqsFromArticleHtml(render('<h3>준비물</h3><p>신분증과 복용약 목록을 준비합니다.</p><h2>질문처럼 보이나요?</h2><p>h2는 대상 아님</p>')), [])
assert.deepEqual(withFaqLd([{ '@type': 'Article' }], []), [{ '@type': 'Article' }])

// 3) 길이 제한
const long = faqsFromArticleHtml(render(`<h3>긴 답변은 잘리나요?</h3><p>${'치료 범위는 검사 후 정합니다. '.repeat(120)}</p>`))
assert.ok(long[0].a.length <= 1001 && long[0].a.endsWith('…'))

// 4) 기존 FAQPage가 있으면 새 노드를 만들지 않고 새 질문만 병합
const existing = [{ '@type': 'Article' }, faqLd([{ q: '발치 후 운전해도 되나요?', a: '기존 답' }])]
const merged = withFaqLd(existing, faqs)
assert.equal(merged.filter(n => n['@type'] === 'FAQPage').length, 1)
assert.equal(merged.find(n => n['@type'] === 'FAQPage').mainEntity.length, 4)
assert.equal(withFaqLd([{ '@type': 'Article' }], faqs, 'https://dodamdc.kr/column/x').filter(n => n['@type'] === 'FAQPage').length, 1)

console.log('column-faq-smoke: fixtures OK')

if (process.env.COLUMN_FAQ_DUMP) {
  const rows = JSON.parse(await readFile(process.env.COLUMN_FAQ_DUMP, 'utf8'))[0].results
  let none = 0
  for (const r of rows) {
    const f = faqsFromArticleHtml(render(r.content_html))
    if (!f.length) none++
    console.log(`${String(f.length).padStart(2)}  ${r.slug}${f.length ? '' : '  (질문형 h3 없음)'}`)
  }
  console.log(`total ${rows.length}, no-faq ${none}`)
}
