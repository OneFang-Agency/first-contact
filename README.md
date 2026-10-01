# First Contact

A one-page questionnaire for potential clients. It's plain HTML/CSS/JS, hosted on Netlify, and submissions are collected by Netlify Forms.

## Adding a question

In `index.html`, copy one `<div class="field question">` block and change:

- `id` / `name` on the `<textarea>`. Use something unique, like `budget`. The `name` is the column title you'll see in Netlify.
- `for` on the `<label>` so it matches the id.
- The label text and the hint (the hint's `id` and `aria-describedby` should match too).
- To make it required, add `required` to the textarea, add a `<p class="error" id="<id>-error" aria-live="polite"></p>` below it, and add `<span class="req" aria-hidden="true">*</span>` to the label.

Questions are numbered automatically.

## Local preview

Open `index.html` in a browser, or run `npx serve .`. Submitting only works on Netlify.

## Deploy

Netlify deploys automatically on every push to `master`.

One-time setup in Netlify:
1. Add new site → Import an existing project → GitHub → pick this repo, branch `master`.
2. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
3. Site configuration → Forms → enable form detection, then redeploy.
4. Forms → Form notifications → add an email notification for `first-contact`.
