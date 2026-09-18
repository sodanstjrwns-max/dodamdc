/* 서울도담치과 관리자 — 예약 알림(Web Push) 설정 화면 */
(function () {
  'use strict';
  var panel = document.getElementById('push-panel');
  if (!panel) return;
  var $ = function (s) { return document.querySelector(s); };
  var publicKey = panel.getAttribute('data-public-key') || '';
  var configured = panel.getAttribute('data-configured') === '1';
  var status = $('#push-status'), hint = $('#push-hint'), enableBtn = $('#push-enable'), testBtn = $('#push-test'), list = $('#push-devices'), count = $('#push-count');
  var reg = null, current = null;

  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  function csrf() { var m = $('meta[name="csrf-token"]'); return m ? m.content : ''; }
  function setStatus(text, kind) { status.textContent = text; status.style.color = kind === 'ok' ? '#1d6b3a' : kind === 'err' ? '#b03a2e' : ''; }
  function setHint(text) { hint.textContent = text || ''; hint.hidden = !text; }
  function toast(msg, isErr) {
    var t = $('#admin-toast');
    if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.className = isErr ? 'show err' : 'show';
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, 3200);
  }
  function post(url, body) {
    return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (js) { if (!r.ok || js.error) throw new Error(js.error || ('요청 실패 (' + r.status + ')')); return js; }); });
  }
  function urlBase64ToUint8Array(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4);
    var raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function deviceLabel() {
    var device = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows PC' : /Macintosh/.test(ua) ? 'Mac' : '기기';
    var browser = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? '삼성 인터넷' : /Whale/.test(ua) ? '웨일' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '브라우저';
    return device + ' · ' + browser + (standalone ? ' · 홈 화면 앱' : '');
  }
  function fmt(v) { return v ? String(v).slice(0, 10).replace(/-/g, '.') : ''; }
  function render(devices) {
    list.textContent = '';
    count.textContent = devices.length + '대';
    if (!devices.length) { var li = document.createElement('li'); li.className = 'hint'; li.textContent = '아직 등록된 기기가 없습니다.'; list.appendChild(li); return; }
    devices.forEach(function (d) {
      var li = document.createElement('li');
      li.setAttribute('data-endpoint', d.endpoint);
      li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d8e3df;border-radius:12px;background:#f8fbf9';
      var info = document.createElement('span'), name = document.createElement('strong'), meta = document.createElement('span');
      name.textContent = d.label + (current && current.endpoint === d.endpoint ? ' (이 기기)' : '');
      meta.className = 'hint'; meta.style.margin = '0';
      meta.textContent = '등록 ' + fmt(d.created_at) + (d.last_ok_at ? ' · 마지막 발송 ' + fmt(d.last_ok_at) : '') + (d.fail_count ? ' · 실패 ' + d.fail_count + '회' : '');
      info.appendChild(name); info.appendChild(document.createElement('br')); info.appendChild(meta);
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-outline btn-sm push-remove'; btn.setAttribute('data-endpoint', d.endpoint); btn.textContent = '해제';
      li.appendChild(info); li.appendChild(btn); list.appendChild(li);
    });
  }
  function registeredHere() {
    if (!current) return false;
    return !!list.querySelector('li[data-endpoint="' + CSS.escape(current.endpoint) + '"]');
  }
  function refreshState() {
    if (Notification.permission === 'denied') {
      setStatus('권한 거부됨 — 브라우저(또는 휴대폰 설정)의 알림 권한을 허용으로 바꾼 뒤 다시 시도해 주세요.', 'err');
      enableBtn.disabled = true; testBtn.disabled = true; return;
    }
    if (current && registeredHere()) {
      setStatus('켜짐 — 이 기기로 새 예약 알림을 보냅니다.', 'ok');
      enableBtn.textContent = '이 기기 다시 등록'; enableBtn.disabled = false; testBtn.disabled = !configured;
    } else {
      setStatus('꺼짐 — 아래 버튼을 눌러 이 기기에서 알림을 켜 주세요.');
      enableBtn.textContent = '이 기기에서 알림 켜기'; enableBtn.disabled = false; testBtn.disabled = true;
    }
    // 목록에 '이 기기' 표시 갱신
    if (current) list.querySelectorAll('li[data-endpoint]').forEach(function (li) {
      var strong = li.querySelector('strong');
      if (strong && li.getAttribute('data-endpoint') === current.endpoint && strong.textContent.indexOf('(이 기기)') < 0) strong.textContent += ' (이 기기)';
    });
  }

  function init() {
    if (!supported) {
      if (isIOS && !standalone) {
        setStatus('아이폰·아이패드는 먼저 홈 화면에 추가해야 합니다.', 'err');
        setHint('사파리 하단 공유 버튼 → ‘홈 화면에 추가’ → 홈 화면의 ‘도담 관리자’ 앱을 열어 로그인한 뒤 이 화면에서 켜 주세요.');
      } else {
        setStatus('이 브라우저는 알림을 지원하지 않습니다. 크롬·엣지·사파리(iOS 16.4 이상)를 사용해 주세요.', 'err');
      }
      enableBtn.disabled = true; testBtn.disabled = true; return;
    }
    if (isIOS && !standalone) setHint('아이폰에서는 홈 화면에 추가한 ‘도담 관리자’ 앱 안에서 켜야 알림이 도착합니다.');
    if (!publicKey) { setStatus('서버에 알림 키가 설정되지 않았습니다.', 'err'); enableBtn.disabled = true; return; }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (r) {
      reg = r;
      return r.pushManager.getSubscription();
    }).then(function (sub) {
      current = sub;
      refreshState();
    }).catch(function (e) {
      setStatus('서비스 워커 등록 실패: ' + e.message, 'err');
    });
  }

  enableBtn.addEventListener('click', function () {
    enableBtn.disabled = true;
    setStatus('권한을 요청하는 중…');
    Promise.resolve(Notification.requestPermission()).then(function (perm) {
      if (perm !== 'granted') { refreshState(); if (perm === 'default') setStatus('알림 허용을 선택하지 않아 켜지지 않았습니다. 다시 눌러 주세요.', 'err'); return; }
      return (reg ? Promise.resolve(reg) : navigator.serviceWorker.ready).then(function (r) {
        reg = r;
        return r.pushManager.getSubscription().then(function (sub) {
          return sub || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
        });
      }).then(function (sub) {
        current = sub;
        return post('/admin/api/push/subscribe', { subscription: sub.toJSON(), label: deviceLabel() });
      }).then(function (js) {
        render(js.devices || []);
        refreshState();
        toast('이 기기에서 알림을 켰습니다.');
      });
    }).catch(function (e) {
      refreshState();
      setStatus('알림을 켜지 못했습니다: ' + (e && e.message ? e.message : e), 'err');
    });
  });

  testBtn.addEventListener('click', function () {
    testBtn.disabled = true;
    post('/admin/api/push/test', { endpoint: current ? current.endpoint : null }).then(function (js) {
      render(js.devices || []); refreshState();
      toast(js.sent ? '테스트 알림을 보냈습니다. 잠시 후 알림이 표시됩니다.' : '발송에 실패했습니다. 잠시 후 다시 시도해 주세요.', !js.sent);
    }).catch(function (e) { toast(e.message, true); testBtn.disabled = false; });
  });

  list.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.push-remove');
    if (!btn) return;
    var endpoint = btn.getAttribute('data-endpoint');
    if (!confirm('이 기기의 알림을 해제할까요?')) return;
    btn.disabled = true;
    var local = current && current.endpoint === endpoint ? current.unsubscribe().catch(function () {}) : Promise.resolve();
    local.then(function () {
      if (current && current.endpoint === endpoint) current = null;
      return post('/admin/api/push/unsubscribe', { endpoint: endpoint });
    }).then(function (js) {
      render(js.devices || []); refreshState(); toast('알림을 해제했습니다.');
    }).catch(function (e) { toast(e.message, true); btn.disabled = false; });
  });

  init();
})();
