import { Permissions, requirePermission } from "../auth/permissions.mjs";

export function createUserService(repository) {
  return {
    async listUsers(currentUser) {
      requirePermission(currentUser, Permissions.VIEW_USERS, "Nur Admins koennen Userlisten sehen.");
      return repository.getUsers();
    },
  };
}
