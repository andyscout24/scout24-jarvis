import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));

export const rootDir = resolve(configDir, "../../..");
export const publicDir = join(rootDir, "public");
const configuredDataFilePath = process.env.DATA_FILE_PATH;
export const dbPath = configuredDataFilePath
  ? isAbsolute(configuredDataFilePath)
    ? configuredDataFilePath
    : join(rootDir, configuredDataFilePath)
  : join(rootDir, "data", "db.json");
export const serviceName = process.env.SERVICE_NAME || "social-jarvis-dashboard";
export const defaultPort = Number(process.env.PORT || 4173);
