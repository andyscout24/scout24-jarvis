import { ActivityLogTable } from "../components/ActivityLogTable.js";
import { PageHeader } from "../components/PageHeader.js";
import { escapeHtml } from "../utils.js";

export function ActivityView(data) {
  const statuses = ["success", "warning", "error", "info"];
  const toolsWithLogs = data.tools.filter((tool) => data.logs.some((log) => (log.toolId || log.tool_id) === tool.id));

  return `
    ${PageHeader({
      eyebrow: "Status",
      title: "Activity Logs",
      description: "Letzte erfolgreiche Laeufe, Warnungen, Fehler und Systemmeldungen.",
      actions: [{ label: "Automation Hub", href: "#/tools", icon: "boxes" }],
    })}

    <section class="hub-controls" aria-label="Activity Log Filter">
      <label class="search-field">
        <span>Suche</span>
        <input id="activity-log-search" type="search" placeholder="Nachricht oder Aktion suchen">
      </label>
      <label class="select-field">
        <span>Status</span>
        <select id="activity-log-status">
          <option value="">Alle Status</option>
          ${statuses.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join("")}
        </select>
      </label>
      <label class="select-field">
        <span>Tool</span>
        <select id="activity-log-tool">
          <option value="">Alle Tools</option>
          ${toolsWithLogs.map((tool) => `<option value="${escapeHtml(tool.id)}">${escapeHtml(tool.name)}</option>`).join("")}
        </select>
      </label>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Letzte Aktivitaeten</h2>
          <p class="panel-subtitle">${data.logs.length} Eintraege</p>
        </div>
      </div>
      ${ActivityLogTable(data.logs, data.tools)}
    </section>
  `;
}
