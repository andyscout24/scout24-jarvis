import { unauthorized } from "../errors/apiError.mjs";

export function createSupabaseAuthClient({ url, serviceRoleKey }) {
  if (!url || !serviceRoleKey) return null;

  const baseUrl = String(url).replace(/\/+$/, "");
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  return {
    async getUser(accessToken) {
      if (!accessToken) {
        throw unauthorized("missing_access_token", "Es wurde kein gueltiges Zugriffstoken uebergeben.");
      }

      const response = await fetch(`${baseUrl}/auth/v1/user`, {
        headers: {
          ...headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const text = await response.text();
      const payload = safeJson(text);

      if (!response.ok) {
        throw unauthorized(
          "invalid_access_token",
          payload?.msg || payload?.message || "Das Supabase-Token ist ungueltig oder abgelaufen.",
        );
      }

      return payload;
    },
  };
}

function safeJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
