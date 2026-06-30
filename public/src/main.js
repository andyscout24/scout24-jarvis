import { api } from "./api.js";
import { getAuthState } from "./auth/session.js";
import {
  canAccessRoute,
} from "./auth/permissions.js";
import { Shell } from "./components/Shell.js";
import { EmptyState } from "./components/EmptyState.js";
import { PageHeader } from "./components/PageHeader.js";
import { getEmptyDashboardData, loadDashboardData } from "./data/dashboardData.js";
import { offerPayloadFromForm, reportPayloadFromForm } from "./forms/formPayloads.js";
import { getRoute } from "./router.js";
import { bindAutomationHubFilters, bindActivityLogFilters, bindReportingFilters } from "./ui/filters.js";
import { bindToolOpenLogging } from "./ui/toolOpenLogging.js";
import { ActivityView } from "./views/ActivityView.js";
import { DashboardView } from "./views/DashboardView.js";
import { OfferGeneratorView } from "./views/OfferGeneratorView.js";
import { ReportingCenterView } from "./views/ReportingCenterView.js";
import { SettingsView } from "./views/SettingsView.js";
import { AuthView } from "./views/AuthView.js";
import { HelpView } from "./views/HelpView.js";
import { ToolDetailView } from "./views/ToolDetailView.js";
import { ToolsView } from "./views/ToolsView.js";

const app = document.getElementById("app");

let state = {
  data: getEmptyDashboardData(),
  currentUser: null,
  authConfig: null,
  authRequired: false,
  authState: getAuthState(),
  apiStatus: "loading",
  error: "",
  warnings: [],
  authError: "",
  notice: "",
  loading: true,
};

window.addEventListener("hashchange", () => render());
window.addEventListener("DOMContentLoaded", () => loadData());

async function loadData(options = {}) {
  state = {
    ...state,
    loading: true,
    error: "",
    warnings: [],
    authError: "",
    notice: options.notice || "",
    apiStatus: "loading",
  };
  render();

  try {
    const { authConfig, currentUser, data } = await loadDashboardData();

    state = {
      ...state,
      currentUser,
      authConfig,
      authRequired: false,
      authState: getAuthState(),
      apiStatus: data.meta.partial ? "degraded" : "connected",
      data,
      error: "",
      warnings: data.meta.warnings,
      notice: options.notice || "",
      loading: false,
    };
  } catch (error) {
    if (error.code === "unauthenticated") {
      let authConfig = state.authConfig;
      try {
        authConfig = authConfig || await api.getAuthConfig();
      } catch {
        // Keep last-known auth config if the public config endpoint is unavailable.
      }

      state = {
        ...state,
        currentUser: null,
        data: getEmptyDashboardData(),
        authConfig,
        authRequired: true,
        authState: getAuthState(),
        apiStatus: "connected",
        error: "",
        authError: "",
        loading: false,
      };
      render();
      return;
    }

    state = {
      ...state,
      authState: getAuthState(),
      apiStatus: error?.status ? "degraded" : "error",
      error: error.message || "Daten konnten nicht geladen werden.",
      data: getEmptyDashboardData(),
      warnings: [],
      loading: false,
    };
  }

  render();
}

function render() {
  const route = normalizeRoute(getRoute());
  const content = renderContent(route);

  app.innerHTML = Shell({
    active: route.active,
    title: route.title,
    content,
    error: state.error,
    warnings: state.warnings,
    notice: state.notice,
    loading: state.loading,
    currentUser: state.currentUser,
    authState: state.authState,
    authConfig: state.authConfig,
    apiStatus: state.apiStatus,
  });

  bindActions();
}

function renderContent(route) {
  if (state.authRequired) return AuthView(state.authConfig, { error: state.authError });
  if (route.name === "#/auth") {
    if (shouldRenderSupabaseAuth()) {
      return AuthView(state.authConfig, { error: state.authError });
    }
    return state.currentUser ? DashboardView(state.data, state.currentUser) : AuthView(state.authConfig, { error: state.authError });
  }
  if (!state.data) return "";
  if (!canAccessRoute(state.currentUser, route, state.data)) return AccessDeniedView(route);

  if (route.name === "#/tools") return ToolsView(state.data);
  if (route.name === "#/offers") return OfferGeneratorView(state.data, state.currentUser);
  if (route.name === "#/reporting") return ReportingCenterView(state.data, state.currentUser);
  if (route.name === "tool-detail") return ToolDetailView(state.data, route.toolId, state.currentUser);
  if (route.name === "#/activity") return ActivityView(state.data);
  if (route.name === "#/settings") return SettingsView(state.data);
  if (route.name === "#/help") return HelpView(state.data, state.currentUser);
  return DashboardView(state.data, state.currentUser);
}

function AccessDeniedView() {
  return `
    ${PageHeader({
      eyebrow: "Zugriff",
      title: "Nicht freigegeben",
      description: "Deine Rolle hat fuer diesen Bereich keine Berechtigung.",
      actions: [{ label: "Zur Uebersicht", href: "#/", icon: "dashboard" }],
    })}
    ${EmptyState({ title: "Kein Zugriff", message: "Wende dich an einen Admin, wenn du diesen Bereich fuer deine Arbeit brauchst.", iconName: "ban" })}
  `;
}

function bindActions() {
  document.getElementById("refresh-dashboard")?.addEventListener("click", () => loadData());
  document.getElementById("sign-out-button")?.addEventListener("click", async () => {
    api.signOut();
    await loadData({ notice: "Du wurdest abgemeldet." });
  });
  bindAutomationHubFilters();
  bindActivityLogFilters();
  bindReportingFilters();
  bindToolOpenLogging(api);

  document.getElementById("auth-sign-in-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    submitButton.disabled = true;
    try {
      await api.signInWithSupabase({ email, password, authConfig: state.authConfig });
      await loadData({ notice: "Anmeldung erfolgreich." });
      if (window.location.hash === "#/auth") {
        window.location.replace("#/");
      }
    } catch (error) {
      state = {
        ...state,
        apiStatus: error?.status ? "connected" : "error",
        authError: error.message || "Anmeldung fehlgeschlagen.",
        error: "",
        warnings: [],
        loading: false,
      };
      render();
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-status-update]").forEach((button) => {
    button.addEventListener("click", async () => {
      const toolId = button.getAttribute("data-tool-id");
      const status = button.getAttribute("data-status-update");
      button.disabled = true;

      try {
        await api.updateToolStatus(toolId, status);
        await loadData();
      } catch (error) {
        state = {
          ...state,
          apiStatus: error?.status ? state.apiStatus : "error",
          error: error.message || "Status konnte nicht aktualisiert werden.",
          warnings: [],
          loading: false,
        };
        render();
      }
    });
  });

  document.getElementById("offer-generator-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const payload = offerPayloadFromForm(form);

    submitButton.disabled = true;
    try {
      const result = await api.generateOffer(payload);
      form.reset();
      await loadData({ notice: `Angebot ${result.offer.offerNumber} wurde erstellt.` });
    } catch (error) {
        state = {
          ...state,
          apiStatus: error?.status ? state.apiStatus : "error",
          error: error.message || "Angebot konnte nicht erstellt werden.",
          notice: "",
          warnings: [],
          loading: false,
        };
        render();
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById("report-generator-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const payload = reportPayloadFromForm(form);

    submitButton.disabled = true;
    try {
      const result = await api.generateReport(payload);
      form.reset();
      await loadData({ notice: `Report ${result.report.fileName} wurde angelegt.` });
    } catch (error) {
        state = {
          ...state,
          apiStatus: error?.status ? state.apiStatus : "error",
          error: error.message || "Report konnte nicht erstellt werden.",
          notice: "",
          warnings: [],
          loading: false,
        };
        render();
    } finally {
      submitButton.disabled = false;
    }
  });
}

function normalizeRoute(route) {
  if (route.name === "#/auth" && state.currentUser && !state.authRequired && !shouldRenderSupabaseAuth()) {
    return {
      ...route,
      name: "#/",
      title: "Dashboard",
      active: "#/",
    };
  }
  return route;
}

function shouldRenderSupabaseAuth() {
  return Boolean(state.authConfig?.supabase?.enabled && !state.authState?.hasSupabaseSession);
}
