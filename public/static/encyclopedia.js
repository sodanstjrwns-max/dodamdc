/* Progressive enhancement only. Every entry and article is already in the HTML.
   Search terms stay in this page: no storage, network requests or analytics events. */
(function () {
  'use strict';
  var query = document.getElementById('ency-query');
  if (query) {
    var category = document.getElementById('ency-category');
    var status = document.getElementById('ency-results');
    var empty = document.getElementById('ency-empty');
    var entries = Array.from(document.querySelectorAll('[data-ency-entry]'));
    var topics = Array.from(document.querySelectorAll('[data-ency-topic]'));
    var buttons = Array.from(document.querySelectorAll('[data-initial]'));
    var selectedInitial = 'all';
    var composing = false;
    var initials = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    function normalize(value) { return value.toLowerCase().normalize('NFC').replace(/[\s\-·()[\]]/g, ''); }
    function chosung(value) {
      return Array.from(value).map(function (char) {
        var code = char.charCodeAt(0);
        return code >= 0xac00 && code <= 0xd7a3 ? initials[Math.floor((code - 0xac00) / 588)] : char;
      }).join('');
    }
    var rows = entries.map(function (element) {
      return { element: element, text: normalize(element.dataset.search || ''), initialText: chosung(normalize(element.querySelector('.ency-term-name').textContent)) };
    });
    function apply() {
      var words = query.value.trim().split(/\s+/).filter(Boolean).map(normalize);
      var count = 0;
      rows.forEach(function (row) {
        var match = (category.value === 'all' || row.element.dataset.category === category.value) &&
          (selectedInitial === 'all' || row.element.dataset.first === selectedInitial) &&
          words.every(function (word) { return row.text.includes(word) || (/^[ㄱ-ㅎ]+$/.test(word) && row.initialText.includes(word)); });
        row.element.hidden = !match;
        if (match) count++;
      });
      topics.forEach(function (topic) { topic.hidden = !topic.querySelector('[data-ency-entry]:not([hidden])'); });
      buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.initial === selectedInitial)); });
      empty.hidden = count !== 0;
      status.textContent = count === entries.length ? '전체 ' + count + '개 용어' : '조건에 맞는 용어 ' + count + '개 · 전체 ' + entries.length + '개';
    }
    function reset() { query.value = ''; category.value = 'all'; selectedInitial = 'all'; apply(); }
    query.addEventListener('compositionstart', function () { composing = true; });
    query.addEventListener('compositionend', function () { composing = false; apply(); });
    query.addEventListener('input', function () { if (!composing) apply(); });
    query.addEventListener('search', apply);
    category.addEventListener('change', apply);
    buttons.forEach(function (button) { button.addEventListener('click', function () { selectedInitial = button.dataset.initial; apply(); }); });
    document.querySelectorAll('[data-ency-reset]').forEach(function (button) { button.addEventListener('click', function () { reset(); query.focus(); }); });
    document.querySelectorAll('[data-ency-category-link]').forEach(function (link) {
      link.addEventListener('click', function () { query.value = ''; selectedInitial = 'all'; category.value = link.dataset.encyCategoryLink; apply(); });
    });
    // A category deep link or back/forward restoration must expose its target even
    // if a previous search had hidden it. Keep ordinary anchor navigation intact.
    function restoreHash() {
      if (!location.hash.startsWith('#cat-')) return;
      var raw = location.hash.slice(1), target = document.getElementById(raw);
      if (!target) { try { target = document.getElementById(decodeURIComponent(raw)); } catch (_) {} }
      if (target && target.dataset.encyTopic) {
        query.value = ''; selectedInitial = 'all'; category.value = target.dataset.encyTopic; apply();
        requestAnimationFrame(function () { target.scrollIntoView({ block: 'start' }); });
      }
    }
    document.querySelector('[data-ency-controls]').hidden = false;
    apply(); restoreHash();
    window.addEventListener('hashchange', restoreHash);
    window.addEventListener('pageshow', function () { apply(); restoreHash(); });
  }
  var copy = document.querySelector('[data-ency-copy]');
  if (copy && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', async function () {
      var message = document.querySelector('.ency-copy-status');
      try {
        await navigator.clipboard.writeText(document.getElementById('ency-question-text').textContent.trim() + '\n' + location.origin + location.pathname);
        message.textContent = '질문과 해설 주소를 복사했습니다.';
      } catch (_) { message.textContent = '복사가 허용되지 않았습니다. 질문을 선택해 복사해 주세요.'; }
    });
  }
})();
