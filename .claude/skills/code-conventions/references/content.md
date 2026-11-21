# Content

The README is the owner's guide for adding posts and projects. Keep it true when content rules
change.

## Personal text

- All personal text lives in `src/_data/` (site identity, home page, social links, CV) or in
  content Markdown files. Templates never hard-code a name, a role, a link or a sentence about the
  owner.
- Placeholders are in `[square brackets]`. Never replace a placeholder with invented personal
  details. Ask the user for the real text.
- UI labels of the site itself (navigation, buttons, headings of fixed sections) can stay in
  templates.

## Blog posts

- File name: `YYYY-MM-DD-short-title.md` in the blog directory. The URL is `/blog/short-title/`.
- Front matter: `title`, `date` (same as the file name prefix), `summary` (one line, used in lists
  and the feed). Optional `draft: true`.
- The post starts with body text, not a `#` heading. The layout renders the title.
- Headings in the body start at `##` and do not skip levels.

## Projects

- One Markdown file per project in the projects directory. Projects have no own page.
- Front matter: `title`, `year`, `tagline`, `tech` (a list). Optional `source`, `live`, `featured`,
  `order`, `draft`.
- The body is two lines: the problem, what was built, and the role.

## Images and files

- Put images and downloads in the assets directory and link them with absolute paths:
  `/assets/<name>`.
- Every content image has alt text that tells what it shows. A decorative image has `alt=""`.
- Use lowercase, hyphenated file names. Size images for the content width before committing.
