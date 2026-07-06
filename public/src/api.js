import { DASHBOARD_ACTOR } from "./domain/constants.js";
import {
  clearSupabaseSession,
  getAccessToken,
  getCurrentUserId,
  setCurrentUserId,
  setSupabaseSession,
} from "./auth/session.js";

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;
  const accessToken = getAccessToken();
  const response = await fetch(path, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : { "X-User-Id": getCurrentUserId() }),
      ...headers,
    },
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    throw apiErrorFromPayload(payload, response.status);
  }
  if (payload && payload.success === false) {
    throw apiErrorFromPayload(payload, response.status);
  }
  return payload?.success === true ? payload.data : payload;
}

function buildAuthHeaders(extraHeaders = {}) {
  const accessToken = getAccessToken();
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : { "X-User-Id": getCurrentUserId() }),
    ...extraHeaders,
  };
}

function apiErrorFromPayload(payload, status) {
  const error = payload?.error || {};
  return new ApiError(
    error.message || "API-Anfrage fehlgeschlagen.",
    status,
    error.code || "api_error",
    error.details,
  );
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  setCurrentUserId,
  getCurrentUserId,
  async getAuthConfig() {
    return request("/api/auth/config");
  },
  async getCurrentUser() {
    return request("/api/auth/me");
  },
  async signInWithSupabase({ email, password, authConfig }) {
    const url = authConfig?.supabase?.url;
    const publishableKey = authConfig?.supabase?.publishableKey;
    if (!url || !publishableKey) {
      throw new ApiError("Supabase Login ist noch nicht vollstaendig konfiguriert.", 400, "supabase_auth_not_configured");
    }

    const response = await fetch(`${String(url).replace(/\/+$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await safeJson(response);
    if (!response.ok) {
      throw new ApiError(
        payload?.msg || payload?.message || "Anmeldung fehlgeschlagen.",
        response.status,
        payload?.error_code || "supabase_sign_in_failed",
      );
    }

    setSupabaseSession(payload);
    return payload;
  },
  signOut() {
    clearSupabaseSession();
  },
  async getHealth() {
    return request("/api/health");
  },
  async download(path) {
    const response = await fetch(path, {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      const payload = await safeJson(response);
      throw apiErrorFromPayload(payload, response.status);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = /filename=\"?([^\";]+)\"?/i.exec(disposition);
    return {
      blob,
      filename: match ? match[1] : "",
    };
  },
  async getTools() {
    return request("/api/tools");
  },
  async getTool(id) {
    return request(`/api/tools/${encodeURIComponent(id)}`);
  },
  async updateToolStatus(id, status) {
    return request(`/api/tools/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, actor: DASHBOARD_ACTOR }),
    });
  },
  async getLogs(limit = 50) {
    const payload = await request(`/api/activity-logs?limit=${encodeURIComponent(limit)}`);
    return { logs: payload.activityLogs || payload.logs || [] };
  },
  async getActivityLogs({ limit = 50, toolId = "", status = "" } = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (toolId) params.set("tool_id", toolId);
    if (status) params.set("status", status);
    return request(`/api/activity-logs?${params.toString()}`);
  },
  async createActivityLog(payload) {
    return request("/api/activity-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getAutomations() {
    return request("/api/automations");
  },
  async getAutomationStatus() {
    return request("/api/automations/status");
  },
  async getOffers() {
    return request("/api/offers");
  },
  async getOffer(id) {
    return request(`/api/offers/${encodeURIComponent(id)}`);
  },
  async generateOffer(payload) {
    return request("/api/offers/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getReports() {
    return request("/api/reports");
  },
  async getLiveReportingSnapshot({
    source = "combined",
    startDate = "",
    endDate = "",
    platform = "",
  } = {}) {
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (platform) params.set("platform", platform);
    return request(`/api/reports/live-snapshot?${params.toString()}`);
  },
  async getReport(id) {
    return request(`/api/reports/${encodeURIComponent(id)}`);
  },
  async generateReport(payload) {
    return request("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getEditorialPlannerOverview() {
    return request("/api/editorial-planner/overview");
  },
  async generateEditorialPlan(payload) {
    return request("/api/editorial-planner/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getEditorialPlans(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    return request(`/api/editorial-planner/plans${query ? `?${query}` : ""}`);
  },
  async getEditorialPlan(id) {
    return request(`/api/editorial-planner/plans/${encodeURIComponent(id)}`);
  },
  async createEditorialContentIdea(payload) {
    return request("/api/editorial-planner/content-ideas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateEditorialContentIdea(id, payload) {
    return request(`/api/editorial-planner/content-ideas/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async deleteEditorialContentIdea(id) {
    return request(`/api/editorial-planner/content-ideas/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async updateEditorialContentIdeaStatus(id, statusCode) {
    return request(`/api/editorial-planner/content-ideas/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status_code: statusCode }),
    });
  },
  async getEditorialTrendSignals(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    return request(`/api/editorial-planner/trend-signals${query ? `?${query}` : ""}`);
  },
  async refreshEditorialTrendSignals(payload = {}) {
    return request("/api/editorial-planner/trend-signals/refresh", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async getEditorialTrendSources() {
    return request("/api/editorial-planner/trend-sources");
  },
  async downloadReportFile(reportId) {
    return this.download(`/api/reports/${encodeURIComponent(reportId)}/file`);
  },
  async exportEditorialPlan(planId, format = "csv") {
    return this.download(`/api/editorial-planner/plans/${encodeURIComponent(planId)}/export?format=${encodeURIComponent(format)}`);
  },
  async getUsers() {
    return request("/api/users");
  },
  async getApiConnections() {
    return request("/api/api-connections");
  },
  async getSettings() {
    return request("/api/settings");
  },
};
