import yaml from "js-yaml";
import pluginRss from "@11ty/eleventy-plugin-rss";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const toDate = (value) => (value instanceof Date ? value : new Date(value));

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/blog/*.md")
      .filter((item) => !item.data.draft)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/projects/*.md")
      .filter((item) => !item.data.draft)
      .sort(
        (a, b) =>
          (Number(b.data.year) || 0) - (Number(a.data.year) || 0) ||
          (a.data.order ?? 999) - (b.data.order ?? 999) ||
          String(a.data.title).localeCompare(String(b.data.title))
      )
  );

  eleventyConfig.addFilter("isoDate", (d) => {
    const x = toDate(d);
    return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
  });
  eleventyConfig.addFilter("monthDay", (d) => {
    const x = toDate(d);
    return `${MONTHS[x.getUTCMonth()]} ${pad(x.getUTCDate())}`;
  });
  eleventyConfig.addFilter("longDate", (d) => {
    const x = toDate(d);
    return `${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}, ${x.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("year", (d) => toDate(d).getUTCFullYear());

  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html || "")
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });

  eleventyConfig.addFilter("groupByYear", (items) => {
    const groups = [];
    for (const item of items || []) {
      const year = toDate(item.date).getUTCFullYear();
      let group = groups.find((g) => g.year === year);
      if (!group) groups.push((group = { year, items: [] }));
      group.items.push(item);
    }
    return groups;
  });

  eleventyConfig.addFilter("head", (items, n) => (items || []).slice(0, n));

  eleventyConfig.addFilter("featuredProjects", (items, n = 3) => {
    const featured = (items || []).filter((p) => p.data.featured);
    return (featured.length ? featured : items || []).slice(0, n);
  });

  eleventyConfig.addShortcode("currentYear", () => String(new Date().getFullYear()));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}
