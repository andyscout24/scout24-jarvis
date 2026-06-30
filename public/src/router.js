import { routeTitles } from "./modules/navigation.js";

export function getRoute() {
  const hash = window.location.hash || "#/";
  if (hash === "#/auth") {
    return {
      name: "#/auth",
      title: "Anmeldung",
      active: "#/",
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
    name: routeTitles[hash] ? hash : "#/",
    title: routeTitles[hash] || routeTitles["#/"],
    active: routeTitles[hash] ? hash : "#/",
  };
}
