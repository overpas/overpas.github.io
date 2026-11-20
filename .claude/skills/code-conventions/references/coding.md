# Coding

## General

- Don't edit the code that doesn't affect the task you are working on.
- Prefer the platform: semantic HTML first, then CSS, then JavaScript only when HTML and CSS cannot
  do it.
- Every page works without JavaScript. A script only enhances what the HTML already shows.

## Templates

- Templates are Nunjucks. Markdown content is not run through a template engine, so `{{ }}` in a
  post stays literal text.
- Every page extends the base layout through `layout`. A page never repeats the document shell, the
  header, the footer or the `<head>` tags.
- Logic that formats, sorts, groups or filters data is an Eleventy filter or collection in the
  config, not inline Nunjucks expressions repeated in templates.
- Format dates only through the date filters. They use UTC, so a post never shows the day before
  its date.

## CSS

- One stylesheet, organized in sections by page or concern. Put new rules in the section they
  belong to.
- Mobile first is not required, but every layout must work at 375px width with no horizontal scroll.
- Respect `prefers-reduced-motion` for any animation or transition beyond a color change.

## JavaScript

- Vanilla ES5-compatible scripts, wrapped in an IIFE, loaded with `defer`. No modules, no bundler,
  no dependencies.
- A script finds its elements by a `data-*` attribute and exits quietly when they are absent.
- Wrap every `localStorage` access in `try`/`catch`. It throws in private windows and with blocked
  storage.

## Accessibility

- Every icon-only control has an `aria-label`. Decorative SVGs have `aria-hidden="true"`.
- The current navigation item has `aria-current`.
- Interactive elements are native `<a>` or `<button>`, reachable and visible with the keyboard.
- Text and its background meet WCAG AA contrast in both themes.
