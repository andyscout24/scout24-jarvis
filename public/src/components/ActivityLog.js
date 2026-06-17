import { formatDateTime, levelBadge, toolMap, escapeHtml } from "../utils.js";

export function ActivityLog(logs, tools, limit = logs.length) {
  const toolsById = toolMap(tools);
  const visibleLogs = logs.slice(0, limit);

  if (!visibleLogs.length) {
    return `<div class="empty-state">Keine Aktivitaeten vorhanden.</div>`;
  }

  return `
    <div class="activity-list">
      ${visibleLogs
        .map((log) => {
          const status = log.status || log.level || "info";
          const toolId = log.toolId || log.tool_id;
          const tool = toolsById[toolId];
          return `
            <div class="activity-item">
              <div>
                <div class="activity-meta">
                  ${levelBadge(status)}
                  <span>${escapeHtml(tool?.name || toolId || "Dashboard")}</span>
                  <span>${escapeHtml(log.actor || log.user || "System")}</span>
                </div>
                <p class="activity-message">${escapeHtml(log.message)}</p>
              </div>
              <time class="activity-time">${formatDateTime(log.createdAt || log.created_at || log.timestamp)}</time>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}
