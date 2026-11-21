# Architecture

This is a **static site** built with **Eleventy 3** and deployed to **GitHub Pages** by a GitHub
Actions workflow on every push to `main`.

```
website/
├── eleventy.config.js        # collections, filters, shortcodes, passthrough copy, directories
├── src/                      # Eleventy input
│   ├── _data/                # site-wide data as YAML: identity, links, home text, CV
│   ├── _includes/            # layouts and macros: base shell, post layout, icons
│   ├── blog/                 # one Markdown file per post, plus directory data (layout, permalink)
│   ├── projects/             # one Markdown file per project, data only, no own page
│   ├── css/                  # the stylesheet, copied as is
│   ├── js/                   # progressive-enhancement scripts, copied as is
│   ├── assets/               # images, favicon, CV PDF, copied as is
│   └── *.njk                 # top-level pages and the RSS feed
├── .github/workflows/        # build and deploy to GitHub Pages
└── _site/                    # build output, git-ignored
```

## Where code goes

- A new top-level page is one `.njk` file in `src/` with front matter and `layout`.
- A new kind of content is a directory in `src/` with a directory data file and a collection in the
  config. Do not glob content directly from templates.
- Data that the site owner edits goes in `src/_data/`. Data that only a template needs stays in that
  template.
- A static file is served only from a passthrough-copied directory.

## Layouts

- The base layout owns the document, the `<head>` metadata, the theme bootstrap, the header with
  navigation and the footer. A page fills only `<main>`.
- A content type that needs its own frame (for example a post) gets its own layout that chains to
  the base layout.
- Navigation items are defined once, in the base layout.

## Design system

The design system is the token block at the top of the stylesheet plus the icon macro. Pages use
them. They never set how things look on their own.

| Concern    | Design system                                                       | Page templates and page CSS                                          |
|------------|---------------------------------------------------------------------|----------------------------------------------------------------------|
| Color      | Custom properties on `:root`, one set per theme                     | `var(--token)` only, never a color literal                           |
| Theme      | Light tokens, dark tokens, and the no-JS `prefers-color-scheme` set | A new token gets a value in every theme set, all kept in sync        |
| Typography | Font family tokens and the shared type rules                        | Uses the shared type classes and semantic elements, no new families  |
| Icons      | Inline stroke SVGs in the icon macro, `currentColor`                | Calls the macro by name and supplies the accessible label            |
| Text       | Holds no personal text                                              | Reads personal text from site data, see `content.md`                 |

When a page needs a look that the design system does not give, add the token or the shared rule
first, then use it.

## Theming

- The theme is a `data-theme` attribute on `<html>`. An inline script in `<head>` sets it before
  first paint from the saved choice, else the system setting.
- Without JavaScript the `prefers-color-scheme` media query applies the dark tokens.
- Theme-specific styles key off the tokens. Use a `data-theme` selector outside the token block
  only for content that differs by theme, such as the icon of the theme toggle.

## Deploy

- The workflow runs `npm ci` and `npm run build` on Node 22 and publishes `_site/`. A change that
  breaks the build stops the deploy.
- Absolute URLs (canonical, feed, Open Graph) come from the site `url` in site data.
