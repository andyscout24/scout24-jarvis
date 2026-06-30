import { canAccessHref, roleLabels } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { navItems } from "../modules/navigation.js";
import { escapeHtml } from "../utils.js";

export function Shell({ active, title, content, error, warnings = [], notice, loading, currentUser, authState, authConfig, apiStatus = "unknown" }) {
  const visibleNavItems = navItems.filter((item) => canAccessHref(currentUser, item.href));
  const navSections = groupNavItems(visibleNavItems);
  const apiStatusUi = getApiStatusUi(apiStatus);

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/" aria-label="Social Jarvis Dashboard">
          <img src="/assets/automation-flow.svg" alt="">
          <span>
            <span class="brand-title">Social Jarvis</span>
            <span class="brand-subtitle">Interne Arbeitsoberflaeche</span>
          </span>
        </a>
        <nav class="nav" aria-label="Hauptnavigation">
          ${navSections.map((section) => navSection(section, active)).join("")}
        </nav>
        <div class="sidebar-note">
          <strong>Interner Zugriff</strong>
          <span>Tools, Reports und Datenquellen fuer Sales, Marketing und Operations.</span>
        </div>
      </aside>
      <div class="main-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Social Jarvis</p>
            <h1>${escapeHtml(title)}</h1>
          </div>
          <div class="topbar-actions">
            ${currentUser ? `<span class="connection-pill">${icon("users", "icon small")}${escapeHtml(currentUser.name)} - ${escapeHtml(roleLabels[currentUser.role] || currentUser.role)}</span>` : ""}
            <span class="connection-pill connection-${apiStatusUi.tone}">${icon(apiStatusUi.icon, "icon small")}${escapeHtml(apiStatusUi.label)}</span>
            ${authConfig?.supabase?.enabled && !authState?.hasSupabaseSession ? `<a class="button" href="#/auth">${icon("users")}Supabase Login</a>` : ""}
            ${authState?.hasSupabaseSession ? `<button class="button" id="sign-out-button" type="button">${icon("ban")}Abmelden</button>` : ""}
            <button class="icon-button" id="refresh-dashboard" type="button" title="Aktualisieren" aria-label="Aktualisieren">
              ${icon("refresh")}
            </button>
          </div>
        </header>
        <main class="view">
          ${loading ? `<div class="loading-banner">${icon("clock")}Daten werden geladen.</div>` : ""}
          ${notice ? `<div class="success-banner">${icon("check")}<span>${escapeHtml(notice)}</span></div>` : ""}
          ${warnings.length ? `<div class="warning-banner">${icon("alert")}<span>${escapeHtml(composeWarning(warnings))}</span></div>` : ""}
          ${error ? `<div class="error-banner">${icon("alert")}<span>${escapeHtml(error)}</span></div>` : ""}
          ${content}
        </main>
      </div>
    </div>
  `;
}

function groupNavItems(items) {
  const order = ["workspace", "operations"];
  return order
    .map((sectionKey) => ({
      key: sectionKey,
      label: sectionKey === "workspace" ? "Arbeitsbereiche" : "Betrieb",
      items: items.filter((item) => item.section === sectionKey),
    }))
    .filter((section) => section.items.length);
}

function navSection(section, active) {
  return `
    <div class="nav-section">
      <p class="nav-section-label">${escapeHtml(section.label)}</p>
      <div class="nav-section-links">
        ${section.items
          .map(
            (item) => `
              <a class="nav-link ${active === item.href ? "active" : ""}" href="${item.href}" ${active === item.href ? 'aria-current="page"' : ""}>
                ${icon(item.icon)}
                <span>${item.label}</span>
              </a>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function getApiStatusUi(apiStatus) {
  if (apiStatus === "connected") return { icon: "check", label: "API verbunden", tone: "success" };
  if (apiStatus === "degraded") return { icon: "alert", label: "API teilweise verfuegbar", tone: "warning" };
  if (apiStatus === "loading") return { icon: "clock", label: "API wird geprueft", tone: "pending" };
  if (apiStatus === "error") return { icon: "alert", label: "API Fehler", tone: "error" };
  return { icon: "clock", label: "API unbekannt", tone: "muted" };
}

function composeWarning(warnings) {
  if (warnings.length === 1) return warnings[0];
  return `${warnings.length} Datenbereiche sind aktuell nicht vollstaendig verfuegbar. ${warnings.slice(0, 2).join(" ")}`;
}
