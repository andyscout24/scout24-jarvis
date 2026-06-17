import { EmptyState } from "../components/EmptyState.js";
import { PageHeader } from "../components/PageHeader.js";
import { ReportGeneratorForm } from "../components/ReportGeneratorForm.js";
import { StatCard } from "../components/StatCard.js";
import { canCreateReports, canViewLogs } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { reportingSources } from "../modules/reporting/sources.js";
import { describeResult } from "../modules/results/resultTypes.js";
import { escapeHtml, formatDateTime, newestFirst, statusBadge } from "../utils.js";

export function ReportingCenterView(data, currentUser) {
  const tool = data.tools.find((item) => item.id === "reporting-tool");
  const reports = newestFirst(data.reports.filter((report) => report.toolId === "reporting-tool"));
  const connection = data.apiConnections.find((item) => item.toolId === "reporting-tool");
  const sources = mergeConnectionState(reportingSources, data.apiConnections);

  return `
    ${PageHeader({
      eyebrow: "Reporting",
      title: "Reporting Center",
      description: "Erzeuge Kampagnenreviews, pruefe Datenquellen und finde zuletzt angelegte Report-Artefakte.",
      actions: [
        { label: "Externe Webapp", href: tool?.externalUrl || "#/tools/reporting-tool", icon: "external", external: Boolean(tool?.externalUrl) },
        ...(canViewLogs(currentUser) ? [{ label: "Logs ansehen", href: "#/activity", icon: "activity" }] : []),
      ],
    })}

    <section class="summary-grid">
      ${StatCard({ label: "Tool Status", value: tool?.status === "ready" ? 1 : 0, note: tool?.status || "unbekannt", iconName: "clock", tone: tool?.status === "error" ? "red" : "teal" })}
      ${StatCard({ label: "Reports", value: reports.length, note: "im Ergebnisindex", iconName: "database", tone: "blue" })}
      ${StatCard({ label: "Runs heute", value: tool?.metrics?.runsToday || 0, note: "laut Tool Registry", iconName: "play", tone: "green" })}
      ${StatCard({ label: "API Status", value: connection?.status === "healthy" ? 1 : 0, note: connection?.status || "unknown", iconName: "activity", tone: "amber" })}
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Report erstellen</h2>
            <p class="panel-subtitle">MVP-Wrapper fuer Campaign Reviews und pending Social-Quellen</p>
          </div>
          ${statusBadge(tool?.status || "disabled")}
        </div>
        ${canCreateReports(currentUser)
          ? ReportGeneratorForm({ tool, dataSources: sources })
          : EmptyState({ title: "Nur Lesen", message: "Deine Rolle kann Reports ansehen, aber keine neuen Reports erstellen.", iconName: "database" })}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Reporting Tool Status</h2>
            <p class="panel-subtitle">${escapeHtml(tool?.integration?.state || "unbekannt")}</p>
          </div>
        </div>
        <div class="integration-list">
          <div class="integration-row">
            <div>
              <p class="integration-title">Webapp</p>
              <p class="integration-meta mono">${escapeHtml(tool?.externalUrl || "nicht verbunden")}</p>
            </div>
            ${icon("external")}
          </div>
          <div class="integration-row">
            <div>
              <p class="integration-title">Health Endpoint</p>
              <p class="integration-meta mono">${escapeHtml(connection?.healthEndpoint || tool?.integration?.healthEndpoint || "-")}</p>
            </div>
            ${sourceBadge(connection?.status === "healthy" ? "ready" : "unknown")}
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Datenquellen</h2>
          <p class="panel-subtitle">Fehlende APIs bleiben sichtbar und blockieren den Reportlauf nicht</p>
        </div>
      </div>
      <div class="source-grid">
        ${sources.map(sourceCard).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">KPI Vorschau</h2>
          <p class="panel-subtitle">Platzhalter bis die jeweilige Datenquelle konkrete Werte liefert</p>
        </div>
      </div>
      <div class="kpi-placeholder-grid">
        ${kpiPlaceholderCards()}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Letzte Reports</h2>
          <p class="panel-subtitle">${reports.length} Reports gefunden</p>
        </div>
      </div>
      <div class="filter-grid report-filter-grid" aria-label="Report Filter">
        <label><span>Zeitraum</span><select id="report-filter-period"><option value="">Alle Zeitraeume</option>${filterOptions(reports, "reportingPeriod")}</select></label>
        <label><span>Kanal</span><select id="report-filter-channel"><option value="">Alle Kanaele</option>${filterOptions(reports, "channel")}</select></label>
        <label><span>Kunde</span><select id="report-filter-client"><option value="">Alle Kunden</option>${filterOptions(reports, "clientName")}</select></label>
        <label><span>Report-Typ</span><select id="report-filter-type"><option value="">Alle Typen</option>${filterOptions(reports, "reportType")}</select></label>
      </div>
      <p class="filter-helper">Die Filter wirken direkt auf die aktuell geladenen Report-Eintraege.</p>
      ${reports.length
        ? `${reportTable(reports)}
           <div id="report-filter-empty" hidden>
             ${EmptyState({ title: "Keine Reports fuer diesen Filter", message: "Passe Zeitraum, Kanal, Kunde oder Report-Typ an.", iconName: "database" })}
           </div>`
        : EmptyState({ title: "Keine Reports", message: "Neue Reports erscheinen nach dem ersten Export automatisch hier.", iconName: "database" })}
    </section>
  `;
}

function mergeConnectionState(sources, apiConnections) {
  const bySource = Object.fromEntries(
    apiConnections
      .filter((connection) => connection.toolId === "reporting-tool")
      .map((connection) => [connection.config?.sourceId || connection.config?.source_id || connection.id, connection]),
  );

  return sources.map((source) => {
    const connection = bySource[source.id];
    return {
      ...source,
      connection,
      state: connection?.config?.state || source.state,
      status: connection?.status || (source.state === "ready" ? "healthy" : "unknown"),
    };
  });
}

function sourceCard(source) {
  return `
    <div class="source-card">
      <div class="source-card-head">
        <strong>${escapeHtml(source.label)}</strong>
        ${sourceBadge(source.state)}
      </div>
      <p>${escapeHtml(source.description)}</p>
      <span class="source-meta mono">${escapeHtml(source.connection?.baseUrl || source.connection?.config?.sourceReference || source.state)}</span>
    </div>
  `;
}

function sourceBadge(state) {
  const labels = {
    ready: "Ready",
    healthy: "Ready",
    external_reference_detected: "Extern",
    pending_connection: "Pending",
    unknown: "Unknown",
    degraded: "Degraded",
    down: "Error",
  };
  const tone = state === "ready" || state === "healthy" ? "ready" : state === "down" || state === "degraded" ? "error" : "pending";
  return `<span class="source-badge source-${tone}">${escapeHtml(labels[state] || state || "Unknown")}</span>`;
}

function kpiPlaceholderCards() {
  const items = [
    ["Reichweite", "pending data"],
    ["Impressionen", "aus Campaign Review KPI"],
    ["Engagement", "pending Social Quelle"],
    ["Klicks", "aus Upload oder API"],
    ["Follower-Wachstum", "pending Social Quelle"],
    ["Top-Formate", "pending Social Quelle"],
    ["Optimierungsvorschlaege", "nach KPI Preview"],
  ];
  return items
    .map(([label, note]) => `
      <div class="kpi-card">
        <span>${escapeHtml(label)}</span>
        <strong>-</strong>
        <small>${escapeHtml(note)}</small>
      </div>
    `)
    .join("");
}

function filterOptions(reports, field) {
  return [...new Set(reports.map((report) => report[field]).filter(Boolean))]
    .map((value) => `<option>${escapeHtml(value)}</option>`)
    .join("");
}

function reportTable(reports) {
  return `
    <div class="table-wrap" id="report-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kunde</th>
            <th>Kampagne</th>
            <th>Typ</th>
            <th>Datenquelle</th>
            <th>Status</th>
            <th>Zeitraum</th>
            <th>Erstellt</th>
            <th>Datei</th>
          </tr>
        </thead>
        <tbody>
          ${reports
            .map((report) => {
              const result = describeResult(report);
              const reportingPeriod = report.reportingPeriod || "";
              const channel = report.channel || "";
              const clientName = report.clientName || "";
              const reportType = report.reportType || "campaign_review";
              return `
                <tr
                  data-report-row
                  data-report-period="${escapeHtml(reportingPeriod)}"
                  data-report-channel="${escapeHtml(channel)}"
                  data-report-client="${escapeHtml(clientName)}"
                  data-report-type="${escapeHtml(reportType)}"
                >
                  <td><strong>${escapeHtml(report.clientName)}</strong><span>${escapeHtml(report.createdBy || "")}</span></td>
                  <td>${escapeHtml(report.campaignName)}</td>
                  <td>${escapeHtml(reportType)}</td>
                  <td>${escapeHtml(report.dataSourceLabel || report.dataSource || "-")}</td>
                  <td>${statusBadge(reportStatus(report, result))}${report.errorMessage ? `<span>${escapeHtml(report.errorMessage)}</span>` : ""}</td>
                  <td>${escapeHtml(reportingPeriod || "-")}</td>
                  <td>${formatDateTime(report.createdAt)}</td>
                  <td class="mono">${escapeHtml(report.fileName || "-")}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function reportStatus(report, result) {
  if (report.status === "failed" || report.status === "error") return "error";
  if (report.status === "pending_connection" || report.status === "in_review") return "in_progress";
  return result.ready || report.status === "generated" ? "ready" : "in_progress";
}
