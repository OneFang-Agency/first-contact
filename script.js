(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const STORAGE_KEY = 'first-contact-draft';
  const LANG_KEY = 'first-contact-lang';
  const THEME_KEY = 'first-contact-theme';
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit');
  const success = document.getElementById('success');
  const textareas = form.querySelectorAll('textarea');
  const savable = form.querySelectorAll('input:not([type=hidden]):not([name=bot-field]), textarea');

  // ---------- Language ----------
  const MESSAGES = {
    ka: {
      title: 'დავიწყოთ',
      required: 'გთხოვთ, შეავსოთ ეს ველი.',
      email: 'ელ. ფოსტის მისამართი არასწორი ჩანს. გთხოვთ, შეამოწმოთ.',
      missing: 'რამდენიმე სავალდებულო პასუხი აკლია.',
      sending: 'იგზავნება…',
      failed: 'გაგზავნისას შეცდომა მოხდა. პასუხები შენახულია, გთხოვთ, ცოტა ხანში სცადოთ ხელახლა.',
      system: 'სისტემური',
      light: 'ნათელი',
      dark: 'მუქი',
    },
    en: {
      title: "Let's Get Started",
      required: 'Please fill this in.',
      email: 'That email doesn’t look right. Please check it.',
      missing: 'A few required answers are missing.',
      sending: 'Sending…',
      failed: 'Something went wrong while sending. Your answers are saved, so please try again in a moment.',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
  };
  const langField = document.getElementById('language-field');
  const langButtons = document.querySelectorAll('[data-set-lang]');
  let lang = document.documentElement.lang === 'en' ? 'en' : 'ka';
  const t = (key) => MESSAGES[lang][key];

  function setLang(next, remember) {
    lang = next;
    document.documentElement.lang = next;
    document.title = t('title');
    langField.value = next;
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === next)));
    themeButtons.forEach((b) => {
      b.setAttribute('aria-label', t(b.dataset.setTheme));
      b.title = t(b.dataset.setTheme);
    });
    // Re-render any visible messages in the new language
    form.querySelectorAll('[aria-invalid="true"]').forEach(validateField);
    if (status.dataset.key) status.textContent = t(status.dataset.key);
    textareas.forEach(autosize);
    if (remember) {
      try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
    }
  }
  langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang, true)));

  // ---------- Theme: system (default), light or dark ----------
  const themeButtons = document.querySelectorAll('[data-set-theme]');
  // Browser toolbar color on mobile follows the chosen theme
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
  const THEME_COLORS = { light: '#f1f6f7', dark: '#141618' };
  themeMetas.forEach((m) => { m.dataset.systemColor = m.content; });
  function setTheme(theme, remember) {
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    themeMetas.forEach((m) => { m.content = THEME_COLORS[theme] || m.dataset.systemColor; });
    themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
    if (remember) {
      try {
        if (theme === 'system') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, theme);
      } catch (e) { /* ignore */ }
    }
  }
  themeButtons.forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.setTheme, true)));
  setTheme(document.documentElement.getAttribute('data-theme') || 'system', false);

  // ---------- Progress ----------
  const progressFill = document.getElementById('progress-fill');
  const answerable = form.querySelectorAll('.question textarea, .contact [required]');
  function updateProgress() {
    let done = 0;
    answerable.forEach((el) => {
      const answered = el.value.trim() !== '';
      if (answered) done++;
      const q = el.closest('.question');
      if (q) q.classList.toggle('is-answered', answered);
    });
    progressFill.style.width = (done / answerable.length) * 100 + '%';
  }

  function setStatus(key, isError) {
    status.dataset.key = key || '';
    status.textContent = key ? t(key) : '';
    status.classList.toggle('is-error', !!isError);
  }

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

  setLang(lang, false);
  loadDraft();
  textareas.forEach(autosize);
  updateProgress();
  form.addEventListener('input', () => { saveDraft(); updateProgress(); });

  // ---------- Mobile keyboard ----------
  // Enter in a one-line field moves to the next field instead of submitting a half-filled form
  const inputs = Array.from(form.querySelectorAll('.contact input'));
  inputs.forEach((el, i) => {
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      if (inputs[i + 1]) inputs[i + 1].focus();
      else el.blur();
    });
  });

  // On small screens, keep the question's title visible above the on-screen keyboard
  const smallScreen = window.matchMedia('(max-width: 720px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  form.addEventListener('focusin', (e) => {
    if (!smallScreen.matches) return;
    const block = e.target.closest('.question, .field');
    if (!block) return;
    // Wait for the keyboard to finish opening before scrolling
    setTimeout(() => {
      if (document.activeElement !== e.target) return;
      block.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }, 300);
  });

  // ---------- Validation ----------
  function messageFor(el) {
    if (el.validity.valueMissing) return t('required');
    if (el.validity.typeMismatch && el.type === 'email') return t('email');
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
      setStatus('missing', true);
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    submitBtn.disabled = true;
    setStatus('sending', false);

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      clearDraft();
      setStatus('', false);
      progressFill.style.width = '100%';
      form.hidden = true;
      success.hidden = false;
      success.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      submitBtn.disabled = false;
      setStatus('failed', true);
    }
  });
})();
