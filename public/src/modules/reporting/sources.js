export const reportingSources = Object.freeze([
  {
    id: "csv_upload",
    label: "CSV / Excel Upload",
    state: "ready",
    description: "CSV, TSV, XLS und XLSX fuer Google Ad Manager, Google Ads und Newsletter.",
  },
  {
    id: "google_ad_manager",
    label: "Google Ad Manager",
    state: "ready",
    description: "Pflichtquelle fuer Placement- und Ad-Server-Daten im Campaign Review.",
  },
  {
    id: "google_ads",
    label: "Google Ads",
    state: "ready",
    description: "Optionale Quelle fuer Campaign-Performance und Paid-Search-KPIs.",
  },
  {
    id: "newsletter",
    label: "Newsletter CSV",
    state: "ready",
    description: "Optionale Quelle fuer Newsletter Opens, Clicks und Raten.",
  },
  {
    id: "fastapi_campaign_review",
    label: "Campaign Review FastAPI",
    state: "external_reference_detected",
    description: "Externe Webapp mit Preview und PPTX-Export ist registriert.",
  },
  {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Social Publishing und Community-Daten sind noch nicht verbunden.",
  },
  {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Meta Performance Daten sind fuer spaeter vorbereitet.",
  },
  {
    id: "google_sheets",
    label: "Google Sheets",
    state: "pending_connection",
    description: "Sheet Import ist geplant und blockiert das MVP nicht.",
  },
]);
