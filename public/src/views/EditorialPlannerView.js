import { PageHeader } from "../components/PageHeader.js";
import { icon } from "../icons.js";
import { escapeHtml, formatDateTime, formatNumber } from "../utils.js";

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

const CHANNEL_OPTIONS = [
  { code: "instagram", label: "Instagram" },
  { code: "tiktok", label: "TikTok" },
  { code: "linkedin", label: "LinkedIn" },
  { code: "facebook", label: "Facebook" },
  { code: "newsletter", label: "Newsletter" },
  { code: "blog_magazin", label: "Blog/Magazin" },
];

const FORMAT_OPTIONS = [
  { code: "reel", label: "Reel" },
  { code: "tiktok_short", label: "TikTok Short" },
  { code: "carousel", label: "Carousel" },
  { code: "static_post", label: "Static Post" },
  { code: "story", label: "Story" },
  { code: "poll", label: "Poll" },
  { code: "meme", label: "Meme" },
  { code: "linkedin_thought_leadership_post", label: "LinkedIn Thought Leadership Post" },
  { code: "market_insight_post", label: "Market Insight Post" },
  { code: "tutorial", label: "Tutorial" },
];

const PRIORITY_OPTIONS = [
  { code: "high", label: "Hoch" },
  { code: "medium", label: "Mittel" },
  { code: "low", label: "Niedrig" },
];

const EFFORT_OPTIONS = [
  { code: "low", label: "Niedrig" },
  { code: "medium", label: "Mittel" },
  { code: "high", label: "Hoch" },
];

const FUNNEL_OPTIONS = [
  { code: "awareness", label: "Awareness" },
  { code: "engagement", label: "Engagement" },
  { code: "traffic", label: "Traffic" },
  { code: "lead", label: "Lead" },
  { code: "retention", label: "Retention" },
];

const RESPONSIBLE_EMAILS = [
  "social-media@immoscout24.at",
  "content.lead@immoscout24.at",
  "brand.review@immoscout24.at",
  "design.ops@immoscout24.at",
  "performance.team@immoscout24.at",
];

const weekdayLabels = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function EditorialPlannerView(data) {
  const planner = data.plannerOverview;
  const activePlan = planner?.currentWeekPlan || planner?.latestPlan || null;
  const ideas = activePlan?.contentIdeas || [];
  const selectedIdea = ideas[0] || null;
  const trendSignals = planner?.trendSignals || [];
  const trendSources = planner?.trendSources || [];
  const channels = unique(ideas.map((idea) => idea.platform).filter(Boolean));
  const formats = unique(ideas.map((idea) => idea.format).filter(Boolean));
  const contentMix = summarizeBy(ideas, (idea) => idea.platform);
  const statusMix = summarizeBy(ideas, (idea) => idea.statusCode || idea.status);
  const topTrendTitles = unique(ideas.map((idea) => idea.trendTitle).filter(Boolean)).slice(0, 5);
  const quickWins = ideas.filter((idea) => idea.effort === "low").length;
  const openTasks = ideas.filter((idea) => !["scheduled", "published"].includes(idea.statusCode)).length;
  const marketInsightCount = ideas.filter((idea) => {
    const category = String(idea.trendBasis?.category || "").toLowerCase();
    return category.includes("markt") || category.includes("wohnen");
  }).length;
  const nextPosts = [...ideas]
    .sort((left, right) => `${left.postingDate} ${left.postingTime}`.localeCompare(`${right.postingDate} ${right.postingTime}`))
    .slice(0, 4);

  return `
    ${PageHeader({
      eyebrow: "Social Media",
      title: "Editorial Planner",
      description: "Komplett in Jarvis integriert: Woche generieren, Trends prüfen, Ideen priorisieren, Status steuern und Exporte auslösen.",
      actions: activePlan
        ? [
            { label: "CSV Export", href: "#/editorial-planner", icon: "file", primary: false },
          ]
        : [],
    })}

    <section class="kpi-row">
      ${plannerKpi("Aktive Woche", activePlan ? `KW ${activePlan.calendarWeek}` : "-", activePlan ? activePlan.market : "Kein Plan", "blue")}
      ${plannerKpi("Geplante Posts", formatNumber(ideas.length), `${channels.length} Kanäle`, "violet")}
      ${plannerKpi("Trend-Signale", formatNumber(trendSignals.length), planner?.connected ? "Service online" : "Service offline", "teal")}
      ${plannerKpi("Offene Aufgaben", formatNumber(openTasks), `${quickWins} Quick Wins`, "amber")}
    </section>

    <section class="workspace-grid workspace-grid-2">
      <article class="surface-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Automatisierung</p>
            <h3>Neue Woche anlegen</h3>
          </div>
          <span class="surface-meta">${planner?.automation?.enabled ? "Scheduler aktiv" : "Manueller Modus"}</span>
        </div>

        <form id="editorial-planner-form" class="modern-form form-stack">
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>Woche ab</span>
              <input name="weekStartDate" type="date" value="${escapeHtml(defaultWeekStart())}" required>
            </label>
            <label class="field">
              <span>Markt</span>
              <select name="market">
                <option value="AT">AT</option>
                <option value="DE">DE</option>
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button class="button primary" type="submit">${icon("calendar")}Neue Woche generieren</button>
            <button class="button" type="button" data-trend-refresh>${icon("refresh")}Trends aktualisieren</button>
          </div>
        </form>

        <div class="planner-summary-grid">
          ${metricTile("Kalenderwoche", activePlan ? `KW ${activePlan.calendarWeek}/${activePlan.calendarYear}` : "Noch offen")}
          ${metricTile("Posts nach Status", renderMiniBreakdown(statusMix))}
          ${metricTile("Content-Mix", renderChipStack(Object.keys(contentMix).length ? Object.entries(contentMix).map(([label, count]) => `${label} ${count}`) : ["Noch keine Inhalte"]))}
          ${metricTile("Top-Trends", renderChipStack(topTrendTitles.length ? topTrendTitles : ["Trend-Refresh empfohlen"]))}
        </div>
      </article>

      <article class="surface-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Wochenübersicht</p>
            <h3>Was das Team diese Woche steuert</h3>
          </div>
          <span class="surface-meta">${planner?.health?.status || "unknown"}</span>
        </div>

        <div class="planner-highlights">
          ${highlightRow("Kanäle", channels.length ? channels.join(", ") : "Noch keine Verteilung")}
          ${highlightRow("Wichtigste Trends", topTrendTitles.length ? topTrendTitles.join(" · ") : "Noch kein Trend-Fokus")}
          ${highlightRow("Offene Aufgaben", `${openTasks} Einträge vor Scheduling oder Veröffentlichung`)}
          ${highlightRow("Markt-/Wohnthemen", `${marketInsightCount} Inhalte mit Markt- oder Wohnbezug`)}
        </div>

        <div class="planner-upcoming-list">
          ${nextPosts.length
            ? nextPosts.map((idea) => `
                <button class="planner-upcoming-item" type="button" data-idea-select="${escapeHtml(String(idea.id))}">
                  <strong>${escapeHtml(formatDayLabel(idea.postingDate))} · ${escapeHtml(idea.postingTime || "--")}</strong>
                  <span>${escapeHtml(idea.platform)} · ${escapeHtml(idea.title)}</span>
                </button>
              `).join("")
            : `<div class="empty-inline">Sobald ein Plan existiert, erscheinen hier die nächsten Veröffentlichungen.</div>`}
        </div>
      </article>
    </section>

    <section class="surface-card">
      <div class="surface-card-header">
        <div>
          <p class="surface-kicker">Operative Steuerung</p>
          <h3>Kalender, Tabelle, Kanban und Trends</h3>
        </div>
        <div class="planner-action-row">
          <button class="button" type="button" data-planner-open-modal="new">${icon("sparkles")}Content-Idee hinzufügen</button>
          ${activePlan ? `<button class="button" type="button" data-export-plan-id="${escapeHtml(String(activePlan.id))}" data-export-format="csv">${icon("file")}CSV</button>` : ""}
          ${activePlan ? `<button class="button" type="button" data-export-plan-id="${escapeHtml(String(activePlan.id))}" data-export-format="json">${icon("file")}JSON</button>` : ""}
        </div>
      </div>

      <div class="planner-toolbar">
        <div class="planner-tab-bar">
          ${plannerTab("overview", "Wochenübersicht", true)}
          ${plannerTab("calendar", "Kalender")}
          ${plannerTab("table", "Tabelle")}
          ${plannerTab("kanban", "Kanban")}
          ${plannerTab("trends", "Trendquellen")}
        </div>
        <div class="planner-filter-bar">
          <label class="field">
            <span>Suche</span>
            <input id="planner-filter-query" type="search" placeholder="Titel, Hook, Trend, Kanal">
          </label>
          <label class="field">
            <span>Kanal</span>
            <select id="planner-filter-channel">
              <option value="">Alle</option>
              ${channels.map((channel) => `<option value="${escapeHtml(channel)}">${escapeHtml(channel)}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select id="planner-filter-status">
              <option value="">Alle</option>
              ${STATUS_FLOW.map((status) => `<option value="${escapeHtml(status.code)}">${escapeHtml(status.label)}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Priorität</span>
            <select id="planner-filter-priority">
              <option value="">Alle</option>
              ${PRIORITY_OPTIONS.map((priority) => `<option value="${escapeHtml(priority.code)}">${escapeHtml(priority.label)}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Format</span>
            <select id="planner-filter-format">
              <option value="">Alle</option>
              ${formats.map((format) => `<option value="${escapeHtml(format)}">${escapeHtml(format)}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>

      <div class="planner-layout">
        <div class="planner-main">
          <section class="planner-panel is-active" data-planner-panel="overview">
            <div class="planner-overview-grid">
              <article class="planner-overview-card">
                <h4>Posts nach Status</h4>
                ${renderCountList(statusMix, STATUS_FLOW)}
              </article>
              <article class="planner-overview-card">
                <h4>Content-Mix nach Kanal</h4>
                ${renderCountList(contentMix)}
              </article>
              <article class="planner-overview-card">
                <h4>Nächste Veröffentlichungen</h4>
                <div class="planner-mini-list">
                  ${nextPosts.length
                    ? nextPosts.map((idea) => `
                        <button class="planner-mini-row" type="button" data-idea-select="${escapeHtml(String(idea.id))}">
                          <span>${escapeHtml(formatDateShort(idea.postingDate))} · ${escapeHtml(idea.postingTime || "--")}</span>
                          <strong>${escapeHtml(idea.title)}</strong>
                        </button>
                      `).join("")
                    : `<div class="empty-inline">Noch keine Postings vorhanden.</div>`}
                </div>
              </article>
              <article class="planner-overview-card">
                <h4>Offene QA-Hinweise</h4>
                <div class="planner-mini-list">
                  ${ideasWithWarnings(ideas).length
                    ? ideasWithWarnings(ideas).slice(0, 4).map((idea) => `
                        <button class="planner-mini-row" type="button" data-idea-select="${escapeHtml(String(idea.id))}">
                          <span>${escapeHtml(idea.platform)} · Score ${escapeHtml(String(Math.round(idea.qualityScore || 0)))}</span>
                          <strong>${escapeHtml(idea.title)}</strong>
                        </button>
                      `).join("")
                    : `<div class="empty-inline">Keine kritischen Qualitätshinweise.</div>`}
                </div>
              </article>
            </div>
          </section>

          <section class="planner-panel" data-planner-panel="calendar">
            <div class="planner-calendar">
              ${renderCalendar(ideas)}
            </div>
          </section>

          <section class="planner-panel" data-planner-panel="table">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Uhrzeit</th>
                    <th>Kanal</th>
                    <th>Format</th>
                    <th>Titel</th>
                    <th>Hook</th>
                    <th>Ziel</th>
                    <th>Priorität</th>
                    <th>Aufwand</th>
                    <th>Verantwortlich</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${ideas.length
                    ? ideas.map((idea) => tableRow(idea)).join("")
                    : `<tr><td colspan="12">Noch keine Content-Ideen vorhanden.</td></tr>`}
                </tbody>
              </table>
            </div>
          </section>

          <section class="planner-panel" data-planner-panel="kanban">
            <div class="planner-kanban">
              ${STATUS_FLOW.map((status) => kanbanColumn(status, ideas)).join("")}
            </div>
          </section>

          <section class="planner-panel" data-planner-panel="trends">
            <div class="planner-overview-grid">
              <article class="planner-overview-card">
                <h4>Trendquellen</h4>
                <div class="planner-source-list">
                  ${trendSources.length
                    ? trendSources.map((source) => `
                        <div class="planner-source-card">
                          <strong>${escapeHtml(source.name || source.code || "Quelle")}</strong>
                          <span>${escapeHtml(source.source_type || "feed")} · ${source.is_active ? "aktiv" : "inaktiv"}</span>
                        </div>
                      `).join("")
                    : `<div class="empty-inline">Noch keine Trendquellen geladen.</div>`}
                </div>
              </article>
              <article class="planner-overview-card planner-trend-card-span">
                <h4>Aktuelle Trend-Signale</h4>
                <div class="planner-signal-list planner-signal-list-wide">
                  ${trendSignals.length
                    ? trendSignals.map((signal) => `
                        <div class="planner-signal-item">
                          <div>
                            <strong>${escapeHtml(signal.title)}</strong>
                            <p>${escapeHtml(signal.category)} · ${escapeHtml(signal.region)} · ${escapeHtml(signal.source)}</p>
                            <span>${escapeHtml(signal.contentOpportunity || signal.description || "")}</span>
                          </div>
                          <div class="planner-signal-scores">
                            <span class="status-chip status-chip-soft">Relevanz ${escapeHtml(String(Math.round(signal.relevance || 0)))}</span>
                            <span class="status-chip status-chip-soft">Confidence ${escapeHtml(String(Math.round(signal.confidence || 0)))}</span>
                          </div>
                        </div>
                      `).join("")
                    : `<div class="empty-inline">Noch keine Trend-Signale vorhanden.</div>`}
                </div>
              </article>
            </div>
          </section>
        </div>

        <aside class="planner-detail-card">
          <div class="surface-card-header">
            <div>
              <p class="surface-kicker">Detailansicht</p>
              <h3>Ausgewählte Content-Idee</h3>
            </div>
            ${selectedIdea ? `<button class="button" type="button" data-planner-open-modal="${escapeHtml(String(selectedIdea.id))}">${icon("settings")}Bearbeiten</button>` : ""}
          </div>
          <div id="planner-detail-panel">
            ${selectedIdea ? renderIdeaDetail(selectedIdea) : `<div class="empty-inline">Wähle eine Content-Idee aus, um Details, Brand Fit und Produktionshinweise zu sehen.</div>`}
          </div>
        </aside>
      </div>
    </section>

    ${renderIdeaModal(activePlan)}
  `;
}

function plannerKpi(label, value, meta, tone) {
  return `
    <article class="kpi-card-modern kpi-${escapeHtml(tone)}">
      <div class="kpi-card-top">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(meta)}</strong>
      </div>
      <div class="kpi-card-value">${escapeHtml(value)}</div>
    </article>
  `;
}

function plannerTab(id, label, active = false) {
  return `<button class="planner-tab ${active ? "is-active" : ""}" type="button" data-planner-tab="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
}

function metricTile(label, content) {
  return `
    <div class="planner-metric-tile">
      <strong>${escapeHtml(label)}</strong>
      <div>${content}</div>
    </div>
  `;
}

function highlightRow(label, value) {
  return `<div class="planner-highlight-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderChipStack(items) {
  return `<div class="planner-chip-stack">${items.map((item) => `<span class="status-chip status-chip-soft">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderMiniBreakdown(values) {
  const entries = Object.entries(values || {});
  if (!entries.length) return "Noch keine Daten";
  return entries
    .slice(0, 4)
    .map(([key, count]) => `${statusLabel(key)} ${count}`)
    .join(" · ");
}

function renderCountList(values, config = []) {
  const labels = new Map((config || []).map((item) => [item.code || item.label, item.label]));
  const entries = Object.entries(values || {});
  if (!entries.length) return `<div class="empty-inline">Noch keine Daten vorhanden.</div>`;
  return `
    <div class="planner-count-list">
      ${entries.map(([key, count]) => `
        <div class="planner-count-row">
          <span>${escapeHtml(labels.get(key) || prettifyKey(key))}</span>
          <strong>${escapeHtml(String(count))}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCalendar(ideas) {
  return weekdayLabels.map((weekday, index) => {
    const dayIdeas = ideas
      .filter((idea) => dayIndex(idea.postingDate) === index)
      .sort((left, right) => `${left.postingTime}`.localeCompare(`${right.postingTime}`));
    return `
      <article class="planner-calendar-day">
        <header>
          <strong>${escapeHtml(weekday)}</strong>
          <span>${escapeHtml(String(dayIdeas.length))} Posts</span>
        </header>
        <div class="planner-calendar-items">
          ${dayIdeas.length
            ? dayIdeas.map((idea) => calendarCard(idea)).join("")
            : `<div class="planner-calendar-empty">Kein Slot geplant</div>`}
        </div>
      </article>
    `;
  }).join("");
}

function calendarCard(idea) {
  return `
    <button
      class="planner-calendar-card"
      type="button"
      data-idea-select="${escapeHtml(String(idea.id))}"
      data-idea-id="${escapeHtml(String(idea.id))}"
      data-idea-search="${escapeHtml(searchText(idea))}"
      data-idea-channel="${escapeHtml(idea.platform || "")}"
      data-idea-status="${escapeHtml(idea.statusCode || "")}"
      data-idea-priority="${escapeHtml(idea.priority || "")}"
      data-idea-format="${escapeHtml(idea.format || "")}"
    >
      <div class="planner-calendar-card-top">
        <span class="status-chip status-chip-soft">${escapeHtml(idea.platform || "")}</span>
        <span>${escapeHtml(idea.postingTime || "--")}</span>
      </div>
      <strong>${escapeHtml(idea.title)}</strong>
      <span>${escapeHtml(idea.format || "")} · ${escapeHtml(statusLabel(idea.statusCode || idea.status))}</span>
    </button>
  `;
}

function tableRow(idea) {
  return `
    <tr
      data-idea-row
      data-idea-id="${escapeHtml(String(idea.id))}"
      data-idea-search="${escapeHtml(searchText(idea))}"
      data-idea-channel="${escapeHtml(idea.platform || "")}"
      data-idea-status="${escapeHtml(idea.statusCode || "")}"
      data-idea-priority="${escapeHtml(idea.priority || "")}"
      data-idea-format="${escapeHtml(idea.format || "")}"
    >
      <td>${escapeHtml(formatDateShort(idea.postingDate))}</td>
      <td>${escapeHtml(idea.postingTime || "--")}</td>
      <td>${escapeHtml(idea.platform || "")}</td>
      <td>${escapeHtml(idea.format || "")}</td>
      <td><button class="planner-row-link" type="button" data-idea-select="${escapeHtml(String(idea.id))}">${escapeHtml(idea.title)}</button></td>
      <td>${escapeHtml(idea.hook || "-")}</td>
      <td>${escapeHtml(idea.funnelGoal || "-")}</td>
      <td>${escapeHtml(prettifyKey(idea.priority || "-"))}</td>
      <td>${escapeHtml(prettifyKey(idea.effort || "-"))}</td>
      <td>${escapeHtml(idea.responsible || "-")}</td>
      <td>${statusSelect(idea)}</td>
      <td>
        <div class="planner-inline-actions">
          <button class="button small" type="button" data-planner-open-modal="${escapeHtml(String(idea.id))}">Bearbeiten</button>
          <button class="button small" type="button" data-planner-delete-id="${escapeHtml(String(idea.id))}">Löschen</button>
        </div>
      </td>
    </tr>
  `;
}

function kanbanColumn(status, ideas) {
  const items = ideas
    .filter((idea) => (idea.statusCode || "") === status.code)
    .sort((left, right) => `${left.postingDate} ${left.postingTime}`.localeCompare(`${right.postingDate} ${right.postingTime}`));

  return `
    <section class="planner-kanban-column">
      <header>
        <strong>${escapeHtml(status.label)}</strong>
        <span>${escapeHtml(String(items.length))}</span>
      </header>
      <div class="planner-kanban-list">
        ${items.length
          ? items.map((idea) => `
              <article
                class="planner-kanban-card"
                data-idea-card
                data-idea-id="${escapeHtml(String(idea.id))}"
                data-idea-search="${escapeHtml(searchText(idea))}"
                data-idea-channel="${escapeHtml(idea.platform || "")}"
                data-idea-status="${escapeHtml(idea.statusCode || "")}"
                data-idea-priority="${escapeHtml(idea.priority || "")}"
                data-idea-format="${escapeHtml(idea.format || "")}"
              >
                <button class="planner-kanban-card-button" type="button" data-idea-select="${escapeHtml(String(idea.id))}">
                  <div class="planner-kanban-card-top">
                    <span>${escapeHtml(idea.platform || "")}</span>
                    <span>${escapeHtml(idea.postingTime || "--")}</span>
                  </div>
                  <strong>${escapeHtml(idea.title)}</strong>
                  <p>${escapeHtml(idea.hook || idea.shortDescription || "")}</p>
                </button>
                ${statusSelect(idea)}
              </article>
            `).join("")
          : `<div class="planner-kanban-empty">Noch kein Inhalt in diesem Status.</div>`}
      </div>
    </section>
  `;
}

function statusSelect(idea) {
  return `
    <select class="planner-status-select" data-idea-status-select="${escapeHtml(String(idea.id))}">
      ${STATUS_FLOW.map((status) => `<option value="${escapeHtml(status.code)}" ${status.code === idea.statusCode ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
    </select>
  `;
}

function renderIdeaDetail(idea) {
  const quality = idea.qualityValidation || {};
  const warnings = Array.isArray(quality.warnings) ? quality.warnings : [];
  const suggestions = Array.isArray(quality.improvementSuggestions) ? quality.improvementSuggestions : [];
  const assets = idea.requiredAssets || [];
  const trend = idea.trendBasis || {};

  return `
    <div class="planner-detail-stack">
      <div class="planner-detail-head">
        <div>
          <strong>${escapeHtml(idea.title)}</strong>
          <p>${escapeHtml(idea.shortDescription || idea.description || "")}</p>
        </div>
        <div class="planner-detail-meta">
          <span class="status-chip status-chip-soft">${escapeHtml(idea.platform || "")}</span>
          <span class="status-chip status-chip-soft">${escapeHtml(statusLabel(idea.statusCode || idea.status))}</span>
        </div>
      </div>

      <div class="planner-detail-grid">
        ${detailItem("Datum", formatDateShort(idea.postingDate))}
        ${detailItem("Uhrzeit", idea.postingTime || "--")}
        ${detailItem("Format", idea.format || "--")}
        ${detailItem("Ziel", idea.funnelGoal || "--")}
        ${detailItem("Priorität", prettifyKey(idea.priority || "--"))}
        ${detailItem("Aufwand", prettifyKey(idea.effort || "--"))}
        ${detailItem("Verantwortlich", idea.responsible || "--")}
        ${detailItem("Brand Fit", idea.brandFitScore != null ? `${Math.round(idea.brandFitScore)}/100` : "--")}
      </div>

      <div class="planner-detail-block">
        <h4>Hook</h4>
        <p>${escapeHtml(idea.hook || "Kein Hook hinterlegt.")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>Caption-Entwurf</h4>
        <p>${escapeHtml(idea.captionDraft || "Noch kein Caption-Entwurf hinterlegt.")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>CTA</h4>
        <p>${escapeHtml(idea.cta || "Noch keine CTA hinterlegt.")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>Creative Direction</h4>
        <p>${escapeHtml(idea.creativeDirection || "Noch keine Creative Direction hinterlegt.")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>Benötigte Assets</h4>
        ${assets.length
          ? `<ul class="planner-list">${assets.map((asset) => `<li>${escapeHtml(asset.type)} · ${escapeHtml(asset.description)}</li>`).join("")}</ul>`
          : `<p>Noch keine Assets hinterlegt.</p>`}
      </div>

      <div class="planner-detail-block">
        <h4>Trendgrundlage</h4>
        <p><strong>${escapeHtml(trend.trend_title || "Manuell gesetzt")}</strong></p>
        <p>${escapeHtml(trend.trend_description || trend.content_opportunity || "Keine Trendbeschreibung hinterlegt.")}</p>
        <p>${escapeHtml([trend.category, trend.region, trend.sourceName || trend.source].filter(Boolean).join(" · ") || "Keine Quelle")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>Timing-Begründung</h4>
        <p>${escapeHtml(idea.timingReason || "Noch keine Timing-Begründung hinterlegt.")}</p>
      </div>

      <div class="planner-detail-block">
        <h4>Qualitätsprüfung</h4>
        <p>Score ${escapeHtml(String(Math.round(idea.qualityScore || 0)))} / 100</p>
        ${warnings.length ? `<ul class="planner-list">${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : `<p>Keine Warnungen.</p>`}
      </div>

      <div class="planner-detail-block">
        <h4>Empfehlungen</h4>
        ${suggestions.length ? `<ul class="planner-list">${suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p>Keine zusätzlichen Empfehlungen.</p>`}
      </div>

      <div class="planner-detail-block">
        <h4>Notizen</h4>
        <p>${escapeHtml(idea.notes || "Noch keine Notizen hinterlegt.")}</p>
      </div>
    </div>
  `;
}

function detailItem(label, value) {
  return `<div class="planner-detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderIdeaModal(activePlan) {
  return `
    <div id="planner-idea-modal" class="planner-modal" hidden>
      <div class="planner-modal-backdrop" data-planner-close-modal></div>
      <div class="planner-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Content-Idee</p>
            <h3 id="planner-modal-title">Inhalt bearbeiten</h3>
          </div>
          <button class="button" type="button" data-planner-close-modal>Schließen</button>
        </div>

        <form id="planner-idea-form" class="modern-form form-stack">
          <input type="hidden" name="ideaId">
          <input type="hidden" name="editorialPlanId" value="${escapeHtml(String(activePlan?.id || ""))}">

          <div class="field-grid field-grid-2">
            <label class="field">
              <span>Titel</span>
              <input name="title" type="text" required>
            </label>
            <label class="field">
              <span>Kanal</span>
              <select name="channel_code" required>${CHANNEL_OPTIONS.map((option) => `<option value="${escapeHtml(option.code)}">${escapeHtml(option.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Format</span>
              <select name="format_code" required>${FORMAT_OPTIONS.map((option) => `<option value="${escapeHtml(option.code)}">${escapeHtml(option.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Zielgruppe</span>
              <input name="target_audience" type="text" required>
            </label>
            <label class="field">
              <span>Posting-Datum</span>
              <input name="posting_date" type="date" required>
            </label>
            <label class="field">
              <span>Posting-Uhrzeit</span>
              <input name="posting_time" type="time" required>
            </label>
            <label class="field">
              <span>Funnel-Ziel</span>
              <select name="funnel_goal" required>${FUNNEL_OPTIONS.map((option) => `<option value="${escapeHtml(option.code)}">${escapeHtml(option.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Priorität</span>
              <select name="priority" required>${PRIORITY_OPTIONS.map((option) => `<option value="${escapeHtml(option.code)}">${escapeHtml(option.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Aufwand</span>
              <select name="effort" required>${EFFORT_OPTIONS.map((option) => `<option value="${escapeHtml(option.code)}">${escapeHtml(option.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Verantwortlich</span>
              <select name="responsible_person_email">${RESPONSIBLE_EMAILS.map((email) => `<option value="${escapeHtml(email)}">${escapeHtml(email)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Status</span>
              <select name="status_code">${STATUS_FLOW.map((status) => `<option value="${escapeHtml(status.code)}">${escapeHtml(status.label)}</option>`).join("")}</select>
            </label>
            <label class="field">
              <span>Trendtitel</span>
              <input name="trend_title" type="text">
            </label>
          </div>

          <label class="field">
            <span>Beschreibung</span>
            <textarea name="description" rows="3" required></textarea>
          </label>

          <label class="field">
            <span>Kurzbeschreibung</span>
            <textarea name="short_description" rows="2"></textarea>
          </label>

          <label class="field">
            <span>Hook</span>
            <textarea name="hook" rows="2" required></textarea>
          </label>

          <label class="field">
            <span>Caption-Entwurf</span>
            <textarea name="caption_suggestion" rows="3" required></textarea>
          </label>

          <div class="field-grid field-grid-2">
            <label class="field">
              <span>CTA</span>
              <input name="cta" type="text" required>
            </label>
            <label class="field">
              <span>Creative Direction</span>
              <input name="creative_direction" type="text">
            </label>
          </div>

          <label class="field">
            <span>Timing-Begründung</span>
            <textarea name="timing_reason" rows="2"></textarea>
          </label>

          <label class="field">
            <span>Benötigte Assets</span>
            <textarea name="asset_requirements_text" rows="3" placeholder="Eine Asset-Anforderung pro Zeile"></textarea>
          </label>

          <label class="field">
            <span>Notizen</span>
            <textarea name="notes" rows="3"></textarea>
          </label>

          <div class="form-actions">
            <button class="button primary" type="submit">${icon("check")}Speichern</button>
            <button class="button" type="button" data-planner-close-modal>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function unique(values) {
  return [...new Set(values)];
}

function summarizeBy(items, pick) {
  return items.reduce((accumulator, item) => {
    const key = String(pick(item) || "").trim();
    if (!key) return accumulator;
    accumulator[key] = Number(accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function ideasWithWarnings(ideas) {
  return ideas.filter((idea) => idea.qualityScore != null && Number(idea.qualityScore) < 75);
}

function searchText(idea) {
  return [
    idea.title,
    idea.hook,
    idea.platform,
    idea.format,
    idea.trendTitle,
    idea.targetAudience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function statusLabel(value) {
  return STATUS_FLOW.find((status) => status.code === value)?.label || prettifyKey(value);
}

function prettifyKey(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dayIndex(dateValue) {
  if (!dateValue) return -1;
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return -1;
  return (date.getDay() + 6) % 7;
}

function formatDateShort(value) {
  if (!value) return "--";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatDayLabel(value) {
  if (!value) return "--";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
}

function defaultWeekStart() {
  const today = new Date();
  const day = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - day);
  return today.toISOString().slice(0, 10);
}
