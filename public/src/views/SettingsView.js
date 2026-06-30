import { icon } from "../icons.js";
import { PageHeader } from "../components/PageHeader.js";
import { statusBadge, escapeHtml } from "../utils.js";

export function SettingsView(data) {
  const activeStorage = inferActiveStorage(data);

  return `
    ${PageHeader({
      eyebrow: "Betrieb",
      title: "Datenquellen & Einstellungen",
      description: "Uebersicht ueber Integrationen, API-Verbindungen, Rollen und den technischen Betriebsrahmen der internen Website.",
      actions: [
        { label: "Activity Logs", href: "#/activity", icon: "activity" },
        { label: "Hilfe", href: "#/help", icon: "book" },
      ],
    })}
    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
        <div>
          <h2 class="panel-title">Module & Integrationen</h2>
          <p class="panel-subtitle">${data.tools.length} aktive und geplante Bereiche</p>
        </div>
        </div>
        <div class="integration-list">
          ${data.tools.length ? data.tools.map(integrationRow).join("") : emptyInline("Keine Module geladen", "Die Modulkonfiguration konnte nicht geladen werden.")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
        <div>
          <h2 class="panel-title">API-Verbindungen</h2>
          <p class="panel-subtitle">${data.apiConnections.length} registriert</p>
        </div>
        </div>
        <div class="integration-list">
          ${data.apiConnections.length ? data.apiConnections.map(apiConnectionRow).join("") : emptyInline("Keine API-Verbindungen", "Aktuell wurden keine Verbindungen geladen oder sie sind fuer deine Rolle nicht freigegeben.")}
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Rollen und Rechte</h2>
            <p class="panel-subtitle">${data.users.length} Beispiel-User</p>
          </div>
        </div>
        <div class="integration-list">
          ${data.users.length ? data.users.map(userRow).join("") : emptyInline("Keine Userdaten", "User und Rollen konnten fuer diese Ansicht nicht geladen werden.")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Datenhaltung</h2>
            <p class="panel-subtitle">Aktive Quelle und vorbereitete Zielsysteme</p>
          </div>
        </div>
        <div class="integration-list">
          <div class="integration-row">
            <div>
              <p class="integration-title">Aktiver Speicher</p>
              <p class="integration-meta mono">${escapeHtml(activeStorage)}</p>
            </div>
            ${icon("database")}
          </div>
          <div class="integration-row">
            <div>
              <p class="integration-title">Zielsystem</p>
              <p class="integration-meta">Supabase / PostgreSQL mit zentralem Schema und Seed-Daten</p>
            </div>
            ${icon("settings")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function integrationRow(tool) {
  return `
    <div class="integration-row">
      <div>
        <p class="integration-title">${escapeHtml(tool.name)}</p>
        <p class="integration-meta">${escapeHtml(tool.integration?.type || "n/a")} - ${escapeHtml(tool.integration?.state || "n/a")}</p>
      </div>
      ${statusBadge(tool.status)}
    </div>
  `;
}

function apiConnectionRow(connection) {
  return `
    <div class="integration-row">
      <div>
        <p class="integration-title">${escapeHtml(connection.name)}</p>
        <p class="integration-meta mono">${escapeHtml(connection.baseUrl || "interner Adapter")} ${escapeHtml(connection.healthEndpoint || "")}</p>
      </div>
      ${statusBadge(connection.status === "healthy" ? "ready" : connection.status === "disabled" ? "disabled" : "in_progress")}
    </div>
  `;
}

function userRow(user) {
  return `
    <div class="integration-row">
      <div>
        <p class="integration-title">${escapeHtml(user.name)}</p>
        <p class="integration-meta">${escapeHtml(user.role)} - ${escapeHtml(user.team || "kein Team")}</p>
      </div>
      ${statusBadge(user.active ? "ready" : "disabled")}
    </div>
  `;
}

function inferActiveStorage(data) {
  const hasApiConnections = Array.isArray(data.apiConnections) && data.apiConnections.length > 0;
  const hasUsers = Array.isArray(data.users) && data.users.length > 0;
  return hasApiConnections && hasUsers ? "Supabase Repository aktiv" : "Lokale MVP-Daten";
}

function emptyInline(title, message) {
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}
