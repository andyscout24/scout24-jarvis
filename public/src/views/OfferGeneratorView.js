import { EmptyState } from "../components/EmptyState.js";
import { OfferGeneratorForm } from "../components/OfferGeneratorForm.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatCard } from "../components/StatCard.js";
import { icon } from "../icons.js";
import { describeResult } from "../modules/results/resultTypes.js";
import { escapeHtml, formatDateTime, newestFirst, statusBadge } from "../utils.js";

export function OfferGeneratorView(data) {
  const tool = data.tools.find((item) => item.id === "offer-generator");
  const offers = newestFirst(data.offers.filter((offer) => offer.toolId === "offer-generator"));

  return `
    ${PageHeader({
      eyebrow: "Sales",
      title: "Angebotsgenerator",
      description: "Erstelle standardisierte Angebote und finde zuletzt generierte Angebotsdateien schnell wieder.",
      actions: [
        { label: "Neues Angebot erstellen", href: "#/offers", icon: "file", primary: true },
        { label: "Alle Tools", href: "#/tools", icon: "boxes" },
      ],
    })}

    <section class="summary-grid">
      ${StatCard({ label: "Tool Status", value: tool?.status === "ready" ? 1 : 0, note: tool?.status || "unbekannt", iconName: "check", tone: tool?.status === "ready" ? "green" : "amber" })}
      ${StatCard({ label: "Angebote", value: offers.length, note: "im Ergebnisindex", iconName: "file", tone: "teal" })}
      ${StatCard({ label: "Runs heute", value: tool?.metrics?.runsToday || 0, note: "laut Tool Registry", iconName: "play", tone: "blue" })}
      ${StatCard({ label: "Fehler", value: data.logs.filter((log) => log.toolId === "offer-generator" && log.level === "error").length, note: "letzte Aktivitaeten", iconName: "alert", tone: "red" })}
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Integration</h2>
            <p class="panel-subtitle">${escapeHtml(tool?.integration?.state || "ready")}</p>
          </div>
          ${statusBadge(tool?.status || "disabled")}
        </div>
        <div class="integration-list">
          <div class="integration-row">
            <div>
              <p class="integration-title">Startpunkt</p>
              <p class="integration-meta">${tool?.externalUrl ? "Externer Angebotsgenerator" : "Dashboard-Modul vorbereitet"}</p>
            </div>
            ${icon("external")}
          </div>
          <div class="integration-row">
            <div>
              <p class="integration-title">Kategorie</p>
              <p class="integration-meta">Sales</p>
            </div>
            ${icon("file")}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Neues Angebot</h2>
            <p class="panel-subtitle">Wrapper fuer den ready Angebotsgenerator</p>
          </div>
        </div>
        ${OfferGeneratorForm(tool)}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Letzte generierte Angebote</h2>
          <p class="panel-subtitle">${offers.length} Angebote gefunden</p>
        </div>
      </div>
      ${offers.length ? offerTable(offers) : EmptyState({ title: "Keine Angebote", message: "Neue Angebote erscheinen nach dem ersten Lauf automatisch hier.", iconName: "file" })}
    </section>
  `;
}

function offerTable(offers) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kunde</th>
            <th>Branche</th>
            <th>Status</th>
            <th>Betrag</th>
            <th>Laufzeit</th>
            <th>Erstellt</th>
            <th>Datei</th>
          </tr>
        </thead>
        <tbody>
          ${offers
            .map((offer) => {
              const result = describeResult(offer);
              return `
                <tr>
                  <td><strong>${escapeHtml(offer.clientName)}</strong><span>${escapeHtml(offer.offerNumber || offer.id)}</span></td>
                  <td>${escapeHtml(offer.industry || offer.metadata?.industry || "-")}</td>
                  <td>${statusBadge(result.ready ? "ready" : "in_progress")}</td>
                  <td>${escapeHtml(result.title.split(" - ")[1] || "-")}</td>
                  <td>${escapeHtml(offer.runtime || offer.metadata?.runtime || "-")}</td>
                  <td>${formatDateTime(offer.createdAt)}</td>
                  <td class="mono">${escapeHtml(offer.fileName || "-")}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
