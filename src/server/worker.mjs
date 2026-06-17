import { createWorkerFetchHandler } from "./app.mjs";
import { applyEnvironmentOverrides } from "./config/env.mjs";

let cachedHandler = null;
let cachedKey = "";

export default {
  async fetch(request, env) {
    applyEnvironmentOverrides(env);

    const nextKey = JSON.stringify({
      authMode: env.AUTH_MODE,
      repository: env.DATA_REPOSITORY,
      supabaseUrl: env.SUPABASE_URL,
      publicBaseUrl: env.PUBLIC_BASE_URL,
    });

    if (!cachedHandler || cachedKey !== nextKey) {
      cachedHandler = createWorkerFetchHandler();
      cachedKey = nextKey;
    }

    return cachedHandler(request, env);
  },
};
