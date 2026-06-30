import { canCreateOffers, canCreateReports } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { ActivityLog } from "../components/ActivityLog.js";
import { EmptyState } from "../components/EmptyState.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatCard } from "../components/StatCard.js";
import { ToolCard } from "../components/ToolCard.js";
import { describeResult } from "../modules/results/resultTypes.js";
import { newestFirst, statusBadge, escapeHtml } from "../utils.js";

export function DashboardView(data, currentUser) {
  const readyCount = data.tools.filter((tool) => tool.status === "ready").length;
  const activeAutomations = data.automations.filter((automation) => automation.enabled).length;
  const errorCount = data.logs.filter((log) => (log.status || log.level) === "error").length;
  const storedResults = data.offers.length + data.reports.length;
  const featuredTools = prioritizeToolsForUser(data.tools, currentUser).slice(0, 3);
  const latestResults = newestFirst([...data.offers, ...data.reports]).slice(0, 4);
  const latestSuccessByTool = getLatestSuccessByTool(data.tools, data.logs);
  const reportingTool = data.tools.find((tool) => tool.id === "reporting-tool");
  const offerTool = data.tools.find((tool) => tool.id === "offer-generator");

  return `
    ${PageHeader({
      eyebrow: "Interne Website",
      title: "Alles Wichtige fuer dein Team",
      description: "Nutze Angebote, Reports und interne Automatisierungen ueber eine gemeinsame Arbeitsoberflaeche mit klaren Status- und Ergebnisansichten.",
      actions: [
        ...(canCreateOffers(currentUser) ? [{ label: "Neues Angebot", href: "#/offers", icon: "file", primary: true }] : []),
        ...(canCreateReports(currentUser) ? [{ label: "Neuer Report", href: "#/reporting", icon: "database" }] : []),
      ],
    })}

    <section class="summary-grid" aria-label="Dashboard Kennzahlen">
      ${StatCard({ label: "Ready Tools", value: readyCount, note: `${data.tools.length} Module registriert`, iconName: "check", tone: "green" })}
      ${StatCard({ label: "Aktive Jobs", value: activeAutomations, note: "Automationen eingeschaltet", iconName: "play", tone: "teal" })}
      ${StatCard({ label: "Ergebnisse", value: storedResults, note: "Angebote und Reports", iconName: "database", tone: "blue" })}
      ${StatCard({ label: "Fehler", value: errorCount, note: "Error Logs im Aktivitaetsstrom", iconName: "alert", tone: errorCount ? "red" : "green" })}
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Arbeitsbereiche</h2>
            <p class="panel-subtitle">Die wichtigsten Einstiege fuer deinen Arbeitsalltag</p>
          </div>
          <a class="button" href="#/tools" title="Alle Bereiche anzeigen">${icon("boxes")}Alle Bereiche</a>
        </div>
        <div class="tools-grid">
          ${featuredTools.length
            ? featuredTools.map(ToolCard).join("")
            : EmptyState({ title: "Keine Arbeitsbereiche", message: "Sobald Module verfuegbar sind, erscheinen sie hier.", iconName: "boxes" })}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Betriebsstatus</h2>
            <p class="panel-subtitle">Aktuelle Signale aus Angeboten, Reports und Integrationen</p>
          </div>
          <a class="button" href="#/settings" title="Datenquellen anzeigen">${icon("settings")}Datenquellen</a>
        </div>
        <div class="integration-list">
          ${statusRow("Angebotsgenerator", offerTool?.status || "disabled", "Sales Tool fuer Medienangebote und Kampagnenpakete.")}
          ${statusRow("Reporting Tool", reportingTool?.status || "disabled", "Report-Erstellung, Datenquellen und KPI-Vorschau.")}
          ${statusRow("Activity Logs", errorCount ? "error" : "ready", errorCount ? `${errorCount} Fehler brauchen Aufmerksamkeit.` : "Keine kritischen Fehler im aktuellen Verlauf.")}
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Letzte Aktivitaeten</h2>
            <p class="panel-subtitle">${data.logs.length} Log-Eintraege</p>
          </div>
          <a class="button" href="#/activity" title="Log anzeigen">${icon("activity")}Activity Logs</a>
        </div>
        ${ActivityLog(data.logs, data.tools, 5)}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Schnelle Orientierung</h2>
            <p class="panel-subtitle">Die wichtigsten Wege durch die interne Website</p>
          </div>
          <a class="button" href="#/help" title="Zur Hilfe">${icon("book")}Hilfe</a>
        </div>
        <div class="quick-actions">
          <a class="quick-action primary" href="#/tools">${icon("boxes")}Alle Arbeitsbereiche</a>
          <a class="quick-action" href="#/reporting">${icon("database")}Reports & Details</a>
          <a class="quick-action" href="#/settings">${icon("settings")}Datenquellen</a>
          <a class="quick-action" href="#/help">${icon("book")}Dokumentation</a>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Letzter erfolgreicher Lauf pro Tool</h2>
          <p class="panel-subtitle">Schneller Monitoring-Blick fuer Admins und Teams</p>
        </div>
        <a class="button" href="#/activity" title="Alle Logs anzeigen">${icon("activity")}Logs</a>
      </div>
      <div class="result-list">
        ${latestSuccessByTool.map(successRunRow).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Ergebnisindex</h2>
          <p class="panel-subtitle">Zuletzt generierte Angebote und Reports</p>
        </div>
      </div>
      <div class="result-list">
        ${latestResults.length
          ? latestResults.map((result) => resultRow(result)).join("")
          : EmptyState({ title: "Noch keine Ergebnisse", message: "Neue Angebote und Reports erscheinen nach dem ersten erfolgreichen Lauf hier.", iconName: "database" })}
      </div>
    </section>
  `;
}

function prioritizeToolsForUser(tools, currentUser) {
  const role = currentUser?.role || "";
  const score = (tool) => {
    if (role === "sales_user" && tool.id === "offer-generator") return 100;
    if (role === "marketing_user" && tool.id === "reporting-tool") return 100;
    if (role === "management_viewer" && tool.id === "reporting-tool") return 95;
    if (tool.status === "ready") return 80;
    if (tool.status === "in_progress") return 60;
    if (tool.status === "pending_connection") return 40;
    return 10;
  };

  return [...tools].sort((left, right) => score(right) - score(left));
}

function statusRow(title, status, description) {
  return `
    <div class="integration-row">
      <div>
        <p class="integration-title">${escapeHtml(title)}</p>
        <p class="integration-meta">${escapeHtml(description)}</p>
      </div>
      ${statusBadge(status)}
    </div>
  `;
}

function getLatestSuccessByTool(tools, logs) {
  const successLogs = newestFirst(logs.filter((log) => (log.status || log.level) === "success"));
  return tools.map((tool) => ({
    tool,
    log: successLogs.find((log) => (log.toolId || log.tool_id) === tool.id) || null,
  }));
}

function successRunRow({ tool, log }) {
  return `
    <div class="result-row">
      <div>
        <p class="result-title">${escapeHtml(tool.name)}</p>
        <p class="result-meta">${log ? `${escapeHtml(log.message)} - ${escapeHtml(log.actor || log.user || "System")}` : "Noch kein erfolgreicher Lauf protokolliert."}</p>
      </div>
      ${log ? statusBadge("ready") : statusBadge(tool.status === "disabled" ? "disabled" : "in_progress")}
    </div>
  `;
}

function resultRow(result) {
  const description = describeResult(result);

  return `
    <div class="result-row">
      <div>
        <p class="result-title">${escapeHtml(description.title)}</p>
        <p class="result-meta">${escapeHtml(description.meta)} - ${escapeHtml(result.createdBy)}</p>
      </div>
      ${statusBadge(description.ready ? "ready" : "in_progress")}
    </div>
  `;
}
