(() => {
  const toggle = document.querySelector(".site-nav-toggle");
  if (!toggle) return;

  const nav = document.getElementById(toggle.getAttribute("aria-controls"));
  if (!nav) return;

  const setOpen = (open) => {
    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".site-nav-toggle-label").textContent = open ? "Close" : "Menu";
  };

  toggle.addEventListener("click", () => setOpen(nav.dataset.open !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.dataset.open === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) setOpen(false);
  }, { passive: true });
})();
