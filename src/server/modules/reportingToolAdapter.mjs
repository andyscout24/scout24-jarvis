import { LogLevels } from "../../shared/contracts.mjs";
import { getReportingSourceEnvStatus } from "../config/env.mjs";
import { badRequest } from "../errors/apiError.mjs";
import { createAuditLog } from "../logging/auditLogger.mjs";
import { optionalString, publicMetadata, requireObject, requireString } from "../utils/validation.mjs";

export const reportingDataSources = Object.freeze({
  csv_upload: {
    id: "csv_upload",
    label: "CSV / Excel Upload",
    state: "ready",
    description: "Unterstuetzt CSV, TSV, XLS und XLSX ueber das Campaign Review Tool.",
    requiredUploads: ["google_ad_manager_report"],
  },
  google_ad_manager: {
    id: "google_ad_manager",
    label: "Google Ad Manager",
    state: "ready",
    description: "Als Pflichtquelle im externen Campaign Review Tool vorhanden.",
    requiredUploads: ["google_ad_manager_report"],
  },
  google_ads: {
    id: "google_ads",
    label: "Google Ads",
    state: "ready",
    description: "Optionaler Upload fuer Paid-Search- und Campaign-Daten.",
    requiredUploads: ["google_ads_report"],
  },
  newsletter: {
    id: "newsletter",
    label: "Newsletter CSV",
    state: "ready",
    description: "Optionaler Upload fuer Newsletter KPIs.",
    requiredUploads: ["newsletter_report"],
  },
  fastapi_campaign_review: {
    id: "fastapi_campaign_review",
    label: "Campaign Review FastAPI",
    state: "external_reference_detected",
    description: "Externe FastAPI ist referenziert, wird im Dashboard aber noch nicht direkt mit Uploads angesteuert.",
    requiredUploads: ["google_ad_manager_report"],
  },
  swat_io: {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Social-Reporting API ist noch nicht angebunden.",
    requiredUploads: [],
  },
  meta_api: {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Meta Marketing API ist fuer das MVP als offene Verbindung markiert.",
    requiredUploads: [],
  },
  google_sheets: {
    id: "google_sheets",
    label: "Google Sheets",
    state: "pending_connection",
    description: "Sheets Import ist geplant, aber noch nicht verbunden.",
    requiredUploads: [],
  },
});

export function listReportingDataSources() {
  return Object.values(reportingDataSources);
}

export function buildReportGenerationPayload(body, tool) {
  requireObject(body);

  const clientName = requireString(body, "clientName", { max: 180 });
  const campaignName = optionalString(body, "campaignName", { max: 180 }) || `${clientName} Report`;
  const reportingPeriod = optionalString(body, "reportingPeriod", { max: 120 }) || "Nicht angegeben";
  const channel = optionalString(body, "channel", { max: 80 }) || "Alle Kanaele";
  const reportType = optionalString(body, "reportType", { max: 80 }) || "campaign_review";
  const dataSourceId = optionalString(body, "dataSource", { max: 80 }) || "csv_upload";
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
  const outputFile = `${safeSuffix}_review.pptx`;
  const pendingConnection = dataSource.state === "pending_connection";
  const externalPending = tool.integration?.state !== "ready";
  const fallback = pendingConnection || externalPending;
  const envStatus = getReportingSourceEnvStatus(dataSource.id);
  const missingConfig = envStatus?.missing || [];
  const errorMessage = pendingConnection
    ? `${dataSource.label} ist noch nicht verbunden.${missingConfig.length ? ` Fehlende Konfiguration: ${missingConfig.join(", ")}.` : ""} Der Reportlauf wurde als Metadaten-Eintrag gespeichert.`
    : null;

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
    outputUrl: null,
    error: errorMessage,
    missingConfig,
    fallback,
    adapter: "dashboard-reporting-tool-wrapper",
    externalService: {
      serviceName: tool.integration?.serviceName || "campaign_review_tool",
      baseUrl: tool.externalUrl || null,
      healthEndpoint: tool.integration?.healthEndpoint || "/api/health",
      previewEndpoint: tool.integration?.previewEndpoint || "/api/preview",
      generateEndpoint: tool.integration?.generateEndpoint || "/api/generate",
      state: tool.integration?.state || "unknown",
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
    status: "succeeded",
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
    errorCode: null,
    errorMessage: null,
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
    status: pendingConnection ? "pending_connection" : "generated",
    fileName: outputFile,
    fileUrl: null,
    errorMessage,
    createdAt,
    updatedAt: createdAt,
    createdBy: actor,
    metadata,
  };

  const log = createAuditLog({
    toolId: tool.id,
    level: pendingConnection ? LogLevels.WARNING : fallback ? LogLevels.INFO : LogLevels.SUCCESS,
    action: pendingConnection ? "report.pending_connection" : "report.created",
    message: pendingConnection
      ? `Reportlauf fuer ${clientName} gespeichert, Datenquelle ${dataSource.label} ist pending.`
      : `Reportlauf fuer ${clientName} angelegt.`,
    actor,
    metadata: {
      reportId,
      runId,
      reportType,
      dataSource: dataSource.id,
      outputFile,
      pendingConnection,
      fallback,
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
