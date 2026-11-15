(() => {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".library-note")];
  const typeButtons = [...document.querySelectorAll("[data-type-filter]")];
  const authorSelect = document.getElementById("portfolioAuthor");
  const topicSelect = document.getElementById("portfolioTopic");
  const empty = document.getElementById("portfolioEmpty");
  const count = document.getElementById("portfolioResultCount");
  let selectedType = "all";

  const requestedAuthor = new URLSearchParams(window.location.search).get("author");
  if (requestedAuthor && [...authorSelect.options].some((option) => option.value === requestedAuthor)) {
    authorSelect.value = requestedAuthor;
  }

  function update() {
    let visible = 0;
    for (const card of cards) {
      const matchesType = selectedType === "all" || card.dataset.category === selectedType;
      const matchesAuthor = authorSelect.value === "all" || card.dataset.authors.split(" ").includes(authorSelect.value);
      const matchesTopic = topicSelect.value === "all" || card.dataset.tags.split("|").includes(topicSelect.value);
      const show = matchesType && matchesAuthor && matchesTopic;
      card.hidden = !show;
      if (show) visible += 1;
    }
    empty.hidden = visible > 0;
    count.textContent = `${visible} ${visible === 1 ? "item" : "items"}`;
  }

  typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedType = button.dataset.typeFilter;
      typeButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      update();
    });
  });
  authorSelect.addEventListener("change", update);
  topicSelect.addEventListener("change", update);
  update();
})();
