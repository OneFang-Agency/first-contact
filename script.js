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
  const options = form.querySelectorAll('input[type=radio], input[type=checkbox]');
  const reveals = form.querySelectorAll('.reveal');
  // Each option's `value` starts as the Georgian text; keep it to switch back
  options.forEach((o) => { o.dataset.ka = o.value; });

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
    // Submit option answers in the language the client is reading
    options.forEach((o) => { o.value = o.dataset[next]; });
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

  // ---------- Fields that appear for some answers ----------
  // <div class="reveal" data-reveal="<radio name>" data-reveal-keys="<data-key> ..."> is shown
  // when one of those options is picked. While hidden, its inputs are disabled, so they're
  // neither validated nor submitted.
  function updateReveals() {
    reveals.forEach((el) => {
      const picked = form.querySelector('input[name="' + el.dataset.reveal + '"]:checked');
      const show = !!picked && el.dataset.revealKeys.split(' ').includes(picked.dataset.key);
      el.hidden = !show;
      el.querySelectorAll('input').forEach((i) => {
        i.disabled = !show;
        if (!show && i.hasAttribute('aria-invalid')) validateField(i);
      });
    });
  }

  // ---------- Progress ----------
  const progressFill = document.getElementById('progress-fill');
  const questions = form.querySelectorAll('.question');
  function updateProgress() {
    const contact = form.querySelectorAll('.contact input[required]:not(:disabled)');
    let done = 0;
    questions.forEach((q) => {
      const answered = Array.from(q.querySelectorAll('textarea, input')).some((el) =>
        el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value.trim() !== ''
      );
      if (answered) done++;
      q.classList.toggle('is-answered', answered);
    });
    contact.forEach((el) => { if (el.value.trim() !== '') done++; });
    progressFill.style.width = (done / (questions.length + contact.length)) * 100 + '%';
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
  // Options are saved by data-key, so a draft survives a language switch
  function saveDraft() {
    const data = {};
    savable.forEach((el) => {
      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.dataset.key;
      } else if (el.type === 'checkbox') {
        data[el.name] = data[el.name] || [];
        if (el.checked) data[el.name].push(el.dataset.key);
      } else {
        data[el.name] = el.value;
      }
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }
  function loadDraft() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* ignore */ }
    if (!data) return;
    savable.forEach((el) => {
      const saved = data[el.name];
      if (el.type === 'radio') el.checked = saved === el.dataset.key;
      else if (el.type === 'checkbox') el.checked = Array.isArray(saved) && saved.includes(el.dataset.key);
      else if (typeof saved === 'string') el.value = saved;
    });
  }
  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  setLang(lang, false);
  loadDraft();
  updateReveals();
  textareas.forEach(autosize);
  updateProgress();
  form.addEventListener('input', () => { saveDraft(); updateProgress(); });
  form.addEventListener('change', (e) => {
    // An option like "Nothing yet" can't be ticked together with the others
    if (e.target.type === 'checkbox' && e.target.checked) {
      form.querySelectorAll('input[name="' + e.target.name + '"]').forEach((o) => {
        if (o !== e.target && (e.target.hasAttribute('data-exclusive') || o.hasAttribute('data-exclusive'))) o.checked = false;
      });
      saveDraft();
      updateProgress();
    }
    if (e.target.type !== 'radio') return;
    updateReveals();
    updateProgress();
    // Move straight to a field that just appeared
    const revealed = e.target.closest('fieldset').querySelector('.reveal:not([hidden]) input');
    if (revealed && !revealed.value) revealed.focus();
  });

  // ---------- Mobile keyboard ----------
  // Enter in a one-line field moves to the next field instead of submitting a half-filled form
  const inputs = Array.from(form.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([name=bot-field])'));
  inputs.forEach((el, i) => {
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      const next = inputs.slice(i + 1).find((n) => !n.disabled && n.closest('.contact') === el.closest('.contact'));
      if (next) next.focus();
      else el.blur();
    });
  });

  // On small screens, keep the question's title visible above the on-screen keyboard
  const smallScreen = window.matchMedia('(max-width: 720px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  form.addEventListener('focusin', (e) => {
    if (!smallScreen.matches || e.target.type === 'radio' || e.target.type === 'checkbox') return;
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
      // Several ticked boxes with one name are sent as one comma-separated answer
      const formData = new FormData(form);
      const body = new URLSearchParams();
      new Set(formData.keys()).forEach((key) => body.append(key, formData.getAll(key).join(', ')));
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
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
