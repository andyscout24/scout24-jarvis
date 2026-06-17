import { icon } from "../icons.js";
import { getAutomationModuleDefinition } from "../modules/automations/registry.js";
import { formatDateTime, formatNumber, formatPercent, statusBadge, escapeHtml } from "../utils.js";
import { MetricStrip } from "./MetricStrip.js";

export function ToolCard(tool) {
  const category = tool.category || "Admin";
  const moduleDefinition = getAutomationModuleDefinition(tool.id);
  const detailHref = tool.route || `#/tools/${tool.id}`;
  const openHref = tool.launchRoute || (tool.externalUrl && tool.status !== "pending_connection" ? tool.externalUrl : detailHref);
  const opensExternal = /^https?:\/\//.test(openHref);
  const metrics = [
    { label: "Runs heute", value: formatNumber(tool.metrics?.runsToday) },
    { label: "Erfolgsrate", value: formatPercent(tool.metrics?.successRate) },
    { label: "Ergebnisse", value: formatNumber(tool.metrics?.storedResults) },
  ];

  const primaryAction = tool.status === "disabled"
    ? `<button class="button primary" type="button" disabled>${icon("chevron")}Oeffnen</button>`
    : `<a class="button primary" href="${escapeHtml(openHref)}" ${opensExternal ? 'target="_blank" rel="noreferrer"' : ""} title="Tool oeffnen" data-log-tool-open data-tool-id="${escapeHtml(tool.id)}" data-tool-name="${escapeHtml(tool.name)}">${icon(opensExternal ? "external" : "chevron")}Oeffnen</a>`;

  const detailAction = `<a class="button" href="${escapeHtml(detailHref)}" title="Tool-Details anzeigen" data-log-tool-open data-tool-id="${escapeHtml(tool.id)}" data-tool-name="${escapeHtml(tool.name)}">${icon("chevron")}Details</a>`;

  return `
    <article class="tool-card" data-tool-card data-tool-name="${escapeHtml(tool.name)}" data-tool-category="${escapeHtml(category)}" data-tool-status="${escapeHtml(tool.status)}">
      <div class="tool-card-header">
        <div>
          <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
          <p class="tool-description">${escapeHtml(tool.description)}</p>
        </div>
        ${statusBadge(tool.status)}
      </div>
      <div class="tag-row compact">
        <span class="tag tag-category">${escapeHtml(category)}</span>
        <span class="tag">${icon(moduleDefinition.icon || categoryIcon(category), "icon small")}${escapeHtml(tool.integration?.state || tool.module?.adapterId || "configured")}</span>
      </div>
      ${MetricStrip(metrics)}
      <div class="tool-card-footer">
        <div class="activity-meta">
          <span>${icon("users", "icon small")}${escapeHtml(tool.owner)}</span>
          <span>${icon("clock", "icon small")}${formatDateTime(tool.lastRunAt)}</span>
        </div>
        <div class="row-actions">
          ${detailAction}
          ${primaryAction}
        </div>
      </div>
    </article>
  `;
}

function categoryIcon(category) {
  if (category.includes("Sales")) return "users";
  if (category.includes("Reporting")) return "database";
  if (category.includes("Marketing")) return "activity";
  if (category.includes("Admin")) return "settings";
  return "wrench";
}
