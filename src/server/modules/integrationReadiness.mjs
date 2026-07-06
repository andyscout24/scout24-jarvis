import { access } from "node:fs/promises";
import { join } from "node:path";
import { redaktionsplanProjectDir, socialReportingProjectDir } from "../config/paths.mjs";

const editorialPlannerBaseUrl = process.env.EDITORIAL_PLANNER_BASE_URL || "http://127.0.0.1:8080";
const editorialPlannerMode = String(process.env.EDITORIAL_PLANNER_MODE || "auto").trim().toLowerCase();

export async function getIntegrationReadinessSummary() {
  const [socialReporting, editorialPlanner] = await Promise.all([
    getSocialReportingReadiness(),
    getEditorialPlannerReadiness(),
  ]);

  return {
    socialReporting,
    editorialPlanner,
  };
}

export async function getSocialReportingReadiness() {
  const projectExists = await pathExists(socialReportingProjectDir);
  const inputDir = join(socialReportingProjectDir, "data_input");
  const outputDir = join(socialReportingProjectDir, "data_output");
  const pythonPath = await resolveSocialReportingPython();

  return {
    toolId: "reporting-tool",
    toolName: "Social Reporting",
    projectPath: socialReportingProjectDir,
    status: projectExists && pythonPath ? "ready" : projectExists ? "missing_runtime" : "missing_project",
    projectExists,
    pythonPath,
    inputDirExists: await pathExists(inputDir),
    outputDirExists: await pathExists(outputDir),
    message: projectExists
      ? (pythonPath
        ? "CLI-Projekt und Python-Runtime sind verfuegbar."
        : "Projekt gefunden, aber keine Python-Runtime erkannt.")
      : "Das separate social_reporting Projekt wurde nicht gefunden.",
  };
}

export async function getEditorialPlannerReadiness() {
  if (editorialPlannerMode === "native") {
    return {
      toolId: "editorial-planner",
      toolName: "Redaktionsplan",
      projectPath: redaktionsplanProjectDir,
      baseUrl: "jarvis-native",
      status: "ready",
      projectExists: true,
      reachable: true,
      health: { status: "ok", mode: "native" },
      message: "Der Planner laeuft direkt nativ in Jarvis.",
    };
  }

  const projectExists = await pathExists(redaktionsplanProjectDir);
  const health = await fetchJson(`${editorialPlannerBaseUrl.replace(/\/+$/, "")}/api/health`);

  return {
    toolId: "editorial-planner",
    toolName: "Redaktionsplan",
    projectPath: redaktionsplanProjectDir,
    baseUrl: editorialPlannerBaseUrl,
    status: projectExists && health.ok ? "ready" : projectExists ? "offline" : "missing_project",
    projectExists,
    reachable: health.ok,
    health: health.payload,
    message: !projectExists
      ? "Das Redaktionsplan-Projekt wurde nicht gefunden."
      : health.ok
        ? "Der Planner-Service antwortet ueber /api/health."
        : "Projekt vorhanden, aber HTTP-Service ist aktuell nicht erreichbar.",
  };
}

async function resolveSocialReportingPython() {
  const candidates = [
    join(socialReportingProjectDir, ".venv", "bin", "python"),
    join(socialReportingProjectDir, ".venv", "Scripts", "python.exe"),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2500),
    });
    const payload = await response.json().catch(() => null);
    return {
      ok: response.ok,
      payload,
    };
  } catch {
    return {
      ok: false,
      payload: null,
    };
  }
}
