import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";
import nodePlugin from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";

const JS_FILES = ["**/*.js"];

export default defineConfig([
  globalIgnores(["_site/", "node_modules/", "package-lock.json"]),

  // JavaScript: every core rule and every unicorn rule, minus the few listed below.
  {
    extends: [js.configs.all, unicorn.configs.all],
    files: JS_FILES,
    linterOptions: { reportUnusedDisableDirectives: "error", reportUnusedInlineConfigs: "error" },
    rules: {
      // Explanatory comments read as sentences; forcing a capital on code-like comments adds nothing.
      "capitalized-comments": "off",
      // Conflicts with prefer-const-style declarations and makes diffs noisier.
      "one-var": "off",
      // Ternaries are the clearest form for short conditional values.
      "no-ternary": "off",
      // Object keys are ordered by meaning (e.g. Eleventy's dir, permalink), not alphabetically.
      "sort-keys": "off",
      // These two together forbid the standard `/** @param {T} name */` JSDoc form that TypeScript reads.
      "unicorn/no-asterisk-prefix-in-documentation-comments": "off",
      "unicorn/single-line-block-comment-style": "off",
      // Literals 0 and 1 (array starts, "at least one") are clearer than named constants.
      "no-magic-numbers": ["error", { ignore: [0, 1], ignoreDefaultValues: true }],
    },
  },

  // Node.js files: config and data files run by Eleventy.
  {
    extends: [nodePlugin.configs["flat/recommended-module"]],
    files: [
      "eslint.config.js",
      "eleventy.config.js",
      "lint-staged.config.js",
      "src/**/*.11tydata.js",
    ],
    languageOptions: { globals: globals.node },
  },

  // Browser modules loaded with <script type="module">.
  {
    files: ["src/js/**/*.js"],
    languageOptions: { globals: globals.browser },
  },

  // JSON (package-lock.json is generated, so it is ignored above).
  {
    extends: [json.configs.recommended],
    files: ["**/*.json"],
    language: "json/json",
  },

  // YAML: data files and GitHub workflows.
  {
    extends: [yml.configs["flat/standard"], yml.configs["flat/prettier"]],
    files: ["**/*.yaml", "**/*.yml"],
  },
]);
