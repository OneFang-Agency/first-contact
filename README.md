# First Contact

A one-page questionnaire for potential clients. It's plain HTML/CSS/JS, hosted on Netlify, and submissions are collected by Netlify Forms.

## Languages

The page is in Georgian by default, with English as the second language. Visitors switch with the buttons at the top, and their choice is remembered. To send someone the English version directly, use `https://<your-site>/?lang=en`.

Every piece of text is written twice in `index.html`, as `<span lang="ka">…</span><span lang="en">…</span>`, and the page shows the one matching the active language. Messages created by JavaScript (validation errors, "Sending…") are in the `MESSAGES` object at the top of `script.js`.

Each submission includes a `language` field (`ka` or `en`) showing which language the client used. Choice answers are submitted in that language, and the budget ranges differ: Georgian shows GEL, English (meant for international clients) shows USD.

## Light / dark theme

The page follows the visitor's system setting by default. They can override it with the System / Light / Dark switch at the top, and the choice is remembered. Colors are defined as CSS variables at the top of `styles.css`, once for light and once for dark.

## Adding a question

In `index.html`, copy one `<li class="question">` block inside `<ol class="questions">`. Questions are numbered automatically. Write all text **in both languages** (`<span lang="ka">` and `<span lang="en">`).

**Text answer** (has a `<textarea>`): change
- `id` / `name` on the `<textarea>`. Use something unique, like `audience`. The `name` is the column title you'll see in Netlify.
- `for` on the `<label>` so it matches the id, and the hint's `id` / `aria-describedby`.
- To make it required, add `required` to the textarea, add a `<p class="error" id="<id>-error" aria-live="polite"></p>` below it, and add `<span class="req" aria-hidden="true">*</span>` to the label.

**Choice answer** (has a `<fieldset>` with chips): use `type="radio"` for pick-one and `type="checkbox"` for pick-any. On each option:
- `name`: the same for all options of the question.
- `data-key`: a short id that doesn't change between languages (used for saved drafts).
- `value`: the Georgian text, and `data-en`: the English text. The one matching the page language is submitted; ticked checkboxes arrive as one comma-separated answer.

A field that should appear only for some answers goes in a `<div class="field reveal" data-reveal="<name>" data-reveal-keys="<data-key> …" hidden>`, with its input `disabled`. See the date under "When do you need it?" and the phone number under contact.

Also add the question to `TEXT` in `netlify/functions/submission-created.mjs` so it shows up in the email.

## Local preview

Open `index.html` in a browser, or run `npx serve .`. Submitting only works on Netlify.

## Deploy

Netlify deploys automatically on every push to `master`.

One-time setup in Netlify:
1. Add new site → Import an existing project → GitHub → pick this repo, branch `master`.
2. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
3. Site configuration → Forms → enable form detection, then redeploy.
4. Email notifications: see below.

## Submission emails

Netlify's built-in form emails can't be styled, so `netlify/functions/submission-created.mjs` sends its own. Netlify runs it automatically for every submission. The email has only the language the client used (`language` field). English uses Montserrat Alternates for titles and Montserrat for answers. Georgian uses the site's Noto Georgian fonts, because Montserrat has no Georgian letters. Replying to the email goes straight to the client.

If you add or rename a question, update `TEXT` at the top of that file as well.

Setup:
1. Create a free account at [resend.com](https://resend.com), verify your sending domain, and create an API key.
2. In Netlify → Site configuration → Environment variables, add:
   - `RESEND_API_KEY`: the API key
   - `NOTIFY_TO`: your address (comma-separate for several)
   - `NOTIFY_FROM`: a sender on the verified domain, e.g. `First Contact <forms@yourdomain.com>`
3. Redeploy. Then in Forms → Form notifications, remove the old built-in email so you don't get two.

Web fonts show in Apple Mail and iOS Mail. Gmail and Outlook don't load web fonts and fall back to Arial (English) or Sylfaen/Arial (Georgian).
