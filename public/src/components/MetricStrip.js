import { escapeHtml } from "../utils.js";

export function MetricStrip(items) {
  return `
    <div class="metric-strip">
      ${items
        .map(
          (item) => `
            <div class="metric">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}
