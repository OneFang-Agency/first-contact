(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const STORAGE_KEY = 'first-contact-draft';
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit');
  const success = document.getElementById('success');
  const textareas = form.querySelectorAll('textarea');
  const savable = form.querySelectorAll('input:not([type=hidden]):not([name=bot-field]), textarea');

  // ---------- Auto-growing textareas ----------
  function autosize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  }
  textareas.forEach((ta) => ta.addEventListener('input', () => autosize(ta)));

  // ---------- Draft autosave ----------
  function saveDraft() {
    const data = {};
    savable.forEach((el) => { data[el.name] = el.value; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }
  function loadDraft() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* ignore */ }
    if (!data) return;
    savable.forEach((el) => {
      if (typeof data[el.name] === 'string') el.value = data[el.name];
    });
  }
  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  loadDraft();
  textareas.forEach(autosize);
  form.addEventListener('input', saveDraft);

  // ---------- Validation ----------
  function messageFor(el) {
    if (el.validity.valueMissing) return 'Please fill this in.';
    if (el.validity.typeMismatch && el.type === 'email') return 'That email doesn’t look right. Please check it.';
    return '';
  }
  function validateField(el) {
    const errorEl = document.getElementById(el.id + '-error');
    if (!errorEl) return true;
    // Treat whitespace-only answers as empty
    if (el.required && !el.value.trim()) el.value = '';
    const msg = el.checkValidity() ? '' : messageFor(el);
    errorEl.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    return !msg;
  }

  form.querySelectorAll('[required]').forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.hasAttribute('aria-invalid')) validateField(el); });
    el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) validateField(el); });
  });

  // ---------- Submit ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach((el) => {
      if (!validateField(el) && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      status.textContent = 'A few required answers are missing.';
      status.classList.add('is-error');
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    status.textContent = '';
    status.classList.remove('is-error');

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      clearDraft();
      form.hidden = true;
      success.hidden = false;
      success.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send answers';
      status.textContent = 'Something went wrong while sending. Your answers are saved, so please try again in a moment.';
      status.classList.add('is-error');
    }
  });
})();
