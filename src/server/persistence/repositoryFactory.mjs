import { getRepositoryConfig, getSupabaseConfig } from "../config/env.mjs";
import { dbPath } from "../config/paths.mjs";
import { createDashboardRepository } from "./dashboardRepository.mjs";
import { createJsonStore } from "./jsonStore.mjs";
import { createSupabaseRepository } from "./supabaseRepository.mjs";

export function createRepository() {
  const repositoryConfig = getRepositoryConfig();

  if (repositoryConfig.mode === "supabase") {
    if (!repositoryConfig.supabaseConfigured) {
      throw new Error("DATA_REPOSITORY=supabase benoetigt SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.");
    }

    return {
      repository: createSupabaseRepository(getSupabaseConfig()),
      storageMode: "supabase",
    };
  }

  return {
    repository: createDashboardRepository(createJsonStore(dbPath)),
    storageMode: "json_file",
  };
}
