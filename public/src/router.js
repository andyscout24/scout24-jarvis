import { routeTitles } from "./modules/navigation.js";

export function getRoute() {
  const hash = window.location.hash || "#/offers";
  if (hash === "#/auth") {
    return {
      name: "#/auth",
      title: "Anmeldung",
      active: "#/offers",
    };
  }
  if (hash.startsWith("#/tools/")) {
    return {
      name: "tool-detail",
      title: "Detailansicht",
      toolId: decodeURIComponent(hash.replace("#/tools/", "")),
      active: "#/reporting",
    };
  }
  return {
    name: routeTitles[hash] ? hash : "#/offers",
    title: routeTitles[hash] || routeTitles["#/offers"],
    active: routeTitles[hash] ? hash : "#/offers",
  };
}
