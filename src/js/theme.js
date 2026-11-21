(function () {
  var root = document.documentElement;
  var button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  function current() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function sync() {
    button.setAttribute("aria-pressed", current() === "dark" ? "true" : "false");
  }

  button.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    sync();
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var saved;
      try { saved = localStorage.getItem("theme"); } catch (err) {}
      if (saved !== "light" && saved !== "dark") {
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
        sync();
      }
    });
  }

  sync();
  if (document.prerendering) document.addEventListener("prerenderingchange", sync, { once: true });
})();
