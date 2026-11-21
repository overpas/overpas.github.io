// Light / dark toggle. The initial theme is set by an inline script in <head>
// (saved choice, else the system setting) so the page never flashes.
const STORAGE_KEY = "theme";
const root = document.documentElement;
const button = document.querySelector("[data-theme-toggle]");

const currentTheme = () => (root.dataset.theme === "dark" ? "dark" : "light");

/** @returns {string | null} The saved choice; "" when storage is blocked. */
const savedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return "";
  }
};

/** @param {string} theme */
const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage is blocked (e.g. some private modes): the choice lasts for this page only.
  }
};

const syncButton = () => {
  button?.setAttribute("aria-pressed", String(currentTheme() === "dark"));
};

button?.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  saveTheme(next);
  syncButton();
});

// Follow system changes until the visitor picks a theme themselves.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (savedTheme() === "light" || savedTheme() === "dark") {
    return;
  }
  root.dataset.theme = event.matches ? "dark" : "light";
  syncButton();
});

syncButton();
if (document.prerendering) {
  document.addEventListener("prerenderingchange", syncButton, { once: true });
}
