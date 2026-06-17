import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function EmptyState({ title, message, iconName = "database" }) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon(iconName)}</div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}
