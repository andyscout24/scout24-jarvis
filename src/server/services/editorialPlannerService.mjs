import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { Roles, canAccessTool } from "../auth/permissions.mjs";
import { socialReportingProjectDir } from "../config/paths.mjs";
import { badRequest, forbidden, notFound } from "../errors/apiError.mjs";
import { createActivityLog } from "../logging/auditLogger.mjs";
import { createEditorialPlannerClient } from "../modules/editorialPlannerClient.mjs";

const plannerClient = createEditorialPlannerClient();

export function createEditorialPlannerService(repository) {
  return {
    async getOverview(currentUser) {
      const tool = await requirePlannerTool(repository, currentUser);
      const overview = await plannerClient.getOverview();

      return {
        tool,
        planner: {
          baseUrl: process.env.EDITORIAL_PLANNER_BASE_URL || "http://127.0.0.1:8080",
          connected: overview.health?.status === "ok",
          health: overview.health,
          latestPlan: simplifyPlan(overview.latestPlan),
          currentWeekPlan: simplifyPlan(overview.currentWeekPlan),
          plans: overview.plans.map(simplifyPlan),
          trendSignals: overview.trendSignals.map(simplifyTrendSignal),
          trendSources: overview.trendSources || [],
          performanceInsights: overview.performanceInsights || {},
          integrationStatus: overview.integrationStatus || {},
          automation: overview.automation || {},
        },
      };
    },

    async generatePlan(body, currentUser) {
      const tool = await requirePlannerTool(repository, currentUser, true);
      const generated = simplifyPlan(await plannerClient.generatePlan(body));
      const timestamp = new Date().toISOString();
      const weekLabel = `KW ${generated.calendarWeek}/${generated.calendarYear}`;

      await repository.updateTool(tool.id, async (mutableTool, db) => {
        mutableTool.lastRunAt = timestamp;
        mutableTool.metrics = {
          ...(mutableTool.metrics || {}),
          runsToday: Number(mutableTool.metrics?.runsToday || 0) + 1,
          storedResults: Number(mutableTool.metrics?.storedResults || 0) + 1,
        };
        db.logs = db.logs || [];
        db.logs.unshift(createActivityLog({
          toolId: tool.id,
          status: "success",
          action: "editorial_plan.generated",
          actor: currentUser.name,
          user: currentUser.name,
          message: `Redaktionsplan fuer ${weekLabel} wurde erzeugt.`,
          metadata: {
            planId: generated.id,
            weekStartDate: generated.weekStartDate,
            market: generated.market,
            totalIdeas: generated.summary?.totalIdeas || generated.contentIdeas.length,
          },
        }));
      });

      return {
        toolId: tool.id,
        plan: generated,
      };
    },

    async exportPlan(planId, format, currentUser) {
      await requirePlannerTool(repository, currentUser);
      return plannerClient.exportPlan(planId, format);
    },

    async listPlans(query, currentUser) {
      await requirePlannerTool(repository, currentUser);
      const payload = await plannerClient.listPlans(query);
      return {
        editorialPlans: Array.isArray(payload?.editorial_plans) ? payload.editorial_plans.map(simplifyPlan) : [],
      };
    },

    async getPlan(planId, currentUser) {
      await requirePlannerTool(repository, currentUser);
      return {
        plan: simplifyPlan(await plannerClient.getPlan(planId)),
      };
    },

    async listTrendSignals(query, currentUser) {
      await requirePlannerTool(repository, currentUser);
      const payload = await plannerClient.listTrendSignals(query);
      return {
        trendSignals: Array.isArray(payload?.trend_signals) ? payload.trend_signals.map(simplifyTrendSignal) : [],
      };
    },

    async refreshTrendSignals(body, currentUser) {
      await requirePlannerTool(repository, currentUser, true);
      const payload = await plannerClient.refreshTrendSignals(body);
      return {
        refreshedCount: Number(payload?.refreshed_count || 0),
        trendSignals: Array.isArray(payload?.trend_signals) ? payload.trend_signals.map(simplifyTrendSignal) : [],
      };
    },

    async listTrendSources(currentUser) {
      await requirePlannerTool(repository, currentUser);
      const payload = await plannerClient.listTrendSources();
      return {
        trendSources: Array.isArray(payload?.trend_sources) ? payload.trend_sources : [],
      };
    },

    async createContentIdea(body, currentUser) {
      await requirePlannerTool(repository, currentUser, true);
      return {
        contentIdea: simplifyContentIdea(await plannerClient.createContentIdea(body)),
      };
    },

    async updateContentIdea(contentIdeaId, body, currentUser) {
      await requirePlannerTool(repository, currentUser, true);
      return {
        contentIdea: simplifyContentIdea(await plannerClient.updateContentIdea(contentIdeaId, body)),
      };
    },

    async deleteContentIdea(contentIdeaId, currentUser) {
      await requirePlannerTool(repository, currentUser, true);
      await plannerClient.deleteContentIdea(contentIdeaId);
      return { ok: true };
    },

    async changeContentIdeaStatus(contentIdeaId, body, currentUser) {
      await requirePlannerTool(repository, currentUser, true);
      return {
        contentIdea: simplifyContentIdea(await plannerClient.changeContentIdeaStatus(contentIdeaId, body)),
      };
    },

    async getReportArtifact(reportId, currentUser) {
      const report = await repository.getReportById(reportId);
      if (!report) {
        throw notFound("report_not_found", "Der angeforderte Report wurde nicht gefunden.");
      }
      if (![Roles.ADMIN, Roles.MARKETING_USER, Roles.MANAGEMENT_VIEWER].includes(currentUser?.role)) {
        throw forbidden("forbidden", "Du darfst diesen Report nicht herunterladen.");
      }
      const filePath = String(report.fileUrl || report.metadata?.outputFilePath || "").trim();
      if (!filePath) {
        throw notFound("report_file_missing", "Zu diesem Report ist keine Exportdatei hinterlegt.");
      }

      const safePath = assertWithinDirectory(filePath, resolve(socialReportingProjectDir, "data_output"));
      return {
        filename: report.fileName || safePath.split(sep).pop() || `report-${reportId}.xlsx`,
        contentType: excelContentType,
        body: await readFile(safePath),
      };
    },
  };
}

const excelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function requirePlannerTool(repository, currentUser, requireGeneratePermission = false) {
  const tool = await repository.getToolById("editorial-planner");
  if (!tool) {
    throw notFound("tool_not_found", "Der Redaktionsplan wurde nicht gefunden.");
  }
  if (!canAccessTool(currentUser, tool)) {
    throw notFound("tool_not_found", "Der Redaktionsplan wurde nicht gefunden.");
  }
  if (requireGeneratePermission && ![Roles.ADMIN, Roles.MARKETING_USER].includes(currentUser?.role)) {
    throw forbidden("forbidden", "Nur Admins und Marketing User duerfen Redaktionsplaene erzeugen.");
  }
  return tool;
}

function simplifyPlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const contentIdeas = Array.isArray(plan.content_ideas || plan.contentIdeas)
    ? (plan.content_ideas || plan.contentIdeas).map(simplifyContentIdea)
    : [];

  return {
    id: Number(plan.id),
    title: String(plan.title || `KW ${plan.calendar_week}/${plan.calendar_year}`),
    calendarYear: Number(plan.calendar_year),
    calendarWeek: Number(plan.calendar_week),
    weekStartDate: plan.week_start_date,
    weekEndDate: plan.week_end_date,
    market: plan.market || "AT",
    status: plan.status || "draft",
    generatedFrom: plan.generated_from || "unknown",
    createdAt: plan.created_at || null,
    updatedAt: plan.updated_at || null,
    contentIdeas,
    summary: plan.summary || {
      totalIdeas: contentIdeas.length,
      channelCount: new Set(contentIdeas.map((item) => item.platform)).size,
      formatCount: new Set(contentIdeas.map((item) => item.format)).size,
      statusCounts: summarizeCounts(contentIdeas.map((item) => item.statusCode || item.status)),
    },
  };
}

function simplifyContentIdea(item) {
  const trendBasis = normalizeTrendBasis(item.trend_basis || item.trendBasis || {});
  const assets = Array.isArray(item.asset_requirements || item.required_assets)
    ? (item.asset_requirements || item.required_assets).map((asset) => ({
      id: Number(asset.id || 0) || null,
      type: asset.asset_type || asset.type || "asset",
      description: asset.description || "",
      required: asset.is_required !== false,
      status: asset.status || "open",
    }))
    : [];
  const responsible = item.responsible_person || {};
  const status = item.status || {};
  const format = item.format || {};
  const channel = item.channel || {};

  return {
    id: Number(item.id),
    backendId: Number(item.id),
    editorialPlanId: Number(item.editorial_plan_id || 0) || null,
    title: String(item.title || "Ohne Titel"),
    description: String(item.description || item.short_description || ""),
    shortDescription: String(item.short_description || item.description || ""),
    platform: channel.name || item.channel_name || "Kanal",
    platformCode: channel.code || item.channel_code || "",
    tone: platformTone(channel.code || channel.name || ""),
    postingDate: item.posting_date || item.date || null,
    postingTime: item.posting_time || item.time || null,
    status: status.name || item.status_name || item.status || "Proposed",
    statusCode: status.code || item.status_code || "",
    format: format.name || item.format_name || "",
    formatCode: format.code || item.format_code || "",
    funnelGoal: item.funnel_goal || "",
    targetAudience: item.target_audience || "",
    hook: item.hook || "",
    captionDraft: item.caption_suggestion || item.caption_draft || "",
    cta: item.cta || "",
    creativeDirection: item.creative_direction || "",
    timingReason: item.timing_reason || "",
    requiredAssets: assets,
    trendBasis,
    responsible: item.responsible_person?.display_name || item.owner || "",
    responsibleEmail: responsible.email || "",
    relevanceScore: item.relevance_score ?? null,
    effort: normalizeEffortLabel(item.effort),
    effortScore: Number(item.effort ?? 0) || null,
    priority: item.priority || "medium",
    notes: item.notes || "",
    expectedImpactScore: item.expected_impact_score ?? null,
    confidenceScore: item.content_confidence_score ?? null,
    performanceScore: item.performance_score ?? null,
    qualityScore: item.quality_score ?? null,
    qualityValidation: item.quality_validation || null,
    brandFitScore: item.brand_fit_score ?? null,
    trendTitle: trendBasis.trend_title || item.trend_title || "",
    publishingSlot: item.publishing_slot || null,
    createdAt: item.created_at || null,
    updatedAt: item.updated_at || null,
  };
}

function simplifyTrendSignal(item) {
  return {
    id: Number(item.id),
    title: String(item.trend_title || item.title || "Trend-Signal"),
    description: String(item.trend_description || item.summary || ""),
    category: String(item.category || "Allgemein"),
    region: String(item.region || "AT"),
    source: String(item.source_name || item.source || ""),
    sourceCode: String(item.source_code || ""),
    relevance: Number(item.relevance_for_immoscout || 0),
    confidence: Number(item.confidence_score || 0),
    suggestedAngle: String(item.suggested_angle || ""),
    contentOpportunity: String(item.content_opportunity || ""),
    detectedAt: item.detected_at || item.observed_at || null,
    platformFit: item.platform_fit_json || item.platform_fit || null,
  };
}

function platformTone(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("instagram")) return "violet";
  if (normalized.includes("linkedin")) return "blue";
  if (normalized.includes("facebook")) return "teal";
  if (normalized.includes("newsletter")) return "amber";
  if (normalized.includes("tiktok")) return "orange";
  return "blue";
}

function summarizeCounts(values) {
  return values.reduce((acc, value) => {
    const key = String(value || "unknown");
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeEffortLabel(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric <= 2) return "low";
    if (numeric >= 4) return "high";
    return "medium";
  }
  const raw = String(value || "").toLowerCase();
  if (raw.includes("hoch") || raw.includes("high")) return "high";
  if (raw.includes("niedrig") || raw.includes("low")) return "low";
  return raw || "medium";
}

function normalizeTrendBasis(value) {
  if (!value || typeof value !== "object") return {};
  return {
    id: value.id ? Number(value.id) : null,
    trend_title: value.trend_title || value.title || "",
    trend_description: value.trend_description || value.summary || "",
    category: value.category || value.topic_cluster || "",
    region: value.region || "",
    source: value.source || value.source_code || "",
    sourceName: value.source_name || "",
    content_opportunity: value.content_opportunity || "",
    suggested_angle: value.suggested_angle || "",
    relevance_for_immoscout: value.relevance_for_immoscout ?? null,
    urgency_score: value.urgency_score ?? null,
  };
}

function assertWithinDirectory(targetPath, allowedDir) {
  const resolvedTarget = resolve(targetPath);
  const relativePath = relative(allowedDir, resolvedTarget);
  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
    throw badRequest("invalid_artifact_path", "Die angeforderte Datei liegt ausserhalb des erlaubten Exportordners.");
  }
  return resolvedTarget;
}
