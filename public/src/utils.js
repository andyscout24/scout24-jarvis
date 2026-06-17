import { icon } from "./icons.js";
import { LogLevels, ToolStatuses } from "./domain/constants.js";

export const statusLabels = {
  [ToolStatuses.READY]: "Ready",
  [ToolStatuses.IN_PROGRESS]: "In progress",
  [ToolStatuses.ERROR]: "Error",
  [ToolStatuses.DISABLED]: "Disabled",
  [ToolStatuses.PENDING_CONNECTION]: "Pending connection",
};

export const statusIcons = {
  [ToolStatuses.READY]: "check",
  [ToolStatuses.IN_PROGRESS]: "clock",
  [ToolStatuses.ERROR]: "alert",
  [ToolStatuses.DISABLED]: "ban",
  [ToolStatuses.PENDING_CONNECTION]: "link",
};

export const levelLabels = {
  [LogLevels.INFO]: "Info",
  [LogLevels.SUCCESS]: "Success",
  [LogLevels.WARNING]: "Warning",
  [LogLevels.ERROR]: "Error",
};

export function formatDateTime(value) {
  if (!value) return "Noch nicht gelaufen";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function newestFirst(items, field = "createdAt") {
  return [...items].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0));
}

export function toolMap(tools) {
  return Object.fromEntries(tools.map((tool) => [tool.id, tool]));
}

export function statusBadge(status) {
  const label = statusLabels[status] || status;
  const iconName = statusIcons[status] || "activity";
  return `<span class="status-badge status-${status}">${icon(iconName, "icon small")}${label}</span>`;
}

export function levelBadge(level) {
  const label = levelLabels[level] || level;
  const iconName = level === "success" ? "check" : level === "error" ? "alert" : level === "warning" ? "alert" : "activity";
  return `<span class="level-badge level-${level}">${icon(iconName, "icon small")}${label}</span>`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
