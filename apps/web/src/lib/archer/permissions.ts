// =============================================================================
// Permission System
// =============================================================================
// This module defines the permission constants and utility functions for
// the Archer-style RBAC system. It can be integrated with the existing
// AuthContext or replaced with a more sophisticated permission system.
// =============================================================================

/**
 * Permission definitions for the Risks V2 module.
 * These follow the pattern: module.resource.action
 */
export const PERMISSIONS = {
  // Risk Register permissions
  RISKS: {
    VIEW: "risks.register.view",
    CREATE: "risks.register.create",
    EDIT: "risks.register.edit",
    DELETE: "risks.register.delete",
    APPROVE: "risks.register.approve",
    EXPORT: "risks.register.export",
  },
  // Risk Scenario permissions
  SCENARIOS: {
    VIEW: "risks.scenarios.view",
    CREATE: "risks.scenarios.create",
    EDIT: "risks.scenarios.edit",
    DELETE: "risks.scenarios.delete",
    ASSESS: "risks.scenarios.assess",
    APPROVE: "risks.scenarios.approve",
  },
  // Treatment permissions
  TREATMENTS: {
    VIEW: "risks.treatments.view",
    CREATE: "risks.treatments.create",
    EDIT: "risks.treatments.edit",
    DELETE: "risks.treatments.delete",
    APPROVE: "risks.treatments.approve",
  },
  // Control permissions
  CONTROLS: {
    VIEW: "risks.controls.view",
    CREATE: "risks.controls.create",
    EDIT: "risks.controls.edit",
    DELETE: "risks.controls.delete",
    LINK: "risks.controls.link",
  },
  // KRI permissions
  KRI: {
    VIEW: "risks.kri.view",
    CREATE: "risks.kri.create",
    EDIT: "risks.kri.edit",
    DELETE: "risks.kri.delete",
  },
  // Configuration permissions
  CONFIG: {
    VIEW: "risks.config.view",
    EDIT: "risks.config.edit",
  },
  // Admin permissions
  ADMIN: {
    VIEW: "risks.admin.view",
    MANAGE_USERS: "risks.admin.manage_users",
    MANAGE_ROLES: "risks.admin.manage_roles",
    AUDIT_LOG: "risks.admin.audit_log",
  },
} as const;

/**
 * Role definitions with their associated permissions.
 * This can be extended or replaced with dynamic role definitions from the API.
 */
export const ROLES = {
  ADMIN: "admin",
  RISK_MANAGER: "risk_manager",
  RISK_OWNER: "risk_owner",
  RISK_ASSESSOR: "risk_assessor",
  VIEWER: "viewer",
} as const;

/**
 * Default permission sets for each role.
 * In production, these would typically come from the API.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS.RISKS),
    ...Object.values(PERMISSIONS.SCENARIOS),
    ...Object.values(PERMISSIONS.TREATMENTS),
    ...Object.values(PERMISSIONS.CONTROLS),
    ...Object.values(PERMISSIONS.KRI),
    ...Object.values(PERMISSIONS.CONFIG),
    ...Object.values(PERMISSIONS.ADMIN),
  ],
  [ROLES.RISK_MANAGER]: [
    PERMISSIONS.RISKS.VIEW,
    PERMISSIONS.RISKS.CREATE,
    PERMISSIONS.RISKS.EDIT,
    PERMISSIONS.RISKS.APPROVE,
    PERMISSIONS.RISKS.EXPORT,
    PERMISSIONS.SCENARIOS.VIEW,
    PERMISSIONS.SCENARIOS.CREATE,
    PERMISSIONS.SCENARIOS.EDIT,
    PERMISSIONS.SCENARIOS.ASSESS,
    PERMISSIONS.SCENARIOS.APPROVE,
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.TREATMENTS.CREATE,
    PERMISSIONS.TREATMENTS.EDIT,
    PERMISSIONS.TREATMENTS.APPROVE,
    PERMISSIONS.CONTROLS.VIEW,
    PERMISSIONS.CONTROLS.LINK,
    PERMISSIONS.KRI.VIEW,
    PERMISSIONS.KRI.CREATE,
    PERMISSIONS.KRI.EDIT,
    PERMISSIONS.CONFIG.VIEW,
  ],
  [ROLES.RISK_OWNER]: [
    PERMISSIONS.RISKS.VIEW,
    PERMISSIONS.RISKS.EDIT,
    PERMISSIONS.SCENARIOS.VIEW,
    PERMISSIONS.SCENARIOS.EDIT,
    PERMISSIONS.SCENARIOS.ASSESS,
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.TREATMENTS.CREATE,
    PERMISSIONS.TREATMENTS.EDIT,
    PERMISSIONS.CONTROLS.VIEW,
    PERMISSIONS.KRI.VIEW,
  ],
  [ROLES.RISK_ASSESSOR]: [
    PERMISSIONS.RISKS.VIEW,
    PERMISSIONS.SCENARIOS.VIEW,
    PERMISSIONS.SCENARIOS.ASSESS,
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.CONTROLS.VIEW,
    PERMISSIONS.KRI.VIEW,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.RISKS.VIEW,
    PERMISSIONS.SCENARIOS.VIEW,
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.CONTROLS.VIEW,
    PERMISSIONS.KRI.VIEW,
  ],
};

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user has any of the specified permissions.
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
}

/**
 * Check if a user has all of the specified permissions.
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

/**
 * Get permissions for a role.
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all unique permissions from multiple roles.
 */
export function getPermissionsForRoles(roles: string[]): string[] {
  const permissionSet = new Set<string>();
  roles.forEach((role) => {
    getPermissionsForRole(role).forEach((permission) => {
      permissionSet.add(permission);
    });
  });
  return Array.from(permissionSet);
}
