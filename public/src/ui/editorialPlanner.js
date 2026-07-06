import { api } from "../api.js";

const STATUS_FLOW = [
  { code: "proposed", label: "Vorgeschlagen" },
  { code: "shortlisted", label: "Shortlist" },
  { code: "planned", label: "Geplant" },
  { code: "briefed", label: "Briefed" },
  { code: "in_creation", label: "In Creation" },
  { code: "in_review", label: "In Review" },
  { code: "approved", label: "Freigegeben" },
  { code: "scheduled", label: "Geplant im Tool" },
  { code: "published", label: "Veröffentlicht" },
];

let plannerIdeas = new Map();
let plannerSelectedIdeaId = null;

export function bindEditorialPlannerView({ plannerOverview, onReload, onError }) {
  const plannerRoot = document.getElementById("planner-detail-panel");
  if (!plannerRoot) return;

  const ideas = plannerOverview?.currentWeekPlan?.contentIdeas || plannerOverview?.latestPlan?.contentIdeas || [];
  plannerIdeas = new Map(ideas.map((idea) => [String(idea.id), idea]));
  plannerSelectedIdeaId = ideas[0] ? String(ideas[0].id) : null;

  bindTabs();
  bindFilters();
  bindIdeaSelection();
  bindStatusUpdates(onReload, onError);
  bindModal(plannerOverview, onReload, onError);
  bindDelete(onReload, onError);
  bindTrendRefresh(onReload, onError);
  highlightSelection(plannerSelectedIdeaId);
}

function bindTabs() {
  const tabs = [...document.querySelectorAll("[data-planner-tab]")];
  const panels = [...document.querySelectorAll("[data-planner-panel]")];
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-planner-tab");
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.getAttribute("data-planner-panel") === target));
    });
  });
}

function bindFilters() {
  const queryInput = document.getElementById("planner-filter-query");
  const channelSelect = document.getElementById("planner-filter-channel");
  const statusSelect = document.getElementById("planner-filter-status");
  const prioritySelect = document.getElementById("planner-filter-priority");
  const formatSelect = document.getElementById("planner-filter-format");
  const filterables = [...document.querySelectorAll("[data-idea-id]")];

  if (!queryInput || !channelSelect || !statusSelect || !prioritySelect || !formatSelect || !filterables.length) return;

  const applyFilters = () => {
    const query = queryInput.value.trim().toLowerCase();
    const channel = channelSelect.value;
    const status = statusSelect.value;
    const priority = prioritySelect.value;
    const format = formatSelect.value;

    filterables.forEach((element) => {
      const matches =
        (!query || String(element.getAttribute("data-idea-search") || "").toLowerCase().includes(query)) &&
        (!channel || (element.getAttribute("data-idea-channel") || "") === channel) &&
        (!status || (element.getAttribute("data-idea-status") || "") === status) &&
        (!priority || (element.getAttribute("data-idea-priority") || "") === priority) &&
        (!format || (element.getAttribute("data-idea-format") || "") === format);

      if (element.tagName === "TR") {
        element.hidden = !matches;
      } else {
        element.hidden = !matches;
      }
    });
  };

  [queryInput, channelSelect, statusSelect, prioritySelect, formatSelect].forEach((field) => {
    field.addEventListener("input", applyFilters);
    field.addEventListener("change", applyFilters);
  });

  applyFilters();
}

function bindIdeaSelection() {
  document.querySelectorAll("[data-idea-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const ideaId = button.getAttribute("data-idea-select");
      if (!ideaId) return;
      plannerSelectedIdeaId = ideaId;
      renderDetail(ideaId);
      highlightSelection(ideaId);
    });
  });
}

function bindStatusUpdates(onReload, onError) {
  document.querySelectorAll("[data-idea-status-select]").forEach((select) => {
    select.addEventListener("change", async () => {
      const ideaId = select.getAttribute("data-idea-status-select");
      const statusCode = select.value;
      if (!ideaId || !statusCode) return;
      select.disabled = true;
      try {
        await api.updateEditorialContentIdeaStatus(ideaId, statusCode);
        await onReload(`Status wurde auf ${statusLabel(statusCode)} gesetzt.`);
      } catch (error) {
        await onError(error, "Status konnte nicht aktualisiert werden.");
      } finally {
        select.disabled = false;
      }
    });
  });
}

function bindModal(plannerOverview, onReload, onError) {
  const modal = document.getElementById("planner-idea-modal");
  const form = document.getElementById("planner-idea-form");
  if (!modal || !form) return;

  const open = (ideaId = "new") => {
    const idea = ideaId !== "new" ? plannerIdeas.get(String(ideaId)) : null;
    fillIdeaForm(form, idea, plannerOverview);
    modal.hidden = false;
    document.body.classList.add("modal-open");
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll("[data-planner-open-modal]").forEach((button) => {
    button.addEventListener("click", () => open(button.getAttribute("data-planner-open-modal") || "new"));
  });
  document.querySelectorAll("[data-planner-close-modal]").forEach((button) => {
    button.addEventListener("click", close);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const payload = payloadFromIdeaForm(form);
    const ideaId = String(form.elements.ideaId.value || "").trim();

    submitButton.disabled = true;
    try {
      if (ideaId) {
        await api.updateEditorialContentIdea(ideaId, payload);
        close();
        await onReload("Content-Idee wurde aktualisiert.");
        return;
      }
      await api.createEditorialContentIdea(payload);
      close();
      await onReload("Content-Idee wurde angelegt.");
    } catch (error) {
      await onError(error, "Content-Idee konnte nicht gespeichert werden.");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function bindDelete(onReload, onError) {
  document.querySelectorAll("[data-planner-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const ideaId = button.getAttribute("data-planner-delete-id");
      if (!ideaId) return;
      if (!window.confirm("Soll diese Content-Idee wirklich gelöscht werden?")) return;
      button.disabled = true;
      try {
        await api.deleteEditorialContentIdea(ideaId);
        await onReload("Content-Idee wurde gelöscht.");
      } catch (error) {
        await onError(error, "Content-Idee konnte nicht gelöscht werden.");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function bindTrendRefresh(onReload, onError) {
  document.querySelectorAll("[data-trend-refresh]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const result = await api.refreshEditorialTrendSignals({ persist: true, min_relevance: 60 });
        await onReload(`${result.refreshedCount || 0} Trend-Signale wurden aktualisiert.`);
      } catch (error) {
        await onError(error, "Trend-Signale konnten nicht aktualisiert werden.");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function fillIdeaForm(form, idea, plannerOverview) {
  const activePlanId = plannerOverview?.currentWeekPlan?.id || plannerOverview?.latestPlan?.id || "";
  form.reset();
  form.elements.ideaId.value = idea?.backendId || idea?.id || "";
  form.elements.editorialPlanId.value = idea?.editorialPlanId || activePlanId;
  form.elements.title.value = idea?.title || "";
  form.elements.channel_code.value = idea?.platformCode || "instagram";
  form.elements.format_code.value = idea?.formatCode || "reel";
  form.elements.target_audience.value = idea?.targetAudience || "";
  form.elements.posting_date.value = idea?.postingDate || "";
  form.elements.posting_time.value = idea?.postingTime || "10:00";
  form.elements.funnel_goal.value = idea?.funnelGoal || "awareness";
  form.elements.priority.value = idea?.priority || "medium";
  form.elements.effort.value = idea?.effort || "medium";
  form.elements.responsible_person_email.value = idea?.responsibleEmail || "social-media@immoscout24.at";
  form.elements.status_code.value = idea?.statusCode || "planned";
  form.elements.trend_title.value = idea?.trendBasis?.trend_title || "";
  form.elements.description.value = idea?.description || "";
  form.elements.short_description.value = idea?.shortDescription || "";
  form.elements.hook.value = idea?.hook || "";
  form.elements.caption_suggestion.value = idea?.captionDraft || "";
  form.elements.cta.value = idea?.cta || "";
  form.elements.creative_direction.value = idea?.creativeDirection || "";
  form.elements.timing_reason.value = idea?.timingReason || "";
  form.elements.asset_requirements_text.value = formatAssetRequirements(idea?.requiredAssets || []);
  form.elements.notes.value = idea?.notes || "";
}

function payloadFromIdeaForm(form) {
  const trendTitle = String(form.elements.trend_title.value || "").trim();
  const statusCode = String(form.elements.status_code.value || "planned").trim();

  return {
    editorial_plan_id: Number(form.elements.editorialPlanId.value || 0),
    title: String(form.elements.title.value || "").trim(),
    description: String(form.elements.description.value || "").trim(),
    short_description: String(form.elements.short_description.value || "").trim(),
    channel_code: String(form.elements.channel_code.value || "").trim(),
    format_code: String(form.elements.format_code.value || "").trim(),
    posting_date: String(form.elements.posting_date.value || "").trim(),
    posting_time: String(form.elements.posting_time.value || "").trim(),
    target_audience: String(form.elements.target_audience.value || "").trim(),
    funnel_goal: String(form.elements.funnel_goal.value || "").trim(),
    hook: String(form.elements.hook.value || "").trim(),
    caption_suggestion: String(form.elements.caption_suggestion.value || "").trim(),
    cta: String(form.elements.cta.value || "").trim(),
    creative_direction: String(form.elements.creative_direction.value || "").trim(),
    timing_reason: String(form.elements.timing_reason.value || "").trim(),
    priority: String(form.elements.priority.value || "").trim(),
    effort: String(form.elements.effort.value || "").trim(),
    status_code: statusCode,
    responsible_person_email: String(form.elements.responsible_person_email.value || "").trim(),
    notes: String(form.elements.notes.value || "").trim(),
    asset_requirements: parseAssetRequirements(form.elements.asset_requirements_text.value),
    trend_basis: trendTitle
      ? {
          trend_title: trendTitle,
          title: trendTitle,
          category: "Redaktion",
          region: "Austria",
          source: "manual",
        }
      : undefined,
  };
}

function parseAssetRequirements(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [maybeType, ...rest] = line.includes(":") ? line.split(":") : ["asset", line];
      const description = (rest.length ? rest.join(":") : maybeType).trim();
      const type = (rest.length ? maybeType : "asset").trim() || "asset";
      return {
        asset_type: type,
        description,
        is_required: true,
        status: "open",
      };
    });
}

function formatAssetRequirements(assets) {
  return assets
    .map((asset) => `${asset.type || asset.asset_type || "asset"}: ${asset.description || ""}`.trim())
    .join("\n");
}

function renderDetail(ideaId) {
  const panel = document.getElementById("planner-detail-panel");
  const idea = plannerIdeas.get(String(ideaId));
  if (!panel || !idea) return;

  const warnings = Array.isArray(idea.qualityValidation?.warnings) ? idea.qualityValidation.warnings : [];
  const suggestions = Array.isArray(idea.qualityValidation?.improvementSuggestions) ? idea.qualityValidation.improvementSuggestions : [];
  const assets = idea.requiredAssets || [];
  const trend = idea.trendBasis || {};

  panel.innerHTML = `
    <div class="planner-detail-stack">
      <div class="planner-detail-head">
        <div>
          <strong>${escape(idea.title)}</strong>
          <p>${escape(idea.shortDescription || idea.description || "")}</p>
        </div>
        <div class="planner-detail-meta">
          <span class="status-chip status-chip-soft">${escape(idea.platform || "")}</span>
          <span class="status-chip status-chip-soft">${escape(statusLabel(idea.statusCode || idea.status))}</span>
        </div>
      </div>
      <div class="planner-detail-grid">
        ${detailItem("Datum", formatDate(idea.postingDate))}
        ${detailItem("Uhrzeit", idea.postingTime || "--")}
        ${detailItem("Format", idea.format || "--")}
        ${detailItem("Ziel", idea.funnelGoal || "--")}
        ${detailItem("Priorität", prettifyKey(idea.priority || "--"))}
        ${detailItem("Aufwand", prettifyKey(idea.effort || "--"))}
        ${detailItem("Verantwortlich", idea.responsible || "--")}
        ${detailItem("Brand Fit", idea.brandFitScore != null ? `${Math.round(idea.brandFitScore)}/100` : "--")}
      </div>
      ${block("Hook", idea.hook || "Kein Hook hinterlegt.")}
      ${block("Caption-Entwurf", idea.captionDraft || "Noch kein Caption-Entwurf hinterlegt.")}
      ${block("CTA", idea.cta || "Noch keine CTA hinterlegt.")}
      ${block("Creative Direction", idea.creativeDirection || "Noch keine Creative Direction hinterlegt.")}
      ${block("Timing-Begründung", idea.timingReason || "Noch keine Timing-Begründung hinterlegt.")}
      ${block("Trendgrundlage", `<strong>${escape(trend.trend_title || "Manuell gesetzt")}</strong><p>${escape(trend.trend_description || trend.content_opportunity || "Keine Trendbeschreibung hinterlegt.")}</p><p>${escape([trend.category, trend.region, trend.sourceName || trend.source].filter(Boolean).join(" · ") || "Keine Quelle")}</p>`, true)}
      ${block("Benötigte Assets", assets.length ? `<ul class="planner-list">${assets.map((asset) => `<li>${escape(asset.type || "")} · ${escape(asset.description || "")}</li>`).join("")}</ul>` : "Noch keine Assets hinterlegt.", true)}
      ${block("Qualitätsprüfung", `Score ${Math.round(idea.qualityScore || 0)} / 100`, false)}
      ${warnings.length ? block("Warnungen", `<ul class="planner-list">${warnings.map((warning) => `<li>${escape(warning)}</li>`).join("")}</ul>`, true) : ""}
      ${suggestions.length ? block("Empfehlungen", `<ul class="planner-list">${suggestions.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`, true) : ""}
      ${block("Notizen", idea.notes || "Noch keine Notizen hinterlegt.")}
    </div>
  `;
}

function highlightSelection(ideaId) {
  document.querySelectorAll("[data-idea-select]").forEach((element) => {
    element.classList.toggle("is-selected", element.getAttribute("data-idea-select") === ideaId);
  });
}

function statusLabel(code) {
  return STATUS_FLOW.find((status) => status.code === code)?.label || prettifyKey(code);
}

function detailItem(label, value) {
  return `<div class="planner-detail-item"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`;
}

function block(label, value, allowHtml = false) {
  return `
    <div class="planner-detail-block">
      <h4>${escape(label)}</h4>
      ${allowHtml ? `<div>${value}</div>` : `<p>${escape(value)}</p>`}
    </div>
  `;
}

function prettifyKey(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function escape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
