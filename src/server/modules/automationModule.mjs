import { ModuleCapabilities, ResultTypes, Roles } from "../../shared/contracts.mjs";

const defaultAdapter = {
  id: "generic-automation",
  capabilities: [ModuleCapabilities.STATUS, ModuleCapabilities.RESULTS, ModuleCapabilities.LOGS],
  requiredRoles: [Roles.ADMIN],
  resultTypes: [ResultTypes.ARTIFACT],
  getLaunchTarget(tool) {
    return {
      type: tool.externalUrl ? "external_url" : "dashboard_route",
      href: tool.externalUrl || tool.route,
    };
  },
};

export function createAutomationModuleAdapter(adapter) {
  return {
    ...defaultAdapter,
    ...adapter,
    capabilities: adapter.capabilities || defaultAdapter.capabilities,
    requiredRoles: adapter.requiredRoles || defaultAdapter.requiredRoles,
    resultTypes: adapter.resultTypes || defaultAdapter.resultTypes,
  };
}

export function enrichToolWithAdapter(tool, adapter = defaultAdapter) {
  return {
    ...tool,
    module: {
      adapterId: adapter.id,
      capabilities: adapter.capabilities,
      requiredRoles: adapter.requiredRoles,
      resultTypes: adapter.resultTypes,
      launchTarget: adapter.getLaunchTarget(tool),
    },
  };
}
