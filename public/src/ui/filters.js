export function bindAutomationHubFilters() {
  const searchInput = document.getElementById("automation-hub-search");
  const categorySelect = document.getElementById("automation-hub-category");
  const cards = [...document.querySelectorAll("[data-tool-card]")];
  const emptyState = document.getElementById("automation-hub-empty");
  if (!searchInput || !categorySelect || !cards.length) return;

  const applyFilters = () => {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = (card.getAttribute("data-tool-name") || "").toLowerCase();
      const cardCategory = card.getAttribute("data-tool-category") || "";
      const matchesSearch = !query || name.includes(query);
      const matchesCategory = !category || cardCategory === category;
      const visible = matchesSearch && matchesCategory;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount > 0;
  };

  searchInput.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
  applyFilters();
}

export function bindActivityLogFilters() {
  const searchInput = document.getElementById("activity-log-search");
  const statusSelect = document.getElementById("activity-log-status");
  const toolSelect = document.getElementById("activity-log-tool");
  const rows = [...document.querySelectorAll("[data-activity-log]")];
  const emptyState = document.getElementById("activity-log-empty");
  if (!searchInput || !statusSelect || !toolSelect || !rows.length) return;

  const applyFilters = () => {
    const query = searchInput.value.trim().toLowerCase();
    const status = statusSelect.value;
    const toolId = toolSelect.value;
    let visibleCount = 0;

    rows.forEach((row) => {
      const rowStatus = row.getAttribute("data-log-status") || "";
      const rowTool = row.getAttribute("data-log-tool") || "";
      const rowSearch = (row.getAttribute("data-log-search") || "").toLowerCase();
      const visible = (!status || rowStatus === status) && (!toolId || rowTool === toolId) && (!query || rowSearch.includes(query));
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount > 0;
  };

  searchInput.addEventListener("input", applyFilters);
  statusSelect.addEventListener("change", applyFilters);
  toolSelect.addEventListener("change", applyFilters);
  applyFilters();
}
