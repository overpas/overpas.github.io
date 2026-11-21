// Applies to every post in src/blog/.
export default {
  layout: "post.njk",
  // 2026-03-14-my-post.md → /blog/my-post/
  /** @param {{ page: { fileSlug: string } }} data */
  permalink: (data) => `/blog/${data.page.fileSlug}/`,
};
