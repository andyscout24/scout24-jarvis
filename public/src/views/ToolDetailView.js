import { ActivityLog } from "../components/ActivityLog.js";
import { MetricStrip } from "../components/MetricStrip.js";
import { canManageToolStatus, canViewLogs } from "../auth/permissions.js";
import { editableToolStatuses } from "../domain/constants.js";
import { icon } from "../icons.js";
import { describeResult } from "../modules/results/resultTypes.js";
import {
  escapeHtml,
  formatDateTime,
  formatNumber,
  formatPercent,
  newestFirst,
  statusBadge,
} from "../utils.js";

export function ToolDetailView(data, toolId, currentUser) {
  const tool = data.tools.find((item) => item.id === toolId);
  if (!tool) {
    return `<div class="empty-state">Tool wurde nicht gefunden.</div>`;
  }

  const toolLogs = newestFirst(data.logs.filter((log) => log.toolId === tool.id)).slice(0, 8);
  const results = newestFirst([
    ...data.offers.filter((offer) => offer.toolId === tool.id),
    ...data.reports.filter((report) => report.toolId === tool.id),
  ]).slice(0, 6);
  const automations = data.automations.filter((automation) => automation.toolId === tool.id);

  return `
    <section class="detail-head">
      <div>
        <h2 class="detail-title">${escapeHtml(tool.name)}</h2>
        <p class="detail-description">${escapeHtml(tool.description)}</p>
        <div class="tag-row">
          <span class="tag">${icon("wrench", "icon small")}${escapeHtml(tool.category)}</span>
          <span class="tag">${icon("users", "icon small")}${escapeHtml(tool.owner)}</span>
          <span class="tag">${icon("clock", "icon small")}${formatDateTime(tool.lastRunAt)}</span>
        </div>
      </div>
      ${statusBadge(tool.status)}
    </section>

    <section class="detail-layout">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Betrieb</h3>
            <p class="panel-subtitle">${escapeHtml(tool.owner)}</p>
          </div>
          ${tool.externalUrl ? `<a class="button" href="${escapeHtml(tool.externalUrl)}" target="_blank" rel="noreferrer" title="Externes Tool oeffnen">${icon("external")}Oeffnen</a>` : ""}
        </div>
        ${MetricStrip([
          { label: "Runs heute", value: formatNumber(tool.metrics?.runsToday) },
          { label: "Erfolgsrate", value: formatPercent(tool.metrics?.successRate) },
          { label: "Ergebnisse", value: formatNumber(tool.metrics?.storedResults) },
        ])}

        ${canManageToolStatus(currentUser) ? `
          <div class="panel-header" style="margin-top: 18px;">
            <div>
              <h3 class="panel-title">Statussteuerung</h3>
              <p class="panel-subtitle">Tool Registry</p>
            </div>
          </div>
          <div class="status-controls">
            <div class="row-actions">
              ${editableToolStatuses
                .map(
                  (status) => `
                    <button class="status-action" data-status-update="${status}" data-tool-id="${escapeHtml(tool.id)}" ${tool.status === status ? "disabled" : ""} type="button">
                      ${statusBadge(status)}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        ` : ""}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Integration</h3>
            <p class="panel-subtitle">${escapeHtml(tool.integration?.state || "unbekannt")}</p>
          </div>
        </div>
        <div class="integration-list">
          ${integrationRows(tool).join("")}
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Ergebnisse</h3>
            <p class="panel-subtitle">${results.length} Eintraege</p>
          </div>
        </div>
        <div class="result-list">
          ${results.map(resultRow).join("") || '<div class="empty-state">Noch keine Ergebnisse fuer dieses Modul.</div>'}
        </div>
      </div>

      ${canViewLogs(currentUser) ? `<div class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Aktivitaeten</h3>
            <p class="panel-subtitle">${toolLogs.length} Log-Eintraege</p>
          </div>
        </div>
        ${ActivityLog(toolLogs, data.tools)}
      </div>` : ""}
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Automationen</h3>
          <p class="panel-subtitle">${automations.length} registriert</p>
        </div>
      </div>
      <div class="integration-list">
        ${automations.map(automationRow).join("") || '<div class="empty-state">Keine Automation registriert.</div>'}
      </div>
    </section>
  `;
}

function integrationRows(tool) {
  const integration = tool.integration || {};
  const rows = [
    ["Typ", integration.type || "n/a"],
    ["Status", integration.state || "n/a"],
  ];

  if (integration.healthEndpoint) rows.push(["Health", integration.healthEndpoint]);
  if (integration.previewEndpoint) rows.push(["Preview", integration.previewEndpoint]);
  if (integration.generateEndpoint) rows.push(["Generate", integration.generateEndpoint]);
  if (integration.sourceReference) rows.push(["Source", integration.sourceReference]);
  if (integration.notes) rows.push(["Hinweis", integration.notes]);

  return rows.map(
    ([label, value]) => `
      <div class="integration-row">
        <div>
          <p class="integration-title">${escapeHtml(label)}</p>
          <p class="integration-meta mono">${escapeHtml(value)}</p>
        </div>
        ${icon("link")}
      </div>
    `,
  );
}

function resultRow(result) {
  const description = describeResult(result);

  return `
    <div class="result-row">
      <div>
        <p class="result-title">${escapeHtml(description.title)}</p>
        <p class="result-meta">${escapeHtml(description.meta)} - ${formatDateTime(result.createdAt)}</p>
      </div>
      ${statusBadge(description.ready ? "ready" : "in_progress")}
    </div>
  `;
}

function automationRow(automation) {
  return `
    <div class="integration-row">
      <div>
        <p class="integration-title">${escapeHtml(automation.name)}</p>
        <p class="integration-meta">${escapeHtml(automation.schedule)} - naechster Lauf: ${formatDateTime(automation.nextRunAt)}</p>
      </div>
      ${statusBadge(automation.enabled ? "ready" : "disabled")}
    </div>
  `;
}
