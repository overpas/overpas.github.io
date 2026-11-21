import pluginRss from "@11ty/eleventy-plugin-rss";
import yaml from "js-yaml";

/**
 * Front matter fields this config reads from posts and projects.
 * @typedef {object} ItemData
 * @property {boolean} [draft] `true` keeps the page out of the site.
 * @property {boolean} [featured] Show the project on the Home page.
 * @property {number} [order] Order of a project within its year.
 * @property {string} [title]
 * @property {number | string} [year]
 */

/** @typedef {{ date: Date, data: ItemData }} Item */
/** @typedef {{ getFilteredByGlob: (glob: string) => Item[] }} CollectionApi */

const WORDS_PER_MINUTE = 220;
const HOME_PAGE_PROJECTS = 3;
// Projects without an `order` sort after the ordered ones of the same year.
const UNORDERED = Number.MAX_SAFE_INTEGER;

// Dates are formatted in UTC so a post dated 2026-03-14 never shows as Mar 13.
/** @param {Date} date */
const utcDate = (date) => date.toTemporalInstant().toZonedDateTimeISO("UTC").toPlainDate();

/** @type {(first: Item, second: Item) => number} */
const newestFirst = (first, second) => second.date.getTime() - first.date.getTime();

/** @type {(first: Item, second: Item) => number} */
const newestYearThenOrder = (first, second) => {
  const byYear = (Number(second.data.year) || 0) - (Number(first.data.year) || 0);
  const byOrder = (first.data.order ?? UNORDERED) - (second.data.order ?? UNORDERED);
  return byYear || byOrder || String(first.data.title).localeCompare(String(second.data.title));
};

/** @param {string} contents */
const parseYaml = (contents) => yaml.load(contents);

const collections = {
  // Blog posts: every .md file in src/blog, newest first.
  /** @param {CollectionApi} api */
  posts: (api) => {
    const published = api.getFilteredByGlob("src/blog/*.md").filter((item) => !item.data.draft);
    return published.toSorted(newestFirst);
  },

  // Projects: every .md file in src/projects, newest year first, then by `order`.
  /** @param {CollectionApi} api */
  projects: (api) => {
    const published = api.getFilteredByGlob("src/projects/*.md").filter((item) => !item.data.draft);
    return published.toSorted(newestYearThenOrder);
  },
};

const filters = {
  // Projects for the Home page: featured ones first; falls back to the newest.
  /** @type {(items?: Item[], count?: number) => Item[]} */
  featuredProjects: (items = [], count = HOME_PAGE_PROJECTS) => {
    const featured = items.filter((project) => project.data.featured);
    return (featured.length > 0 ? featured : items).slice(0, count);
  },

  // [{ year, items }] groups, preserving the collection's order.
  /** @param {Item[]} items */
  groupByYear: (items = []) => {
    const byYear = Map.groupBy(items, (item) => utcDate(item.date).year);
    return Array.from(byYear, ([year, yearItems]) => ({ items: yearItems, year }));
  },

  /** @type {(items?: unknown[], count?: number) => unknown[]} */
  head: (items = [], count = Infinity) => items.slice(0, count),

  /** @param {Date} date */
  isoDate: (date) => utcDate(date).toString(),

  /** @param {Date} date */
  longDate: (date) =>
    utcDate(date).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric" }),

  /** @param {Date} date */
  monthDay: (date) => utcDate(date).toLocaleString("en-US", { day: "2-digit", month: "short" }),

  // Reading time in minutes from the rendered HTML.
  /** @param {unknown} html */
  readingTime: (html = "") => {
    const words = String(html)
      .replaceAll(/<[^>]*>/gu, " ")
      .split(/\s+/u)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  },

  /** @param {Date} date */
  year: (date) => utcDate(date).year,
};

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function configureEleventy(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  // Data files can be written in YAML (src/_data/*.yaml).
  eleventyConfig.addDataExtension("yaml,yml", parseYaml);

  // Static files copied as-is.
  for (const directory of ["src/css", "src/js", "src/assets"]) {
    eleventyConfig.addPassthroughCopy(directory);
  }
  for (const [name, collection] of Object.entries(collections)) {
    eleventyConfig.addCollection(name, collection);
  }
  for (const [name, filter] of Object.entries(filters)) {
    eleventyConfig.addFilter(name, filter);
  }
  eleventyConfig.addShortcode("currentYear", () => String(Temporal.Now.plainDateISO().year));

  return {
    dir: { data: "_data", includes: "_includes", input: "src", output: "_site" },
    htmlTemplateEngine: "njk",
    // Markdown is plain markdown, so `{{ }}` in code samples is left alone.
    markdownTemplateEngine: false,
    templateFormats: ["md", "njk", "html"],
  };
}
