// auto-generated
// src/modules/rbac/rbac.service.ts

import { ROLES, PERMISSIONS } from "./rbac.constants";

const rolePermissions: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.VIEW_LEAD,
    PERMISSIONS.UPDATE_LEAD,
    PERMISSIONS.DELETE_LEAD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_AUDIT,
  ],

  [ROLES.USER]: [
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.VIEW_LEAD,
    PERMISSIONS.UPDATE_LEAD,
  ],
};

/**
 * Check if role has permission
 */
export const hasPermission = (role: string, permission: string) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};