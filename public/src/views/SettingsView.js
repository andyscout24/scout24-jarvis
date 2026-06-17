import { icon } from "../icons.js";
import { PageHeader } from "../components/PageHeader.js";
import { statusBadge, escapeHtml } from "../utils.js";

export function SettingsView(data) {
  return `
    ${PageHeader({
      eyebrow: "Admin",
      title: "Settings und Integrationen",
      description: "Tool-Status, API-Verbindungen, Datenhaltung und Platzhalter fuer Rollen und Rechte.",
      actions: [{ label: "Status pruefen", href: "#/activity", icon: "activity" }],
    })}
    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
        <div>
          <h2 class="panel-title">Integrationen</h2>
          <p class="panel-subtitle">${data.tools.length} Moduladapter</p>
        </div>
        </div>
        <div class="integration-list">
          ${data.tools.map(integrationRow).join("")}
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
          ${data.apiConnections.map(apiConnectionRow).join("")}
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
          ${data.users.map(userRow).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Datenhaltung</h2>
            <p class="panel-subtitle">MVP jetzt, Postgres/Supabase vorbereitet</p>
          </div>
        </div>
        <div class="integration-list">
          <div class="integration-row">
            <div>
              <p class="integration-title">Aktiver Speicher</p>
              <p class="integration-meta mono">data/db.json</p>
            </div>
            ${icon("database")}
          </div>
          <div class="integration-row">
            <div>
              <p class="integration-title">Zielsystem</p>
              <p class="integration-meta">database/schema.sql und database/seed.sql</p>
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
