import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

export function PageHeader({ eyebrow, title, description, actions = [] }) {
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2 class="page-title">${escapeHtml(title)}</h2>
        ${description ? `<p class="page-description">${escapeHtml(description)}</p>` : ""}
      </div>
      ${actions.length ? `<div class="page-actions">${actions.map(actionButton).join("")}</div>` : ""}
    </section>
  `;
}

function actionButton(action) {
  const href = action.href || "#/";
  const className = action.primary ? "button primary" : "button";
  const target = action.external ? ' target="_blank" rel="noreferrer"' : "";
  return `<a class="${className}" href="${escapeHtml(href)}"${target}>${icon(action.icon || "chevron")}${escapeHtml(action.label)}</a>`;
}
