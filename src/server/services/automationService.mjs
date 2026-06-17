import { LogLevels, isValidToolStatus, validToolStatuses } from "../../shared/contracts.mjs";
import { Permissions, canAccessTool, canReadAutomation, filterToolsForUser, requirePermission } from "../auth/permissions.mjs";
import { badRequest, notFound } from "../errors/apiError.mjs";
import { createAuditLog } from "../logging/auditLogger.mjs";
import { enrichTool, listPublicAutomationModules } from "../modules/registry.mjs";
import { sanitizeToolForClient } from "../security/publicPayload.mjs";

export function createAutomationService(repository) {
  return {
    async listTools(currentUser) {
      const tools = await repository.getTools();
      return filterToolsForUser(currentUser, tools.map(enrichTool)).map(sanitizeToolForClient);
    },

    async getToolDetail(toolId, currentUser) {
      const detail = await repository.getToolDetail(toolId);
      if (!detail) {
        throw notFound("tool_not_found", "Das angeforderte Tool wurde nicht gefunden.");
      }
      const enrichedTool = enrichTool(detail.tool);
      if (!canAccessTool(currentUser, enrichedTool)) {
        throw notFound("tool_not_found", "Das angeforderte Tool wurde nicht gefunden.");
      }

      return {
        ...detail,
        tool: sanitizeToolForClient(enrichedTool),
        logs: currentUser.role === "admin" ? detail.logs : [],
      };
    },

    async updateToolStatus(toolId, body, currentUser) {
      requirePermission(currentUser, Permissions.MANAGE_TOOL_STATUS, "Nur Admins koennen Tool-Status aendern.");
      if (!isValidToolStatus(body.status)) {
        throw badRequest("invalid_status", "Der Tool-Status ist ungueltig.", {
          allowed: Array.from(validToolStatuses),
        });
      }

      const tool = await repository.updateTool(toolId, async (currentTool, db) => {
        const previousStatus = currentTool.status;
        currentTool.status = body.status;
        currentTool.lastRunAt = new Date().toISOString();
        db.logs.unshift(
          createAuditLog({
            toolId: currentTool.id,
            level: body.status === "error" ? LogLevels.ERROR : LogLevels.INFO,
            action: "tool.status_changed",
            message: `${currentTool.name}: Status von ${previousStatus} auf ${body.status} geaendert.`,
            actor: currentUser.name,
            user: currentUser.name,
            metadata: {
              previousStatus,
              nextStatus: body.status,
            },
          }),
        );
      });
      if (!tool) {
        throw notFound("tool_not_found", "Das angeforderte Tool wurde nicht gefunden.");
      }
      return sanitizeToolForClient(enrichTool(tool));
    },

    async listAutomations(currentUser) {
      const [automations, tools] = await Promise.all([repository.getAutomations(), repository.getTools()]);
      const toolsById = new Map(tools.map((tool) => [tool.id, enrichTool(tool)]));
      return automations.filter((automation) => canReadAutomation(currentUser, automation, toolsById));
    },

    async getAutomationStatus(currentUser) {
      const [tools, automations, runs] = await Promise.all([
        repository.getTools(),
        repository.getAutomations(),
        repository.getAutomationRuns({ limit: 100 }),
      ]);
      const visibleTools = filterToolsForUser(currentUser, tools.map(enrichTool));
      const visibleToolIds = new Set(visibleTools.map((tool) => tool.id));
      const visibleAutomations = automations.filter((automation) => visibleToolIds.has(automation.toolId));
      const visibleRuns = runs.filter((run) => visibleToolIds.has(run.toolId));
      const activeTools = visibleTools.filter((tool) => tool.status !== "disabled");
      const errorTools = visibleTools.filter((tool) => tool.status === "error");
      const runningRuns = visibleRuns.filter((run) => run.status === "running" || run.status === "queued");
      const failedRuns = visibleRuns.filter((run) => run.status === "failed");

      return {
        tools: {
          total: visibleTools.length,
          active: activeTools.length,
          ready: visibleTools.filter((tool) => tool.status === "ready").length,
          inProgress: visibleTools.filter((tool) => tool.status === "in_progress").length,
          pendingConnection: visibleTools.filter((tool) => tool.status === "pending_connection").length,
          error: errorTools.length,
          disabled: visibleTools.filter((tool) => tool.status === "disabled").length,
        },
        automations: {
          total: visibleAutomations.length,
          enabled: visibleAutomations.filter((automation) => automation.enabled).length,
          disabled: visibleAutomations.filter((automation) => !automation.enabled).length,
        },
        runs: {
          total: visibleRuns.length,
          running: runningRuns.length,
          failed: failedRuns.length,
          lastRunAt: visibleRuns[0]?.startedAt || null,
        },
        health: errorTools.length ? "degraded" : "ok",
      };
    },

    async listModules() {
      return listPublicAutomationModules();
    },
  };
}
