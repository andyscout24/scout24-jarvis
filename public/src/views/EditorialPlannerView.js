import { PageHeader } from "../components/PageHeader.js";
import { icon } from "../icons.js";
import { escapeHtml } from "../utils.js";

const weekdayColumns = [
  {
    day: "Montag",
    focus: "Markttrend",
    items: [
      { platform: "Instagram", tone: "violet", title: "Wohntrend der Woche", status: "In Vorbereitung" },
      { platform: "LinkedIn", tone: "blue", title: "Makro-Insight fuer Makler", status: "Geplant" },
    ],
  },
  {
    day: "Dienstag",
    focus: "Lead Story",
    items: [
      { platform: "Instagram", tone: "violet", title: "Top Listing Carousel", status: "Freigabe offen" },
    ],
  },
  {
    day: "Mittwoch",
    focus: "Community",
    items: [
      { platform: "Facebook", tone: "teal", title: "Fragen aus der Community", status: "Geplant" },
      { platform: "LinkedIn", tone: "blue", title: "Marktupdate fuer Partner", status: "In Vorbereitung" },
    ],
  },
  {
    day: "Donnerstag",
    focus: "Produkt & Nutzen",
    items: [
      { platform: "Instagram", tone: "violet", title: "Feature Highlight: Alerts", status: "Geplant" },
    ],
  },
  {
    day: "Freitag",
    focus: "Performance",
    items: [
      { platform: "LinkedIn", tone: "blue", title: "Weekly Performance Recap", status: "In Vorbereitung" },
    ],
  },
  {
    day: "Samstag",
    focus: "Lifestyle",
    items: [
      { platform: "Instagram", tone: "violet", title: "Neighborhood Inspiration", status: "Geplant" },
    ],
  },
  {
    day: "Sonntag",
    focus: "Evergreen",
    items: [
      { platform: "Pinterest", tone: "amber", title: "Home Decor Saveboard", status: "Backlog" },
    ],
  },
];

export function EditorialPlannerView() {
  return `
    ${PageHeader({
      eyebrow: "Social Media",
      title: "Redaktionsplan",
      description: "Plane deine Kalenderwoche kanalgenau, halte Status sichtbar und reserviere Platz fuer kommende Performance-Signale.",
      actions: [{ label: "Neue Woche planen", href: "#/editorial-planner", icon: "calendar", primary: true }],
    })}

    <section class="week-board-shell">
      <div class="week-board-head">
        <div>
          <p class="surface-kicker">Kalenderwoche 27</p>
          <h3>Inhaltsplanung Montag bis Sonntag</h3>
        </div>
        <div class="week-board-meta">
          <span class="status-chip status-chip-soft">${icon("sparkles", "icon small")}8 Content-Ideen</span>
          <span class="status-chip status-chip-soft">${icon("chart", "icon small")}Performance Slots vorbereitet</span>
        </div>
      </div>

      <div class="week-board">
        ${weekdayColumns.map(dayColumn).join("")}
      </div>
    </section>
  `;
}

function dayColumn(column) {
  return `
    <article class="weekday-column">
      <header class="weekday-column-head">
        <div>
          <strong>${escapeHtml(column.day)}</strong>
          <span>${escapeHtml(column.focus)}</span>
        </div>
      </header>
      <div class="weekday-column-body">
        ${column.items.map(contentCard).join("")}
      </div>
    </article>
  `;
}

function contentCard(item) {
  return `
    <div class="content-card">
      <div class="content-card-top">
        <span class="platform-badge platform-${escapeHtml(item.tone)}">${escapeHtml(item.platform)}</span>
        <span class="content-status">${escapeHtml(item.status)}</span>
      </div>
      <strong>${escapeHtml(item.title)}</strong>
      <div class="content-metrics">
        <span>Reach</span>
        <span>--</span>
        <span>Engagement</span>
        <span>--</span>
      </div>
    </div>
  `;
}
