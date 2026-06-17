/**
 * @typedef {"ready" | "in_progress" | "error" | "disabled" | "pending_connection"} ToolStatus
 * @typedef {"info" | "success" | "warning" | "error"} LogLevel
 * @typedef {"admin" | "sales_user" | "marketing_user" | "management_viewer"} UserRole
 */

export const ToolStatuses = Object.freeze({
  READY: "ready",
  IN_PROGRESS: "in_progress",
  ERROR: "error",
  DISABLED: "disabled",
  PENDING_CONNECTION: "pending_connection",
});

export const LogLevels = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
});

export const Roles = Object.freeze({
  ADMIN: "admin",
  SALES_USER: "sales_user",
  MARKETING_USER: "marketing_user",
  MANAGEMENT_VIEWER: "management_viewer",
});

export const Permissions = Object.freeze({
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_TOOLS: "view_tools",
  VIEW_OFFERS: "view_offers",
  CREATE_OFFERS: "create_offers",
  VIEW_REPORTS: "view_reports",
  CREATE_REPORTS: "create_reports",
  VIEW_LOGS: "view_logs",
  MANAGE_TOOL_STATUS: "manage_tool_status",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_API_CONNECTIONS: "manage_api_connections",
  VIEW_USERS: "view_users",
});

export const ModuleCapabilities = Object.freeze({
  LAUNCH: "launch",
  STATUS: "status",
  RESULTS: "results",
  LOGS: "logs",
  HEALTH: "health",
  CONFIGURE: "configure",
  GENERATE: "generate",
});

export const ResultTypes = Object.freeze({
  OFFER: "offer",
  REPORT: "report",
  ARTIFACT: "artifact",
});

export const validToolStatuses = new Set(Object.values(ToolStatuses));
export const validLogLevels = new Set(Object.values(LogLevels));
export const validRoles = new Set(Object.values(Roles));

export function isValidToolStatus(status) {
  return validToolStatuses.has(status);
}

export function isValidLogLevel(level) {
  return validLogLevels.has(level);
}
