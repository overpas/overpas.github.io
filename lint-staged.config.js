// Runs on staged files before each commit (installed as a Git hook by simple-git-hooks).
const config = {
  "*.css": ["stylelint --fix --max-warnings 0", "prettier --write"],
  "*.js": [
    "eslint --fix --max-warnings 0 --no-warn-ignored",
    "prettier --write",
    () => "tsc --noEmit",
  ],
  "*.md": ["markdownlint-cli2 --fix", "prettier --write"],
  "*.{json,yaml,yml}": ["eslint --fix --max-warnings 0 --no-warn-ignored", "prettier --write"],
};

export default config;
