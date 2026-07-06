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
    description: "Kommt spaeter fuer kombinierte Social-Datenfluesse dazu.",
  },
  {
    id: "swat_io",
    label: "Swat.io",
    state: "pending_connection",
    description: "Organische Social-Performance und Publishing-Status.",
  },
  {
    id: "meta_api",
    label: "Meta API",
    state: "pending_connection",
    description: "Direkte Social-API-Anbindung fuer spaetere Automatisierung.",
  },
]);
