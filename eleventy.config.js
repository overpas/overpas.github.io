import pluginRss from "@11ty/eleventy-plugin-rss";
import yaml from "js-yaml";

const WORDS_PER_MINUTE = 220;
const HOME_PAGE_PROJECTS = 3;
const ISO_DATE_LENGTH = 10;
const UNORDERED = Number.MAX_SAFE_INTEGER;

const monthDayFormat = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const longDateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});
const currentYearFormat = new Intl.DateTimeFormat("en-US", { year: "numeric" });

const newestFirst = (first, second) => second.date.getTime() - first.date.getTime();

const newestYearThenOrder = (first, second) => {
  const byYear = (Number(second.data.year) || 0) - (Number(first.data.year) || 0);
  const byOrder = (first.data.order ?? UNORDERED) - (second.data.order ?? UNORDERED);
  return byYear || byOrder || String(first.data.title).localeCompare(String(second.data.title));
};

const parseYaml = (contents) => yaml.load(contents);

const collections = {
  posts: (api) => {
    const published = api.getFilteredByGlob("src/blog/*.md").filter((item) => !item.data.draft);
    return published.toSorted(newestFirst);
  },

  projects: (api) => {
    const published = api.getFilteredByGlob("src/projects/*.md").filter((item) => !item.data.draft);
    return published.toSorted(newestYearThenOrder);
  },
};

const filters = {
  featuredProjects: (items = [], count = HOME_PAGE_PROJECTS) => {
    const featured = items.filter((project) => project.data.featured);
    return (featured.length > 0 ? featured : items).slice(0, count);
  },

  groupByYear: (items = []) => {
    const byYear = Map.groupBy(items, (item) => item.date.getUTCFullYear());
    return Array.from(byYear, ([year, yearItems]) => ({ items: yearItems, year }));
  },

  head: (items = [], count = Infinity) => items.slice(0, count),

  isoDate: (date) => date.toISOString().slice(0, ISO_DATE_LENGTH),

  longDate: (date) => longDateFormat.format(date),

  monthDay: (date) => monthDayFormat.format(date),

  readingTime: (html = "") => {
    const words = String(html)
      .replaceAll(/<[^>]*>/gu, " ")
      .split(/\s+/u)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  },

  year: (date) => date.getUTCFullYear(),
};

export default function configureEleventy(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addDataExtension("yaml,yml", parseYaml);

  for (const directory of ["src/css", "src/js", "src/assets"]) {
    eleventyConfig.addPassthroughCopy(directory);
  }
  for (const [name, collection] of Object.entries(collections)) {
    eleventyConfig.addCollection(name, collection);
  }
  for (const [name, filter] of Object.entries(filters)) {
    eleventyConfig.addFilter(name, filter);
  }
  eleventyConfig.addShortcode("currentYear", () => currentYearFormat.format());

  return {
    dir: { data: "_data", includes: "_includes", input: "src", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
    templateFormats: ["md", "njk", "html"],
  };
}
