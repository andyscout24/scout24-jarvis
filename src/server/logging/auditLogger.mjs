import { LogLevels, isValidLogLevel } from "../../shared/contracts.mjs";

const sensitiveKeys = new Set([
  "apiKey",
  "api_key",
  "authorization",
  "bearer",
  "clientSecret",
  "client_secret",
  "password",
  "refreshToken",
  "refresh_token",
  "secret",
  "serviceRole",
  "service_role",
  "token",
]);

export function createActivityLog({
  toolId,
  tool_id,
  level,
  status = level || LogLevels.INFO,
  action = "activity.logged",
  message,
  actor = "Dashboard",
  user,
  metadata = undefined,
}) {
  const safeStatus = isValidLogLevel(status) ? status : LogLevels.INFO;
  const safeToolId = toolId || tool_id || null;
  const safeActor = actor || user || "Dashboard";
  const timestamp = new Date().toISOString();
  const safeMetadata = sanitizeMetadata(metadata);

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    actor: safeActor,
    user: user || safeActor,
    tool_id: safeToolId,
    toolId: safeToolId,
    action: String(action || "activity.logged"),
    status: safeStatus,
    level: safeStatus,
    message: String(message),
    metadata: safeMetadata,
    created_at: timestamp,
    createdAt: timestamp,
  };
}

export function createAuditLog(input) {
  return createActivityLog(input);
}

export function normalizeActivityLog(log) {
  const status = log.status || log.level || LogLevels.INFO;
  const safeStatus = isValidLogLevel(status) ? status : LogLevels.INFO;
  const createdAt = log.createdAt || log.created_at || log.timestamp || new Date().toISOString();
  const toolId = log.toolId || log.tool_id || null;
  const actor = log.actor || log.user || log.actor_label || "System";

  return {
    ...log,
    timestamp: log.timestamp || createdAt,
    actor,
    user: log.user || actor,
    tool_id: toolId,
    toolId,
    action: log.action || inferAction(log),
    status: safeStatus,
    level: safeStatus,
    message: String(log.message || "Aktivitaet protokolliert."),
    metadata: sanitizeMetadata(log.metadata),
    created_at: log.created_at || createdAt,
    createdAt,
  };
}

export function sanitizeMetadata(value) {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, item]) => [key, item && typeof item === "object" ? sanitizeMetadata(item) : item]),
  );
}

function isSensitiveKey(key) {
  const normalized = String(key)
    .replace(/[-_\s]/g, "")
    .toLowerCase();
  return sensitiveKeys.has(key) || ["apikey", "authorization", "bearer", "clientsecret", "password", "refreshtoken", "secret", "servicerole", "token"].includes(normalized);
}

function inferAction(log) {
  const message = String(log.message || "").toLowerCase();
  if (message.includes("angebot")) return "offer.created";
  if (message.includes("report")) return "report.created";
  if (message.includes("status")) return "tool.status_changed";
  if (message.includes("api")) return "api.connection_checked";
  return "activity.logged";
}
