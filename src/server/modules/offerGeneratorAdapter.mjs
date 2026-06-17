import { LogLevels } from "../../shared/contracts.mjs";
import { createAuditLog } from "../logging/auditLogger.mjs";
import { optionalNumber, optionalString, publicMetadata, requireObject, requireString } from "../utils/validation.mjs";

export function buildOfferGenerationPayload(body, tool) {
  requireObject(body);

  const clientName = requireString(body, "clientName", { max: 180 });
  const industry = optionalString(body, "industry", { max: 120 }) || "Nicht angegeben";
  const budget = optionalNumber(body, "budget", { min: 0, max: 100000000 });
  const amount = budget ?? optionalNumber(body, "amount", { min: 0, max: 100000000 });
  const runtime = optionalString(body, "runtime", { max: 120 }) || optionalString(body, "duration", { max: 120 }) || "Nicht angegeben";
  const currency = (optionalString(body, "currency", { max: 3 }) || "EUR").toUpperCase();
  const actor = optionalString(body, "actor", { max: 120 }) || "Dashboard";
  const clientId = optionalString(body, "clientId", { max: 120 });
  const actorUserId = optionalString(body, "actorUserId", { max: 120 });
  const createdAt = new Date().toISOString();
  const idSeed = Date.now();
  const offerId = `offer-${idSeed}`;
  const runId = `run-offer-${idSeed}`;
  const offerNumber = `OFF-${new Date().getFullYear()}-${String(idSeed).slice(-5)}`;
  const safeSuffix = slugify(`${clientName}-${offerNumber}`) || "angebot";
  const outputFile = `${safeSuffix}.pdf`;
  const adapterReady = tool.status === "ready";

  const metadata = {
    ...publicMetadata(body.metadata),
    clientName,
    industry,
    budget: amount,
    runtime,
    generatedAt: createdAt,
    createdBy: actor,
    outputFile,
    outputUrl: null,
    adapter: "dashboard-offer-generator-wrapper",
  };

  const automationRun = {
    id: runId,
    automationId: "automation-offers-daily-index",
    toolId: tool.id,
    clientId,
    status: "succeeded",
    triggerSource: "manual",
    actorUserId,
    input: {
      clientName,
      industry,
      budget: amount,
      runtime,
      currency,
    },
    output: {
      offerId,
      offerNumber,
      fileName: outputFile,
      fileUrl: null,
      adapterReady,
    },
    errorCode: null,
    errorMessage: null,
    startedAt: createdAt,
    finishedAt: createdAt,
    createdAt,
  };

  const offer = {
    id: offerId,
    toolId: tool.id,
    clientId,
    automationRunId: runId,
    offerNumber,
    clientName,
    industry,
    budget: amount,
    runtime,
    status: adapterReady ? "generated" : "draft",
    amount,
    currency,
    fileName: outputFile,
    fileUrl: null,
    createdAt,
    updatedAt: createdAt,
    createdBy: actor,
    metadata,
  };

  const log = createAuditLog({
    toolId: tool.id,
    level: adapterReady ? LogLevels.SUCCESS : LogLevels.WARNING,
    action: "offer.created",
    message: adapterReady
      ? `Angebot fuer ${clientName} erstellt.`
      : `Angebot fuer ${clientName} wurde ueber den Dashboard-Wrapper angelegt.`,
    actor,
    metadata: {
      offerId,
      runId,
      offerNumber,
      outputFile,
      adapterReady,
    },
  });

  return { offer, automationRun, log };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}
