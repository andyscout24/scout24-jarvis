import { spawn } from "node:child_process";
import { access, readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { socialReportingProjectDir } from "../config/paths.mjs";

const sourceMap = {
  file: "file",
  csv_upload: "file",
  google_ad_manager: "file",
  google_ads: "file",
  newsletter: "file",
  fastapi_campaign_review: "file",
  meta: "meta",
  meta_api: "meta",
  swatio: "swatio",
  swat_io: "swatio",
  combined: "combined",
};

const sourceLabels = {
  file: "Datei-Import",
  meta: "Meta API",
  swatio: "Swat.io",
  combined: "Meta + Swat.io",
};

export async function runSocialReportingReport(body) {
  const projectPath = socialReportingProjectDir;
  const outputDir = join(projectPath, "data_output");
  const logsDir = join(projectPath, "logs");

  if (!await pathExists(projectPath)) {
    return {
      executed: false,
      reportStatus: "pending_connection",
      automationStatus: "failed",
      fallback: true,
      errorMessage: "Das Social Reporting Projekt wurde nicht gefunden.",
    };
  }

  const pythonPath = await resolvePythonExecutable(projectPath);
  if (!pythonPath) {
    return {
      executed: false,
      reportStatus: "pending_connection",
      automationStatus: "failed",
      fallback: true,
      errorMessage: "Keine Python-Runtime fuer das Social Reporting Tool gefunden.",
    };
  }

  const requestedSource = String(body.dataSource || "file").trim().toLowerCase();
  const source = sourceMap[requestedSource] || "file";
  const layout = resolveLayout(body.reportType);
  const outputName = `dashboard_${slugify(body.clientName || "report")}_${Date.now()}.xlsx`;
  const dateRange = resolveDateRange(body);
  const outputBefore = await latestFile(outputDir, isReportArtifact);
  const logBefore = await latestFile(logsDir, isLogArtifact);

  const args = [
    "-m",
    "src.main",
    "--source",
    source,
    "--output",
    "data_output",
    "--output-name",
    outputName,
    "--period",
    resolvePeriod(body.reportingPeriod),
    "--layout",
    layout,
    "--no-ai",
  ];

  if (source === "file") {
    args.push("--input", resolveInputPath(projectPath, body.inputPath));
  } else {
    args.push("--start-date", dateRange.startDate, "--end-date", dateRange.endDate);
  }

  const platform = normalizePlatform(body.channel);
  if (platform) args.push("--platform", platform);

  const commandResult = await runProcess(pythonPath, args, projectPath);
  const outputAfter = await latestFile(outputDir, (name) => isReportArtifact(name) && name === outputName);
  const latestOutput = outputAfter || await latestFile(outputDir, isReportArtifact);
  const latestLog = await latestFile(logsDir, isLogArtifact);
  const outputCreated = latestOutput && latestOutput.path !== outputBefore?.path ? latestOutput : outputAfter || latestOutput;
  const logCreated = latestLog && latestLog.path !== logBefore?.path ? latestLog : latestLog;
  const success = commandResult.code === 0 && Boolean(outputCreated);
  const errorMessage = success ? null : summarizeFailure(commandResult);

  return {
    executed: true,
    projectPath,
    pythonPath,
    source,
    sourceLabel: sourceLabels[source] || source,
    reportStatus: success ? "generated" : "error",
    automationStatus: success ? "succeeded" : "failed",
    fallback: !success,
    errorMessage,
    outputFileName: outputCreated ? basename(outputCreated.path) : outputName,
    outputFilePath: outputCreated?.path || null,
    outputCreatedAt: outputCreated?.modifiedAt || null,
    logFilePath: logCreated?.path || null,
    logCreatedAt: logCreated?.modifiedAt || null,
    stdoutPreview: shrinkText(commandResult.stdout),
    stderrPreview: shrinkText(commandResult.stderr),
    commandPreview: `${pythonPath} ${args.join(" ")}`,
    dateRange,
    layout,
  };
}

async function resolvePythonExecutable(projectPath) {
  const configuredPythonPath = String(process.env.SOCIAL_REPORTING_PYTHON_PATH || "").trim();
  const candidates = [
    configuredPythonPath,
    join(projectPath, ".venv", "bin", "python"),
    join(projectPath, ".venv", "Scripts", "python.exe"),
    "python3",
    "python",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "python3" || candidate === "python") return candidate;
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

function resolveInputPath(projectPath, requestedInputPath) {
  if (requestedInputPath) return requestedInputPath;
  const defaultFolder = resolve(projectPath, "data_input");
  return defaultFolder;
}

function resolveDateRange(body) {
  const endDate = normalizeDate(body.endDate) || isoDate(new Date());
  const startDate = normalizeDate(body.startDate) || isoDate(daysAgo(7));
  return { startDate, endDate };
}

function resolveLayout(reportType) {
  return reportType === "management_overview" ? "executive" : "weekly";
}

function resolvePeriod(reportingPeriod) {
  const normalized = String(reportingPeriod || "").toLowerCase();
  if (normalized.includes("monat")) return "monthly";
  if (normalized.includes("quarter")) return "quarterly";
  if (normalized.includes("woche") || normalized.includes("kw")) return "weekly";
  return "weekly";
}

function normalizePlatform(channel) {
  const value = String(channel || "").trim();
  if (!value || value === "Alle Kanaele") return "";
  if (value === "Social") return "";
  return value;
}

function normalizeDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

async function latestFile(dirPath, matcher) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(entries
      .filter((entry) => entry.isFile() && matcher(entry.name))
      .map(async (entry) => {
        const filePath = join(dirPath, entry.name);
        const fileStat = await stat(filePath);
        return {
          path: filePath,
          modifiedAt: fileStat.mtime.toISOString(),
          modifiedMs: fileStat.mtimeMs,
        };
      }));

    return files.sort((left, right) => right.modifiedMs - left.modifiedMs)[0] || null;
  } catch {
    return null;
  }
}

function isReportArtifact(fileName) {
  return fileName.endsWith(".xlsx") && !fileName.startsWith("~$");
}

function isLogArtifact(fileName) {
  return fileName.endsWith(".log");
}

function runProcess(command, args, cwd) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      resolvePromise({
        code: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
      });
    });

    child.on("close", (code) => {
      resolvePromise({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function summarizeFailure(commandResult) {
  return shrinkText(commandResult.stderr || commandResult.stdout || "Der externe Reportlauf ist fehlgeschlagen.");
}

function shrinkText(value, max = 500) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function slugify(value) {
  return String(value || "report")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64) || "report";
}
