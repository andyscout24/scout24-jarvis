import { canAccessHref, roleLabels } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { navItems } from "../modules/navigation.js";
import { escapeHtml } from "../utils.js";

export function Shell({ active, title, content, error, notice, loading, currentUser, authState, authConfig }) {
  const visibleNavItems = navItems.filter((item) => canAccessHref(currentUser, item.href));

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/" aria-label="Social Jarvis Dashboard">
          <img src="/assets/automation-flow.svg" alt="">
          <span>
            <span class="brand-title">Social Jarvis</span>
            <span class="brand-subtitle">Automation Dashboard</span>
          </span>
        </a>
        <nav class="nav" aria-label="Hauptnavigation">
          ${visibleNavItems
            .map(
              (item) => `
                <a class="nav-link ${active === item.href ? "active" : ""}" href="${item.href}">
                  ${icon(item.icon)}
                  <span>${item.label}</span>
                </a>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <div class="main-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Social Jarvis</p>
            <h1>${escapeHtml(title)}</h1>
          </div>
          <div class="topbar-actions">
            ${currentUser ? `<span class="connection-pill">${icon("users", "icon small")}${escapeHtml(currentUser.name)} - ${escapeHtml(roleLabels[currentUser.role] || currentUser.role)}</span>` : ""}
            <span class="connection-pill">${icon("check", "icon small")}API verbunden</span>
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
          ${error ? `<div class="error-banner">${icon("alert")}<span>${escapeHtml(error)}</span></div>` : ""}
          ${content}
        </main>
      </div>
    </div>
  `;
}
