export const navItems = Object.freeze([
  { href: "#/", label: "Dashboard", icon: "dashboard", section: "workspace" },
  { href: "#/tools", label: "Arbeitsbereiche", icon: "boxes", section: "workspace" },
  { href: "#/reporting", label: "Reports & Details", icon: "database", section: "workspace" },
  { href: "#/offers", label: "Angebote", icon: "file", section: "workspace" },
  { href: "#/settings", label: "Datenquellen", icon: "settings", section: "operations" },
  { href: "#/help", label: "Hilfe & Doku", icon: "book", section: "operations" },
]);

export const routeTitles = Object.freeze({
  "#/": "Dashboard",
  "#/tools": "Arbeitsbereiche",
  "#/offers": "Angebotsgenerator",
  "#/reporting": "Reports & Details",
  "#/activity": "Activity Logs",
  "#/settings": "Datenquellen",
  "#/help": "Hilfe & Dokumentation",
});
