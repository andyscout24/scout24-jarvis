import { badRequest, unauthorized } from "../errors/apiError.mjs";

const DEFAULT_BASE_URL = process.env.EDITORIAL_PLANNER_BASE_URL || "http://127.0.0.1:8080";
const DEFAULT_EMAIL = process.env.EDITORIAL_PLANNER_EMAIL || "admin@immoscout24.at";
const DEFAULT_PASSWORD = process.env.EDITORIAL_PLANNER_PASSWORD || "Planner2026!";

export function createEditorialPlannerClient() {
  let sessionCookie = "";

  return {
    async getOverview() {
      const health = await this.request("/api/health");
      const plansPayload = await this.request("/api/editorial-plans?limit=6");
      const trendPayload = await this.request("/api/trend-signals?limit=8");
      const sourcePayload = await this.request("/api/trend-sources");
      const performancePayload = await this.request("/api/performance-insights?target_count=6");
      const integrationPayload = await this.request("/api/integrations/status");
      const automationPayload = await this.request("/api/automation/status");

      const plans = Array.isArray(plansPayload?.editorial_plans) ? plansPayload.editorial_plans : [];
      const latestPlan = plans[0] || null;
      const currentWeek = isoWeekParts(new Date());
      const currentWeekPlan = await this.tryRequest(
        `/api/editorial-plans/week?year=${currentWeek.year}&week=${currentWeek.week}&market=AT`,
      );

      return {
        health,
        plans,
        latestPlan,
        currentWeekPlan,
        trendSignals: trendPayload?.trend_signals || [],
        trendSources: sourcePayload?.trend_sources || [],
        performanceInsights: performancePayload?.performance_insights || {},
        integrationStatus: integrationPayload?.integration_status || {},
        automation: automationPayload?.automation || {},
      };
    },

    async generatePlan(payload) {
      const body = normalizeGenerationPayload(payload);
      return this.request("/api/editorial-plans/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async exportPlan(planId, format = "csv") {
      const response = await this.requestRaw(`/api/editorial-plans/${encodeURIComponent(planId)}/export?format=${encodeURIComponent(format)}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw plannerErrorFromPayload(payload, response.status);
      }
      const filename = fileNameFromDisposition(response.headers.get("content-disposition"))
        || `editorial-plan-${planId}.${format}`;
      return {
        contentType: response.headers.get("content-type") || "application/octet-stream",
        filename,
        body: Buffer.from(await response.arrayBuffer()),
      };
    },

    async listPlans(query = {}) {
      return this.request(withQuery("/api/editorial-plans", query));
    },

    async getPlan(planId) {
      return this.request(`/api/editorial-plans/${encodeURIComponent(planId)}`);
    },

    async getPlanForWeek(query = {}) {
      return this.request(withQuery("/api/editorial-plans/week", query));
    },

    async listTrendSources() {
      return this.request("/api/trend-sources");
    },

    async listTrendSignals(query = {}) {
      return this.request(withQuery("/api/trend-signals", query));
    },

    async refreshTrendSignals(payload = {}) {
      return this.request("/api/trend-signals/refresh", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async createContentIdea(payload) {
      return this.request("/api/content-ideas", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
    },

    async updateContentIdea(contentIdeaId, payload) {
      return this.request(`/api/content-ideas/${encodeURIComponent(contentIdeaId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload || {}),
      });
    },

    async deleteContentIdea(contentIdeaId) {
      const response = await this.requestRaw(`/api/content-ideas/${encodeURIComponent(contentIdeaId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw plannerErrorFromPayload(payload, response.status);
      }
      return { ok: true };
    },

    async changeContentIdeaStatus(contentIdeaId, payload) {
      return this.request(`/api/content-ideas/${encodeURIComponent(contentIdeaId)}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload || {}),
      });
    },

    async request(path, options = {}) {
      const response = await this.requestRaw(path, options);
      const payload = await response.json().catch(() => {
        throw badRequest("editorial_planner_invalid_response", "Der Redaktionsplan-Service hat kein gueltiges JSON geliefert.");
      });

      if (!response.ok) {
        throw plannerErrorFromPayload(payload, response.status);
      }

      return payload;
    },

    async tryRequest(path, options = {}) {
      try {
        return await this.request(path, options);
      } catch (error) {
        if (error?.statusCode === 404 || String(error?.message || "").toLowerCase().includes("not found")) return null;
        throw error;
      }
    },

    async requestRaw(path, options = {}, allowRetry = true) {
      if (!sessionCookie) {
        await login();
      }

      const response = await fetch(resolveUrl(path), {
        method: options.method || "GET",
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(sessionCookie ? { Cookie: sessionCookie } : {}),
          ...(options.headers || {}),
        },
        body: options.body,
      });

      if (response.status === 401 && allowRetry) {
        sessionCookie = "";
        await login();
        return this.requestRaw(path, options, false);
      }

      return response;
    },
  };

  async function login() {
    if (!DEFAULT_EMAIL || !DEFAULT_PASSWORD) {
      throw unauthorized(
        "editorial_planner_auth_missing",
        "Fuer den Redaktionsplan-Service fehlen Login-Daten.",
      );
    }

    const response = await fetch(resolveUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw plannerErrorFromPayload(payload, response.status);
    }

    const setCookie = response.headers.get("set-cookie") || "";
    sessionCookie = setCookie.split(";")[0] || "";
    if (!sessionCookie) {
      throw unauthorized(
        "editorial_planner_auth_failed",
        "Der Redaktionsplan-Service hat keine Session zurueckgegeben.",
      );
    }
  }
}

function normalizeGenerationPayload(payload) {
  const weekStartDate = String(payload?.weekStartDate || "").trim();
  const market = String(payload?.market || "AT").trim().toUpperCase();

  if (!weekStartDate) {
    throw badRequest("missing_week_start", "Bitte waehle ein Startdatum fuer die Woche.");
  }

  return {
    weekStartDate,
    market: market || "AT",
  };
}

function resolveUrl(path) {
  return `${String(DEFAULT_BASE_URL).replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function withQuery(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function plannerErrorFromPayload(payload, statusCode) {
  const message = payload?.message || payload?.error || "Der Redaktionsplan-Service konnte die Anfrage nicht verarbeiten.";
  if (statusCode === 401) {
    return unauthorized("editorial_planner_unauthorized", message);
  }
  return badRequest("editorial_planner_request_failed", message);
}

function fileNameFromDisposition(disposition) {
  const match = /filename=\"?([^\";]+)\"?/i.exec(String(disposition || ""));
  return match ? match[1] : "";
}

function isoWeekParts(value) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return {
    year: date.getUTCFullYear(),
    week,
  };
}
