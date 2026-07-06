const env = process.env;

export function applyEnvironmentOverrides(overrides = {}) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      env[key] = String(value);
    }
  }
}

const integrationRequirements = [
  {
    id: "campaign_review",
    label: "Campaign Review FastAPI",
    required: ["CAMPAIGN_REVIEW_BASE_URL"],
  },
  {
    id: "social_reporting_api",
    label: "Social Reporting Internal API",
    required: ["SOCIAL_REPORTING_API_BASE_URL"],
    optional: ["SOCIAL_REPORTING_API_TOKEN"],
  },
  {
    id: "swat_io",
    label: "Swat.io",
    required: ["SWATIO_BASE_URL", "SWATIO_API_KEY"],
  },
  {
    id: "meta_api",
    label: "Meta API",
    required: ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN"],
  },
  {
    id: "google_sheets",
    label: "Google Sheets",
    required: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"],
  },
  {
    id: "openai",
    label: "OpenAI",
    required: ["OPENAI_API_KEY"],
  },
  {
    id: "supabase",
    label: "Supabase",
    required: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    optional: ["SUPABASE_ANON_KEY"],
  },
];

const reportingSourceToIntegration = {
  fastapi_campaign_review: "campaign_review",
  swat_io: "swat_io",
  meta_api: "meta_api",
  google_sheets: "google_sheets",
};

export function getRepositoryConfig() {
  const requestedMode = (env.DATA_REPOSITORY || "json").toLowerCase();
  const supabaseConfigured = hasEnv("SUPABASE_URL") && hasEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (requestedMode === "supabase") {
    return {
      mode: "supabase",
      requestedMode,
      supabaseConfigured,
    };
  }

  if (requestedMode === "auto" && supabaseConfigured) {
    return {
      mode: "supabase",
      requestedMode,
      supabaseConfigured,
    };
  }

  return {
    mode: "json_file",
    requestedMode,
    supabaseConfigured,
  };
}

export function getSupabaseConfig() {
  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    schema: env.SUPABASE_SCHEMA || "public",
  };
}

export function getPublicAuthConfig() {
  const authMode = normalizeAuthMode(env.AUTH_MODE || "mock_header");
  const supabaseModeEnabled = authMode === "supabase";
  const url = supabaseModeEnabled ? (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "") : "";
  const publishableKey = supabaseModeEnabled ? (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "") : "";

  return {
    mode: authMode,
    allowMockHeader: authMode !== "supabase",
    allowSupabaseToken: supabaseModeEnabled && hasEnv("SUPABASE_URL") && hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabase: {
      enabled: supabaseModeEnabled && Boolean(url && publishableKey),
      url,
      publishableKey,
      passwordSignInEnabled: supabaseModeEnabled && Boolean(url && publishableKey),
    },
  };
}

export function getAppEnvironment() {
  return {
    appEnv: env.APP_ENV || env.NODE_ENV || "development",
    nodeEnv: env.NODE_ENV || "development",
    authMode: normalizeAuthMode(env.AUTH_MODE || "mock_header"),
    publicBaseUrlConfigured: hasEnv("PUBLIC_BASE_URL"),
  };
}

export function getStorageEnvironment() {
  const repositoryConfig = getRepositoryConfig();
  return {
    mode: repositoryConfig.mode,
    requestedMode: repositoryConfig.requestedMode,
    dataFileConfigured: hasEnv("DATA_FILE_PATH"),
    databaseUrlConfigured: hasEnv("DATABASE_URL"),
    supabaseUrlConfigured: hasEnv("SUPABASE_URL"),
    supabaseServiceRoleConfigured: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseSchema: env.SUPABASE_SCHEMA || "public",
    migrationsAvailable: true,
  };
}

export function getIntegrationEnvStatus(id) {
  const definition = integrationRequirements.find((item) => item.id === id);
  if (!definition) return null;

  const missing = definition.required.filter((key) => !hasEnv(key));
  const optionalMissing = (definition.optional || []).filter((key) => !hasEnv(key));

  return {
    id: definition.id,
    label: definition.label,
    configured: missing.length === 0,
    missing,
    optionalMissing,
  };
}

export function getReportingSourceEnvStatus(sourceId) {
  const internalApiStatus = getIntegrationEnvStatus("social_reporting_api");
  if (internalApiStatus?.configured && ["file", "combined", "swat_io", "meta_api"].includes(sourceId)) {
    return {
      ...internalApiStatus,
      id: sourceId,
      label: `Reporting via ${internalApiStatus.label}`,
    };
  }
  const integrationId = reportingSourceToIntegration[sourceId];
  return integrationId ? getIntegrationEnvStatus(integrationId) : null;
}

export function listIntegrationEnvStatus() {
  return integrationRequirements.map((definition) => getIntegrationEnvStatus(definition.id));
}

export function getHealthConfigSummary() {
  return {
    environment: getAppEnvironment(),
    storage: getStorageEnvironment(),
    integrations: listIntegrationEnvStatus(),
    runtime: {
      nodeVersion: process.version,
    },
  };
}

function hasEnv(key) {
  return typeof env[key] === "string" && env[key].trim().length > 0;
}

function normalizeAuthMode(value) {
  const normalized = String(value || "mock_header").trim().toLowerCase();
  if (normalized === "supabase") return "supabase";
  if (normalized === "hybrid") return "hybrid";
  return "mock_header";
}
