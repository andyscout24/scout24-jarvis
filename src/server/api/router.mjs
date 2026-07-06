import { Permissions } from "../auth/permissions.mjs";
import { notFound } from "../errors/apiError.mjs";
import { getApiSegments, readJsonBody } from "../http/request.mjs";
import { sendBinary, sendSuccess } from "../http/response.mjs";

export function createApiRouter(services) {
  return async function handleApi(req, res, url) {
    const method = req.method || "GET";
    const segments = getApiSegments(url);

    if (method === "GET" && segments[0] === "health" && segments.length === 1) {
      const health = await services.health.getHealth();
      sendSuccess(res, health.status === "ok" ? 200 : 503, health, "API Health Check erfolgreich.");
      return;
    }

    if (method === "GET" && segments[0] === "auth" && segments[1] === "config" && segments.length === 2) {
      sendSuccess(res, 200, services.auth.getPublicAuthConfig(), "Auth-Konfiguration erfolgreich abgerufen.");
      return;
    }

    const currentUser = await services.auth.requireCurrentUser(req);

    if (method === "GET" && segments[0] === "auth" && segments[1] === "me" && segments.length === 2) {
      sendSuccess(res, 200, {
        user: currentUser,
        permissions: services.auth.permissionsFor(currentUser),
      }, "Aktueller User erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "tools" && segments.length === 1) {
      sendSuccess(res, 200, { tools: await services.automations.listTools(currentUser) }, "Tools erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "modules" && segments.length === 1) {
      sendSuccess(res, 200, { modules: await services.automations.listModules() }, "Module erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "tools" && segments[1] && segments.length === 2) {
      sendSuccess(res, 200, await services.automations.getToolDetail(segments[1], currentUser), "Tool erfolgreich abgerufen.");
      return;
    }

    if (method === "PATCH" && segments[0] === "tools" && segments[1] && segments[2] === "status") {
      const body = await readJsonBody(req);
      sendSuccess(
        res,
        200,
        { tool: await services.automations.updateToolStatus(segments[1], body, currentUser) },
        "Tool-Status erfolgreich aktualisiert.",
      );
      return;
    }

    if (method === "GET" && segments[0] === "logs" && segments.length === 1) {
      services.auth.requirePermission(currentUser, Permissions.VIEW_LOGS, "Nur Admins koennen Logs sehen.");
      const logs = await services.logs.listLogs({
        toolId: url.searchParams.get("toolId") || url.searchParams.get("tool_id"),
        status: url.searchParams.get("status") || url.searchParams.get("level"),
        limit: url.searchParams.get("limit"),
      });
      sendSuccess(res, 200, {
        logs,
      }, "Logs erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "activity-logs" && segments.length === 1) {
      services.auth.requirePermission(currentUser, Permissions.VIEW_LOGS, "Nur Admins koennen Activity Logs sehen.");
      const activityLogs = await services.logs.getActivityLogs({
        toolId: url.searchParams.get("toolId"),
        tool_id: url.searchParams.get("tool_id"),
        status: url.searchParams.get("status"),
        level: url.searchParams.get("level"),
        action: url.searchParams.get("action"),
        limit: url.searchParams.get("limit"),
      });
      sendSuccess(res, 200, {
        activityLogs,
        logs: activityLogs,
      }, "Aktivitaeten erfolgreich abgerufen.");
      return;
    }

    if (method === "POST" && segments[0] === "logs" && segments.length === 1) {
      const body = await readJsonBody(req);
      sendSuccess(res, 201, { log: await services.logs.createLog(body, currentUser) }, "Log-Eintrag erfolgreich erstellt.");
      return;
    }

    if (method === "POST" && segments[0] === "activity-logs" && segments.length === 1) {
      const body = await readJsonBody(req);
      const activityLog = await services.logs.createActivityLog(body, currentUser);
      sendSuccess(res, 201, { activityLog, log: activityLog }, "Aktivitaet erfolgreich protokolliert.");
      return;
    }

    if (method === "GET" && segments[0] === "automations" && segments.length === 1) {
      sendSuccess(res, 200, { automations: await services.automations.listAutomations(currentUser) }, "Automationen erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "automations" && segments[1] === "status" && segments.length === 2) {
      sendSuccess(res, 200, { status: await services.automations.getAutomationStatus(currentUser) }, "Automatisierungsstatus erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "offers" && segments.length === 1) {
      sendSuccess(res, 200, { offers: await services.results.listOffers(currentUser) }, "Angebote erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "offers" && segments[1] && segments.length === 2) {
      sendSuccess(res, 200, { offer: await services.results.getOffer(segments[1], currentUser) }, "Angebot erfolgreich abgerufen.");
      return;
    }

    if (method === "POST" && segments[0] === "offers" && segments[1] === "generate" && segments.length === 2) {
      const body = await readJsonBody(req);
      sendSuccess(res, 202, { offer: await services.results.generateOffer(body, currentUser) }, "Angebotserstellung gestartet.");
      return;
    }

    if (method === "GET" && segments[0] === "reports" && segments.length === 1) {
      sendSuccess(res, 200, { reports: await services.results.listReports(currentUser) }, "Reports erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "reports" && segments[1] === "live-snapshot" && segments.length === 2) {
      const snapshot = await services.results.getLiveReportingSnapshot(currentUser, {
        source: url.searchParams.get("source") || "combined",
        startDate: url.searchParams.get("startDate") || url.searchParams.get("start_date") || "",
        endDate: url.searchParams.get("endDate") || url.searchParams.get("end_date") || "",
        platform: url.searchParams.get("platform") || "",
      });
      sendSuccess(res, 200, { snapshot }, "Live Reporting Snapshot erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "reports" && segments[1] && segments.length === 2) {
      sendSuccess(res, 200, { report: await services.results.getReport(segments[1], currentUser) }, "Report erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "reports" && segments[1] && segments[2] === "file" && segments.length === 3) {
      const artifact = await services.editorialPlanner.getReportArtifact(segments[1], currentUser);
      sendBinary(res, 200, artifact.body, {
        contentType: artifact.contentType,
        filename: artifact.filename,
      });
      return;
    }

    if (method === "POST" && segments[0] === "reports" && segments[1] === "generate" && segments.length === 2) {
      const body = await readJsonBody(req);
      sendSuccess(res, 202, { report: await services.results.generateReport(body, currentUser) }, "Report-Generierung gestartet.");
      return;
    }

    if (method === "GET" && segments[0] === "editorial-planner" && segments[1] === "overview" && segments.length === 2) {
      sendSuccess(res, 200, await services.editorialPlanner.getOverview(currentUser), "Redaktionsplan erfolgreich geladen.");
      return;
    }

    if (method === "POST" && segments[0] === "editorial-planner" && segments[1] === "generate" && segments.length === 2) {
      const body = await readJsonBody(req);
      sendSuccess(res, 201, await services.editorialPlanner.generatePlan(body, currentUser), "Redaktionsplan erfolgreich erzeugt.");
      return;
    }

    if (method === "GET" && segments[0] === "editorial-planner" && segments[1] === "plans" && segments.length === 2) {
      sendSuccess(
        res,
        200,
        await services.editorialPlanner.listPlans({
          market: url.searchParams.get("market") || "",
          status: url.searchParams.get("status") || "",
          limit: url.searchParams.get("limit") || "",
          offset: url.searchParams.get("offset") || "",
        }, currentUser),
        "Redaktionsplaene erfolgreich geladen.",
      );
      return;
    }

    if (method === "GET" && segments[0] === "editorial-planner" && segments[1] === "plans" && segments[2] && segments.length === 3) {
      sendSuccess(res, 200, await services.editorialPlanner.getPlan(segments[2], currentUser), "Redaktionsplan erfolgreich geladen.");
      return;
    }

    if (
      method === "GET"
      && segments[0] === "editorial-planner"
      && segments[1] === "plans"
      && segments[2]
      && segments[3] === "export"
      && segments.length === 4
    ) {
      const artifact = await services.editorialPlanner.exportPlan(segments[2], url.searchParams.get("format") || "csv", currentUser);
      sendBinary(res, 200, artifact.body, {
        contentType: artifact.contentType,
        filename: artifact.filename,
      });
      return;
    }

    if (method === "GET" && segments[0] === "editorial-planner" && segments[1] === "trend-signals" && segments.length === 2) {
      sendSuccess(
        res,
        200,
        await services.editorialPlanner.listTrendSignals({
          category: url.searchParams.get("category") || "",
          region: url.searchParams.get("region") || "",
          source: url.searchParams.get("source") || "",
          min_relevance: url.searchParams.get("min_relevance") || "",
          limit: url.searchParams.get("limit") || "",
        }, currentUser),
        "Trend-Signale erfolgreich geladen.",
      );
      return;
    }

    if (method === "POST" && segments[0] === "editorial-planner" && segments[1] === "trend-signals" && segments[2] === "refresh" && segments.length === 3) {
      const body = await readJsonBody(req);
      sendSuccess(res, 201, await services.editorialPlanner.refreshTrendSignals(body, currentUser), "Trend-Signale erfolgreich aktualisiert.");
      return;
    }

    if (method === "GET" && segments[0] === "editorial-planner" && segments[1] === "trend-sources" && segments.length === 2) {
      sendSuccess(res, 200, await services.editorialPlanner.listTrendSources(currentUser), "Trendquellen erfolgreich geladen.");
      return;
    }

    if (method === "POST" && segments[0] === "editorial-planner" && segments[1] === "content-ideas" && segments.length === 2) {
      const body = await readJsonBody(req);
      sendSuccess(res, 201, await services.editorialPlanner.createContentIdea(body, currentUser), "Content-Idee erfolgreich erstellt.");
      return;
    }

    if (method === "PATCH" && segments[0] === "editorial-planner" && segments[1] === "content-ideas" && segments[2] && segments.length === 3) {
      const body = await readJsonBody(req);
      sendSuccess(res, 200, await services.editorialPlanner.updateContentIdea(segments[2], body, currentUser), "Content-Idee erfolgreich aktualisiert.");
      return;
    }

    if (method === "DELETE" && segments[0] === "editorial-planner" && segments[1] === "content-ideas" && segments[2] && segments.length === 3) {
      await services.editorialPlanner.deleteContentIdea(segments[2], currentUser);
      sendSuccess(res, 200, { ok: true }, "Content-Idee erfolgreich geloescht.");
      return;
    }

    if (
      method === "PATCH"
      && segments[0] === "editorial-planner"
      && segments[1] === "content-ideas"
      && segments[2]
      && segments[3] === "status"
      && segments.length === 4
    ) {
      const body = await readJsonBody(req);
      sendSuccess(res, 200, await services.editorialPlanner.changeContentIdeaStatus(segments[2], body, currentUser), "Status erfolgreich aktualisiert.");
      return;
    }

    if (method === "GET" && segments[0] === "users" && segments.length === 1) {
      sendSuccess(res, 200, { users: await services.users.listUsers(currentUser) }, "User erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "api-connections" && segments.length === 1) {
      sendSuccess(res, 200, { apiConnections: await services.admin.listApiConnections(currentUser) }, "API-Verbindungen erfolgreich abgerufen.");
      return;
    }

    if (method === "GET" && segments[0] === "settings" && segments.length === 1) {
      sendSuccess(res, 200, { settings: await services.admin.listSettings(currentUser) }, "Settings erfolgreich abgerufen.");
      return;
    }

    throw notFound("not_found", "Die angeforderte API-Route existiert nicht.");
  };
}
