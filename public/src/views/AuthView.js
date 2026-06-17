import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function AuthView(authConfig, { error = "" } = {}) {
  const supabaseEnabled = Boolean(authConfig?.supabase?.enabled);

  return `
    <section class="auth-layout">
      <div class="auth-card">
        <div class="auth-card-header">
          <span class="eyebrow">Interner Zugriff</span>
          <h2 class="auth-title">Bitte anmelden</h2>
          <p class="auth-description">
            Melde dich mit deinem freigeschalteten Supabase-Account an, damit Rollen und Toolrechte serverseitig geprueft werden koennen.
          </p>
        </div>

        ${supabaseEnabled
          ? `<form id="auth-sign-in-form" class="auth-form">
              ${error ? `<div class="inline-form-error" role="alert">${icon("alert")}<span>${escapeHtml(error)}</span></div>` : ""}
              <label>
                <span>E-Mail</span>
                <input name="email" type="email" autocomplete="username" placeholder="vorname.nachname@firma.de" required>
              </label>
              <label>
                <span>Passwort</span>
                <input name="password" type="password" autocomplete="current-password" placeholder="Passwort" required>
              </label>
              <button class="button primary auth-submit" type="submit">
                ${icon("check")}
                <span>Anmelden</span>
              </button>
            </form>`
          : `<div class="empty-state auth-empty">
              ${icon("alert")}
              <div>
                <strong>Supabase Login ist noch nicht oeffentlich konfiguriert.</strong>
                <p>Setze die Public-Supabase-Variablen fuer URL und Publishable Key, damit sich Mitarbeiter direkt im Dashboard anmelden koennen.</p>
              </div>
            </div>`}

        <div class="auth-note">
          <span class="connection-pill">${icon("settings", "icon small")}Auth Mode: ${authConfig?.mode || "mock_header"}</span>
          <span class="connection-pill">${icon("database", "icon small")}Rollen kommen weiterhin aus der internen User-Tabelle</span>
        </div>
      </div>
    </section>
  `;
}
