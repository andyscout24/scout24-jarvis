export const reportingSources = Object.freeze([
  {
    id: "file",
    label: "CSV / XLSX Import",
    state: "ready",
    description: "Social-Reporting-Dateien direkt aus dem separaten Python-Projekt einlesen.",
  },
  {
    id: "combined",
    label: "Meta + Swat.io",
    state: "pending_connection",
    description: "Kombinierte Social-Daten ueber den internen Social-Reporting-Service.",
  },
  {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Organische Social-Performance ueber den internen Social-Reporting-Service.",
  },
  {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Paid-Daten und Kampagnen-Performance ueber den internen Social-Reporting-Service.",
  },
]);
