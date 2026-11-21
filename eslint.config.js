import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";
import nodePlugin from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";

const noComments = {
  create: (context) => {
    const reportAll = () => {
      for (const comment of context.sourceCode.getAllComments()) {
        context.report({ loc: comment.loc, messageId: "comment" });
      }
    };
    return { Program: reportAll };
  },
  meta: {
    messages: { comment: "Comments are not allowed in this project." },
    schema: [],
    type: "suggestion",
  },
};

const project = { rules: { "no-comments": noComments } };

export default defineConfig([
  globalIgnores([
    "_site/",
    "node_modules/",
    "package-lock.json",
    ".claude/*",
    "!.claude/launch.json",
  ]),

  {
    extends: [js.configs.all, unicorn.configs.all],
    files: ["**/*.js"],
    linterOptions: { reportUnusedDisableDirectives: "error", reportUnusedInlineConfigs: "error" },
    plugins: { project },
    rules: {
      "capitalized-comments": "off",
      "no-magic-numbers": ["error", { ignore: [0, 1], ignoreDefaultValues: true }],
      "no-ternary": "off",
      "one-var": "off",
      "project/no-comments": "error",
      "sort-keys": "off",
    },
  },

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

  {
    files: ["src/js/**/*.js"],
    languageOptions: { ecmaVersion: 5, globals: globals.browser, sourceType: "script" },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
      "no-var": "off",
      "prefer-arrow-callback": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-optional-catch-binding": "off",
    },
  },

  {
    extends: [json.configs.recommended],
    files: ["**/*.json"],
    language: "json/json",
  },

  {
    extends: [yml.configs["flat/standard"], yml.configs["flat/prettier"]],
    files: ["**/*.yaml", "**/*.yml"],
    plugins: { project },
    rules: { "project/no-comments": "error" },
  },
]);
