import { ResultTypes, Roles } from "../../domain/constants.js";

export const automationModules = Object.freeze({
  "offer-generator": {
    area: "Angebotsgenerator",
    category: "Sales",
    icon: "file",
    requiredRoles: [Roles.ADMIN, Roles.SALES_USER],
    resultTypes: [ResultTypes.OFFER],
  },
  "reporting-tool": {
    area: "Reporting Center",
    category: "Reporting",
    icon: "file",
    requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER],
    resultTypes: [ResultTypes.REPORT],
  },
  "lead-list-generator": {
    area: "Leadlisten Generator",
    category: "Sales",
    icon: "users",
    requiredRoles: [Roles.ADMIN, Roles.SALES_USER],
    resultTypes: [ResultTypes.ARTIFACT],
    planned: true,
  },
  "content-ideas-generator": {
    area: "Content Ideen Generator",
    category: "Marketing",
    icon: "activity",
    requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER],
    resultTypes: [ResultTypes.ARTIFACT],
    planned: true,
  },
  "campaign-analyzer": {
    area: "Campaign Analyzer",
    category: "Marketing / Reporting",
    icon: "dashboard",
    requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER, Roles.MANAGEMENT_VIEWER],
    resultTypes: [ResultTypes.REPORT],
    planned: true,
  },
  "powerpoint-generator": {
    area: "PowerPoint Generator",
    category: "Marketing",
    icon: "file",
    requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER, Roles.SALES_USER],
    resultTypes: [ResultTypes.ARTIFACT],
    planned: true,
  },
  "api-health-monitor": {
    area: "API Health Monitor",
    category: "Admin",
    icon: "activity",
    requiredRoles: [Roles.ADMIN],
    resultTypes: [ResultTypes.ARTIFACT],
    planned: true,
  },
});

export function getAutomationModuleDefinition(toolId) {
  return (
    automationModules[toolId] || {
      area: "Automation",
      category: "Admin",
      icon: "wrench",
      requiredRoles: [Roles.ADMIN],
      resultTypes: [ResultTypes.ARTIFACT],
    }
  );
}
