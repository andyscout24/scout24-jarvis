const fallbackMethods = [
  "getTools",
  "getToolById",
  "getAutomations",
  "getOffers",
  "getOfferById",
  "getReports",
  "getReportById",
  "getLogs",
  "getUsers",
  "getUserById",
  "getUserByEmail",
  "getApiConnections",
  "getAutomationRuns",
  "getSettings",
  "getToolDetail",
  "updateTool",
  "insertLog",
  "createReport",
  "createOffer",
];

export function createResilientRepository(primaryRepository, fallbackRepository, {
  primaryMode = "supabase",
  fallbackMode = "json_file",
} = {}) {
  const state = {
    primaryMode,
    fallbackMode,
    activeMode: primaryMode,
    fallbackActive: false,
    lastFallbackAt: null,
    lastError: null,
  };

  const repository = {};

  for (const methodName of fallbackMethods) {
    const primaryMethod = primaryRepository[methodName];
    if (typeof primaryMethod !== "function") continue;

    repository[methodName] = async (...args) => {
      try {
        const result = await primaryMethod.apply(primaryRepository, args);
        clearFallbackState(state);
        return result;
      } catch (error) {
        const fallbackMethod = fallbackRepository[methodName];
        if (typeof fallbackMethod !== "function") throw error;

        recordFallbackState(state, error);
        return fallbackMethod.apply(fallbackRepository, args);
      }
    };
  }

  repository.getStorageStatus = () => ({ ...state });

  return repository;
}

function clearFallbackState(state) {
  state.activeMode = state.primaryMode;
  state.fallbackActive = false;
  state.lastError = null;
}

function recordFallbackState(state, error) {
  state.activeMode = state.fallbackMode;
  state.fallbackActive = true;
  state.lastFallbackAt = new Date().toISOString();
  state.lastError = serializeError(error);
}

function serializeError(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || "Unbekannter Fehler in der Primaerdatenquelle.",
  };
}
