import { canCreateOffers, canCreateReports } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { ActivityLog } from "../components/ActivityLog.js";
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
  const featuredTools = data.tools.slice(0, 2);
  const latestResults = newestFirst([...data.offers, ...data.reports]).slice(0, 4);
  const latestSuccessByTool = getLatestSuccessByTool(data.tools, data.logs);

  return `
    ${PageHeader({
      eyebrow: "Guten Morgen",
      title: "Alles Wichtige auf einen Blick",
      description: "Starte interne Automatisierungen, finde letzte Ergebnisse und erkenne Fehler, bevor sie Arbeit blockieren.",
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
            <h2 class="panel-title">Wichtigste Tools</h2>
            <p class="panel-subtitle">Direkter Einstieg fuer Sales und Reporting</p>
          </div>
          <a class="button" href="#/tools" title="Alle Module anzeigen">${icon("boxes")}Alle</a>
        </div>
        <div class="tools-grid">
          ${featuredTools.map(ToolCard).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Letzte Aktivitaeten</h2>
            <p class="panel-subtitle">${data.logs.length} Log-Eintraege</p>
          </div>
          <a class="button" href="#/activity" title="Log anzeigen">${icon("activity")}Log</a>
        </div>
        ${ActivityLog(data.logs, data.tools, 5)}
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
        ${latestResults.map((result) => resultRow(result)).join("") || '<div class="empty-state">Noch keine Ergebnisse gespeichert.</div>'}
      </div>
    </section>
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
