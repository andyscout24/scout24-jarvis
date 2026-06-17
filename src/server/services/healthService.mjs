import { getHealthConfigSummary } from "../config/env.mjs";

export function createHealthService(repository, { serviceName, storageMode } = {}) {
  return {
    async getHealth() {
      const config = getHealthConfigSummary();
      const timestamp = new Date().toISOString();

      try {
        const [tools, apiConnections] = await Promise.all([
          repository.getTools(),
          repository.getApiConnections(),
        ]);

        return {
          status: "ok",
          service: serviceName,
          timestamp,
          ...config,
          checks: {
            storage: {
              status: "ok",
              mode: storageMode || config.storage.mode,
              toolCount: tools.length,
            },
            tools: {
              total: tools.length,
              error: tools.filter((tool) => tool.status === "error").length,
              disabled: tools.filter((tool) => tool.status === "disabled").length,
            },
            apiConnections: {
              total: apiConnections.length,
              pending: apiConnections.filter((connection) => connection.config?.state === "pending_connection").length,
              unknown: apiConnections.filter((connection) => connection.status === "unknown").length,
            },
          },
        };
      } catch (error) {
        return {
          status: "error",
          service: serviceName,
          timestamp,
          ...config,
          checks: {
            storage: {
              status: "error",
              mode: storageMode || config.storage.mode,
              message: "Die Dashboard-Datenquelle konnte nicht gelesen werden.",
            },
          },
        };
      }
    },
  };
}
