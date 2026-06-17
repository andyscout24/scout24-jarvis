import { EmptyState } from "./EmptyState.js";
import { formatDateTime, levelBadge, toolMap, escapeHtml } from "../utils.js";

export function ActivityLogTable(logs, tools) {
  const toolsById = toolMap(tools);

  if (!logs.length) {
    return `
      ${EmptyState({ title: "Keine Aktivitaeten", message: "Wenn ein Tool laeuft oder Fehler meldet, erscheint der Eintrag hier.", iconName: "activity" })}
    `;
  }

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Zeitpunkt</th>
            <th>Status</th>
            <th>Tool</th>
            <th>Aktion</th>
            <th>Beschreibung</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${logs
            .map((log) => {
              const status = log.status || log.level || "info";
              const toolId = log.toolId || log.tool_id;
              const tool = toolsById[toolId];
              const details = logDetails(log);
              return `
                <tr data-activity-log data-log-status="${escapeHtml(status)}" data-log-tool="${escapeHtml(toolId || "")}" data-log-search="${escapeHtml(`${log.message || ""} ${log.action || ""} ${tool?.name || toolId || ""}`)}">
                  <td>${formatDateTime(log.createdAt || log.created_at || log.timestamp)}</td>
                  <td>${levelBadge(status)}</td>
                  <td>
                    <strong>${escapeHtml(tool?.name || toolId || "Dashboard")}</strong>
                    <span>${escapeHtml(log.actor || log.user || "System")}</span>
                  </td>
                  <td><span class="mono">${escapeHtml(log.action || "activity.logged")}</span></td>
                  <td>${escapeHtml(log.message)}</td>
                  <td>${details}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div id="activity-log-empty" hidden>
      ${EmptyState({ title: "Keine passenden Logs", message: "Passe Filter oder Suche an, um wieder Aktivitaeten zu sehen.", iconName: "activity" })}
    </div>
  `;
}

function logDetails(log) {
  const metadata = log.metadata && Object.keys(log.metadata).length ? JSON.stringify(log.metadata, null, 2) : "{}";
  return `
    <details class="log-details">
      <summary>Details anzeigen</summary>
      <pre class="metadata-block">${escapeHtml(metadata)}</pre>
    </details>
  `;
}
