import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function OfferGeneratorForm(tool) {
  const disabled = tool?.status === "disabled";
  return `
    <form class="tool-form" id="offer-generator-form" aria-label="Neues Angebot erstellen">
      <div class="form-grid">
        <label>
          <span>Kunde</span>
          <input name="clientName" type="text" placeholder="z. B. Musterkunde GmbH" required ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Branche</span>
          <input name="industry" type="text" placeholder="z. B. Real Estate" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Budget</span>
          <input name="budget" type="number" min="0" step="100" placeholder="12000" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Waehrung</span>
          <select name="currency" ${disabled ? "disabled" : ""}>
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>
          <span>Laufzeit</span>
          <input name="runtime" type="text" placeholder="z. B. 3 Monate" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Ersteller</span>
          <input name="actor" type="text" value="Dashboard" ${disabled ? "disabled" : ""}>
        </label>
      </div>
      <div class="form-actions">
        <button class="button primary" type="submit" ${disabled ? "disabled" : ""}>
          ${icon("file")} ${disabled ? "Tool deaktiviert" : "Neues Angebot erstellen"}
        </button>
        <span class="form-note">${escapeHtml(tool?.integration?.adapter || "dashboard-offer-generator-wrapper")}</span>
      </div>
    </form>
  `;
}
