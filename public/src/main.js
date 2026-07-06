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
import { bindEditorialPlannerView } from "./ui/editorialPlanner.js";
import { bindToolOpenLogging } from "./ui/toolOpenLogging.js";
import { formatCurrency } from "./utils.js";
import { ActivityView } from "./views/ActivityView.js";
import { ContentCreationView } from "./views/ContentCreationView.js";
import { DashboardView } from "./views/DashboardView.js";
import { EditorialPlannerView } from "./views/EditorialPlannerView.js";
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

  if (route.name === "#/offers") return OfferGeneratorView(state.data, state.currentUser);
  if (route.name === "#/editorial-planner") return EditorialPlannerView(state.data, state.currentUser);
  if (route.name === "#/reporting") return ReportingCenterView(state.data, state.currentUser);
  if (route.name === "#/content-creation") return ContentCreationView(state.data, state.currentUser);
  if (route.name === "tool-detail") return ToolDetailView(state.data, route.toolId, state.currentUser);
  if (route.name === "#/activity") return ActivityView(state.data);
  if (route.name === "#/settings") return SettingsView(state.data);
  if (route.name === "#/help") return HelpView(state.data, state.currentUser);
  return OfferGeneratorView(state.data, state.currentUser);
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
  bindEditorialPlannerView({
    plannerOverview: state.data?.plannerOverview,
    onReload: async (notice) => loadData({ notice }),
    onError: async (error, fallbackMessage) => {
      state = {
        ...state,
        apiStatus: error?.status ? state.apiStatus : "error",
        error: error?.message || fallbackMessage,
        notice: "",
        warnings: [],
        loading: false,
      };
      render();
    },
  });
  bindToolOpenLogging(api);
  bindOfferPreview();

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

  document.getElementById("editorial-planner-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const payload = {
      weekStartDate: String(form.elements.weekStartDate.value || ""),
      market: String(form.elements.market.value || "AT"),
    };

    submitButton.disabled = true;
    try {
      const result = await api.generateEditorialPlan(payload);
      await loadData({ notice: `Redaktionsplan fuer KW ${result.plan.calendarWeek}/${result.plan.calendarYear} wurde erzeugt.` });
    } catch (error) {
      state = {
        ...state,
        apiStatus: error?.status ? state.apiStatus : "error",
        error: error.message || "Redaktionsplan konnte nicht erzeugt werden.",
        notice: "",
        warnings: [],
        loading: false,
      };
      render();
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-download-report-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const reportId = button.getAttribute("data-download-report-id");
      button.disabled = true;
      try {
        const file = await api.downloadReportFile(reportId);
        triggerBrowserDownload(file.blob, file.filename || `report-${reportId}.xlsx`);
      } catch (error) {
        state = {
          ...state,
          apiStatus: error?.status ? state.apiStatus : "error",
          error: error.message || "Report-Datei konnte nicht geladen werden.",
          loading: false,
        };
        render();
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-export-plan-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const planId = button.getAttribute("data-export-plan-id");
      const format = button.getAttribute("data-export-format") || "csv";
      button.disabled = true;
      try {
        const file = await api.exportEditorialPlan(planId, format);
        triggerBrowserDownload(file.blob, file.filename || `editorial-plan-${planId}.${format}`);
      } catch (error) {
        state = {
          ...state,
          apiStatus: error?.status ? state.apiStatus : "error",
          error: error.message || "Plan-Export konnte nicht geladen werden.",
          loading: false,
        };
        render();
      } finally {
        button.disabled = false;
      }
    });
  });
}

function normalizeRoute(route) {
  if (route.name === "#/auth" && state.currentUser && !state.authRequired && !shouldRenderSupabaseAuth()) {
    return {
      ...route,
      name: "#/offers",
      title: "Angebotsgenerator",
      active: "#/offers",
    };
  }
  return route;
}

function shouldRenderSupabaseAuth() {
  return Boolean(state.authConfig?.supabase?.enabled && !state.authState?.hasSupabaseSession);
}

function bindOfferPreview() {
  const form = document.getElementById("offer-generator-form");
  if (!form) return;

  const update = () => {
    const formData = new FormData(form);
    const client = String(formData.get("clientName") || "").trim() || "Wohnbau Atlas GmbH";
    const industry = String(formData.get("industry") || "").trim() || "Immobilienentwicklung";
    const runtime = String(formData.get("runtime") || "").trim() || "6 Wochen";
    const budget = Number(formData.get("budget") || 15000) || 15000;
    const channels = formData.getAll("channels").map((value) => String(value)).filter(Boolean);

    setText("offer-preview-client", client);
    setText("offer-preview-industry", industry);
    setText("offer-preview-runtime", runtime);
    setHtml("offer-preview-channels", channels.length
      ? channels.map((channel) => `<span class="inline-tag">${channel}</span>`).join("")
      : `<span class="inline-tag">Keine Kanaele gewaehlt</span>`);
    setText("offer-preview-total", formatCurrency(budget));
    setText("offer-preview-media", formatCurrency(Math.round(budget * 0.6)));
    setText("offer-preview-creative", formatCurrency(Math.round(budget * 0.25)));
    setText("offer-preview-ops", formatCurrency(Math.round(budget * 0.15)));
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setHtml(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value;
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
