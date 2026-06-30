import { getAppEnvironment, getRepositoryConfig, getSupabaseConfig } from "../config/env.mjs";
import { dbPath } from "../config/paths.mjs";
import { createDashboardRepository } from "./dashboardRepository.mjs";
import { createJsonStore } from "./jsonStore.mjs";
import { createResilientRepository } from "./resilientRepository.mjs";
import { createSupabaseRepository } from "./supabaseRepository.mjs";

export function createRepository() {
  const repositoryConfig = getRepositoryConfig();
  const appEnvironment = getAppEnvironment();
  const jsonRepository = createDashboardRepository(createJsonStore(dbPath));

  if (repositoryConfig.mode === "supabase") {
    if (!repositoryConfig.supabaseConfigured) {
      throw new Error("DATA_REPOSITORY=supabase benoetigt SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabaseRepository = createSupabaseRepository(getSupabaseConfig());
    const allowJsonFallback = appEnvironment.appEnv !== "production";

    return {
      repository: allowJsonFallback
        ? createResilientRepository(supabaseRepository, jsonRepository, {
          primaryMode: "supabase",
          fallbackMode: "json_file",
        })
        : withStorageStatus(supabaseRepository, {
          primaryMode: "supabase",
          fallbackMode: "json_file",
          activeMode: "supabase",
          fallbackActive: false,
          lastFallbackAt: null,
          lastError: null,
        }),
      storageMode: allowJsonFallback ? "supabase_with_json_fallback" : "supabase",
    };
  }

  return {
    repository: withStorageStatus(jsonRepository, {
      primaryMode: "json_file",
      fallbackMode: "json_file",
      activeMode: "json_file",
      fallbackActive: false,
      lastFallbackAt: null,
      lastError: null,
    }),
    storageMode: "json_file",
  };
}

function withStorageStatus(repository, status) {
  return {
    ...repository,
    getStorageStatus() {
      return { ...status };
    },
  };
}
