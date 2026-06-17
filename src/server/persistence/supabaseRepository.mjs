import { normalizeActivityLog } from "../logging/auditLogger.mjs";
import { newestFirst, parseLimit } from "../utils/collections.mjs";
import { SupabaseRestClient } from "./supabaseRestClient.mjs";

export function createSupabaseRepository(config) {
  const client = new SupabaseRestClient(config);

  return {
    async getTools() {
      const rows = await client.select("tools", { order: "created_at.asc" });
      return rows.map(toolFromRow);
    },

    async getToolById(toolId) {
      const [row] = await client.select("tools", { filters: [eq("id", toolId)], limit: 1 });
      return row ? toolFromRow(row) : null;
    },

    async getAutomations({ toolId } = {}) {
      const filters = toolId ? [eq("tool_id", toolId)] : [];
      const rows = await client.select("automations", { filters, order: "created_at.asc" });
      return rows.map(automationFromRow);
    },

    async getOffers({ toolId, clientId, limit } = {}) {
      const filters = compactFilters([toolId && eq("tool_id", toolId), clientId && eq("client_id", clientId)]);
      const rows = await client.select("offers", {
        filters,
        order: "created_at.desc",
        limit: parseLimit(limit, 50),
      });
      return mapOffers(rows);
    },

    async getOfferById(offerId) {
      const [row] = await client.select("offers", { filters: [eq("id", offerId)], limit: 1 });
      if (!row) return null;
      const [offer] = await mapOffers([row]);
      return offer || null;
    },

    async getReports({ toolId, clientId, limit } = {}) {
      const filters = compactFilters([toolId && eq("tool_id", toolId), clientId && eq("client_id", clientId)]);
      const rows = await client.select("reports", {
        filters,
        order: "created_at.desc",
        limit: parseLimit(limit, 50),
      });
      return mapReports(rows);
    },

    async getReportById(reportId) {
      const [row] = await client.select("reports", { filters: [eq("id", reportId)], limit: 1 });
      if (!row) return null;
      const [report] = await mapReports([row]);
      return report || null;
    },

    async getLogs({ toolId, tool_id, level, status, action, limit } = {}) {
      const requestedToolId = toolId || tool_id;
      const requestedStatus = status || level;
      const filters = compactFilters([
        requestedToolId && eq("tool_id", requestedToolId),
        requestedStatus && eq("status", requestedStatus),
        action && eq("action", action),
      ]);
      const rows = await client.select("activity_logs", {
        filters,
        order: "created_at.desc",
        limit: parseLimit(limit, 50),
      });
      return rows.map(logFromRow);
    },

    async getUsers() {
      const rows = await client.select("users", { order: "created_at.asc" });
      return rows.map(userFromRow);
    },

    async getUserById(userId) {
      const filter = isUuid(userId) ? eq("id", userId) : eq("external_auth_id", userId);
      const [row] = await client.select("users", { filters: [filter], limit: 1 });
      return row ? userFromRow(row) : null;
    },

    async getUserByEmail(email) {
      const [row] = await client.select("users", { filters: [eq("email", email)], limit: 1 });
      return row ? userFromRow(row) : null;
    },

    async getApiConnections() {
      const rows = await client.select("api_connections", { order: "created_at.asc" });
      return rows.map(apiConnectionFromRow);
    },

    async getAutomationRuns({ toolId, status, limit } = {}) {
      const filters = compactFilters([toolId && eq("tool_id", toolId), status && eq("status", status)]);
      const rows = await client.select("automation_runs", {
        filters,
        order: "started_at.desc",
        limit: parseLimit(limit, 50),
      });
      return rows.map(automationRunFromRow);
    },

    async getSettings() {
      const rows = await client.select("settings", { order: "setting_key.asc" });
      return rows.map(settingFromRow);
    },

    async getToolDetail(toolId) {
      const tool = await this.getToolById(toolId);
      if (!tool) return null;

      const [logs, reports, offers, automations] = await Promise.all([
        this.getLogs({ toolId, limit: 12 }),
        this.getReports({ toolId }),
        this.getOffers({ toolId }),
        this.getAutomations({ toolId }),
      ]);

      return {
        tool,
        logs,
        reports,
        offers,
        automations,
      };
    },

    async updateTool(toolId, updater) {
      const tool = await this.getToolById(toolId);
      if (!tool) return null;

      const db = { logs: [] };
      await updater(tool, db);

      const [updatedTool] = await client.patch("tools", {
        filters: [eq("id", toolId)],
        body: toolToPatchRow(tool),
      });

      if (db.logs?.length) {
        await client.insert("activity_logs", db.logs.map(logToRow));
      }

      return updatedTool ? toolFromRow(updatedTool) : tool;
    },

    async insertLog(log) {
      const [row] = await client.insert("activity_logs", logToRow(log));
      return row ? logFromRow(row) : normalizeActivityLog(log);
    },

    async createReport({ report, automationRun, log }) {
      await client.insert("automation_runs", automationRunToRow(automationRun));
      const [row] = await client.insert("reports", reportToRow(report, automationRun));
      await client.insert("activity_logs", logToRow(log));
      await incrementToolMetrics(report.toolId, report.createdAt);
      return row ? (await mapReports([row]))[0] : report;
    },

    async createOffer({ offer, automationRun, log }) {
      await client.insert("automation_runs", automationRunToRow(automationRun));
      const [row] = await client.insert("offers", offerToRow(offer, automationRun));
      await client.insert("activity_logs", logToRow(log));
      await incrementToolMetrics(offer.toolId, offer.createdAt);
      return row ? (await mapOffers([row]))[0] : offer;
    },
  };

  async function mapReports(rows) {
    const [clientsById, usersById] = await Promise.all([clientMap(), userMap()]);
    return newestFirst(rows.map((row) => reportFromRow(row, clientsById, usersById)));
  }

  async function mapOffers(rows) {
    const [clientsById, usersById] = await Promise.all([clientMap(), userMap()]);
    return newestFirst(rows.map((row) => offerFromRow(row, clientsById, usersById)));
  }

  async function clientMap() {
    const rows = await client.select("clients");
    return new Map(rows.map((row) => [row.id, clientFromRow(row)]));
  }

  async function userMap() {
    const rows = await client.select("users");
    return new Map(rows.map((row) => [row.id, userFromRow(row)]));
  }

  async function incrementToolMetrics(toolId, lastRunAt) {
    const [toolRow] = await client.select("tools", { filters: [eq("id", toolId)], limit: 1 });
    if (!toolRow) return;
    const tool = toolFromRow(toolRow);

    const metrics = {
      ...(tool.metrics || {}),
      runsToday: Number(tool.metrics?.runsToday || 0) + 1,
      storedResults: Number(tool.metrics?.storedResults || 0) + 1,
    };

    await client.patch("tools", {
      filters: [eq("id", toolId)],
      body: {
        last_run_at: lastRunAt,
        metadata: {
          ...(tool.metadata || {}),
          metrics,
        },
      },
    });
  }
}

function toolFromRow(row) {
  const config = camelize(row.config || {});
  const metadata = camelize(row.metadata || {});
  const metrics = metadata.metrics || {
    runsToday: 0,
    successRate: null,
    storedResults: 0,
  };

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    status: row.status,
    owner: row.owner_team || "Platform",
    route: row.route,
    launchRoute: config.launchRoute || row.route,
    externalUrl: row.external_url,
    lastRunAt: row.last_run_at,
    metrics,
    metadata,
    integration: {
      type: row.integration_type,
      state: row.integration_state,
      adapter: config.adapter,
      serviceName: config.serviceName,
      healthEndpoint: config.healthEndpoint,
      previewEndpoint: config.previewEndpoint,
      generateEndpoint: config.generateEndpoint,
      dataSources: config.dataSources,
      sourceReference: config.sourceReference,
      notes: config.notes,
    },
    config,
  };
}

function toolToPatchRow(tool) {
  return {
    status: tool.status,
    last_run_at: tool.lastRunAt || null,
    metadata: {
      ...(tool.metadata || {}),
      metrics: tool.metrics || tool.metadata?.metrics || {},
    },
  };
}

function userFromRow(row) {
  return {
    id: row.id,
    externalAuthId: row.external_auth_id,
    name: row.name,
    email: row.email,
    role: row.role,
    team: row.team,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clientFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    externalRef: row.external_ref,
    industry: row.industry,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function automationFromRow(row) {
  return {
    id: row.id,
    toolId: row.tool_id,
    name: row.name,
    description: row.description,
    schedule: row.schedule,
    enabled: row.enabled,
    createdByUserId: row.created_by_user_id,
    config: camelize(row.config || {}),
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function automationRunFromRow(row) {
  return {
    id: row.id,
    automationId: row.automation_id,
    toolId: row.tool_id,
    clientId: row.client_id,
    status: row.status,
    triggerSource: row.trigger_source,
    actorUserId: row.actor_user_id,
    input: camelize(row.input || {}),
    output: camelize(row.output || {}),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

function reportFromRow(row, clientsById, usersById) {
  const metadata = camelize(row.metadata || {});
  const client = clientsById.get(row.client_id);
  const user = usersById.get(row.created_by_user_id);

  return {
    id: row.id,
    toolId: row.tool_id,
    clientId: row.client_id,
    automationRunId: row.automation_run_id,
    clientName: metadata.clientName || client?.name || "Unbekannter Kunde",
    campaignName: row.campaign_name,
    reportType: row.report_type,
    reportingPeriod: row.reporting_period,
    channel: row.channel,
    dataSource: row.data_source,
    dataSourceLabel: row.data_source_label,
    status: row.status,
    fileName: row.file_name,
    fileUrl: row.file_url,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: metadata.createdBy || user?.name || "System",
    createdByUserId: row.created_by_user_id,
    metadata,
  };
}

function offerFromRow(row, clientsById, usersById) {
  const metadata = camelize(row.metadata || {});
  const client = clientsById.get(row.client_id);
  const user = usersById.get(row.created_by_user_id);
  const amount = row.amount === null || row.amount === undefined ? null : Number(row.amount);

  return {
    id: row.id,
    toolId: row.tool_id,
    clientId: row.client_id,
    automationRunId: row.automation_run_id,
    offerNumber: row.offer_number,
    clientName: metadata.clientName || client?.name || "Unbekannter Kunde",
    industry: metadata.industry || client?.industry || "Nicht angegeben",
    budget: metadata.budget ?? amount,
    runtime: metadata.runtime || "Nicht angegeben",
    status: row.status,
    amount,
    currency: row.currency,
    fileName: row.file_name,
    fileUrl: row.file_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: metadata.createdBy || user?.name || "System",
    createdByUserId: row.created_by_user_id,
    metadata,
  };
}

function apiConnectionFromRow(row) {
  return {
    id: row.id,
    toolId: row.tool_id,
    name: row.name,
    baseUrl: row.base_url,
    healthEndpoint: row.health_endpoint,
    authType: row.auth_type,
    status: row.status,
    lastCheckedAt: row.last_checked_at,
    lastError: row.last_error,
    config: camelize(row.config || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function settingFromRow(row) {
  return {
    key: row.setting_key || row.key,
    scope: row.scope,
    toolId: row.tool_id,
    userId: row.user_id,
    value: row.value,
    isSecret: row.is_secret,
    updatedByUserId: row.updated_by_user_id,
    updatedAt: row.updated_at,
  };
}

function logFromRow(row) {
  return normalizeActivityLog({
    id: row.id,
    timestamp: row.timestamp,
    actor: row.actor_label,
    userId: row.user_id,
    toolId: row.tool_id,
    automationRunId: row.automation_run_id,
    action: row.action,
    status: row.status,
    level: row.level,
    message: row.message,
    metadata: camelize(row.metadata || {}),
    createdAt: row.created_at,
  });
}

function automationRunToRow(run) {
  return {
    id: run.id,
    automation_id: run.automationId,
    tool_id: run.toolId,
    client_id: run.clientId || null,
    status: run.status,
    trigger_source: run.triggerSource,
    actor_user_id: uuidOrNull(run.actorUserId),
    input: run.input || {},
    output: run.output || {},
    error_code: run.errorCode || null,
    error_message: run.errorMessage || null,
    started_at: run.startedAt,
    finished_at: run.finishedAt || null,
    created_at: run.createdAt,
  };
}

function reportToRow(report, automationRun) {
  return {
    id: report.id,
    tool_id: report.toolId,
    client_id: report.clientId || null,
    automation_run_id: report.automationRunId || automationRun.id,
    campaign_name: report.campaignName,
    report_type: report.reportType,
    reporting_period: report.reportingPeriod,
    channel: report.channel,
    data_source: report.dataSource,
    data_source_label: report.dataSourceLabel,
    status: report.status,
    file_name: report.fileName,
    file_url: report.fileUrl,
    error_message: report.errorMessage,
    created_by_user_id: uuidOrNull(automationRun.actorUserId),
    metadata: {
      ...(report.metadata || {}),
      clientName: report.clientName,
      createdBy: report.createdBy,
    },
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

function offerToRow(offer, automationRun) {
  return {
    id: offer.id,
    tool_id: offer.toolId,
    client_id: offer.clientId || null,
    automation_run_id: offer.automationRunId || automationRun.id,
    offer_number: offer.offerNumber,
    status: offer.status,
    amount: offer.amount,
    currency: offer.currency,
    file_name: offer.fileName,
    file_url: offer.fileUrl,
    created_by_user_id: uuidOrNull(automationRun.actorUserId),
    metadata: {
      ...(offer.metadata || {}),
      clientName: offer.clientName,
      industry: offer.industry,
      budget: offer.budget,
      runtime: offer.runtime,
      createdBy: offer.createdBy,
    },
    created_at: offer.createdAt,
    updated_at: offer.updatedAt,
  };
}

function logToRow(log) {
  const normalized = normalizeActivityLog(log);
  return {
    id: normalized.id,
    tool_id: normalized.toolId,
    automation_run_id: normalized.automationRunId || null,
    user_id: uuidOrNull(normalized.userId),
    timestamp: normalized.timestamp,
    actor_label: normalized.actor,
    action: normalized.action,
    status: normalized.status,
    level: normalized.level,
    message: normalized.message,
    metadata: normalized.metadata || {},
    created_at: normalized.createdAt,
  };
}

function compactFilters(filters) {
  return filters.filter(Boolean);
}

function eq(column, value) {
  return { column, operator: "eq", value };
}

function camelize(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(camelize);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [toCamel(key), camelize(item)]),
  );
}

function toCamel(value) {
  return String(value).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function uuidOrNull(value) {
  return isUuid(value) ? value : null;
}
