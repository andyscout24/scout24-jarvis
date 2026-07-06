import { api } from "../api.js";
import {
  canManageSettings,
  canViewLogs,
  canViewOffers,
  canViewReports,
} from "../auth/permissions.js";

const emptyDashboardData = Object.freeze({
  tools: [],
  logs: [],
  automations: [],
  offers: [],
  reports: [],
  reportingSnapshot: null,
  plannerOverview: null,
  users: [],
  apiConnections: [],
  settings: [],
  meta: {
    warnings: [],
    sources: {},
    partial: false,
    loadedAt: null,
  },
});

export async function loadDashboardData() {
  const authConfig = await api.getAuthConfig();
  const authPayload = await api.getCurrentUser();
  const currentUser = authPayload.user;

  const resourceDefinitions = [
    { key: "tools", label: "Tools", loader: () => api.getTools(), pick: (payload) => payload.tools || [] },
    { key: "automations", label: "Automationen", loader: () => api.getAutomations(), pick: (payload) => payload.automations || [] },
    {
      key: "offers",
      label: "Angebote",
      enabled: canViewOffers(currentUser),
      loader: () => api.getOffers(),
      pick: (payload) => payload.offers || [],
    },
    {
      key: "reports",
      label: "Reports",
      enabled: canViewReports(currentUser),
      loader: () => api.getReports(),
      pick: (payload) => payload.reports || [],
    },
    {
      key: "reportingSnapshot",
      label: "Live Reporting Snapshot",
      enabled: canViewReports(currentUser),
      loader: () => api.getLiveReportingSnapshot({ source: "combined" }),
      pick: (payload) => payload.snapshot || null,
    },
    {
      key: "plannerOverview",
      label: "Redaktionsplan",
      enabled: currentUser?.role === "admin" || currentUser?.role === "marketing_user",
      loader: () => api.getEditorialPlannerOverview(),
      pick: (payload) => payload.planner || null,
    },
    {
      key: "logs",
      label: "Activity Logs",
      enabled: canViewLogs(currentUser),
      loader: () => api.getLogs(50),
      pick: (payload) => payload.logs || payload.activityLogs || [],
    },
    {
      key: "users",
      label: "User",
      enabled: canManageSettings(currentUser),
      loader: () => api.getUsers(),
      pick: (payload) => payload.users || [],
    },
    {
      key: "apiConnections",
      label: "API-Verbindungen",
      enabled: canManageSettings(currentUser),
      loader: () => api.getApiConnections(),
      pick: (payload) => payload.apiConnections || [],
    },
    {
      key: "settings",
      label: "Settings",
      enabled: canManageSettings(currentUser),
      loader: () => api.getSettings(),
      pick: (payload) => payload.settings || [],
    },
  ];

  const settled = await Promise.all(resourceDefinitions.map((resource) => loadResource(resource)));

  const data = getEmptyDashboardData();
  data.meta.loadedAt = new Date().toISOString();

  for (const resource of settled) {
    data[resource.key] = resource.items;
    data.meta.sources[resource.key] = {
      label: resource.label,
      status: resource.status,
      message: resource.message,
    };
    if (resource.status === "error") {
      data.meta.partial = true;
      data.meta.warnings.push(resource.message);
    }
  }

  return {
    authConfig,
    currentUser,
    data,
  };
}

async function loadResource(resource) {
  if (resource.enabled === false) {
    return {
      key: resource.key,
      label: resource.label,
      items: [],
      status: "skipped",
      message: "",
    };
  }

  try {
    const payload = await resource.loader();
    return {
      key: resource.key,
      label: resource.label,
      items: resource.pick(payload),
      status: "ready",
      message: "",
    };
  } catch {
    return {
      key: resource.key,
      label: resource.label,
      items: [],
      status: "error",
      message: `${resource.label} konnten nicht geladen werden.`,
    };
  }
}

export function getEmptyDashboardData() {
  return {
    tools: [],
    logs: [],
    automations: [],
    offers: [],
    reports: [],
    reportingSnapshot: null,
    plannerOverview: null,
    users: [],
    apiConnections: [],
    settings: [],
    meta: {
      warnings: [],
      sources: {},
      partial: false,
      loadedAt: null,
    },
  };
}
