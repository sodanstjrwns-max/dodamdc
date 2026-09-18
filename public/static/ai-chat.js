/* 서울도담치과 — AI 상담 위젯 (vanilla, no deps)
   대화는 메모리에만 두고 저장하지 않는다. 진단·처방이 아닌 일반 안내. */
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
  var endpoint = panel.getAttribute('data-endpoint') || '/api/ai-chat';
  var phone = panel.getAttribute('data-phone') || '';
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var history = []; // {role, content} — in-memory only
  var streaming = false;
  var lastFocus = null;
  var DEFAULT_FALLBACK = '지금은 AI 상담사와 연결이 어려워요. 전화' + (phone ? '(' + phone + ')' : '') + '나 카카오톡으로 문의해 주세요.';

  function scrollToEnd() {
    try { log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }
    catch (_) { log.scrollTop = log.scrollHeight; }
  }
  function bubble(role, text) {
    var el = d.createElement('div');
    el.className = 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
    el.textContent = text || '';
    log.appendChild(el);
    scrollToEnd();
    return el;
  }
  function typing() {
    var el = d.createElement('div');
    el.className = 'ai-msg ai-msg-bot ai-msg-typing';
    el.setAttribute('aria-label', '답변 작성 중');
    el.innerHTML = reduced ? '…' : '<i></i><i></i><i></i>';
    log.appendChild(el);
    scrollToEnd();
    return el;
  }
  function setBusy(on) {
    streaming = on;
    input.disabled = on;
    sendBtn.disabled = on;
    log.setAttribute('aria-busy', on ? 'true' : 'false');
    Array.prototype.forEach.call(chips.querySelectorAll('.ai-chip'), function (b) { b.disabled = on; });
    panel.classList.toggle('is-busy', on);
  }

  function open() {
    if (!panel.hidden) return;
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
        bubble('assistant', DEFAULT_FALLBACK);
        history.pop();
      } else {
        history.push({ role: 'assistant', content: got });
      }
    }).catch(function (err) {
      if (wait.parentNode) wait.parentNode.removeChild(wait);
      var msg = err && err.message && err.message.indexOf('__fallback__') === 0 ? err.message.slice(12) : DEFAULT_FALLBACK;
      if (got.trim()) { history.push({ role: 'assistant', content: got }); }
      else { if (out && out.parentNode) out.parentNode.removeChild(out); history.pop(); }
      var el = bubble('assistant', msg);
      el.classList.add('ai-msg-fallback');
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
