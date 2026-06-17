import { icon } from "../icons.js";
import { escapeHtml, formatNumber } from "../utils.js";

export function StatCard({ label, value, note, iconName = "activity", tone = "neutral" }) {
  return `
    <article class="stat-card stat-${tone}">
      <div class="stat-label">${icon(iconName, "icon small")}${escapeHtml(label)}</div>
      <div class="stat-value">${formatNumber(value)}</div>
      <div class="stat-note">${escapeHtml(note)}</div>
    </article>
  `;
}
