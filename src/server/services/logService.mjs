import { isValidLogLevel, validLogLevels } from "../../shared/contracts.mjs";
import { canAccessTool } from "../auth/permissions.mjs";
import { badRequest, notFound } from "../errors/apiError.mjs";
import { createActivityLog } from "../logging/auditLogger.mjs";

export function createLogService(repository) {
  return {
    async listLogs({ toolId, tool_id, level, status, action, limit } = {}) {
      return repository.getLogs({ toolId, tool_id, level, status, action, limit });
    },

    async getActivityLogs({ toolId, tool_id, level, status, action, limit } = {}) {
      return repository.getLogs({ toolId, tool_id, level, status, action, limit });
    },

    async listActivityLogs(params = {}) {
      return this.getActivityLogs(params);
    },

    async getLogsByTool(toolId, { status, limit } = {}) {
      return repository.getLogs({ toolId, status, limit });
    },

    async getErrorLogs({ toolId, limit } = {}) {
      return repository.getLogs({ toolId, status: "error", limit });
    },

    async createLog(body, currentUser) {
      return this.createActivityLog(body, currentUser);
    },

    async createActivityLog(body, currentUser) {
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw badRequest("invalid_log", "Der Log-Eintrag muss ein JSON-Objekt sein.");
      }
      if (!body.message) {
        throw badRequest("invalid_log", "Ein Log-Eintrag braucht mindestens eine lesbare Nachricht.");
      }

      const toolId = body.toolId || body.tool_id || null;
      const status = body.status || body.level || "info";
      if (!isValidLogLevel(status)) {
        throw badRequest("invalid_log_status", "Der Log-Status ist ungueltig.", {
          allowed: Array.from(validLogLevels),
        });
      }

      const tool = toolId ? await repository.getToolById(toolId) : null;
      if (toolId && !tool) {
        throw notFound("tool_not_found", "Das Tool fuer den Log-Eintrag wurde nicht gefunden.");
      }
      if (tool && !canAccessTool(currentUser, tool)) {
        throw notFound("tool_not_found", "Das Tool fuer den Log-Eintrag wurde nicht gefunden.");
      }

      const log = createActivityLog({
        toolId,
        status,
        action: body.action || "activity.logged",
        message: body.message,
        actor: body.actor || body.user || currentUser.name,
        user: body.user || currentUser.name,
        metadata: body.metadata,
      });
      return repository.insertLog(log);
    },
  };
}
