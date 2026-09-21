/* 서울도담치과 — AI 상담 위젯 (vanilla, no deps)
   대화는 메모리에만 두고 저장하지 않는다. 진단·처방이 아닌 일반 안내.
   2026-09-21: 첫 방문 말풍선·버튼 강조(한 번만), 연결 실패(429/5xx) 시 전화·예약 카드 + 다시 시도. */
(function () {
  'use strict';
  var d = document, w = window;
  var panel = d.getElementById('ai-chat');
  var openBtn = d.getElementById('ai-chat-open');
  if (!panel || !openBtn) return;
  var closeBtn = d.getElementById('ai-chat-close');
  var log = d.getElementById('ai-chat-log');
  var chips = d.getElementById('ai-chat-chips');
  var form = d.getElementById('ai-chat-form');
  var input = d.getElementById('ai-chat-input');
  var sendBtn = d.getElementById('ai-chat-send');
  var tip = d.getElementById('ai-chat-tip');
  var tipOpen = d.getElementById('ai-chat-tip-open');
  var tipClose = d.getElementById('ai-chat-tip-close');
  var endpoint = panel.getAttribute('data-endpoint') || '/api/ai-chat';
  var phone = panel.getAttribute('data-phone') || '';
  var tel = panel.getAttribute('data-tel') || (phone ? 'tel:' + phone : '');
  var naver = panel.getAttribute('data-naver') || '';
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var history = []; // {role, content} — in-memory only
  var streaming = false;
  var lastFocus = null;
  var lastQuestion = null; // {text, topic} — "다시 시도"용
  var TIP_KEY = 'dodam-ai-tip-seen';
  var DEFAULT_FALLBACK = '지금은 AI 상담사와 연결이 어려워요. 잠시 후 다시 시도해 주세요.';

  function scrollToEnd() {
    try { log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }
    catch (_) { log.scrollTop = log.scrollHeight; }
  }
  function el(tag, cls, text) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function bubble(role, text) {
    var b = el('div', 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'), text || '');
    log.appendChild(b);
    scrollToEnd();
    return b;
  }
  function typing() {
    var t = el('div', 'ai-msg ai-msg-bot ai-msg-typing');
    t.setAttribute('aria-label', '답변 작성 중');
    t.innerHTML = reduced ? '…' : '<i></i><i></i><i></i>';
    log.appendChild(t);
    scrollToEnd();
    return t;
  }
  // 연결 실패·응답 없음일 때: 전화 / 네이버 예약 / 다시 시도 카드 (성모치과 위젯의 답변 뒤 CTA 참고)
  function ctaCard(withRetry) {
    var card = el('div', 'ai-cta');
    card.appendChild(el('p', 'ai-cta-lead', '급하시면 바로 연락 주세요'));
    var row = el('div', 'ai-cta-row');
    if (tel) { var a = el('a', 'ai-act ai-act-call', '전화 ' + phone); a.href = tel; row.appendChild(a); }
    var b = el('a', 'ai-act ai-act-naver', naver ? '네이버 예약' : '진료 예약');
    b.href = naver || '/reservation';
    if (naver) { b.target = '_blank'; b.rel = 'noopener noreferrer'; b.setAttribute('data-booking-provider', 'naver'); }
    row.appendChild(b);
    if (withRetry && lastQuestion) {
      var r = el('button', 'ai-act ai-act-retry', '다시 시도');
      r.type = 'button';
      r.addEventListener('click', function () {
        if (card.parentNode) card.parentNode.removeChild(card);
        send(lastQuestion.text, lastQuestion.topic);
      });
      row.appendChild(r);
    }
    card.appendChild(row);
    log.appendChild(card);
    scrollToEnd();
    return card;
  }
  function setBusy(on) {
    streaming = on;
    input.disabled = on;
    sendBtn.disabled = on;
    log.setAttribute('aria-busy', on ? 'true' : 'false');
    Array.prototype.forEach.call(chips.querySelectorAll('.ai-chip'), function (b) { b.disabled = on; });
    Array.prototype.forEach.call(log.querySelectorAll('.ai-act-retry'), function (b) { b.disabled = on; });
    panel.classList.toggle('is-busy', on);
  }

  // ---- 첫 방문 말풍선 + 버튼 강조 (한 번만, localStorage) ----
  var tipTimer = null, tipHide = null;
  function tipSeen() { try { return !!w.localStorage.getItem(TIP_KEY); } catch (_) { return false; } }
  function markTip() { try { w.localStorage.setItem(TIP_KEY, '1'); } catch (_) {} }
  function placeTip() {
    var r = openBtn.getBoundingClientRect();
    if (!r.width || !r.height || r.top < 0) return false;
    tip.style.top = Math.round(r.top + r.height / 2) + 'px';
    tip.style.right = Math.round(w.innerWidth - r.left + 10) + 'px';
    return true;
  }
  function showTip() {
    tipTimer = null;
    if (!tip || !panel.hidden || tipSeen()) return;
    if (d.hidden) { // 탭이 보이지 않으면 다시 보일 때 한 번만 시도
      d.addEventListener('visibilitychange', function onVis() { d.removeEventListener('visibilitychange', onVis); if (!d.hidden) tipTimer = setTimeout(showTip, 1500); });
      return;
    }
    if (!placeTip()) return;
    tip.hidden = false;
    if (!reduced) openBtn.classList.add('is-nudge');
    tipHide = setTimeout(function () { hideTip(); }, 10000);
  }
  function hideTip(forget) {
    if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
    if (tipHide) { clearTimeout(tipHide); tipHide = null; }
    if (tip) tip.hidden = true;
    openBtn.classList.remove('is-nudge');
    if (!forget) markTip();
  }
  if (tip && !tipSeen()) {
    tipTimer = setTimeout(showTip, 3500);
    w.addEventListener('resize', function () { if (!tip.hidden && !placeTip()) hideTip(true); });
    if (tipOpen) tipOpen.addEventListener('click', function () { hideTip(); open(); });
    if (tipClose) tipClose.addEventListener('click', function () { hideTip(); openBtn.focus(); });
  }

  function open() {
    if (!panel.hidden) return;
    hideTip();
    lastFocus = d.activeElement;
    panel.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    d.body.classList.add('ai-chat-open');
    if (!reduced) { panel.classList.add('is-entering'); setTimeout(function () { panel.classList.remove('is-entering'); }, 260); }
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); } }, 50);
  }
  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    d.body.classList.remove('ai-chat-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
    else openBtn.focus();
  }

  function fallbackFromResponse(res) {
    return res.json().then(function (j) { return (j && j.message) || DEFAULT_FALLBACK; }, function () { return DEFAULT_FALLBACK; });
  }

  function send(text, topic) {
    text = (text || '').replace(/\s+$/, '');
    if (!text || streaming) return;
    if (text.length > 1000) text = text.slice(0, 1000);
    lastQuestion = { text: text, topic: topic || '' };
    history.push({ role: 'user', content: text });
    bubble('user', text);
    input.value = '';
    autosize();
    setBusy(true);
    var wait = typing();
    var out = null, got = '';
    var payload = { messages: history.slice(-8) };
    if (topic) payload.topic = topic;
    var controller = w.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 70000) : null;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok || !res.body) {
        return fallbackFromResponse(res).then(function (msg) { throw new Error('__fallback__' + msg); });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) { got += decoder.decode(); return; }
          var chunk = decoder.decode(r.value, { stream: true });
          if (!chunk) return pump();
          if (!out) { if (wait.parentNode) wait.parentNode.removeChild(wait); out = bubble('assistant', ''); }
          got += chunk;
          out.textContent = got;
          scrollToEnd();
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (wait.parentNode) wait.parentNode.removeChild(wait);
      if (!got.trim()) {
        if (out && out.parentNode) out.parentNode.removeChild(out);
        bubble('assistant', DEFAULT_FALLBACK).classList.add('ai-msg-fallback');
        history.pop();
        ctaCard(true);
      } else {
        history.push({ role: 'assistant', content: got });
      }
    }).catch(function (err) {
      if (wait.parentNode) wait.parentNode.removeChild(wait);
      var msg = err && err.message && err.message.indexOf('__fallback__') === 0 ? err.message.slice(12) : DEFAULT_FALLBACK;
      if (got.trim()) { history.push({ role: 'assistant', content: got }); }
      else { if (out && out.parentNode) out.parentNode.removeChild(out); history.pop(); }
      bubble('assistant', msg).classList.add('ai-msg-fallback');
      ctaCard(!got.trim());
    }).then(function () {
      if (timer) clearTimeout(timer);
      setBusy(false);
      if (!panel.hidden) { try { input.focus({ preventScroll: true }); } catch (_) {} }
      scrollToEnd();
    });
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(120, input.scrollHeight) + 'px';
  }

  openBtn.addEventListener('click', function () { panel.hidden ? open() : close(); });
  if (closeBtn) closeBtn.addEventListener('click', close);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  chips.addEventListener('click', function (e) {
    var b = e.target instanceof Element ? e.target.closest('.ai-chip') : null;
    if (!b || b.disabled) return;
    send(b.getAttribute('data-q') || b.textContent, b.getAttribute('data-topic') || '');
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value, ''); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!streaming) send(input.value, ''); }
  });
  input.addEventListener('input', autosize);
})();
