/* DOM-only symptom navigation. No network calls, URL state, cookies or storage. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var all = function (s) { return Array.from(document.querySelectorAll(s)); };
  var form = $('#symptom-form');
  if (!form) return;
  var area = '', step = 1;
  var areaStep = $('#symptom-area-step'), choiceStep = $('#symptom-choice-step'), results = $('#symptom-results');
  var safety = all('[data-safety]');
  function hasSafety(type) { return safety.some(function (x) { return x.checked && x.dataset.safety === type; }); }
  function selections() { return all('[data-area-group="' + area + '"] input:checked'); }
  function announce(message) { $('#symptom-status').textContent = message; }
  function showStep(next, focus) {
    step = next;
    areaStep.hidden = step !== 1;
    choiceStep.hidden = step !== 2;
    results.hidden = step !== 3;
    all('[data-step]').forEach(function (el) {
      if (Number(el.dataset.step) === step) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    if (focus) {
      var target = step === 1 ? (form.querySelector('[name="area"]:checked') || form.querySelector('[name="area"]')) : $(step === 2 ? '#symptom-choice-title' : '#symptom-results-title');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }
  function clearResults() {
    all('[data-guide]').forEach(function (el) { el.hidden = true; });
    $('#symptom-selected-list').replaceChildren();
    $('#symptom-selected-area').textContent = '';
    $('#symptom-urgent-result').hidden = true;
  }
  function chooseArea(value) {
    area = value;
    all('[name="symptom"]').forEach(function (input) { input.checked = false; });
    all('[data-area-group]').forEach(function (group) {
      group.hidden = group.dataset.areaGroup !== area;
      group.disabled = group.hidden;
    });
    clearResults();
    $('#symptom-count').textContent = '(0개 선택)';
    $('#symptom-choice-error').textContent = '';
    $('#symptom-area-error').textContent = '';
    var radio = form.querySelector('[name="area"]:checked');
    $('#symptom-area-name').textContent = radio ? radio.closest('label').querySelector('strong').textContent : '';
  }
  function reset(focus) {
    form.reset();
    safety.forEach(function (x) { x.checked = false; });
    area = '';
    chooseArea('');
    $('#symptom-emergency').hidden = true;
    $('#symptom-trauma').hidden = true;
    $('#symptom-interactive').hidden = false;
    $('#symptom-routine-booking').hidden = false;
    $('#symptom-safety-details').open = false;
    announce('');
    showStep(1, focus);
  }
  all('[name="area"]').forEach(function (input) {
    input.addEventListener('change', function () { chooseArea(input.value); });
  });
  $('#symptom-next').addEventListener('click', function () {
    if (!area) {
      $('#symptom-area-error').textContent = '불편한 부위를 하나 선택해 주세요.';
      form.querySelector('[name="area"]').focus();
      return;
    }
    showStep(2, true);
    announce('2단계. 해당하는 증상을 모두 선택해 주세요.');
  });
  all('[name="symptom"]').forEach(function (input) {
    input.addEventListener('change', function () {
      $('#symptom-count').textContent = '(' + selections().length + '개 선택)';
      $('#symptom-choice-error').textContent = '';
      clearResults();
    });
  });
  $('#symptom-back').addEventListener('click', function () { showStep(1, true); announce('1단계. 부위를 바꾸면 이전 증상 선택은 초기화됩니다.'); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (hasSafety('emergency') || hasSafety('urgent') || step !== 2) return;
    var chosen = selections();
    if (!chosen.length) {
      $('#symptom-choice-error').textContent = '해당하는 증상을 한 가지 이상 선택해 주세요.';
      form.querySelector('[data-area-group="' + area + '"] input').focus();
      return;
    }
    var ids = new Set(chosen.flatMap(function (x) { return x.dataset.guides.split(' '); }));
    all('[data-guide]').forEach(function (card) { card.hidden = !ids.has(card.dataset.guide); });
    $('#symptom-selected-area').textContent = $('#symptom-area-name').textContent + ' · 선택한 증상';
    $('#symptom-selected-list').replaceChildren();
    chosen.forEach(function (input) { var li = document.createElement('li'); li.textContent = input.closest('label').querySelector('span').textContent; $('#symptom-selected-list').append(li); });
    var urgent = chosen.some(function (x) { return x.dataset.urgent === 'yes'; });
    $('#symptom-urgent-result').hidden = !urgent;
    $('#symptom-routine-booking').hidden = urgent;
    showStep(3, true);
    announce((urgent ? '오늘 진료 문의가 우선입니다. ' : '') + '선택한 증상에 대한 안내 ' + ids.size + '개를 확인할 수 있습니다. 진단 결과가 아닙니다.');
  });
  $('#symptom-edit').addEventListener('click', function () { showStep(2, true); announce('2단계. 선택한 증상을 변경할 수 있습니다.'); });
  $('#symptom-reset').addEventListener('click', function () { reset(true); announce('모든 선택을 초기화했습니다.'); });
  safety.forEach(function (input) {
    input.addEventListener('change', function () {
      var emergency = hasSafety('emergency'), trauma = hasSafety('urgent');
      $('#symptom-emergency').hidden = !emergency;
      $('#symptom-trauma').hidden = emergency || !trauma;
      $('#symptom-interactive').hidden = emergency || trauma;
      if (emergency || trauma) { clearResults(); showStep(1, false); }
    });
  });
  $('#symptom-safety-options').hidden = false;
  reset(false);
  // Avoid exposing previous choices when returning with browser back/forward cache.
  window.addEventListener('pagehide', function () { reset(false); });
  window.addEventListener('pageshow', function (event) { if (event.persisted) reset(false); });
})();
