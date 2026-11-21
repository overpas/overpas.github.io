// Eleventy and its RSS plugin ship no TypeScript declarations, so this covers only the API
// that eleventy.config.js uses.
declare module "@11ty/eleventy" {
  type Callback = (...args: never[]) => unknown;

  export interface UserConfig {
    addCollection(name: string, collection: Callback): void;
    addDataExtension(extensions: string, parser: (contents: string) => unknown): void;
    addFilter(name: string, filter: Callback): void;
    addPassthroughCopy(path: string): void;
    addPlugin(plugin: (config: UserConfig) => unknown): void;
    addShortcode(name: string, shortcode: Callback): void;
  }
}

declare module "@11ty/eleventy-plugin-rss" {
  import type { UserConfig } from "@11ty/eleventy";

  const plugin: (config: UserConfig) => void;
  export default plugin;
}
