import { PageHeader } from "../components/PageHeader.js";
import { canCreateReports } from "../auth/permissions.js";
import { ReportGeneratorForm } from "../components/ReportGeneratorForm.js";
import { MetricStrip } from "../components/MetricStrip.js";
import { reportingSources } from "../modules/reporting/sources.js";
import { formatDateTime, formatNumber, formatPercent, newestFirst, escapeHtml, statusBadge } from "../utils.js";

export function ReportingCenterView(data, currentUser) {
  const reports = newestFirst(data.reports.filter((report) => report.toolId === "reporting-tool"));
  const reportingTool = data.tools.find((tool) => tool.id === "reporting-tool");
  const snapshot = data.reportingSnapshot;
  const latest = reports[0];
  const kpis = buildKpis(reports, reportingTool);
  const chartPoints = buildChartPoints(reports);
  const runStates = summarizeRunStates(reports);
  const liveMetrics = buildLiveMetrics(snapshot);
  const sourcePills = buildSourcePills(snapshot);
  const platformRows = (snapshot?.platforms || []).slice(0, 4);

  return `
    ${PageHeader({
      eyebrow: "Social Media",
      title: "Reporting & Analytics",
      description: "Das Dashboard steuert das echte social_reporting Projekt, zeigt Exportlaeufe an und startet neue Social-Media-Reports direkt aus der Arbeitsoberflaeche.",
      actions: [
        ...(canCreateReports(currentUser) ? [{ label: "Neuen Report starten", href: "#/reporting", icon: "play", primary: true }] : []),
      ],
    })}

    <section class="kpi-row">
      ${kpiCard("Exports gesamt", formatNumber(kpis.totalReports), `${kpis.latestSource}`, "blue")}
      ${kpiCard("Erfolgreiche Laeufe", formatNumber(kpis.successfulRuns), `${kpis.successRate}% Erfolgsquote`, "violet")}
      ${kpiCard("Letzter Export", latest ? escapeHtml(latest.fileName || "-") : "-", latest ? formatDateTime(latest.createdAt) : "Noch keiner", "teal")}
    </section>

    <section class="analytics-grid">
      <article class="surface-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Live Snapshot</p>
            <h3>Echtzeit-KPIs aus social_reporting</h3>
          </div>
          <span class="surface-meta">${snapshot ? escapeHtml(formatDateTime(snapshot.generatedAt)) : "Kein Stand"}</span>
        </div>

        ${MetricStrip(liveMetrics)}

        <div class="report-connection-strip">
          ${sourcePills}
        </div>

        <div class="mini-list">
          <div class="mini-row"><span>Zeitraum</span><strong>${escapeHtml(formatSnapshotPeriod(snapshot))}</strong></div>
          <div class="mini-row"><span>Qualitaet</span><strong>${escapeHtml(formatSnapshotQuality(snapshot))}</strong></div>
          <div class="mini-row"><span>Status</span><strong>${escapeHtml(formatSnapshotStatus(snapshot))}</strong></div>
        </div>

        ${platformRows.length ? `
          <div class="mini-table">
            <div class="mini-table-head">
              <span>Plattform</span>
              <span>Reach</span>
              <span>Engagement</span>
            </div>
            ${platformRows.map((row) => `
              <div class="mini-table-row">
                <span>${escapeHtml(row.platform)}</span>
                <span>${escapeHtml(formatNumber(row.reach))}</span>
                <span>${escapeHtml(formatNumber(row.engagement))}</span>
              </div>
            `).join("")}
          </div>
        ` : `<div class="empty-inline">Noch keine Live-Kennzahlen verfuegbar.</div>`}
      </article>

      <article class="surface-card chart-surface">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Exportverlauf</p>
            <h3>Letzte 7 Reportlaeufe</h3>
          </div>
          <span class="surface-meta">${runStates}</span>
        </div>

        <div class="chart-stage">
          <svg viewBox="0 0 520 220" class="trend-chart" aria-hidden="true">
            <defs>
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(99,102,241,0.24)" />
                <stop offset="100%" stop-color="rgba(99,102,241,0)" />
              </linearGradient>
            </defs>
            <path d="${chartAreaPath(chartPoints)}" fill="url(#trendFill)"></path>
            <path d="${chartLinePath(chartPoints)}" fill="none" stroke="#4f46e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            ${chartDots(chartPoints)}
          </svg>
          <div class="chart-axis-labels">
            ${chartPoints.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
          </div>
        </div>

        <div class="report-connection-strip">
          ${buildConfiguredSourcePills(snapshot)}
        </div>
      </article>

      <article class="surface-card data-grid-surface">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Neue Social Reports</p>
            <h3>Report ueber das Dashboard starten</h3>
          </div>
          <span class="surface-meta">${statusBadge(reportingTool?.status || "disabled")}</span>
        </div>

        ${ReportGeneratorForm({ tool: reportingTool, dataSources: reportingSources })}
      </article>
    </section>

    <section class="workspace-grid workspace-grid-2">
      <article class="surface-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Export Queue</p>
            <h3>Zuletzt erzeugte Reports</h3>
          </div>
          <span class="surface-meta">${reports.length} Eintraege</span>
        </div>
        <div class="report-list">
          ${reports.length
            ? reports.slice(0, 6).map((report) => reportCard(report)).join("")
            : `<div class="empty-inline">Noch keine Reports gespeichert.</div>`}
        </div>
      </article>

      <article class="surface-card">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Letzter Export</p>
            <h3>Datei und Laufdetails</h3>
          </div>
          <span class="surface-meta">${latest ? escapeHtml(latest.status) : "leer"}</span>
        </div>
        ${latest ? `
          <div class="report-callout">
            <strong>${escapeHtml(latest.fileName || "Exportdatei")}</strong>
            <p>${escapeHtml(latest.clientName)} · ${escapeHtml(latest.reportingPeriod || "aktueller Zeitraum")}</p>
            <div class="mini-list">
              <div class="mini-row"><span>Quelle</span><strong>${escapeHtml(latest.dataSourceLabel || latest.dataSource || "-")}</strong></div>
              <div class="mini-row"><span>Kanal</span><strong>${escapeHtml(latest.channel || "-")}</strong></div>
              <div class="mini-row"><span>Erstellt</span><strong>${escapeHtml(formatDateTime(latest.createdAt))}</strong></div>
            </div>
            ${latest.fileUrl ? `
              <div class="row-actions">
                <button class="button primary" type="button" data-download-report-id="${escapeHtml(latest.id)}">Export herunterladen</button>
              </div>
            ` : ""}
          </div>
        ` : `<div class="empty-inline">Sobald der erste Social Report erzeugt wurde, erscheinen hier Exportdetails.</div>`}
      </article>
    </section>
  `;
}

function buildLiveMetrics(snapshot) {
  const summary = snapshot?.summary;
  return [
    { label: "Reach", value: formatNumber(summary?.total_reach) },
    { label: "Impressions", value: formatNumber(summary?.total_impressions) },
    { label: "Engagement", value: formatNumber(summary?.total_engagement) },
    { label: "Klicks", value: formatNumber(summary?.total_clicks) },
    { label: "Engagement Rate", value: formatPercent(summary?.average_engagement_rate) },
    { label: "Follower Growth", value: formatNumber(summary?.follower_growth) },
  ];
}

function buildSourcePills(snapshot) {
  const liveSources = snapshot?.sources || [];
  if (!liveSources.length) {
    return `
      <div class="connection-pill">
        <strong>Live-Daten</strong>
        <span>noch nicht verfuegbar</span>
      </div>
    `;
  }

  const grouped = new Map();
  for (const item of liveSources) {
    const key = item.source || "unknown";
    const current = grouped.get(key) || { rows: 0, reach: 0 };
    current.rows += Number(item.rows || 0);
    current.reach += Number(item.reach || 0);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries()).map(([source, values]) => `
    <div class="connection-pill">
      <strong>${escapeHtml(sourceLabel(source))}</strong>
      <span>${escapeHtml(`${formatNumber(values.rows)} Zeilen · Reach ${formatNumber(values.reach)}`)}</span>
    </div>
  `).join("");
}

function buildConfiguredSourcePills(snapshot) {
  const activeSources = new Set((snapshot?.sources || []).map((item) => item.source));
  return reportingSources.map((source) => {
    const state = resolveDisplayedSourceState(source.id, snapshot, activeSources);
    return `
      <div class="connection-pill">
        <strong>${escapeHtml(source.label)}</strong>
        <span>${escapeHtml(state)}</span>
      </div>
    `;
  }).join("");
}

function resolveDisplayedSourceState(sourceId, snapshot, activeSources) {
  if (sourceId === "file") return "bereit";
  if (sourceId === "combined") {
    if (snapshot?.status === "ready") return "live verbunden";
    if (snapshot?.status === "error") return "fehler";
    return "spaeter";
  }
  if (sourceId === "swat_io") return activeSources.has("swatio") ? "live verbunden" : "spaeter";
  if (sourceId === "meta_api") return activeSources.has("meta") ? "live verbunden" : "spaeter";
  return "spaeter";
}

function sourceLabel(source) {
  if (source === "meta") return "Meta";
  if (source === "swatio") return "Swat.io";
  if (source === "file") return "Datei-Import";
  return source || "Unbekannt";
}

function formatSnapshotPeriod(snapshot) {
  if (!snapshot?.period?.startDate || !snapshot?.period?.endDate) return "Nicht verfuegbar";
  return `${snapshot.period.startDate} bis ${snapshot.period.endDate}`;
}

function formatSnapshotQuality(snapshot) {
  if (!snapshot?.qualitySummary) return "Keine Daten";
  const { errors = 0, warnings = 0 } = snapshot.qualitySummary;
  return `${formatNumber(errors)} Fehler · ${formatNumber(warnings)} Warnungen`;
}

function formatSnapshotStatus(snapshot) {
  if (!snapshot) return "Kein Snapshot geladen";
  if (snapshot.status === "ready") return "Live verbunden";
  if (snapshot.status === "pending_connection") return "Verbindung fehlt";
  if (snapshot.status === "error") return snapshot.errorMessage || "Snapshot fehlgeschlagen";
  return snapshot.status;
}

function buildKpis(reports, tool) {
  const successfulRuns = reports.filter((report) => report.status === "generated" || report.status === "completed").length;
  const totalReports = reports.length;
  const latestSource = tool?.integration?.serviceName || "social_reporting";
  return {
    totalReports,
    successfulRuns,
    successRate: totalReports ? Math.round((successfulRuns / totalReports) * 100) : 0,
    latestSource,
  };
}

function buildChartPoints(reports) {
  const lastRuns = reports.slice(0, 7).reverse();
  const points = lastRuns.map((report, index) => ({
    value: report.status === "generated" || report.status === "completed" ? 88 + index : 36 + index,
    label: shortDate(report.createdAt),
  }));
  while (points.length < 7) {
    points.unshift({ value: 20 + points.length * 3, label: "--" });
  }
  const values = points.map((item) => item.value);
  values.labels = points.map((item) => item.label);
  return values;
}

function summarizeRunStates(reports) {
  if (!reports.length) return "Noch keine Laeufe";
  const ok = reports.filter((report) => report.status === "generated" || report.status === "completed").length;
  return `${ok}/${reports.length} erfolgreich`;
}

function reportCard(report) {
  return `
    <article class="report-list-item">
      <div class="report-list-head">
        <div>
          <strong>${escapeHtml(report.clientName)}</strong>
          <p>${escapeHtml(report.campaignName || "Social Reporting Lauf")}</p>
        </div>
        ${statusBadge(report.status === "generated" ? "ready" : report.status === "completed" ? "ready" : report.status === "error" ? "error" : "in_progress")}
      </div>
      <div class="mini-table">
        <div class="mini-table-head">
          <span>Quelle</span>
          <span>Zeitraum</span>
          <span>Datei</span>
        </div>
        <div class="mini-table-row">
          <span>${escapeHtml(report.dataSourceLabel || report.dataSource || "-")}</span>
          <span>${escapeHtml(report.reportingPeriod || "-")}</span>
          <span>${escapeHtml(report.fileName || "-")}</span>
        </div>
      </div>
      <div class="surface-card-footer">
        <span class="surface-meta">${escapeHtml(formatDateTime(report.createdAt))}</span>
        ${report.fileUrl ? `<button class="button" type="button" data-download-report-id="${escapeHtml(report.id)}">Datei laden</button>` : ""}
      </div>
    </article>
  `;
}

function kpiCard(label, value, trend, tone) {
  return `
    <article class="kpi-card-modern kpi-${escapeHtml(tone)}">
      <div class="kpi-card-top">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(trend)}</strong>
      </div>
      <div class="kpi-card-value">${escapeHtml(value)}</div>
    </article>
  `;
}

function chartLinePath(points) {
  return points
    .map((point, index) => {
      const x = 30 + index * 76;
      const y = 180 - point * 1.35;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function chartAreaPath(points) {
  const line = chartLinePath(points);
  const endX = 30 + (points.length - 1) * 76;
  return `${line} L ${endX} 200 L 30 200 Z`;
}

function chartDots(points) {
  return points
    .map((point, index) => {
      const x = 30 + index * 76;
      const y = 180 - point * 1.35;
      return `<circle cx="${x}" cy="${y}" r="5" fill="#4f46e5"></circle>`;
    })
    .join("");
}

function shortDate(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}
