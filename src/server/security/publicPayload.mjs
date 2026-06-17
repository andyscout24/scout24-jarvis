const blockedKeys = new Set([
  "apiKey",
  "api_key",
  "authorization",
  "bearer",
  "clientSecret",
  "client_secret",
  "localPath",
  "local_path",
  "password",
  "privateKey",
  "private_key",
  "refreshToken",
  "refresh_token",
  "secret",
  "serviceRole",
  "service_role",
  "sourcePath",
  "source_path",
  "token",
]);

export function sanitizePublicPayload(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizePublicPayload(item));

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isBlockedPublicKey(key))
      .map(([key, item]) => [key, sanitizePublicPayload(item)]),
  );
}

export function sanitizeToolForClient(tool) {
  return sanitizePublicPayload(tool);
}

export function sanitizeApiConnectionForClient(connection) {
  return sanitizePublicPayload(connection);
}

function isBlockedPublicKey(key) {
  const normalized = String(key)
    .replace(/[-_\s]/g, "")
    .toLowerCase();
  return blockedKeys.has(key) || [
    "apikey",
    "authorization",
    "bearer",
    "clientsecret",
    "localpath",
    "password",
    "privatekey",
    "refreshtoken",
    "secret",
    "servicerole",
    "sourcepath",
    "token",
  ].includes(normalized);
}
