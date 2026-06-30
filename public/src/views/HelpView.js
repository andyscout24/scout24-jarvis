import { EmptyState } from "../components/EmptyState.js";
import { PageHeader } from "../components/PageHeader.js";
import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function HelpView(data, currentUser) {
  const tools = data.tools.filter((tool) => tool.status !== "disabled");
  const reportingConnection = data.apiConnections.find((item) => item.toolId === "reporting-tool");

  return `
    ${PageHeader({
      eyebrow: "Hilfe",
      title: "Hilfe & Dokumentation",
      description: "Schneller Einstieg fuer interne Teams mit Zugriffswegen, Moduluebersicht und Ansprechpartnern.",
      actions: [
        { label: "Reports oeffnen", href: "#/reporting", icon: "database" },
        { label: "Datenquellen", href: "#/settings", icon: "settings" },
      ],
    })}

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">So nutzt du die Website</h2>
            <p class="panel-subtitle">Empfohlener Arbeitsablauf fuer den Alltag</p>
          </div>
        </div>
        <div class="guide-list">
          ${guideStep("1", "Dashboard pruefen", "Auf der Startseite siehst du sofort wichtige Tools, letzte Aktivitaeten und offene Fehler.")}
          ${guideStep("2", "Arbeitsbereich waehlen", "Gehe ueber Arbeitsbereiche in das passende Modul oder springe direkt in Angebote und Reports.")}
          ${guideStep("3", "Ergebnisse kontrollieren", "Jedes Modul zeigt zuletzt erzeugte Angebote oder Reports sowie den aktuellen Status.")}
          ${guideStep("4", "Stoerungen melden", "Fehler oder fehlende Datenquellen findest du ueber Datenquellen und die Activity Logs.")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Dein aktueller Zugriff</h2>
            <p class="panel-subtitle">Rolle und freigeschaltete Module</p>
          </div>
        </div>
        ${currentUser ? `
          <div class="integration-list">
            <div class="integration-row">
              <div>
                <p class="integration-title">${escapeHtml(currentUser.name)}</p>
                <p class="integration-meta">${escapeHtml(currentUser.role)} - ${escapeHtml(currentUser.team || "internes Team")}</p>
              </div>
              <span class="status-badge status-ready">${icon("check", "icon small")}Aktiv</span>
            </div>
            <div class="integration-row">
              <div>
                <p class="integration-title">Freigeschaltete Module</p>
                <p class="integration-meta">${escapeHtml(String(tools.length))} aktive Werkzeuge in deiner Arbeitsoberflaeche</p>
              </div>
              ${icon("boxes")}
            </div>
            <div class="integration-row">
              <div>
                <p class="integration-title">Reporting Verbindung</p>
                <p class="integration-meta">${escapeHtml(reportingConnection?.status || "unknown")}</p>
              </div>
              ${icon("activity")}
            </div>
          </div>
        ` : EmptyState({ title: "Kein User geladen", message: "Melde dich an, um rollenbasierte Hinweise und Module zu sehen.", iconName: "users" })}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Wichtige Bereiche</h2>
          <p class="panel-subtitle">Was du wo findest</p>
        </div>
      </div>
      <div class="help-grid">
        ${helpCard("Dashboard", "Tagesueberblick, Status, letzte Ergebnisse und Schnellaktionen.", "#/", "dashboard")}
        ${helpCard("Arbeitsbereiche", "Alle freigeschalteten Automatisierungen mit Status und Detailzugang.", "#/tools", "boxes")}
        ${helpCard("Reports & Details", "Reporting Center sowie tieferer Blick auf Tool-Status und Ergebnislisten.", "#/reporting", "database")}
        ${helpCard("Datenquellen", "Integrationen, API-Verbindungen, Rollen und Systemkontext.", "#/settings", "settings")}
      </div>
    </section>
  `;
}

function guideStep(step, title, text) {
  return `
    <div class="guide-step">
      <span class="guide-index">${escapeHtml(step)}</span>
      <div>
        <p class="integration-title">${escapeHtml(title)}</p>
        <p class="integration-meta">${escapeHtml(text)}</p>
      </div>
    </div>
  `;
}

function helpCard(title, text, href, iconName) {
  return `
    <a class="help-card" href="${escapeHtml(href)}">
      <div class="help-card-head">
        <span class="empty-icon">${icon(iconName)}</span>
        <span class="status-badge status-in_progress">${icon("chevron", "icon small")}Oeffnen</span>
      </div>
      <div>
        <p class="integration-title">${escapeHtml(title)}</p>
        <p class="integration-meta">${escapeHtml(text)}</p>
      </div>
    </a>
  `;
}
