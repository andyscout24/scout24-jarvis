import { createServer } from "node:http";
import { defaultPort, publicDir, serviceName } from "./config/paths.mjs";
import { createApiRouter } from "./api/router.mjs";
import { createAuthService } from "./auth/authService.mjs";
import { createSupabaseAuthClient } from "./auth/supabaseAuthClient.mjs";
import { getAppEnvironment, getPublicAuthConfig, getSupabaseConfig } from "./config/env.mjs";
import { createWebRequest, createWebResponse } from "./http/webAdapter.mjs";
import { sendErrorResponse } from "./http/response.mjs";
import { createRepository } from "./persistence/repositoryFactory.mjs";
import { createAdminService } from "./services/adminService.mjs";
import { createAutomationService } from "./services/automationService.mjs";
import { createHealthService } from "./services/healthService.mjs";
import { createLogService } from "./services/logService.mjs";
import { createResultService } from "./services/resultService.mjs";
import { createUserService } from "./services/userService.mjs";
import { createStaticServer } from "./static/staticServer.mjs";

export function createServices() {
  const { repository, storageMode } = createRepository();
  const appEnvironment = getAppEnvironment();
  const publicAuthConfig = getPublicAuthConfig();
  const supabaseAuthClient = createSupabaseAuthClient(getSupabaseConfig());
  return {
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
}

export function createNodeRequestHandler() {
  const services = createServices();
  const handleApi = createApiRouter(services);
  const serveStatic = createStaticServer(publicDir);

  return async function handleNodeRequest(req, res) {
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
  };
}

export function createApp() {
  return createServer(createNodeRequestHandler());
}

export function startServer({ port = defaultPort } = {}) {
  const server = createApp();
  server.listen(port, () => {
    console.log(`Social Jarvis Dashboard running at http://localhost:${port}`);
  });
  return server;
}

export function createWorkerFetchHandler({ assetsBindingName = "ASSETS" } = {}) {
  const services = createServices();
  const handleApi = createApiRouter(services);

  return async function handleWorkerFetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const req = createWebRequest(request);
      const res = createWebResponse();
      try {
        await handleApi(req, res, url);
      } catch (error) {
        sendErrorResponse(res, error);
      }
      return res.toResponse();
    }

    const assets = env?.[assetsBindingName];
    if (!assets || typeof assets.fetch !== "function") {
      return new Response("Static assets binding fehlt.", { status: 500 });
    }

    const assetResponse = await assets.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const fallbackUrl = new URL("/index.html", request.url);
    return assets.fetch(new Request(fallbackUrl.toString(), request));
  };
}
