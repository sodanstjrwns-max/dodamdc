/* 서울도담치과 — 프론트 인터랙션 (vanilla, no deps) */
(function () {
  'use strict';
  var d = document, w = window;
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* Only allowlisted actions and a signed per-render ticket. Never read form values,
     query strings, referrers, patient details, or send data to GA4. */
  var conversionTicket = $('meta[name="conversion-ticket"]');
  var sentConversions = new Set();
  function trackConversionClick(e) {
    if (!e.isTrusted || (e.type === 'auxclick' && e.button !== 1) || !conversionTicket || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    var link = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!link) return;
    var url;
    try { url = new URL(link.href, w.location.origin); } catch (_) { return; }
    var event = link.dataset.bookingProvider === 'naver' ? 'naver_click' :
      url.protocol === 'tel:' ? 'phone_click' :
      url.hostname === 'pf.kakao.com' ? 'kakao_click' :
      url.origin === w.location.origin && url.pathname === '/reservation' ? 'reservation_click' : '';
    if (!event) return;
    var location = link.dataset.conversionLocation ||
      (link.closest('.mobile-action-bar') ? 'mobile_bar' :
      link.closest('#mobile-nav') ? 'mobile_menu' :
      link.closest('.site-header') ? 'header' :
      link.closest('.floating-cta') ? 'floating' :
      link.closest('.site-footer') ? 'footer' :
      link.closest('.reading-nav') ? 'reading_nav' :
      link.closest('.tx-side') ? 'sidebar' :
      link.closest('.cta-strip') ? 'cta_strip' :
      d.body.classList.contains('reservation-page') ? 'reservation' :
      d.body.classList.contains('home-page') ? 'home' :
      link.closest('.page-hero') ? 'hero' : 'content');
    var key = event + ':' + location;
    if (sentConversions.has(key)) return;
    sentConversions.add(key);
    // Navigation must not wait on analytics. No retries (avoids duplicate sends).
    fetch('/api/conversions', { method: 'POST', keepalive: true, credentials: 'omit',
      referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: event, location: location, ticket: conversionTicket.content })
    }).catch(function () {});
  }
  d.addEventListener('click', trackConversionClick);
  d.addEventListener('auxclick', trackConversionClick);

  /* ── 헤더: 스크롤 상태 / 진행바 / 플로팅 CTA ───────────── */
  var header = $('#site-header'), progress = $('#scroll-progress'), fab = $('#floating-cta');
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = w.scrollY || d.documentElement.scrollTop;
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      // Keep navigation available while reading; avoid moving targets.
      header.classList.remove('hide');
    }
    if (progress) {
      var h = d.documentElement.scrollHeight - w.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    }
    if (fab) fab.classList.toggle('show', y > 480);
    updateReadingPosition();
    lastY = y; ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ── 모바일 메뉴 ─────────────────────────────────────── */
  var toggle = $('#menu-toggle'), mnav = $('#mobile-nav');
  if (toggle && mnav) {
    var outsideMenu = $$('#main, .site-footer, .floating-cta, .mobile-action-bar');
    function setMenu(open, restoreFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      mnav.hidden = !open;
      d.body.classList.toggle('menu-open', open);
      outsideMenu.forEach(function(el) { el.inert = open; });
      if (!open && restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true', false); });
    mnav.addEventListener('click', function(e) { if (e.target.closest('a')) setMenu(false, false); });
    d.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { e.preventDefault(); setMenu(false, true); }
      if (e.key === 'Tab') {
        var focusable = [toggle].concat($$('a, summary, button', mnav).filter(function(el) { return el.getClientRects().length; }));
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && (d.activeElement === first || !mnav.contains(d.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    w.addEventListener('resize', function() { if (w.innerWidth > 1000 && !mnav.hidden) setMenu(false, false); });
  }
  /* Show the current page and its parent section, including detail pages. */
  var currentPath = location.pathname.replace(/\/$/, '') || '/';
  $$('#gnb a, #mobile-nav a').forEach(function(a) {
    if (a.getAttribute('href') === currentPath) a.setAttribute('aria-current', 'page');
  });
  var navGroups = {
    '/mission': ['/mission'],
    '/doctors': ['/doctors'],
    '/treatments': ['/treatments', '/floor-guide'],
    '/column': ['/column', '/cases', '/encyclopedia'],
    '/directions': ['/directions', '/hours', '/pricing', '/faq', '/notice']
  };
  $$('.gnb-list > li').forEach(function(li) {
    var trigger = $('a', li);
    var paths = navGroups[trigger && trigger.getAttribute('href')] || [];
    li.classList.toggle('is-current-section', paths.some(function(path) {
      return currentPath === path || currentPath.indexOf(path + '/') === 0;
    }));
  });
  $$('#mobile-nav details').forEach(function(details) {
    if ($$('a', details).some(function(a) {
      var path = a.getAttribute('href');
      return path && (currentPath === path || currentPath.indexOf(path + '/') === 0);
    })) {
      details.open = true;
      $('summary', details).classList.add('is-current-section');
    }
  });
  /* Desktop navigation exposes its expanded state to assistive technology. */
  $$('.gnb-list > li').forEach(function (li) {
    var trigger = $('a', li);
    if (!trigger) return;
    var href = trigger.getAttribute('href');
    if (href === location.pathname) trigger.setAttribute('aria-current', 'page');
    if (!li.matches('.has-mega, .has-drop')) return;
    function expanded(value) { trigger.setAttribute('aria-expanded', String(value)); }
    li.addEventListener('mouseenter', function() { li.classList.remove('menu-dismissed'); expanded(true); });
    li.addEventListener('mouseleave', function() { if (!li.contains(d.activeElement)) expanded(false); });
    li.addEventListener('focusin', function() { li.classList.remove('menu-dismissed'); expanded(true); });
    li.addEventListener('focusout', function() { setTimeout(function() { if (!li.contains(d.activeElement)) expanded(false); }, 0); });
    li.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { trigger.focus(); li.classList.add('menu-dismissed'); expanded(false); }
    });
  });

  /* Treatment tabs: all content remains readable when JavaScript is disabled. */
  var careTabs = $$('.care-tab'), carePanels = $$('.care-panel');
  if (careTabs.length && carePanels.length === careTabs.length) {
    $('.care-tabs').setAttribute('role', 'tablist');
    function selectCare(index, focus) {
      careTabs.forEach(function(tab, i) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(i === index));
        tab.setAttribute('tabindex', i === index ? '0' : '-1');
        tab.classList.toggle('active', i === index);
        carePanels[i].setAttribute('role', 'tabpanel');
        carePanels[i].setAttribute('tabindex', '0');
        carePanels[i].hidden = i !== index;
      });
      if (focus) careTabs[index].focus();
    }
    careTabs.forEach(function(tab, i) {
      tab.addEventListener('click', function() { selectCare(i, false); });
      tab.addEventListener('keydown', function(e) {
        var next = i;
        if (e.key === 'ArrowRight') next = (i + 1) % careTabs.length;
        else if (e.key === 'ArrowLeft') next = (i + careTabs.length - 1) % careTabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = careTabs.length - 1;
        else return;
        e.preventDefault(); selectCare(next, true);
      });
    });
    selectCare(0, false);
  }

  /* ── 스크롤 리빌 / 스태거 / 카운트업 ─────────────────── */
  var revealEls = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger');
  if (reduced || !('IntersectionObserver' in w)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    $$('.count[data-to]').forEach(function (el) { el.textContent = fmt(el, +el.getAttribute('data-to')); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target); countUp(en.target);
      });
    }, { threshold: 0.4 });
    $$('.count[data-to]').forEach(function (el) { cio.observe(el); });
  }
  function fmt(el, n) {
    var dec = +(el.getAttribute('data-dec') || 0);
    var s = dec ? n.toFixed(dec) : Math.round(n).toLocaleString('ko-KR');
    return (el.getAttribute('data-prefix') || '') + s + (el.getAttribute('data-suffix') || '');
  }
  function countUp(el) {
    var to = +el.getAttribute('data-to'), dur = +(el.getAttribute('data-dur') || 1400), t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── 패럴랙스 (가벼운 translateY) ─────────────────────── */
  var px = $$('.parallax');
  if (px.length && !reduced) {
    var pxTick = false;
    function parallax() {
      var vh = w.innerHeight;
      px.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var sp = +(el.getAttribute('data-speed') || 0.15);
        var off = (r.top + r.height / 2 - vh / 2) * sp;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      pxTick = false;
    }
    w.addEventListener('scroll', function () { if (!pxTick) { pxTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ── 핵심진료 스티키 시퀀스 ───────────────────────────── */
  $$('.core-seq').forEach(function (seq) {
    var steps = $$('.core-step', seq), imgs = $$('.core-sticky-img img', seq), label = $('.core-sticky-label', seq);
    if (!steps.length) return;
    function activate(i) {
      steps.forEach(function (s, j) { s.classList.toggle('active', i === j); });
      imgs.forEach(function (im, j) { im.classList.toggle('active', i === j); });
      if (label) label.textContent = steps[i].getAttribute('data-label') || '';
    }
    activate(0);
    if (!('IntersectionObserver' in w)) return;
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(+en.target.getAttribute('data-index') || 0); });
    }, { rootMargin: '-40% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
    steps.forEach(function (s) { s.addEventListener('mouseenter', function () { if (w.innerWidth > 960) activate(+s.getAttribute('data-index') || 0); }); });
  });

  /* The compact reading toolbar follows the section without hijacking scrolling. */
  var readingNav = $('.reading-nav');
  var readingSections = readingNav ? $$('a[href^="#"]', readingNav).map(function(link) {
    return { link: link, section: d.getElementById(link.getAttribute('href').slice(1)) };
  }).filter(function(item) { return item.section; }) : [];
  var activeReading = null;
  function updateReadingPosition() {
    if (!readingNav || !readingSections || !readingSections.length) return;
    var threshold = readingNav.getBoundingClientRect().bottom + 40;
    var current = readingSections[0];
    readingSections.forEach(function(item) {
      if (item.section.getBoundingClientRect().top <= threshold) current = item;
    });
    if (activeReading === current.link) return;
    if (activeReading) activeReading.removeAttribute('aria-current');
    activeReading = current.link;
    activeReading.setAttribute('aria-current', 'location');
  }
  updateReadingPosition();
  w.addEventListener('resize', updateReadingPosition, { passive: true });

  /* ── 목차(TOC) 현재 섹션 표시 ─────────────────────────── */
  var toc = $('.toc');
  if (toc && 'IntersectionObserver' in w) {
    var links = $$('a[href^="#"]', toc), map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); var t = d.getElementById(id); if (t) map[id] = a; });
    var current = null;
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (current) current.classList.remove('active');
          current = map[en.target.id]; if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { tio.observe(d.getElementById(id)); });
  }

  /* ── 비포/애프터 슬라이더 ─────────────────────────────── */
  $$('.ba').forEach(function (ba) {
    var range = $('input[type=range]', ba), after = $('img.after', ba), handle = $('.ba-handle', ba);
    if (!range || !after) return;
    function set(v) {
      after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      if (handle) handle.style.left = v + '%';
    }
    range.addEventListener('input', function () { set(range.value); });
    set(range.value || 50);
    var dragging = false;
    function pos(e) {
      var r = ba.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var v = Math.max(0, Math.min(100, (x / r.width) * 100));
      range.value = v; set(v);
    }
    ba.addEventListener('pointerdown', function (e) { if (e.target === range) return; dragging = true; pos(e); });
    w.addEventListener('pointermove', function (e) { if (dragging) pos(e); });
    w.addEventListener('pointerup', function () { dragging = false; });
  });

  /* ── 지역 자동완성 ────────────────────────────────────── */
  $$('.autocomplete').forEach(function (ac) {
    var input = $('input', ac), list = $('.autocomplete-list', ac), timer;
    if (!input || !list) return;
    input.setAttribute('autocomplete', 'off');
    function close() { list.classList.remove('open'); list.innerHTML = ''; }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 1) return close();
      timer = setTimeout(function () {
        fetch('/api/regions?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (js) {
          var items = js.results || [];
          if (!items.length) return close();
          list.innerHTML = items.map(function (it) { return '<button type="button" class="sel" data-v="' + it.replace(/"/g, '&quot;') + '">' + it + '</button>'; }).join('');
          list.classList.add('open');
        }).catch(close);
      }, 160);
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.sel'); if (!b) return;
      input.value = b.getAttribute('data-v'); close();
    });
    d.addEventListener('click', function (e) { if (!ac.contains(e.target)) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  });

  /* ── FAQ 검색/필터 ────────────────────────────────────── */
  var faqSearch = $('.faq-search input');
  if (faqSearch) {
    var items = $$('.faq-item'), groups = $$('.faq-group'), chips = $$('.faq-filter button');
    var cat = 'all';
    function apply() {
      var q = faqSearch.value.trim().toLowerCase();
      items.forEach(function (it) {
        var okCat = cat === 'all' || it.getAttribute('data-cat') === cat;
        var okQ = !q || it.textContent.toLowerCase().indexOf(q) > -1;
        it.hidden = !(okCat && okQ);
        if (q && okCat && okQ) it.open = true;
      });
      groups.forEach(function (g) { g.hidden = !$$('.faq-item:not([hidden])', g).length; });
      var empty = $('.faq-empty'); if (empty) empty.hidden = !!$$('.faq-item:not([hidden])').length;
    }
    faqSearch.addEventListener('input', apply);
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
        cat = b.getAttribute('data-cat') || 'all'; apply();
      });
    });
  }

  /* ── 백과사전 검색 ────────────────────────────────────── */
  var encySearch = $('#ency-search');
  if (encySearch) {
    var encyItems = $$('.ency-item'), encyGroups = $$('.ency-group');
    encySearch.addEventListener('input', function () {
      var q = encySearch.value.trim().toLowerCase();
      encyItems.forEach(function (it) { it.hidden = !!q && it.textContent.toLowerCase().indexOf(q) === -1; });
      encyGroups.forEach(function (g) { g.hidden = !$$('.ency-item:not([hidden])', g).length; });
    });
  }

  /* ── 폼: 전화번호 포맷 / 중복 제출 방지 ──────────────── */
  $$('input[type=tel]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var v = inp.value.replace(/[^\d]/g, '').slice(0, 11);
      if (v.length > 7) v = v.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
      else if (v.length > 3) v = v.replace(/^(\d{2,3})(\d+)$/, '$1-$2');
      inp.value = v;
    });
  });
  $$('form[data-once]').forEach(function (f) {
    f.addEventListener('submit', function () {
      var b = $('button[type=submit]', f); if (b) { b.disabled = true; b.textContent = b.getAttribute('data-loading') || '처리 중…'; }
    });
  });

  /* ── 헤더 높이만큼 앵커 오프셋 ───────────────────────── */
  if (location.hash) setTimeout(function () {
    try { var t = d.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView({ block: 'start' }); } catch (_) { /* Ignore malformed URL fragments. */ }
  }, 50);

  /* ── 진료시간 오늘 표시 ──────────────────────────────── */
  var today = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.now() + 9 * 3600e3).getUTCDay()];
  $$('.hours-table tr[data-day]').forEach(function (tr) { tr.classList.toggle('today', tr.getAttribute('data-day') === today); });

  /* ── 공유 버튼 ───────────────────────────────────────── */
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: d.title, url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else navigator.clipboard.writeText(location.href).then(function () { b.textContent = '링크 복사됨'; });
    });
  });
  d.documentElement.classList.add('js');
})();
