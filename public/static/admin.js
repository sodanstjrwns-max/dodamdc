/* 서울도담치과 관리자 — 에디터 · 업로드 · 카운터 · 지역 자동완성 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 업로드 공통 ---------- */
  function upload(url, prefix, file) {
    var fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', prefix || 'uploads');
    var csrf = $('meta[name="csrf-token"]');
    return fetch(url, { method: 'POST', body: fd, credentials: 'same-origin', headers: { 'X-CSRF-Token': csrf ? csrf.content : '' } })
      .then(function (r) { return r.json().then(function (js) { if (!r.ok || js.error) throw new Error(js.error || '업로드 실패'); return js; }); });
  }
  function toast(msg, isErr) {
    var t = $('#admin-toast');
    if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.className = isErr ? 'show err' : 'show';
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, 2600);
  }

  /* ---------- 리치 에디터 ---------- */
  var editor = $('#editor');
  var hidden = $('#content_html');
  if (editor && hidden) {
    var form = editor.closest('form');
    var uploadUrl = editor.getAttribute('data-upload') || '/admin/api/upload';
    var prefix = editor.getAttribute('data-prefix') || 'uploads';

    function sync() {
      // 첫 블록 앞의 맨 텍스트를 <p>로 감싸서 항상 블록 구조 유지
      var first = editor.firstChild;
      if (first && first.nodeType === 3 && first.textContent.trim()) {
        var p = document.createElement('p');
        editor.insertBefore(p, first); p.appendChild(first);
        var r = document.createRange(); r.selectNodeContents(p); r.collapse(false);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      }
      hidden.value = clean(editor.innerHTML);
    }
    function clean(h) {
      if (!window.AdminSanitizer) { var text = document.createElement('span'); text.textContent = h; return text.innerHTML; }
      h = window.AdminSanitizer.clean(h);
      // Keep only safe, simple editor formatting.
      return h
        .replace(/\s(style|class|dir|data-[\w-]+)="[^"]*"/gi, function (m, a) { return /^data-(key|src)$/i.test(a) ? m : ''; })
        .replace(/<span>([\s\S]*?)<\/span>/gi, '$1')
        .replace(/<(b|strong)>\s*<\/(b|strong)>/gi, '')
        .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
        .replace(/<div>/gi, '<p>').replace(/<\/div>/gi, '</p>')
        .trim();
    }
    editor.addEventListener('input', sync);
    editor.addEventListener('blur', sync);
    if (form) form.addEventListener('submit', function (e) {
      sync();
      if (!hidden.value.replace(/<[^>]+>/g, '').trim() && !$('img', editor)) {
        e.preventDefault(); toast('내용을 입력해 주세요', true); editor.focus();
        form.removeAttribute('data-submitted'); $$('[type=submit]', form).forEach(function (b) { b.disabled = false; });
      }
    });

    function exec(cmd, val) { document.execCommand(cmd, false, val || null); editor.focus(); sync(); }
    function block(tag) {
      try { document.execCommand('formatBlock', false, tag); } catch (e) { }
      editor.focus(); sync();
    }
    function insertHtml(h) {
      h = clean(h);
      editor.focus();
      if (!document.execCommand('insertHTML', false, h)) {
        editor.insertAdjacentHTML('beforeend', h);
      }
      sync();
    }
    function insertImage(js) {
      var alt = prompt('이미지 설명(alt) — 검색 노출에 도움이 됩니다', '') || '';
      insertHtml('<figure><img src="' + js.url + '" alt="' + alt.replace(/"/g, '&quot;') + '" loading="lazy">' + (alt ? '<figcaption>' + alt.replace(/</g, '&lt;') + '</figcaption>' : '') + '</figure><p></p>');
    }
    function uploadAndInsert(files) {
      Array.prototype.forEach.call(files, function (f) {
        if (!/^image\//.test(f.type)) return;
        if (f.size > 8 * 1024 * 1024) { toast('8MB 이하 이미지만 올릴 수 있습니다', true); return; }
        var ph = document.createElement('p'); ph.className = 'uploading'; ph.textContent = '이미지 업로드 중…'; editor.appendChild(ph);
        upload(uploadUrl, prefix, f).then(function (js) {
          ph.remove();
          insertImage(js); toast('이미지가 추가되었습니다');
        }).catch(function (err) {
          ph.remove();
          toast(err.message, true);
        });
      });
    }

    $$('.editor-toolbar [data-cmd]').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); }); // 선택 영역 유지
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-cmd');
        switch (cmd) {
          case 'h2': case 'h3': case 'p': block(cmd); break;
          case 'bold': exec('bold'); break;
          case 'italic': exec('italic'); break;
          case 'ul': exec('insertUnorderedList'); break;
          case 'ol': exec('insertOrderedList'); break;
          case 'quote': block('blockquote'); break;
          case 'hr': insertHtml('<hr><p></p>'); break;
          case 'clear': exec('removeFormat'); block('p'); break;
          case 'link': {
            var sel = window.getSelection();
            var text = sel && sel.toString();
            var url = prompt('링크 주소 (사이트 내부 링크는 /treatments/implant 처럼 입력)', 'https://');
            if (!url || url === 'https://') return;
            try { if (!['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(url, location.origin).protocol)) throw new Error(); } catch (_) { toast('안전한 링크 주소를 입력해 주세요.', true); return; }
            if (text) exec('createLink', url);
            else insertHtml('<a href="' + url.replace(/"/g, '&quot;') + '">' + url.replace(/</g, '&lt;') + '</a>');
            // 외부 링크는 새 창
            $$('a', editor).forEach(function (a) { if (/^https?:\/\//.test(a.getAttribute('href') || '') && a.host !== location.host) { a.target = '_blank'; a.rel = 'noopener'; } });
            sync();
            break;
          }
          case 'image': {
            var inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
            inp.onchange = function () { uploadAndInsert(inp.files); };
            inp.click();
            break;
          }
        }
      });
    });

    // 드래그 & 드롭
    ['dragenter', 'dragover'].forEach(function (ev) {
      editor.addEventListener(ev, function (e) { e.preventDefault(); editor.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      editor.addEventListener(ev, function () { editor.classList.remove('dragover'); });
    });
    editor.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!e.dataTransfer) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length) uploadAndInsert(e.dataTransfer.files);
      else { var incoming = e.dataTransfer.getData('text/html'); if (incoming) insertHtml(incoming); else { var span = document.createElement('span'); span.textContent = e.dataTransfer.getData('text/plain'); insertHtml(span.innerHTML); } }
    });
    // 붙여넣기: 이미지 → 업로드, 텍스트 → 서식 제거 후 삽입
    editor.addEventListener('paste', function (e) {
      var cd = e.clipboardData; if (!cd) return;
      var imgs = Array.prototype.filter.call(cd.items || [], function (it) { return it.kind === 'file' && /^image\//.test(it.type); });
      if (imgs.length) { e.preventDefault(); uploadAndInsert(imgs.map(function (it) { return it.getAsFile(); })); return; }
      var htmlData = cd.getData('text/html');
      var text = cd.getData('text/plain');
      if (htmlData) {
        e.preventDefault();
        var tmp = document.createElement('div'); tmp.innerHTML = clean(htmlData);
        $$('script,style,meta,link', tmp).forEach(function (n) { n.remove(); });
        insertHtml(clean(tmp.innerHTML));
      } else if (text) {
        e.preventDefault();
        insertHtml(text.split(/\n{2,}/).map(function (p) { return '<p>' + p.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p>'; }).join(''));
      }
    });
    // 단축키
    editor.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      var k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); exec('bold'); }
      else if (k === 'i') { e.preventDefault(); exec('italic'); }
      else if (k === 'k') { e.preventDefault(); var b = $('.editor-toolbar [data-cmd=link]'); if (b) b.click(); }
      else if (e.altKey && (k === '2' || k === '3')) { e.preventDefault(); block('h' + k); }
    });
    // 글자수 (본문)
    var counter = document.createElement('div');
    counter.className = 'editor-count hint';
    editor.parentNode.insertBefore(counter, editor.nextSibling);
    function count() {
      var t = editor.textContent.replace(/\s+/g, ' ').trim();
      counter.textContent = t.length.toLocaleString() + '자 · 이미지 ' + $$('img', editor).length + '장 · H2 ' + $$('h2', editor).length + '개';
    }
    editor.addEventListener('input', count); count();
    sync();
  }

  /* ---------- 업로드 슬롯 (파일 선택 → 미리보기) ---------- */
  $$('.upload-slot').forEach(function (slot) {
    var file = $('input[type=file]', slot);
    var hiddenKey = $('input[type=hidden]', slot);
    var clearBox = $('input[type=checkbox]', slot);
    if (!file) return;
    function preview(f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('이미지 파일만 가능합니다', true); file.value = ''; return; }
      if (f.size > 8 * 1024 * 1024) { toast('8MB 이하 이미지만 올릴 수 있습니다', true); file.value = ''; return; }
      var img = $('img', slot);
      if (!img) { img = document.createElement('img'); img.alt = ''; img.width = 240; img.height = 160; var e = $('.upload-empty', slot); if (e) e.replaceWith(img); else slot.insertBefore(img, file); }
      img.src = URL.createObjectURL(f);
      slot.classList.add('has');
      if (clearBox) clearBox.checked = false;
      var name = $('.upload-name', slot);
      if (!name) { name = document.createElement('span'); name.className = 'upload-name hint'; slot.appendChild(name); }
      name.textContent = f.name + ' (' + Math.round(f.size / 1024) + 'KB)';
    }
    file.addEventListener('change', function () { preview(file.files[0]); });
    // 슬롯 자체를 클릭 → 파일 선택
    slot.addEventListener('click', function (e) {
      if (e.target === file || e.target.closest('label.check') || e.target.tagName === 'INPUT') return;
      file.click();
    });
    ['dragenter', 'dragover'].forEach(function (ev) { slot.addEventListener(ev, function (e) { e.preventDefault(); slot.classList.add('dragover'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { slot.addEventListener(ev, function () { slot.classList.remove('dragover'); }); });
    slot.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      try { var dt = new DataTransfer(); dt.items.add(f); file.files = dt.files; } catch (err) { }
      preview(f);
    });
    if (clearBox) clearBox.addEventListener('change', function () {
      slot.classList.toggle('cleared', clearBox.checked);
      if (clearBox.checked) file.value = '';
    });
    void hiddenKey;
  });

  /* ---------- 글자수 카운터 ---------- */
  $$('[data-count]').forEach(function (el) {
    var max = parseInt(el.getAttribute('maxlength') || '0', 10);
    var out = document.createElement('span'); out.className = 'count hint';
    el.parentNode.appendChild(out);
    function upd() {
      var n = el.value.length;
      out.textContent = n + (max ? ' / ' + max : '') + '자';
      out.classList.toggle('warn', max && n > max * 0.9);
    }
    el.addEventListener('input', upd); upd();
  });

  /* ---------- 슬러그 자동 생성 (제목 → slug, 비어있을 때만) ---------- */
  var titleIn = $('input[name=title]'), slugIn = $('input[name=slug]');
  if (titleIn && slugIn && !slugIn.value) {
    var auto = true;
    slugIn.addEventListener('input', function () { auto = !slugIn.value; });
    titleIn.addEventListener('input', function () {
      if (!auto) return;
      var t = titleIn.value.trim();
      // 서버 정책과 동일: 영문/숫자 제목만 제목 기반 슬러그, 한글 제목은 날짜 기반 자동 생성
      slugIn.placeholder = /^[\x00-\x7F]+$/.test(t) && t
        ? t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
        : (t ? '비우면 자동 생성 (예: ' + (slugIn.getAttribute('data-kind') || 'column') + '-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-xxxx)' : '비우면 자동 생성');
    });
  }

  /* ---------- 지역 자동완성 (app.js가 관리자에 없을 때) ---------- */
  $$('.autocomplete').forEach(function (ac) {
    var input = $('input', ac), list = $('.autocomplete-list', ac), timer;
    if (!input || !list || input._acBound) return;
    input._acBound = true;
    input.setAttribute('autocomplete', 'off');
    function close() { list.innerHTML = ''; list.classList.remove('open'); }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 1) return close();
      timer = setTimeout(function () {
        fetch('/api/regions?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (js) {
          var items = js.results || js || [];
          if (!items.length) return close();
          list.innerHTML = items.map(function (x) { var v = typeof x === 'string' ? x : x.label || x.name; return '<button type="button" role="option">' + v.replace(/</g, '&lt;') + '</button>'; }).join('');
          list.classList.add('open');
        }).catch(close);
      }, 160);
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      input.value = b.textContent; close(); input.dispatchEvent(new Event('change'));
    });
    input.addEventListener('keydown', function (e) {
      var opts = $$('button', list); if (!opts.length) return;
      var i = opts.findIndex(function (o) { return o.classList.contains('active'); });
      if (e.key === 'ArrowDown') { e.preventDefault(); opts.forEach(function (o) { o.classList.remove('active'); }); opts[(i + 1) % opts.length].classList.add('active'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); opts.forEach(function (o) { o.classList.remove('active'); }); opts[(i - 1 + opts.length) % opts.length].classList.add('active'); }
      else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); opts[i].click(); }
      else if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function (e) { if (!ac.contains(e.target)) close(); });
  });

  /* ---------- 중복 제출 방지 ---------- */
  $$('form[data-once]').forEach(function (f) {
    f.addEventListener('submit', function () {
      if (f.getAttribute('data-submitted')) return;
      f.setAttribute('data-submitted', '1');
      $$('[type=submit]', f).forEach(function (b) { b.disabled = true; b.dataset.label = b.textContent; b.textContent = '저장 중…'; });
    });
  });

  /* ---------- 삭제 확인 ---------- */
  $$('form[data-confirm], a[data-confirm], button[data-confirm]').forEach(function (el) {
    var ev = el.tagName === 'FORM' ? 'submit' : 'click';
    el.addEventListener(ev, function (e) { if (!confirm(el.getAttribute('data-confirm') || '정말 삭제할까요? 되돌릴 수 없습니다.')) e.preventDefault(); });
  });

  /* ---------- 전화번호 자동 하이픈 ---------- */
  $$('input[type=tel]').forEach(function (i) {
    i.addEventListener('input', function () {
      var v = i.value.replace(/[^\d]/g, '').slice(0, 11);
      i.value = v.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
    });
  });
})();
