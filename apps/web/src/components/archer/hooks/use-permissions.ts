import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
  ROLE_PERMISSIONS,
} from "@/lib/archer/permissions";

/**
 * Hook for checking user permissions in the Archer components.
 *
 * Integrates with the existing AuthContext and provides permission checking
 * utilities. In development/demo mode, defaults to admin permissions.
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  // Get user permissions based on their role
  // In production, this would come from the user object or a separate API call
  const permissions = useMemo(() => {
    if (!isAuthenticated || !user) {
      // In demo mode, grant admin permissions for development
      return ROLE_PERMISSIONS["admin"] || [];
    }

    // Get permissions based on user's role
    const role = user.role || "viewer";
    return getPermissionsForRole(role);
  }, [isAuthenticated, user]);

  /**
   * Check if the user has a specific permission.
   */
  const can = (permission: string): boolean => {
    return hasPermission(permissions, permission);
  };

  /**
   * Check if the user has any of the specified permissions.
   */
  const canAny = (requiredPermissions: string[]): boolean => {
    return hasAnyPermission(permissions, requiredPermissions);
  };

  /**
   * Check if the user has all of the specified permissions.
   */
  const canAll = (requiredPermissions: string[]): boolean => {
    return hasAllPermissions(permissions, requiredPermissions);
  };

  /**
   * Check permission(s) - accepts single permission or array.
   * For arrays, checks if user has ANY of the permissions (OR logic).
   */
  const hasAccess = (permission: string | string[]): boolean => {
    if (Array.isArray(permission)) {
      return canAny(permission);
    }
    return can(permission);
  };

  return {
    permissions,
    can,
    canAny,
    canAll,
    hasAccess,
    isAuthenticated,
    user,
  };
}

export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
