import { Permissions, Roles } from "../../shared/contracts.mjs";
import { forbidden } from "../errors/apiError.mjs";

const rolePermissions = Object.freeze({
  [Roles.ADMIN]: Object.values(Permissions),
  [Roles.SALES_USER]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_TOOLS,
    Permissions.VIEW_OFFERS,
    Permissions.CREATE_OFFERS,
  ],
  [Roles.MARKETING_USER]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_TOOLS,
    Permissions.VIEW_REPORTS,
    Permissions.CREATE_REPORTS,
  ],
  [Roles.MANAGEMENT_VIEWER]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_TOOLS,
    Permissions.VIEW_REPORTS,
  ],
});

export function hasPermission(user, permission) {
  if (!user?.active) return false;
  return (rolePermissions[user.role] || []).includes(permission);
}

export function requirePermission(user, permission, message = "Du hast keine Berechtigung fuer diese Aktion.") {
  if (!hasPermission(user, permission)) {
    throw forbidden("forbidden", message, { permission });
  }
}

export function canAccessTool(user, tool) {
  if (!user?.active || !tool) return false;
  if (user.role === Roles.ADMIN) return true;

  const requiredRoles = tool.module?.requiredRoles || tool.integration?.requiredRoles || tool.config?.requiredRoles || tool.config?.required_roles || [];
  if (Array.isArray(requiredRoles) && requiredRoles.includes(user.role)) return true;

  const category = String(tool.category || "").toLowerCase();
  if (user.role === Roles.SALES_USER) return category.includes("sales");
  if (user.role === Roles.MARKETING_USER) return category.includes("marketing") || category.includes("reporting");
  if (user.role === Roles.MANAGEMENT_VIEWER) return category.includes("reporting") || tool.id === "reporting-tool";
  return false;
}

export function filterToolsForUser(user, tools) {
  return tools.filter((tool) => canAccessTool(user, tool));
}

export function canReadOffer(user, offer) {
  if (!user?.active || !offer) return false;
  if (user.role === Roles.ADMIN) return true;
  if (user.role !== Roles.SALES_USER) return false;
  return offer.createdBy === user.name || offer.metadata?.createdBy === user.name || offer.actorUserId === user.id || offer.createdByUserId === user.id;
}

export function canReadReport(user, report) {
  if (!user?.active || !report) return false;
  return [Roles.ADMIN, Roles.MARKETING_USER, Roles.MANAGEMENT_VIEWER].includes(user.role);
}

export function canReadAutomation(user, automation, toolsById) {
  return canAccessTool(user, toolsById.get(automation.toolId));
}

export { Permissions, Roles };
