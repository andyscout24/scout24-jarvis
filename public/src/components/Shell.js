import { canAccessHref, roleLabels } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { navItems } from "../modules/navigation.js";
import { escapeHtml } from "../utils.js";

export function Shell({ active, title, content, error, warnings = [], notice, loading, currentUser, authState, authConfig, apiStatus = "unknown" }) {
  const visibleNavItems = navItems.filter((item) => canAccessHref(currentUser, item.href));
  const navSections = groupNavItems(visibleNavItems);
  const apiStatusUi = getApiStatusUi(apiStatus);
  const initials = getInitials(currentUser?.name || "SJ");

  return `
    <div class="saas-shell">
      <aside class="saas-sidebar">
        <div class="sidebar-top">
          <a class="brand-block" href="#/offers" aria-label="Social Jarvis Dashboard">
            <span class="brand-mark">
              <img src="/assets/automation-flow.svg" alt="">
            </span>
            <span>
              <span class="brand-title">Social Jarvis</span>
              <span class="brand-subtitle">ImmoScout24 Austria Team</span>
            </span>
          </a>
          <nav class="sidebar-nav" aria-label="Hauptnavigation">
            ${navSections.map((section) => navSection(section, active)).join("")}
          </nav>
        </div>

        <div class="sidebar-footer">
          <a class="sidebar-settings-link" href="#/settings">
            ${icon("settings")}
            <span>Einstellungen</span>
          </a>
          <div class="profile-card">
            <span class="profile-avatar">${escapeHtml(initials)}</span>
            <div class="profile-copy">
              <strong>${escapeHtml(currentUser?.name || "Teammitglied")}</strong>
              <span>${escapeHtml(currentUser ? (roleLabels[currentUser.role] || currentUser.role) : "Interner Zugriff")}</span>
            </div>
          </div>
        </div>
      </aside>
      <div class="saas-main">
        <header class="workspace-topbar">
          <div class="workspace-title">
            <p class="workspace-kicker">Interne Tool Suite</p>
            <h1>${escapeHtml(title)}</h1>
          </div>
          <div class="workspace-actions">
            <span class="connection-pill connection-${apiStatusUi.tone}">${icon(apiStatusUi.icon, "icon small")}${escapeHtml(apiStatusUi.label)}</span>
            ${authConfig?.supabase?.enabled && !authState?.hasSupabaseSession ? `<a class="button subtle" href="#/auth">${icon("users")}Anmelden</a>` : ""}
            ${authState?.hasSupabaseSession ? `<button class="button subtle" id="sign-out-button" type="button">${icon("ban")}Abmelden</button>` : ""}
            <button class="icon-button" id="refresh-dashboard" type="button" title="Aktualisieren" aria-label="Aktualisieren">
              ${icon("refresh")}
            </button>
          </div>
        </header>
        <main class="workspace-content">
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
  const order = ["media-sales", "social-media"];
  return order
    .map((sectionKey) => ({
      key: sectionKey,
      label: sectionKey === "media-sales" ? "Media Sales" : "Social Media",
      items: items.filter((item) => item.section === sectionKey),
    }))
    .filter((section) => section.items.length);
}

function navSection(section, active) {
  return `
    <div class="sidebar-group">
      <p class="sidebar-group-label">${escapeHtml(section.label)}</p>
      <div class="sidebar-group-links">
        ${section.items
          .map(
            (item) => `
              <a class="sidebar-link ${active === item.href ? "active" : ""}" href="${item.href}" ${active === item.href ? 'aria-current="page"' : ""}>
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

function getInitials(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "SJ";
}
