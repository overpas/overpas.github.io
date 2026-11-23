(function initBackToTop() {
  "use strict";

  var link = document.querySelector("[data-back-to-top]"),
    update = function update() {
      link.hidden = window.scrollY <= 0;
    };

  if (!link) {
    return;
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
