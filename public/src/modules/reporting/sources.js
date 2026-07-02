export const reportingSources = Object.freeze([
  {
    id: "file",
    label: "Datei-Import",
    state: "ready",
    description: "CSV-, TSV-, XLS- und XLSX-Dateien direkt ueber das Social Reporting Projekt.",
  },
  {
    id: "combined",
    label: "Meta + Swat.io",
    state: "pending_connection",
    description: "Kombiniert Paid- und Social-Daten, sobald beide APIs verbunden sind.",
  },
  {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Social Publishing, Community und organische Performance-Daten.",
  },
  {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Paid Social Performance und Kampagnendaten aus Meta.",
  },
  {
    id: "fastapi_campaign_review",
    label: "Campaign Review FastAPI",
    state: "external_reference_detected",
    description: "Separates Media-Reporting Tool fuer PPTX-/Preview-Workflows.",
  },
  {
    id: "google_sheets",
    label: "Google Sheets",
    state: "pending_connection",
    description: "Sheet Import ist geplant und blockiert das MVP nicht.",
  },
]);
