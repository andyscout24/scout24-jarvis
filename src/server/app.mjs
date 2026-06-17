import { createServer } from "node:http";
import { defaultPort, publicDir, serviceName } from "./config/paths.mjs";
import { createApiRouter } from "./api/router.mjs";
import { createAuthService } from "./auth/authService.mjs";
import { createSupabaseAuthClient } from "./auth/supabaseAuthClient.mjs";
import { getAppEnvironment, getPublicAuthConfig, getSupabaseConfig } from "./config/env.mjs";
import { sendErrorResponse } from "./http/response.mjs";
import { createRepository } from "./persistence/repositoryFactory.mjs";
import { createAdminService } from "./services/adminService.mjs";
import { createAutomationService } from "./services/automationService.mjs";
import { createHealthService } from "./services/healthService.mjs";
import { createLogService } from "./services/logService.mjs";
import { createResultService } from "./services/resultService.mjs";
import { createUserService } from "./services/userService.mjs";
import { createStaticServer } from "./static/staticServer.mjs";

export function createApp() {
  const { repository, storageMode } = createRepository();
  const appEnvironment = getAppEnvironment();
  const publicAuthConfig = getPublicAuthConfig();
  const supabaseAuthClient = createSupabaseAuthClient(getSupabaseConfig());
  const services = {
    auth: createAuthService(repository, {
      authMode: appEnvironment.authMode,
      supabaseAuthClient,
      publicAuthConfig,
    }),
    automations: createAutomationService(repository),
    health: createHealthService(repository, { serviceName, storageMode }),
    logs: createLogService(repository),
    results: createResultService(repository),
    users: createUserService(repository),
    admin: createAdminService(repository),
  };
  const handleApi = createApiRouter(services);
  const serveStatic = createStaticServer(publicDir);

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }
      await serveStatic(res, url.pathname);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });
}

export function startServer({ port = defaultPort } = {}) {
  const server = createApp();
  server.listen(port, () => {
    console.log(`Social Jarvis Dashboard running at http://localhost:${port}`);
  });
  return server;
}
