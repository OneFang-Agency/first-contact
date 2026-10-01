// Runs automatically on every verified Netlify Forms submission and emails it,
// in the language the client filled the form in.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   RESEND_API_KEY  API key from resend.com
//   NOTIFY_TO       where submissions are sent, e.g. you@example.com
//   NOTIFY_FROM     verified sender, e.g. "First Contact <forms@yourdomain.com>"

const TEXT = {
  en: {
    subject: (name, company) => `New enquiry from ${name}${company ? ` (${company})` : ''}`,
    heading: 'New enquiry',
    questions: {
      'project-type': 'What do you need?',
      business: 'Describe your business in a couple of sentences',
      goals: 'What are your goals with the website?',
      clients: 'Who are your clients?',
      'liked-websites': 'Do you have websites that you like?',
      assets: 'What do you already have?',
      budget: 'What budget do you have in mind?',
      timeline: 'When do you need it?',
    },
    contact: 'Contact',
    fields: {
      name: 'Name',
      email: 'Email',
      company: 'Company',
      'current-website': 'Current website',
      'contact-method': 'Prefers',
      phone: 'Phone',
    },
    empty: 'No answer',
    reply: 'Reply to this email to answer the client directly.',
  },
  ka: {
    subject: (name, company) => `ახალი განაცხადი: ${name}${company ? ` (${company})` : ''}`,
    heading: 'ახალი განაცხადი',
    questions: {
      'project-type': 'რა გჭირდებათ?',
      business: 'აღწერეთ თქვენი ბიზნესი რამდენიმე წინადადებით',
      goals: 'რა მიზნები გაქვთ ვებსაიტთან დაკავშირებით?',
      clients: 'ვინ არიან თქვენი კლიენტები?',
      'liked-websites': 'არის ვებსაიტები, რომლებიც მოგწონთ?',
      assets: 'რა გაქვთ უკვე მზად?',
      budget: 'რა ბიუჯეტს ვარაუდობთ?',
      timeline: 'როდის გჭირდებათ?',
    },
    contact: 'კონტაქტი',
    fields: {
      name: 'სახელი',
      email: 'ელ. ფოსტა',
      company: 'კომპანია',
      'current-website': 'არსებული ვებსაიტი',
      'contact-method': 'სასურველი არხი',
      phone: 'ტელეფონი',
    },
    empty: 'პასუხი არ არის',
    reply: 'კლიენტს პირდაპირ უპასუხებთ ამ წერილზე პასუხით.',
  },
};

// Montserrat has no Georgian glyphs, so Georgian uses the site's own fonts
const FONTS = {
  en: {
    link: 'https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@600;700&family=Montserrat:wght@400;500&display=swap',
    title: "'Montserrat Alternates', 'Montserrat', Arial, sans-serif",
    answer: "'Montserrat', Arial, Helvetica, sans-serif",
  },
  ka: {
    link: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500&family=Noto+Serif+Georgian:wght@600;700&display=swap',
    title: "'Noto Serif Georgian', 'Sylfaen', Georgia, serif",
    answer: "'Noto Sans Georgian', 'Sylfaen', Arial, sans-serif",
  },
};

const C = { paper: '#f1f6f7', card: '#ffffff', ink: '#0e1a1f', muted: '#56656b', rule: '#dce7ea', accent: '#00717f' };

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// The answer to show for a question; a deadline is added to "By a specific date"
function answer(data, key) {
  const value = clean(data[key]);
  if (key === 'timeline' && value && clean(data.deadline)) return `${value}: ${clean(data.deadline)}`;
  return value;
}

function answerHtml(value, t, f, size) {
  if (!value) {
    return `<div style="font-family:${f.answer};font-size:15px;color:${C.muted};">${t.empty}</div>`;
  }
  return `<div style="font-family:${f.answer};font-size:${size}px;line-height:1.55;font-weight:500;color:${C.ink};">${escape(value).replace(/\r?\n/g, '<br>')}</div>`;
}

function buildHtml(data, lang) {
  const t = TEXT[lang];
  const f = FONTS[lang];

  const questions = Object.entries(t.questions)
    .map(
      ([key, label], i) => `
      <tr><td style="padding:24px 0;border-top:1px solid ${C.rule};">
        <div style="font-family:${f.title};font-size:13px;font-weight:600;letter-spacing:0.02em;color:${C.accent};margin:0 0 8px;">${i + 1}. ${escape(label)}</div>
        ${answerHtml(answer(data, key), t, f, 17)}
      </td></tr>`
    )
    .join('');

  const contact = Object.entries(t.fields)
    .map(([key, label]) => {
      const value = clean(data[key]);
      let shown = value ? escape(value) : `<span style="color:${C.muted};">${t.empty}</span>`;
      if (value && key === 'email') shown = `<a href="mailto:${escape(value)}" style="color:${C.accent};">${escape(value)}</a>`;
      return `
        <tr>
          <td style="padding:6px 16px 6px 0;font-family:${f.title};font-size:13px;font-weight:600;color:${C.muted};vertical-align:top;white-space:nowrap;">${escape(label)}</td>
          <td style="padding:6px 0;font-family:${f.answer};font-size:16px;font-weight:500;color:${C.ink};">${shown}</td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${f.link}">
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:12px;">
      <tr><td style="padding:32px 32px 8px;">
        <div style="font-family:${f.title};font-size:26px;font-weight:700;color:${C.ink};margin:0 0 4px;">${t.heading}</div>
        <div style="font-family:${f.answer};font-size:15px;color:${C.muted};">${escape(clean(data.name))}${clean(data.company) ? ' · ' + escape(clean(data.company)) : ''}</div>
      </td></tr>
      <tr><td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${questions}</table>
      </td></tr>
      <tr><td style="padding:8px 32px 32px;">
        <div style="border-top:1px solid ${C.rule};padding-top:24px;">
          <div style="font-family:${f.title};font-size:18px;font-weight:700;color:${C.ink};margin:0 0 12px;">${t.contact}</div>
          <table role="presentation" cellpadding="0" cellspacing="0">${contact}</table>
        </div>
      </td></tr>
    </table>
    <div style="font-family:${f.answer};font-size:12px;color:${C.muted};padding:16px;">${t.reply}</div>
  </td></tr>
</table>
</body>
</html>`;
}

function buildText(data, lang) {
  const t = TEXT[lang];
  const block = (label, value) => `${label}\n${value || `(${t.empty})`}\n`;
  return [
    t.heading.toUpperCase(),
    '',
    ...Object.entries(t.questions).map(([key, label], i) => block(`${i + 1}. ${label}`, answer(data, key))),
    `— ${t.contact} —`,
    ...Object.entries(t.fields).map(([key, label]) => `${label}: ${clean(data[key]) || '—'}`),
  ].join('\n');
}

export async function handler(event) {
  const { payload } = JSON.parse(event.body);
  if (payload.form_name !== 'first-contact') return { statusCode: 200 };

  const data = payload.data || {};
  const lang = data.language === 'en' ? 'en' : 'ka';
  const t = TEXT[lang];

  const { RESEND_API_KEY, NOTIFY_TO, NOTIFY_FROM } = process.env;
  if (!RESEND_API_KEY || !NOTIFY_TO || !NOTIFY_FROM) {
    console.error('Missing RESEND_API_KEY, NOTIFY_TO or NOTIFY_FROM');
    return { statusCode: 500 };
  }

  const email = clean(data.email);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: NOTIFY_TO.split(',').map((s) => s.trim()),
      reply_to: email || undefined,
      subject: t.subject(clean(data.name) || '—', clean(data.company)),
      html: buildHtml(data, lang),
      text: buildText(data, lang),
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return { statusCode: 502 };
  }
  return { statusCode: 200 };
}

// Exported for local preview
export { buildHtml, buildText };
