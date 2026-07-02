import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function ReportGeneratorForm({ tool, dataSources = [] }) {
  const disabled = tool?.status === "disabled";
  return `
    <form class="tool-form" id="report-generator-form" aria-label="Neuen Report erstellen">
      <div class="form-grid">
        <label>
          <span>Kunde</span>
          <input name="clientName" type="text" placeholder="z. B. Musterkunde GmbH" required ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Kampagne</span>
          <input name="campaignName" type="text" placeholder="z. B. Q2 Immobilienkampagne" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Zeitraum</span>
          <input name="reportingPeriod" type="text" placeholder="z. B. Mai 2026" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Kanal</span>
          <select name="channel" ${disabled ? "disabled" : ""}>
            <option value="Alle Kanaele">Alle Kanaele</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="TikTok">TikTok</option>
            <option value="Social">Social</option>
          </select>
        </label>
        <label>
          <span>Report-Typ</span>
          <select name="reportType" ${disabled ? "disabled" : ""}>
            <option value="weekly_social">Weekly Social Report</option>
            <option value="monthly_social">Monthly Social Report</option>
            <option value="performance_summary">Performance Summary</option>
            <option value="management_overview">Management Overview</option>
            <option value="campaign_review">Campaign Review</option>
          </select>
        </label>
        <label>
          <span>Datenquelle</span>
          <select name="dataSource" ${disabled ? "disabled" : ""}>
            ${dataSources.map((source) => sourceOption(source)).join("")}
          </select>
        </label>
        <label>
          <span>Startdatum</span>
          <input name="startDate" type="date" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Enddatum</span>
          <input name="endDate" type="date" ${disabled ? "disabled" : ""}>
        </label>
        <label class="form-grid-span-2">
          <span>Input-Pfad (optional)</span>
          <input name="inputPath" type="text" placeholder="leer lassen fuer Standarddaten im social_reporting Projekt" ${disabled ? "disabled" : ""}>
        </label>
        <label>
          <span>Ersteller</span>
          <input name="actor" type="text" value="Dashboard" ${disabled ? "disabled" : ""}>
        </label>
      </div>
      <div class="form-actions">
        <button class="button primary" type="submit" ${disabled ? "disabled" : ""}>
          ${icon("play")} ${disabled ? "Tool deaktiviert" : "Report erstellen"}
        </button>
        <span class="form-note">${escapeHtml(tool?.integration?.serviceName || "social_reporting")}</span>
      </div>
    </form>
  `;
}

function sourceOption(source) {
  const suffix = source.state === "pending_connection" ? " (pending)" : source.state === "external_reference_detected" ? " (extern)" : "";
  return `<option value="${escapeHtml(source.id)}">${escapeHtml(source.label)}${suffix}</option>`;
}
