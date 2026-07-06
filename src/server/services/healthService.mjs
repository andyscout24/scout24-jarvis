import { getHealthConfigSummary } from "../config/env.mjs";
import { getIntegrationReadinessSummary } from "../modules/integrationReadiness.mjs";

export function createHealthService(repository, { serviceName, storageMode } = {}) {
  return {
    async getHealth() {
      const config = getHealthConfigSummary();
      const timestamp = new Date().toISOString();
      const storageStatus = repository.getStorageStatus?.() || null;
      const integrationReadiness = await getIntegrationReadinessSummary();

      try {
        const [tools, apiConnections] = await Promise.all([
          repository.getTools(),
          repository.getApiConnections(),
        ]);

        const activeMode = storageStatus?.activeMode || storageMode || config.storage.mode;
        const fallbackActive = Boolean(storageStatus?.fallbackActive);

        return {
          status: "ok",
          service: serviceName,
          timestamp,
          ...config,
          checks: {
            storage: {
              status: fallbackActive ? "fallback" : "ok",
              mode: activeMode,
              primaryMode: storageStatus?.primaryMode || storageMode || config.storage.mode,
              fallbackActive,
              lastFallbackAt: storageStatus?.lastFallbackAt || null,
              message: fallbackActive
                ? "Die Primaerdatenquelle war nicht erreichbar. Das Dashboard nutzt lokal den JSON-Fallback."
                : undefined,
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
            externalTools: integrationReadiness,
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
              mode: storageStatus?.activeMode || storageMode || config.storage.mode,
              primaryMode: storageStatus?.primaryMode || storageMode || config.storage.mode,
              fallbackActive: Boolean(storageStatus?.fallbackActive),
              message: "Die Dashboard-Datenquelle konnte nicht gelesen werden.",
            },
            externalTools: integrationReadiness,
          },
        };
      }
    },
  };
}
