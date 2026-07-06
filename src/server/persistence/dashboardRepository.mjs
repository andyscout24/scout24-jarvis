import { normalizeActivityLog } from "../logging/auditLogger.mjs";
import { newestFirst, parseLimit } from "../utils/collections.mjs";

export function createDashboardRepository(store) {
  return {
    async getTools() {
      const db = await store.read();
      return db.tools;
    },

    async getToolById(toolId) {
      const db = await store.read();
      return db.tools.find((tool) => tool.id === toolId) || null;
    },

    async getAutomations({ toolId } = {}) {
      const db = await store.read();
      return toolId ? db.automations.filter((automation) => automation.toolId === toolId) : db.automations;
    },

    async getOffers({ toolId, clientId, limit } = {}) {
      const db = await store.read();
      let offers = db.offers;
      if (toolId) offers = offers.filter((offer) => offer.toolId === toolId);
      if (clientId) offers = offers.filter((offer) => offer.clientId === clientId);
      return newestFirst(offers).slice(0, parseLimit(limit, offers.length || 50));
    },

    async getOfferById(offerId) {
      const db = await store.read();
      return db.offers.find((offer) => offer.id === offerId) || null;
    },

    async getReports({ toolId, clientId, limit } = {}) {
      const db = await store.read();
      let reports = db.reports;
      if (toolId) reports = reports.filter((report) => report.toolId === toolId);
      if (clientId) reports = reports.filter((report) => report.clientId === clientId);
      return newestFirst(reports).slice(0, parseLimit(limit, reports.length || 50));
    },

    async getReportById(reportId) {
      const db = await store.read();
      return db.reports.find((report) => report.id === reportId) || null;
    },

    async getLogs({ toolId, tool_id, level, status, action, limit } = {}) {
      const db = await store.read();
      const requestedToolId = toolId || tool_id;
      const requestedStatus = status || level;
      let logs = (db.logs || []).map(normalizeActivityLog);
      if (requestedToolId) logs = logs.filter((log) => log.toolId === requestedToolId || log.tool_id === requestedToolId);
      if (requestedStatus) logs = logs.filter((log) => log.status === requestedStatus || log.level === requestedStatus);
      if (action) logs = logs.filter((log) => log.action === action);
      return newestFirst(logs, "createdAt").slice(0, parseLimit(limit));
    },

    async getUsers() {
      const db = await store.read();
      return db.users;
    },

    async getUserById(userId) {
      const db = await store.read();
      return db.users.find((user) => user.id === userId || user.externalAuthId === userId) || null;
    },

    async getUserByEmail(email) {
      const db = await store.read();
      return db.users.find((user) => user.email === email) || null;
    },

    async getApiConnections() {
      const db = await store.read();
      return db.apiConnections || [];
    },

    async getAutomationRuns({ toolId, status, limit } = {}) {
      const db = await store.read();
      let runs = db.automationRuns || [];
      if (toolId) runs = runs.filter((run) => run.toolId === toolId);
      if (status) runs = runs.filter((run) => run.status === status);
      return newestFirst(runs, "startedAt").slice(0, parseLimit(limit, runs.length || 50));
    },

    async getSettings() {
      const db = await store.read();
      return db.settings || [];
    },

    async getSetting(settingKey, { toolId = null, scope = null } = {}) {
      const db = await store.read();
      const settings = db.settings || [];
      return settings.find((setting) =>
        setting.settingKey === settingKey
        && (scope ? setting.scope === scope : true)
        && (toolId ? setting.toolId === toolId : true)) || null;
    },

    async getToolDetail(toolId) {
      const db = await store.read();
      const tool = db.tools.find((item) => item.id === toolId) || null;
      if (!tool) return null;

      return {
        tool,
        logs: newestFirst((db.logs || []).map(normalizeActivityLog).filter((item) => item.toolId === tool.id)).slice(0, 12),
        reports: newestFirst(db.reports.filter((item) => item.toolId === tool.id)),
        offers: newestFirst(db.offers.filter((item) => item.toolId === tool.id)),
        automations: db.automations.filter((item) => item.toolId === tool.id),
      };
    },

    async updateTool(toolId, updater) {
      const db = await store.read();
      const tool = db.tools.find((item) => item.id === toolId) || null;
      if (!tool) return null;

      await updater(tool, db);
      await store.write(db);
      return tool;
    },

    async insertLog(log) {
      const db = await store.read();
      db.logs = db.logs || [];
      db.logs.unshift(normalizeActivityLog(log));
      await store.write(db);
      return normalizeActivityLog(log);
    },

    async createReport({ report, automationRun, log }) {
      const db = await store.read();
      db.automationRuns = db.automationRuns || [];
      db.reports = db.reports || [];
      db.logs = db.logs || [];
      db.automationRuns.unshift(automationRun);
      db.reports.unshift(report);
      db.logs.unshift(normalizeActivityLog(log));
      const tool = db.tools.find((item) => item.id === report.toolId);
      if (tool) {
        tool.lastRunAt = report.createdAt;
        tool.metrics = {
          ...(tool.metrics || {}),
          runsToday: Number(tool.metrics?.runsToday || 0) + 1,
          storedResults: Number(tool.metrics?.storedResults || 0) + 1,
        };
      }
      await store.write(db);
      return report;
    },

    async createOffer({ offer, automationRun, log }) {
      const db = await store.read();
      db.automationRuns = db.automationRuns || [];
      db.offers = db.offers || [];
      db.logs = db.logs || [];
      db.automationRuns.unshift(automationRun);
      db.offers.unshift(offer);
      db.logs.unshift(normalizeActivityLog(log));
      const tool = db.tools.find((item) => item.id === offer.toolId);
      if (tool) {
        tool.lastRunAt = offer.createdAt;
        tool.metrics = {
          ...(tool.metrics || {}),
          runsToday: Number(tool.metrics?.runsToday || 0) + 1,
          storedResults: Number(tool.metrics?.storedResults || 0) + 1,
        };
      }
      await store.write(db);
      return offer;
    },

    async upsertSetting(setting) {
      const db = await store.read();
      db.settings = db.settings || [];
      const normalized = {
        settingKey: setting.settingKey,
        scope: setting.scope || "global",
        toolId: setting.toolId || null,
        userId: setting.userId || null,
        value: setting.value ?? null,
        isSecret: Boolean(setting.isSecret),
        updatedByUserId: setting.updatedByUserId || null,
        updatedAt: setting.updatedAt || new Date().toISOString(),
      };

      const index = db.settings.findIndex((item) =>
        item.settingKey === normalized.settingKey
        && item.scope === normalized.scope
        && (item.toolId || null) === normalized.toolId
        && (item.userId || null) === normalized.userId);

      if (index >= 0) {
        db.settings[index] = {
          ...db.settings[index],
          ...normalized,
        };
      } else {
        db.settings.push(normalized);
      }

      await store.write(db);
      return normalized;
    },
  };
}
