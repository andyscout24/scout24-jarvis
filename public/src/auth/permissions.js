import { Roles, roleLabels } from "../domain/constants.js";

export function isAdmin(user) {
  return user?.role === Roles.ADMIN;
}

export function canViewLogs(user) {
  return isAdmin(user);
}

export function canManageSettings(user) {
  return isAdmin(user);
}

export function canManageToolStatus(user) {
  return isAdmin(user);
}

export function canViewOffers(user) {
  return [Roles.ADMIN, Roles.SALES_USER].includes(user?.role);
}

export function canCreateOffers(user) {
  return [Roles.ADMIN, Roles.SALES_USER].includes(user?.role);
}

export function canViewReports(user) {
  return [Roles.ADMIN, Roles.MARKETING_USER, Roles.MANAGEMENT_VIEWER].includes(user?.role);
}

export function canCreateReports(user) {
  return [Roles.ADMIN, Roles.MARKETING_USER].includes(user?.role);
}

export function canViewTool(user, tool) {
  if (!user?.active || !tool) return false;
  if (isAdmin(user)) return true;
  const requiredRoles = tool.module?.requiredRoles || tool.config?.requiredRoles || tool.config?.required_roles || [];
  if (Array.isArray(requiredRoles) && requiredRoles.includes(user.role)) return true;
  const category = String(tool.category || "").toLowerCase();
  if (user.role === Roles.SALES_USER) return category.includes("sales");
  if (user.role === Roles.MARKETING_USER) return category.includes("marketing") || category.includes("reporting");
  if (user.role === Roles.MANAGEMENT_VIEWER) return category.includes("reporting") || tool.id === "reporting-tool";
  return false;
}

export function canAccessHref(user, href) {
  if (href === "#/offers") return canViewOffers(user);
  if (href === "#/editorial-planner") return [Roles.ADMIN, Roles.MARKETING_USER].includes(user?.role);
  if (href === "#/reporting") return canViewReports(user);
  if (href === "#/content-creation") return [Roles.ADMIN, Roles.MARKETING_USER].includes(user?.role);
  if (href === "#/settings") return canManageSettings(user);
  return Boolean(user?.active);
}

export function canAccessRoute(user, route, data) {
  if (!user?.active) return false;
  if (route.name === "tool-detail") {
    return canViewTool(user, data?.tools.find((tool) => tool.id === route.toolId));
  }
  return canAccessHref(user, route.name);
}

export { Roles, roleLabels };
