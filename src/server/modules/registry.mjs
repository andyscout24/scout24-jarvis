import { ModuleCapabilities, ResultTypes, Roles } from "../../shared/contracts.mjs";
import { createAutomationModuleAdapter, enrichToolWithAdapter } from "./automationModule.mjs";

const adapters = new Map(
  [
    createAutomationModuleAdapter({
      id: "offer-generator",
      capabilities: [
        ModuleCapabilities.LAUNCH,
        ModuleCapabilities.GENERATE,
        ModuleCapabilities.STATUS,
        ModuleCapabilities.RESULTS,
        ModuleCapabilities.LOGS,
      ],
      requiredRoles: [Roles.ADMIN, Roles.SALES_USER],
      resultTypes: [ResultTypes.OFFER],
    }),
    createAutomationModuleAdapter({
      id: "reporting-tool",
      capabilities: [
        ModuleCapabilities.LAUNCH,
        ModuleCapabilities.HEALTH,
        ModuleCapabilities.GENERATE,
        ModuleCapabilities.STATUS,
        ModuleCapabilities.RESULTS,
        ModuleCapabilities.LOGS,
      ],
      requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER],
      resultTypes: [ResultTypes.REPORT],
    }),
    createAutomationModuleAdapter({
      id: "lead-list-generator",
      capabilities: [ModuleCapabilities.STATUS, ModuleCapabilities.RESULTS, ModuleCapabilities.LOGS],
      requiredRoles: [Roles.ADMIN, Roles.SALES_USER],
      resultTypes: [ResultTypes.ARTIFACT],
    }),
    createAutomationModuleAdapter({
      id: "content-ideas-generator",
      capabilities: [ModuleCapabilities.STATUS, ModuleCapabilities.RESULTS, ModuleCapabilities.LOGS],
      requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER],
      resultTypes: [ResultTypes.ARTIFACT],
    }),
    createAutomationModuleAdapter({
      id: "editorial-planner",
      capabilities: [
        ModuleCapabilities.LAUNCH,
        ModuleCapabilities.HEALTH,
        ModuleCapabilities.STATUS,
        ModuleCapabilities.RESULTS,
        ModuleCapabilities.LOGS,
      ],
      requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER],
      resultTypes: [ResultTypes.ARTIFACT],
    }),
    createAutomationModuleAdapter({
      id: "campaign-analyzer",
      capabilities: [ModuleCapabilities.HEALTH, ModuleCapabilities.STATUS, ModuleCapabilities.RESULTS, ModuleCapabilities.LOGS],
      requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER, Roles.MANAGEMENT_VIEWER],
      resultTypes: [ResultTypes.REPORT],
    }),
    createAutomationModuleAdapter({
      id: "powerpoint-generator",
      capabilities: [ModuleCapabilities.STATUS, ModuleCapabilities.RESULTS, ModuleCapabilities.LOGS],
      requiredRoles: [Roles.ADMIN, Roles.MARKETING_USER, Roles.SALES_USER],
      resultTypes: [ResultTypes.ARTIFACT],
    }),
    createAutomationModuleAdapter({
      id: "api-health-monitor",
      capabilities: [ModuleCapabilities.HEALTH, ModuleCapabilities.STATUS, ModuleCapabilities.LOGS],
      requiredRoles: [Roles.ADMIN],
      resultTypes: [ResultTypes.ARTIFACT],
    }),
  ].map((adapter) => [adapter.id, adapter]),
);

export function getAutomationModuleAdapter(toolId) {
  return adapters.get(toolId);
}

export function enrichTool(tool) {
  return enrichToolWithAdapter(tool, getAutomationModuleAdapter(tool.id));
}

export function listAutomationModuleAdapters() {
  return Array.from(adapters.values());
}

export function listPublicAutomationModules() {
  return listAutomationModuleAdapters().map((adapter) => ({
    id: adapter.id,
    capabilities: adapter.capabilities,
    requiredRoles: adapter.requiredRoles,
    resultTypes: adapter.resultTypes,
  }));
}
