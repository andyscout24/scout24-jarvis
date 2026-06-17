import { Permissions, hasPermission, requirePermission } from "./permissions.mjs";
import { unauthorized } from "../errors/apiError.mjs";

export function createAuthService(repository, { authMode = "mock_header", supabaseAuthClient = null, publicAuthConfig = null } = {}) {
  const normalizedMode = normalizeAuthMode(authMode);

  return {
    getPublicAuthConfig() {
      return publicAuthConfig || {
        mode: normalizedMode,
        allowMockHeader: normalizedMode !== "supabase",
        allowSupabaseToken: Boolean(supabaseAuthClient),
        supabase: {
          enabled: false,
          url: "",
          publishableKey: "",
          passwordSignInEnabled: false,
        },
      };
    },

    async requireCurrentUser(req) {
      const accessToken = getBearerToken(req);
      if (accessToken && supabaseAuthClient) {
        const supabaseUser = await supabaseAuthClient.getUser(accessToken);
        const user = await resolveRepositoryUser(repository, supabaseUser);
        if (!user || !user.active) {
          throw unauthorized("unauthenticated", "Der Supabase-User ist nicht aktiv oder nicht freigeschaltet.");
        }
        return user;
      }

      if (normalizedMode === "supabase") {
        throw unauthorized("unauthenticated", "Bitte melde dich ueber Supabase Auth an.");
      }

      const userId = getHeader(req, "x-user-id");
      const email = getHeader(req, "x-user-email");
      if (!userId && !email) {
        throw unauthorized("unauthenticated", "Fuer diese API ist ein interner User-Kontext erforderlich.");
      }

      const user = userId ? await repository.getUserById(userId) : await repository.getUserByEmail(email);
      if (!user || !user.active) {
        throw unauthorized("unauthenticated", "Der angegebene User ist nicht aktiv oder existiert nicht.");
      }
      return user;
    },

    hasPermission(user, permission) {
      return hasPermission(user, permission);
    },

    requirePermission(user, permission, message) {
      return requirePermission(user, permission, message);
    },

    permissionsFor(user) {
      return Object.values(Permissions).filter((permission) => hasPermission(user, permission));
    },
  };
}

function getHeader(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(req) {
  const header = getHeader(req, "authorization");
  if (!header || typeof header !== "string") return "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token || "" : "";
}

async function resolveRepositoryUser(repository, supabaseUser) {
  const id = supabaseUser?.id;
  const email = supabaseUser?.email;
  if (id) {
    const byId = await repository.getUserById(id);
    if (byId) return byId;
  }
  if (email) {
    return repository.getUserByEmail(email);
  }
  return null;
}

function normalizeAuthMode(value) {
  const normalized = String(value || "mock_header").trim().toLowerCase();
  if (normalized === "supabase") return "supabase";
  if (normalized === "hybrid") return "hybrid";
  return "mock_header";
}
