import { Permissions, requirePermission } from "../auth/permissions.mjs";
import { sanitizeApiConnectionForClient } from "../security/publicPayload.mjs";

export function createAdminService(repository) {
  return {
    async listApiConnections(currentUser) {
      requirePermission(currentUser, Permissions.MANAGE_API_CONNECTIONS, "Nur Admins koennen API-Verbindungen sehen.");
      const connections = await repository.getApiConnections();
      return connections.map(sanitizeApiConnectionForClient);
    },

    async listSettings(currentUser) {
      requirePermission(currentUser, Permissions.MANAGE_SETTINGS, "Nur Admins koennen Settings sehen.");
      const settings = await repository.getSettings();
      return settings.map((setting) => {
        if (!setting.isSecret) return setting;
        return {
          ...setting,
          value: null,
          valueConfigured: setting.value !== null && setting.value !== undefined && String(setting.value).length > 0,
          redacted: true,
        };
      });
    },
  };
}
