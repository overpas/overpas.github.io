# Personal website

A small static site (Home, Projects, Blog, CV) built with [Eleventy](https://www.11ty.dev/)
and published to GitHub Pages by a GitHub Actions workflow. Every push to `main` rebuilds
and redeploys the site.

## Add a blog post

Create a markdown file in `src/blog/`, named `YYYY-MM-DD-short-title.md`:

```markdown
---
title: "My post title"
date: 2026-03-14
summary: "One line shown in the post list and the RSS feed."
---

Write the post in Markdown here.
```

Commit and push. The post appears on the Blog page (grouped by year), in "Latest writing"
on the Home page, and in the RSS feed at `/feed.xml`. Its address is `/blog/short-title/`
(the date prefix is dropped). Add `draft: true` to keep a post out of the site.

Images: put them in `src/assets/` and use `![Alt text](/assets/picture.jpg)`.

## Add a project

Create a markdown file in `src/projects/`, for example `src/projects/my-tool.md`:

```markdown
---
title: "My tool"
year: 2026
tagline: "One line shown on the Home page."
tech: ["TypeScript", "SQLite"]
source: "https://github.com/your-handle/my-tool"   # optional
live: "https://my-tool.example.com"               # optional
featured: true                                    # optional: show on the Home page
order: 1                                          # optional: order within the same year
---

Two lines on the problem, what you built, and your role.
```

Projects are listed newest year first. The Home page shows up to three `featured` projects
(or the three newest if none are featured).

## Fill in your details

All personal content is in `[square-bracket placeholders]`:

| What | Where |
| --- | --- |
| Name, role, intro, "Now" list, social links, email, site URL | `src/_data/site.yaml` |
| CV: summary, experience, education, skills, languages | `src/_data/cv.yaml` |
| CV PDF for the "Download PDF" button | add `src/assets/cv.pdf` |
| Placeholder posts and projects | delete the `placeholder-*` files in `src/blog/` and `src/projects/` |
| Favicon (the "Y" monogram) | `src/assets/favicon.svg` |

Notes on the data files:

- `url` in `site.yaml` is the full URL of the published site with no trailing slash. The RSS feed
  and link previews use it.
- `now` rows in `site.yaml` can be added, removed or reordered freely.
- `socials` in `site.yaml` are the header icon links. `icon` is one of `linkedin`, `github`,
  `telegram`, `x`, `link`. Delete a row to hide that icon.
- `email` in `site.yaml` shows as the envelope icon. Set it to `""` to hide it.
- `pdf` in `cv.yaml` is the path of the CV PDF. Set it to `""` to hide the Download button.
- `experience` in `cv.yaml` is newest first. Leave `end` out for the current job, which then
  shows "Present".

Colors and type live at the top of `src/css/style.css`.

## Preview locally

```bash
npm install
```

```bash
npm start
```

Then open http://localhost:8080. The page reloads when you save a file.
`npm run build` writes the finished site to `_site/`.

## Publish on GitHub Pages (once)

1. Create a repository named `<your-username>.github.io` on GitHub and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Set `url` in `src/_data/site.yaml` to `https://<your-username>.github.io` (or your custom domain).

After that, each push to `main` deploys automatically; progress shows under the **Actions** tab.
For a custom domain, add it under Settings → Pages and point your DNS at GitHub.
