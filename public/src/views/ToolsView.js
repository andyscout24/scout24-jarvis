import { EmptyState } from "../components/EmptyState.js";
import { PageHeader } from "../components/PageHeader.js";
import { ToolCard } from "../components/ToolCard.js";
import { toolStatusOrder } from "../domain/constants.js";
import { escapeHtml, statusBadge } from "../utils.js";

export function ToolsView(data) {
  const categories = [...new Set(data.tools.map((tool) => tool.category).filter(Boolean))];
  const statusLegend = toolStatusOrder
    .map((status) => statusBadge(status))
    .join("");

  return `
    ${PageHeader({
      eyebrow: "Automation Hub",
      title: "Alle Automatisierungen",
      description: "Zentrale Startseite fuer alle internen Automatisierungen mit Status, Suche und direktem Einstieg.",
      actions: [{ label: "Activity Logs", href: "#/activity", icon: "activity" }],
    })}

    <section class="hub-controls" aria-label="Automation Hub Filter">
      <label class="search-field">
        <span>Suche</span>
        <input id="automation-hub-search" type="search" placeholder="Toolname suchen">
      </label>
      <label class="select-field">
        <span>Kategorie</span>
        <select id="automation-hub-category">
          <option value="">Alle Kategorien</option>
          ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
        </select>
      </label>
      <div class="status-legend" aria-label="Status Legende">
        ${statusLegend}
      </div>
    </section>

    <section class="tools-grid" aria-label="Automatisierungsmodule">
      ${data.tools.length ? data.tools.map(ToolCard).join("") : ""}
    </section>
    <div id="automation-hub-empty" ${data.tools.length ? "hidden" : ""}>
      ${EmptyState({ title: "Keine Automatisierungen gefunden", message: "Passe Suche oder Kategorie an, um wieder Tools zu sehen.", iconName: "boxes" })}
    </div>
  `;
}
