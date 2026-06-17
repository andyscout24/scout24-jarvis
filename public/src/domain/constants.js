/**
 * @typedef {"ready" | "in_progress" | "error" | "disabled" | "pending_connection"} ToolStatus
 * @typedef {"info" | "success" | "warning" | "error"} LogLevel
 * @typedef {"admin" | "sales_user" | "marketing_user" | "management_viewer"} UserRole
 * @typedef {{ href: string, label: string, icon: string }} NavItem
 */

export const DASHBOARD_ACTOR = "Dashboard";
export const DEFAULT_USER_ID = "user-001";
export const CURRENT_USER_STORAGE_KEY = "social-jarvis.current-user-id";
export const SUPABASE_ACCESS_TOKEN_STORAGE_KEY = "social-jarvis.supabase-access-token";
export const SUPABASE_REFRESH_TOKEN_STORAGE_KEY = "social-jarvis.supabase-refresh-token";

export const ToolStatuses = Object.freeze({
  READY: "ready",
  IN_PROGRESS: "in_progress",
  ERROR: "error",
  DISABLED: "disabled",
  PENDING_CONNECTION: "pending_connection",
});

export const toolStatusOrder = Object.freeze([
  ToolStatuses.READY,
  ToolStatuses.IN_PROGRESS,
  ToolStatuses.PENDING_CONNECTION,
  ToolStatuses.ERROR,
  ToolStatuses.DISABLED,
]);

export const editableToolStatuses = Object.freeze([
  ToolStatuses.READY,
  ToolStatuses.IN_PROGRESS,
  ToolStatuses.ERROR,
  ToolStatuses.DISABLED,
]);

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

export const ResultTypes = Object.freeze({
  OFFER: "offer",
  REPORT: "report",
  ARTIFACT: "artifact",
});

export const roleLabels = Object.freeze({
  [Roles.ADMIN]: "Admin",
  [Roles.SALES_USER]: "Sales User",
  [Roles.MARKETING_USER]: "Marketing User",
  [Roles.MANAGEMENT_VIEWER]: "Management Viewer",
});
