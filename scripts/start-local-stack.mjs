import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { redaktionsplanProjectDir, rootDir } from "../src/server/config/paths.mjs";
import { getEditorialPlannerReadiness, getSocialReportingReadiness } from "../src/server/modules/integrationReadiness.mjs";

const dashboardPort = Number(process.env.PORT || 4173);
const plannerBaseUrl = process.env.EDITORIAL_PLANNER_BASE_URL || "http://127.0.0.1:8080";
const plannerPort = Number(new URL(plannerBaseUrl).port || 8080);
const plannerDbPath = process.env.EDITORIAL_PLANNER_DB_PATH || "data/editorial_planner.sqlite";

const children = [];
let shuttingDown = false;

const socialReporting = await getSocialReportingReadiness();
if (socialReporting.status !== "ready") {
  process.stderr.write(`Social Reporting nicht bereit: ${socialReporting.message}\n`);
  process.exit(1);
}

const planner = await getEditorialPlannerReadiness();
if (planner.status === "missing_project") {
  process.stderr.write(`Redaktionsplan nicht bereit: ${planner.message}\n`);
  process.exit(1);
}

if (planner.status !== "ready") {
  const plannerPython = resolvePlannerPython();
  if (!plannerPython) {
    process.stderr.write("Keine Python-Runtime fuer den Redaktionsplan gefunden.\n");
    process.exit(1);
  }

  process.stdout.write(`Starte Redaktionsplan-Service auf Port ${plannerPort} ...\n`);
  children.push(startProcess(
    plannerPython,
    ["-m", "weekly_editorial_planner", "--db", plannerDbPath, "--seed-mvp", "--port", String(plannerPort)],
    redaktionsplanProjectDir,
    "planner",
  ));

  await waitForHealth(`${plannerBaseUrl.replace(/\/+$/, "")}/api/health`, 15000);
}

process.stdout.write(`Starte Dashboard auf http://localhost:${dashboardPort} ...\n`);
children.push(startProcess(
  process.execPath,
  ["server.mjs"],
  rootDir,
  "dashboard",
));

process.stdout.write("\nLokaler Stack laeuft.\n");
process.stdout.write(`- Dashboard: http://localhost:${dashboardPort}\n`);
process.stdout.write(`- Redaktionsplan API: ${plannerBaseUrl}\n`);
process.stdout.write("- Social Reporting: wird on-demand ueber die Dashboard-API gestartet\n");
process.stdout.write("\nMit Ctrl+C beendest du den gesamten Stack.\n");

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function startProcess(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${String(chunk)}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${String(chunk)}`);
  });
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      process.stderr.write(`\n[${name}] beendet mit Code ${code}\n`);
      shutdown(1);
    }
  });

  return child;
}

async function waitForHealth(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(`Service unter ${url} wurde nicht rechtzeitig gesund.`);
}

function resolvePlannerPython() {
  const candidates = [
    join(redaktionsplanProjectDir, ".venv", "bin", "python"),
    join(redaktionsplanProjectDir, ".venv", "Scripts", "python.exe"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return "python3";
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  await sleep(250);
  process.exit(exitCode);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
