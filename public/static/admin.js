/* 서울도담치과 관리자 — 에디터 · 업로드 · 카운터 · 지역 자동완성 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var pendingUploads = 0;
  var uploadTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  /* ---------- 업로드 공통 ---------- */
  function upload(url, prefix, file) {
    if (uploadTypes.indexOf(file.type) < 0 || file.size > 8 * 1024 * 1024) return Promise.reject(new Error('8MB 이하 JPG·PNG·WebP·GIF만 가능합니다. HEIC는 JPG로 변환해 주세요.'));
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
      if (typeof count === 'function' && counter) count();
      editor.dispatchEvent(new CustomEvent('editor-synced', { bubbles: true }));
    }
    function clean(h) {
      if (!window.AdminSanitizer) { var text = document.createElement('span'); text.textContent = h; return text.innerHTML; }
      h = window.AdminSanitizer.clean(h.replace(/<(\/?)(h1)(?=[\s>])/gi, '<$1h2'));
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

    var savedRange;
    document.addEventListener('selectionchange', function () { var s = window.getSelection(); if (s.rangeCount && editor.contains(s.anchorNode) && editor.contains(s.focusNode)) savedRange = s.getRangeAt(0).cloneRange(); });
    function restoreRange() { editor.focus(); if (savedRange && editor.contains(savedRange.commonAncestorContainer)) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
    function exec(cmd, val) { restoreRange(); document.execCommand(cmd, false, val || null); editor.focus(); sync(); }
    function block(tag) {
      restoreRange();
      try { document.execCommand('formatBlock', false, tag); } catch (e) { }
      editor.focus(); sync();
    }
    function insertHtml(h) {
      h = clean(h);
      restoreRange();
      if (!document.execCommand('insertHTML', false, h)) {
        editor.insertAdjacentHTML('beforeend', h);
      }
      sync();
    }
    function insertImage(js) {
      var alt = prompt('이미지의 내용을 설명해 주세요. 개인정보는 입력하지 마세요.', '') || '';
      var figure = document.createElement('figure'), image = document.createElement('img');
      image.src = js.url; image.alt = alt; image.loading = 'lazy'; image.width = 960; image.height = 640; figure.appendChild(image);
      if (alt) { var caption = document.createElement('figcaption'); caption.textContent = alt; figure.appendChild(caption); }
      insertHtml(figure.outerHTML + '<p><br></p>');
      var probe = new Image(); probe.onload = function () { $$('img', editor).forEach(function (img) { if (img.getAttribute('src') === js.url) { img.width = probe.naturalWidth; img.height = probe.naturalHeight; } }); sync(); }; probe.src = js.url;
    }
    function uploadAndInsert(files) {
      Array.prototype.forEach.call(files, function (f) {
        if (uploadTypes.indexOf(f.type) < 0) { toast('JPG·PNG·WebP·GIF만 지원합니다. HEIC는 JPG로 변환해 주세요.', true); return; }
        if (f.size > 8 * 1024 * 1024) { toast('8MB 이하 이미지만 올릴 수 있습니다', true); return; }
        pendingUploads++;
        var ph = document.createElement('p'); ph.className = 'uploading'; ph.textContent = '이미지 업로드 중…'; editor.parentNode.appendChild(ph);
        upload(uploadUrl, prefix, f).then(function (js) {
          ph.remove();
          insertImage(js); toast('이미지가 추가되었습니다');
        }).catch(function (err) {
          ph.remove();
          toast(err.message, true);
        }).finally(function () { pendingUploads--; });
      });
    }

    $$('.editor-toolbar [data-cmd]').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); }); // 선택 영역 유지
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-cmd');
        switch (cmd) {
          case 'h2': case 'h3': case 'p': block(cmd); break;
          case 'undo': case 'redo': case 'unlink': exec(cmd); break;
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
            inp.type = 'file'; inp.accept = uploadTypes.join(','); inp.multiple = false; inp.setAttribute('aria-label', '본문 이미지 선택');
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
    editor._sync = sync;
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
      if (uploadTypes.indexOf(f.type) < 0) { toast('JPG·PNG·WebP·GIF만 가능합니다. HEIC는 JPG로 변환해 주세요.', true); file.value = ''; return; }
      if (f.size > 8 * 1024 * 1024) { toast('8MB 이하 이미지만 올릴 수 있습니다', true); file.value = ''; return; }
      var img = $('img', slot);
      if (!img) { img = document.createElement('img'); img.alt = ''; img.width = 240; img.height = 160; var e = $('.upload-empty', slot); if (e) e.replaceWith(img); else slot.insertBefore(img, file); }
      if (slot._objectUrl) URL.revokeObjectURL(slot._objectUrl);
      slot._objectUrl = URL.createObjectURL(f); img.src = slot._objectUrl; img.alt = file.getAttribute('aria-label') || '선택한 이미지 미리보기';
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
      try { var dt = new DataTransfer(); dt.items.add(f); file.files = dt.files; } catch (err) { toast('이 브라우저에서는 파일 선택 버튼을 사용해 주세요.', true); return; }
      preview(f); file.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (clearBox) clearBox.addEventListener('change', function () {
      slot.classList.toggle('cleared', clearBox.checked);
      if (clearBox.checked) file.value = '';
    });
    void hiddenKey;
  });

  /* ---------- CMS workspace: previews, recoverable saving and unsaved changes ---------- */
  var cmsForm = $('[data-cms-form]');
  if (cmsForm) {
    var dirty = false, saving = false;
    var status = document.createElement('p'); status.className = 'cms-save-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    status.textContent = '새 글은 비공개로 시작합니다. 저장 전에는 서버에 반영되지 않습니다.';
    cmsForm.prepend(status);
    $$('input,textarea,select', cmsForm).forEach(function (field, index) {
      if (field.type === 'hidden' || field.hidden || field.labels && field.labels.length) return;
      field.id = field.id || 'cms-field-' + index;
      var label = field.closest('.field') && $('label', field.closest('.field'));
      if (label && !label.htmlFor) label.htmlFor = field.id;
      if (field.type === 'file' && !field.hasAttribute('aria-label')) field.setAttribute('aria-label', label ? label.textContent + ' 파일 선택' : '이미지 파일 선택');
    });
    function markDirty() { dirty = true; if (!saving) { status.textContent = '저장하지 않은 변경사항이 있습니다.'; status.classList.remove('error'); } }
    cmsForm.addEventListener('input', markDirty); cmsForm.addEventListener('change', markDirty); cmsForm.addEventListener('editor-synced', markDirty);
    window.addEventListener('beforeunload', function (event) { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
    window.addEventListener('pageshow', function () { saving = false; cmsForm.inert = false; cmsForm.removeAttribute('aria-busy'); });
    cmsForm.addEventListener('keydown', function (event) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); cmsForm.requestSubmit(); } });
    cmsForm.addEventListener('submit', async function (event) {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (saving) return;
      if (pendingUploads) { status.textContent = '이미지 업로드가 끝난 뒤 저장해 주세요.'; return; }
      if (!cmsForm.reportValidity()) return;
      var text = editor ? editor.textContent.trim() : '';
      if (cmsForm.dataset.cmsForm === 'column' && text.length < 20) { status.textContent = '칼럼 본문을 20자 이상 입력해 주세요.'; status.classList.add('error'); editor.focus(); return; }
      var body = new FormData(cmsForm), token = $('meta[name="csrf-token"]');
      saving = true; cmsForm.inert = true; cmsForm.setAttribute('aria-busy', 'true'); status.textContent = '저장 중입니다. 잠시만 기다려 주세요.';
      try {
        var response = await fetch(cmsForm.action || location.href, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': token ? token.content : '', 'X-CMS-Request': '1', Accept: 'application/json' }, body: body });
        if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('로그인 상태 또는 저장 결과를 확인해 주세요. 입력 내용은 이 화면에 남아 있습니다.');
        var data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || '저장하지 못했습니다. 입력 내용을 유지했습니다.');
        var target = new URL(data.redirect, location.origin);
        if (target.origin !== location.origin || !/^\/admin\/(cases|columns|notices)$/.test(target.pathname)) throw new Error('저장 결과를 목록에서 확인해 주세요.');
        dirty = false; status.textContent = '저장되었습니다. 목록으로 이동합니다.'; location.assign(target.href);
      } catch (error) {
        saving = false; cmsForm.inert = false; cmsForm.removeAttribute('aria-busy');
        status.textContent = error instanceof TypeError ? '연결이 끊겨 저장 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 중복 등록을 피하려면 목록을 먼저 확인해 주세요.' : error.message;
        status.classList.add('error'); toast(status.textContent, true); status.scrollIntoView({ block: 'nearest' });
      }
    });
    var previewButton = $('[data-cms-preview]', cmsForm);
    if (previewButton) previewButton.addEventListener('click', function () {
      var modal = document.createElement('dialog'); modal.className = 'cms-preview'; modal.setAttribute('aria-label', '작성 내용 미리보기');
      var controls = document.createElement('div'); controls.className = 'cms-preview-controls';
      var article = document.createElement('article'); article.className = 'cms-preview-article prose';
      [['모바일 폭', 'mobile'], ['PC 폭', 'desktop'], ['닫기', 'close']].forEach(function (entry) { var button = document.createElement('button'); button.type = 'button'; button.textContent = entry[0]; button.className = 'btn btn-outline btn-sm'; button.addEventListener('click', function () { if (entry[1] === 'close') modal.close(); else article.classList.toggle('mobile-preview', entry[1] === 'mobile'); }); controls.appendChild(button); });
      var note = document.createElement('p'); note.className = 'cms-guidance'; note.textContent = cmsForm.dataset.cmsForm === 'case' ? '직원 사진 점검 화면입니다. 치료 후 사진은 공개 방문자에게 표시되지 않습니다.' : '저장 전 본문 미리보기입니다. 자동 용어 링크·공개 페이지의 전체 레이아웃과는 다를 수 있습니다.';
      var heading = document.createElement('h1'); heading.textContent = $('[name=title]', cmsForm).value || '제목을 입력해 주세요'; article.appendChild(heading);
      if (editor && window.AdminSanitizer) { var content = document.createElement('div'); content.innerHTML = window.AdminSanitizer.clean(editor.innerHTML); article.appendChild(content); }
      else { var description = document.createElement('p'); description.className = 'cms-case-description'; description.textContent = $('[name=description]', cmsForm)?.value || ''; article.appendChild(description); }
      $$('.upload-slot', cmsForm).forEach(function (slot) { var source = $('img', slot), clear = $('input[type=checkbox]', slot); if (!source || clear && clear.checked) return; var figure = document.createElement('figure'); var image = source.cloneNode(); image.removeAttribute('width'); image.removeAttribute('height'); var caption = document.createElement('figcaption'); caption.textContent = $('label', slot)?.textContent || '대표 이미지'; figure.append(image, caption); article.appendChild(figure); });
      article.addEventListener('click', function (event) { if (event.target.closest('a')) event.preventDefault(); });
      modal.append(controls, note, article); document.body.appendChild(modal); modal.addEventListener('close', function () { modal.remove(); previewButton.focus(); }); modal.showModal();
    });
    // Explicit image editing instead of leaving an inserted photo unmanageable.
    if (editor) {
      var imageTools = document.createElement('div'); imageTools.className = 'cms-image-tools'; imageTools.hidden = true;
      var altInput = document.createElement('input'); altInput.type = 'text'; altInput.maxLength = 250; altInput.setAttribute('aria-label', '선택 이미지 설명');
      var selectedImage;
      var apply = document.createElement('button'); apply.type = 'button'; apply.textContent = '설명 적용';
      var remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '이미지 삭제';
      imageTools.append(altInput, apply, remove); editor.after(imageTools);
      editor.addEventListener('click', function (event) { if (event.target.tagName !== 'IMG') return; selectedImage = event.target; altInput.value = selectedImage.alt; imageTools.hidden = false; });
      apply.addEventListener('click', function () { if (!selectedImage || !editor.contains(selectedImage)) return; selectedImage.alt = altInput.value; var caption = selectedImage.closest('figure')?.querySelector('figcaption'); if (caption) caption.textContent = altInput.value; editor._sync(); markDirty(); toast('이미지 설명을 적용했습니다. 저장하면 반영됩니다.'); });
      remove.addEventListener('click', function () { if (!selectedImage || !editor.contains(selectedImage)) return; (selectedImage.closest('figure') || selectedImage).remove(); imageTools.hidden = true; editor._sync(); markDirty(); });
    }
  }
  if (new URLSearchParams(location.search).get('saved') === '1') { var saved = document.createElement('p'); saved.className = 'alert-ok'; saved.setAttribute('role','status'); saved.textContent = '저장되었습니다. 공개/비공개 상태와 게시물을 확인해 주세요.'; $('.admin-main')?.prepend(saved); }
  // Tables scroll inside their own region rather than widening the mobile page.
  $$('.admin-table').forEach(function (table) { if (table.closest('.table-wrap')) return; var wrap = document.createElement('div'); wrap.className = 'table-wrap cms-table-scroll'; wrap.tabIndex = 0; wrap.setAttribute('role','region'); wrap.setAttribute('aria-label','관리 목록, 좌우로 이동할 수 있습니다'); table.before(wrap); wrap.appendChild(table); });

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
  $$('form[data-once]:not([data-cms-form])').forEach(function (f) {
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
