import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleUrl = typeof import.meta !== "undefined" && typeof import.meta.url === "string" ? import.meta.url : "";
const configDir = moduleUrl ? dirname(fileURLToPath(moduleUrl)) : ".";

export const rootDir = resolve(configDir, "../../..");
export const codexProjectsDir = resolve(rootDir, "..");
export const publicDir = join(rootDir, "public");
const configuredDataFilePath = process.env.DATA_FILE_PATH;
export const dbPath = configuredDataFilePath
  ? isAbsolute(configuredDataFilePath)
    ? configuredDataFilePath
    : join(rootDir, configuredDataFilePath)
  : join(rootDir, "data", "db.json");
export const serviceName = process.env.SERVICE_NAME || "social-jarvis-dashboard";
export const defaultPort = Number(process.env.PORT || 4173);

export const socialReportingProjectDir = resolveConfiguredProjectPath(
  process.env.SOCIAL_REPORTING_PROJECT_PATH,
  resolve(codexProjectsDir, "Reporting", "social_reporting"),
);

export const redaktionsplanProjectDir = resolveConfiguredProjectPath(
  process.env.REDAKTIONSPLAN_PROJECT_PATH,
  resolve(codexProjectsDir, "Redaktionsplan"),
);

function resolveConfiguredProjectPath(configuredPath, fallbackPath) {
  if (!configuredPath) return fallbackPath;
  return isAbsolute(configuredPath) ? configuredPath : resolve(rootDir, configuredPath);
}
