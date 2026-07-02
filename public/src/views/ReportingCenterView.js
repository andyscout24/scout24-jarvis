import { PageHeader } from "../components/PageHeader.js";
import { canCreateReports } from "../auth/permissions.js";
import { icon } from "../icons.js";
import { formatNumber, newestFirst, escapeHtml } from "../utils.js";

export function ReportingCenterView(data, currentUser) {
  const reports = newestFirst(data.reports.filter((report) => report.toolId === "reporting-tool"));
  const latest = reports[0];
  const kpis = buildKpis(reports);
  const chartPoints = [44, 58, 51, 72, 66, 89, 94];

  return `
    ${PageHeader({
      eyebrow: "Social Media",
      title: "Reporting & Analytics",
      description: "Ein klarer Anzeige-Fokus fuer Reporting, Trends und die letzten Exportlaeufe deines Teams.",
      actions: [
        ...(canCreateReports(currentUser) ? [{ label: "Neuen Report starten", href: "#/reporting", icon: "play", primary: true }] : []),
      ],
    })}

    <section class="kpi-row">
      ${kpiCard("Gesamtreichweite", formatNumber(kpis.reach), "+12%", "blue")}
      ${kpiCard("Interaktionen", formatNumber(kpis.engagement), "+8%", "violet")}
      ${kpiCard("Conversions", formatNumber(kpis.conversions), "+5%", "teal")}
    </section>

    <section class="analytics-grid">
      <article class="surface-card chart-surface">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Performance Verlauf</p>
            <h3>Letzte 7 Reporting-Signale</h3>
          </div>
          <span class="surface-meta">Mock Chart Surface</span>
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
            <span>Mo</span>
            <span>Di</span>
            <span>Mi</span>
            <span>Do</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>So</span>
          </div>
        </div>
      </article>

      <article class="surface-card data-grid-surface">
        <div class="surface-card-header">
          <div>
            <p class="surface-kicker">Export Queue</p>
            <h3>Zuletzt erzeugte Reports</h3>
          </div>
          <span class="surface-meta">${reports.length} Eintraege</span>
        </div>

        <div class="mini-table">
          <div class="mini-table-head">
            <span>Kunde</span>
            <span>Quelle</span>
            <span>Status</span>
          </div>
          ${reports.slice(0, 5).map((report) => `
            <div class="mini-table-row">
              <span>${escapeHtml(report.clientName)}</span>
              <span>${escapeHtml(report.dataSourceLabel || report.dataSource || "-")}</span>
              <span>${escapeHtml(report.status)}</span>
            </div>
          `).join("")}
        </div>

        ${latest ? `
          <div class="report-callout">
            <span class="surface-kicker">Letzter Export</span>
            <strong>${escapeHtml(latest.fileName)}</strong>
            <p>${escapeHtml(latest.clientName)} · ${escapeHtml(latest.reportingPeriod || "aktueller Zeitraum")}</p>
          </div>
        ` : ""}
      </article>
    </section>
  `;
}

function buildKpis(reports) {
  const count = reports.length || 1;
  return {
    reach: 482000 + count * 3200,
    engagement: 18240 + count * 240,
    conversions: 620 + count * 14,
  };
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
