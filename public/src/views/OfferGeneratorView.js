import { PageHeader } from "../components/PageHeader.js";
import { canCreateOffers } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { escapeHtml, formatCurrency, newestFirst } from "../utils.js";

export function OfferGeneratorView(data, currentUser) {
  const canEdit = canCreateOffers(currentUser);
  const latestOffers = newestFirst(data.offers.filter((offer) => offer.toolId === "offer-generator")).slice(0, 3);

  return `
    ${PageHeader({
      eyebrow: "Media Sales",
      title: "Angebotsgenerator",
      description: "Erfasse Kunden- und Kampagnenparameter links und erzeuge rechts eine hochwertige Angebotsvorschau fuer dein Sales-Team.",
      actions: latestOffers.length ? [{ label: "Letzte Angebote", href: "#/offers", icon: "file" }] : [],
    })}

    <section class="workspace-grid workspace-grid-2">
      <article class="surface-card surface-form-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Eingaben</p>
            <h3>Rahmendaten fuer das Angebot</h3>
          </div>
          <span class="surface-meta">${canEdit ? "Bearbeitbar" : "Nur Vorschau"}</span>
        </div>

        <form id="offer-generator-form" class="modern-form form-stack">
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>Kundenname</span>
              <input name="clientName" data-offer-preview="client" type="text" placeholder="z. B. Wohnbau Atlas GmbH" ${canEdit ? "" : "disabled"} required>
            </label>
            <label class="field">
              <span>Branche</span>
              <input name="industry" data-offer-preview="industry" type="text" placeholder="z. B. Immobilienentwicklung" ${canEdit ? "" : "disabled"}>
            </label>
          </div>

          <div class="field-grid field-grid-2">
            <label class="field">
              <span>Kampagnen-Budget</span>
              <input name="budget" data-offer-preview="budget" type="number" min="0" step="100" placeholder="15000" ${canEdit ? "" : "disabled"}>
            </label>
            <label class="field">
              <span>Laufzeit</span>
              <input name="runtime" data-offer-preview="runtime" type="text" placeholder="6 Wochen" ${canEdit ? "" : "disabled"}>
            </label>
          </div>

          <fieldset class="channel-fieldset">
            <legend>Kanalauswahl</legend>
            <div class="checkbox-grid">
              ${["ImmoScout24 Portal", "Meta Ads", "Instagram", "LinkedIn", "Newsletter", "Display Retargeting"]
                .map((channel, index) => `
                  <label class="checkbox-tile">
                    <input type="checkbox" name="channels" value="${escapeHtml(channel)}" data-offer-preview="channel"${index < 3 ? " checked" : ""} ${canEdit ? "" : "disabled"}>
                    <span>${escapeHtml(channel)}</span>
                  </label>
                `)
                .join("")}
            </div>
          </fieldset>

          <label class="field">
            <span>Ersteller</span>
            <input name="actor" type="text" value="${escapeHtml(currentUser?.name || "Dashboard User")}" ${canEdit ? "" : "disabled"}>
          </label>
        </form>
      </article>

      <article class="surface-card proposal-preview-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Live-Vorschau</p>
            <h3>Angebotsentwurf</h3>
          </div>
          <span class="status-chip status-chip-live">${icon("sparkles", "icon small")}Aktiv</span>
        </div>

        <div class="proposal-sheet">
          <div class="proposal-letterhead">
            <div>
              <strong>ImmoScout24 Austria</strong>
              <span>Media Sales Solutions</span>
            </div>
            <span class="proposal-id">Proposal</span>
          </div>

          <div class="proposal-body">
            <div class="proposal-summary">
              <div>
                <span class="proposal-label">Kunde</span>
                <strong id="offer-preview-client">Wohnbau Atlas GmbH</strong>
              </div>
              <div>
                <span class="proposal-label">Branche</span>
                <strong id="offer-preview-industry">Immobilienentwicklung</strong>
              </div>
              <div>
                <span class="proposal-label">Laufzeit</span>
                <strong id="offer-preview-runtime">6 Wochen</strong>
              </div>
            </div>

            <div class="proposal-channel-line">
              <span class="proposal-label">Kanaele</span>
              <div id="offer-preview-channels" class="inline-tag-list">
                <span class="inline-tag">ImmoScout24 Portal</span>
                <span class="inline-tag">Meta Ads</span>
                <span class="inline-tag">Instagram</span>
              </div>
            </div>

            <table class="pricing-table">
              <thead>
                <tr>
                  <th>Leistung</th>
                  <th>Anteil</th>
                  <th>Kosten</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Media Placement</td>
                  <td>60%</td>
                  <td id="offer-preview-media">${formatCurrency(9000)}</td>
                </tr>
                <tr>
                  <td>Creative & Setup</td>
                  <td>25%</td>
                  <td id="offer-preview-creative">${formatCurrency(3750)}</td>
                </tr>
                <tr>
                  <td>Optimierung & Reporting</td>
                  <td>15%</td>
                  <td id="offer-preview-ops">${formatCurrency(2250)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2">Gesamtbudget</td>
                  <td id="offer-preview-total">${formatCurrency(15000)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="surface-card-footer">
          <button class="button primary large-button" type="submit" form="offer-generator-form" ${canEdit ? "" : "disabled"}>
            ${icon("file")}Angebot generieren
          </button>
          <div class="mini-list">
            ${latestOffers.length
              ? latestOffers.map((offer) => `
                  <div class="mini-row">
                    <span>${escapeHtml(offer.clientName)}</span>
                    <strong>${formatCurrency(offer.amount, offer.currency)}</strong>
                  </div>
                `).join("")
              : `<div class="mini-row muted"><span>Keine Angebote erzeugt</span><strong>-</strong></div>`}
          </div>
        </div>
      </article>
    </section>
  `;
}
