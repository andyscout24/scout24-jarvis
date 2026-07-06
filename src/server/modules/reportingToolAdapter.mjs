import { LogLevels } from "../../shared/contracts.mjs";
import { getReportingSourceEnvStatus } from "../config/env.mjs";
import { badRequest } from "../errors/apiError.mjs";
import { createAuditLog } from "../logging/auditLogger.mjs";
import { optionalString, publicMetadata, requireObject, requireString } from "../utils/validation.mjs";

export const reportingDataSources = Object.freeze({
  file: {
    id: "file",
    label: "Datei-Import",
    state: "ready",
    description: "CSV-, XLSX- und XLS-Dateien direkt aus dem social_reporting Projekt.",
    requiredUploads: ["social_export_file"],
  },
  combined: {
    id: "combined",
    label: "Meta + Swat.io",
    state: "pending_connection",
    description: "Kombiniert Paid- und Social-Daten, sobald beide API-Verbindungen konfiguriert sind.",
    requiredUploads: [],
  },
  swat_io: {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Social-Daten aus Swat.io fuer organische Performance und Community-Signale.",
    requiredUploads: [],
  },
  meta_api: {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Meta Paid Daten fuer Kampagnen und Performance-Auswertungen.",
    requiredUploads: [],
  },
  fastapi_campaign_review: {
    id: "fastapi_campaign_review",
    label: "Campaign Review FastAPI",
    state: "external_reference_detected",
    description: "Externe Campaign-Review-Webapp fuer PPTX-Workflows und Media-Reports.",
    requiredUploads: [],
  },
});

export function listReportingDataSources() {
  return Object.values(reportingDataSources);
}

export function buildReportGenerationPayload(body, tool, execution = null) {
  requireObject(body);

  const clientName = requireString(body, "clientName", { max: 180 });
  const campaignName = optionalString(body, "campaignName", { max: 180 }) || `${clientName} Report`;
  const reportingPeriod = optionalString(body, "reportingPeriod", { max: 120 }) || "Nicht angegeben";
  const channel = optionalString(body, "channel", { max: 80 }) || "Alle Kanaele";
  const reportType = optionalString(body, "reportType", { max: 80 }) || "campaign_review";
  const dataSourceId = optionalString(body, "dataSource", { max: 80 }) || "file";
  const dataSource = reportingDataSources[dataSourceId];
  if (!dataSource) {
    throw badRequest("invalid_data_source", "Die angegebene Datenquelle ist fuer das Reporting Tool nicht bekannt.");
  }

  const actor = optionalString(body, "actor", { max: 120 }) || "Dashboard";
  const clientId = optionalString(body, "clientId", { max: 120 });
  const actorUserId = optionalString(body, "actorUserId", { max: 120 });
  const createdAt = new Date().toISOString();
  const idSeed = Date.now();
  const reportId = `report-${idSeed}`;
  const runId = `run-report-${idSeed}`;
  const safeSuffix = slugify(`${clientName}-${campaignName}-${reportingPeriod}`) || "report";
  const outputFile = execution?.outputFileName || `${safeSuffix}_review.xlsx`;
  const pendingConnection = !execution && dataSource.state === "pending_connection";
  const externalPending = tool.integration?.state !== "ready";
  const fallback = execution ? Boolean(execution.fallback) : (pendingConnection || externalPending);
  const envStatus = getReportingSourceEnvStatus(dataSource.id);
  const missingConfig = envStatus?.missing || [];
  const errorMessage = execution?.errorMessage || (pendingConnection
    ? `${dataSource.label} ist noch nicht verbunden.${missingConfig.length ? ` Fehlende Konfiguration: ${missingConfig.join(", ")}.` : ""} Der Reportlauf wurde als Metadaten-Eintrag gespeichert.`
    : null);

  const kpiPlaceholders = buildKpiPlaceholders(dataSource);
  const metadata = {
    ...publicMetadata(body.metadata),
    reportType,
    reportingPeriod,
    dataSource: dataSource.id,
    dataSourceLabel: dataSource.label,
    dataSourceState: dataSource.state,
    channel,
    generatedAt: createdAt,
    createdBy: actor,
    outputFile,
    outputUrl: execution?.outputFilePath || null,
    error: errorMessage,
    internalOnly: true,
    internalOnlyMessage: "Das Social Reporting Tool ist ausschliesslich fuer interne Zwecke vorgesehen und nicht fuer Kundenzugriffe gedacht.",
    missingConfig,
    fallback,
    adapter: execution?.executed
      ? (execution.executionMode === "remote_api" ? "social-reporting-api-adapter" : "social-reporting-cli-adapter")
      : "dashboard-reporting-tool-wrapper",
    execution: execution ? {
      executed: true,
      projectPath: execution.projectPath,
      pythonPath: execution.pythonPath,
      source: execution.source,
      sourceLabel: execution.sourceLabel,
      commandPreview: execution.commandPreview,
      stdoutPreview: execution.stdoutPreview,
      stderrPreview: execution.stderrPreview,
      outputFilePath: execution.outputFilePath,
      outputCreatedAt: execution.outputCreatedAt,
      logFilePath: execution.logFilePath,
      logCreatedAt: execution.logCreatedAt,
      startDate: execution.dateRange?.startDate || null,
      endDate: execution.dateRange?.endDate || null,
      layout: execution.layout || null,
      executionMode: execution.executionMode || null,
      internalOnly: execution.internalOnly === true,
    } : null,
    externalService: {
      serviceName: tool.integration?.serviceName || "campaign_review_tool",
      baseUrl: tool.externalUrl || null,
      healthEndpoint: tool.integration?.healthEndpoint || "/api/health",
      previewEndpoint: tool.integration?.previewEndpoint || "/api/preview",
      generateEndpoint: tool.integration?.generateEndpoint || "/api/generate",
      state: execution?.executed
        ? (execution.executionMode === "remote_api" ? "social_reporting_api_connected" : "social_reporting_cli_connected")
        : (tool.integration?.state || "unknown"),
      sourceReference: tool.integration?.sourceReference || null,
    },
    requiredUploads: dataSource.requiredUploads,
    kpiPlaceholders,
  };

  const automationRun = {
    id: runId,
    automationId: "automation-report-cleanup",
    toolId: tool.id,
    clientId,
    status: execution?.automationStatus || "succeeded",
    triggerSource: "manual",
    actorUserId,
    input: {
      clientName,
      campaignName,
      reportingPeriod,
      channel,
      reportType,
      dataSource: dataSource.id,
    },
    output: {
      reportId,
      fileName: outputFile,
      fileUrl: null,
      pendingConnection,
      fallback,
    },
    errorCode: execution?.reportStatus === "error" ? "social_reporting_failed" : null,
    errorMessage: errorMessage || null,
    startedAt: createdAt,
    finishedAt: createdAt,
    createdAt,
  };

  const report = {
    id: reportId,
    toolId: tool.id,
    clientId,
    automationRunId: runId,
    clientName,
    campaignName,
    reportType,
    reportingPeriod,
    channel,
    dataSource: dataSource.id,
    dataSourceLabel: dataSource.label,
    status: execution?.reportStatus || (pendingConnection ? "pending_connection" : "generated"),
    fileName: outputFile,
    fileUrl: execution?.outputFilePath || null,
    errorMessage,
    createdAt,
    updatedAt: createdAt,
    createdBy: actor,
    metadata,
  };

  const log = createAuditLog({
    toolId: tool.id,
    level: execution?.reportStatus === "error"
      ? LogLevels.ERROR
      : pendingConnection
        ? LogLevels.WARNING
        : fallback
          ? LogLevels.INFO
          : LogLevels.SUCCESS,
    action: execution?.reportStatus === "error"
      ? "report.failed"
      : pendingConnection
        ? "report.pending_connection"
        : "report.created",
    message: execution?.reportStatus === "error"
      ? `Reportlauf fuer ${clientName} ist fehlgeschlagen.`
      : pendingConnection
        ? `Reportlauf fuer ${clientName} gespeichert, Datenquelle ${dataSource.label} ist pending.`
        : execution?.executed
          ? `Social Reporting Report fuer ${clientName} wurde erstellt.`
          : `Reportlauf fuer ${clientName} angelegt.`,
    actor,
    metadata: {
      reportId,
      runId,
      reportType,
      dataSource: dataSource.id,
      outputFile,
      internalOnly: true,
      pendingConnection,
      fallback,
      outputFilePath: execution?.outputFilePath || null,
      logFilePath: execution?.logFilePath || null,
    },
  });

  return { report, automationRun, log };
}

function buildKpiPlaceholders(dataSource) {
  return {
    reach: { label: "Reichweite", value: null, status: "pending_data", source: dataSource.id },
    impressions: { label: "Impressionen", value: null, status: "pending_data", source: dataSource.id },
    engagement: { label: "Engagement", value: null, status: "pending_data", source: dataSource.id },
    clicks: { label: "Klicks", value: null, status: "pending_data", source: dataSource.id },
    followerGrowth: { label: "Follower-Wachstum", value: null, status: "pending_data", source: dataSource.id },
    topFormats: { label: "Top-Formate", value: [], status: "pending_data", source: dataSource.id },
    recommendations: { label: "Optimierungsvorschlaege", value: [], status: "pending_data", source: dataSource.id },
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 90);
}
