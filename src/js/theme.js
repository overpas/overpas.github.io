(function initThemeToggle() {
  "use strict";

  var button = document.querySelector("[data-theme-toggle]"),
    currentTheme = function currentTheme() {
      return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    },
    markPressed = function markPressed() {
      button.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
    },
    onSystemThemeChange = function onSystemThemeChange(event) {
      var saved = "";
      try {
        saved = localStorage.getItem("theme");
      } catch (error) {}
      if (saved === "light" || saved === "dark") {
        return;
      }
      document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      markPressed();
    },
    onToggleClick = function onToggleClick() {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (error) {}
      markPressed();
    };

  if (!button) {
    return;
  }
  button.addEventListener("click", onToggleClick);
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", onSystemThemeChange);
  }
  markPressed();
  if (document.prerendering) {
    document.addEventListener("prerenderingchange", markPressed, { once: true });
  }
})();
