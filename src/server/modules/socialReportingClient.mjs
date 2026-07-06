import { badRequest, notFound, unauthorized } from "../errors/apiError.mjs";

const DEFAULT_BASE_URL = String(process.env.SOCIAL_REPORTING_API_BASE_URL || "").trim();
const DEFAULT_TOKEN = String(process.env.SOCIAL_REPORTING_API_TOKEN || "").trim();

export function createSocialReportingClient() {
  return {
    async getHealth() {
      return this.request("/api/health");
    },

    async getLiveSnapshot(query = {}) {
      return this.request(withQuery("/api/live-snapshot", query));
    },

    async generateReport(payload = {}) {
      return this.request("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
    },

    async downloadArtifact(artifactPath) {
      const response = await this.requestRaw(artifactPath);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw serviceErrorFromPayload(payload, response.status);
      }
      return {
        contentType: response.headers.get("content-type") || "application/octet-stream",
        filename: fileNameFromDisposition(response.headers.get("content-disposition")) || artifactPath.split("/").pop() || "report.xlsx",
        body: Buffer.from(await response.arrayBuffer()),
      };
    },

    async request(path, options = {}) {
      const response = await this.requestRaw(path, options);
      const payload = await response.json().catch(() => {
        throw badRequest("social_reporting_invalid_response", "Der Social Reporting Service hat kein gueltiges JSON geliefert.");
      });

      if (!response.ok) {
        throw serviceErrorFromPayload(payload, response.status);
      }
      return payload;
    },

    async requestRaw(path, options = {}) {
      if (!DEFAULT_BASE_URL) {
        throw badRequest("social_reporting_api_missing", "SOCIAL_REPORTING_API_BASE_URL ist nicht konfiguriert.");
      }

      return fetch(resolveUrl(path), {
        method: options.method || "GET",
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(DEFAULT_TOKEN ? { Authorization: `Bearer ${DEFAULT_TOKEN}` } : {}),
          ...(options.headers || {}),
        },
        body: options.body,
      });
    },
  };
}

function resolveUrl(path) {
  return `${DEFAULT_BASE_URL.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
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

function serviceErrorFromPayload(payload, statusCode) {
  const message = payload?.message || payload?.error || "Der Social Reporting Service konnte die Anfrage nicht verarbeiten.";
  if (statusCode === 401) {
    return unauthorized("social_reporting_unauthorized", message);
  }
  if (statusCode === 404) {
    return notFound("social_reporting_not_found", message);
  }
  return badRequest("social_reporting_request_failed", message);
}

function fileNameFromDisposition(disposition) {
  const match = /filename=\"?([^\";]+)\"?/i.exec(String(disposition || ""));
  return match ? match[1] : "";
}
