import { badRequest } from "../errors/apiError.mjs";

export function requireObject(body, code = "invalid_payload") {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest(code, "Der Request Body muss ein JSON-Objekt sein.");
  }
}

export function requireString(body, field, { min = 1, max = 160, code = "invalid_payload" } = {}) {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length < min) {
    throw badRequest(code, `Das Feld '${field}' ist erforderlich.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw badRequest(code, `Das Feld '${field}' ist zu lang.`);
  }
  return trimmed;
}

export function optionalString(body, field, { max = 240 } = {}) {
  const value = body[field];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw badRequest("invalid_payload", `Das Feld '${field}' muss Text sein.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw badRequest("invalid_payload", `Das Feld '${field}' ist zu lang.`);
  }
  return trimmed || null;
}

export function optionalNumber(body, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const value = body[field];
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw badRequest("invalid_payload", `Das Feld '${field}' muss eine gueltige Zahl sein.`);
  }
  return parsed;
}

export function publicMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const blocked = new Set(["token", "apiKey", "api_key", "secret", "password", "authorization"]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.has(key)));
}
