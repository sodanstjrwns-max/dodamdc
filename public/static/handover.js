(() => {
  const status = document.getElementById('handover-copy-status');
  document.getElementById('handover-print')?.addEventListener('click', () => {
    const opened = [...document.querySelectorAll('.handover-guide-list details, .handover-reference')].filter(el => !el.open);
    opened.forEach(el => { el.open = true; });
    window.addEventListener('afterprint', () => opened.forEach(el => { el.open = false; }), { once: true });
    window.print();
  });
  document.querySelectorAll('[data-copy-target]').forEach(button => button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;
    const text = target.textContent.trim();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea'); field.value = text;
        field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('clipboard unavailable');
      }
      const label = button.textContent; button.textContent = '복사했습니다';
      setTimeout(() => { button.textContent = label; }, 1800);
      status.textContent = '계좌번호를 복사했습니다.';
    } catch { status.textContent = '자동 복사를 지원하지 않는 환경입니다. 표시된 내용을 직접 선택해 복사해 주세요.'; }
  }));
})();
