import type { ReactNode } from "react";
import { usePermissions } from "./hooks/use-permissions";
import type { PermissionGateProps } from "@/lib/archer/types";

/**
 * PermissionGate - RBAC wrapper component.
 *
 * Shows or hides children based on user permissions.
 * Optionally renders a fallback component when access is denied.
 * When `disabled` is true, children are rendered but disabled interactions.
 */
export function PermissionGate({
  permission,
  fallback = null,
  disabled = false,
  children,
}: PermissionGateProps) {
  const { hasAccess } = usePermissions();

  const hasPermission = hasAccess(permission);

  // If user has permission, render children normally
  if (hasPermission) {
    return <>{children}</>;
  }

  // If disabled mode, render children wrapped in a disabled container
  if (disabled) {
    return (
      <div className="pointer-events-none opacity-50" aria-disabled="true">
        {children}
      </div>
    );
  }

  // Otherwise, render the fallback (or nothing)
  return <>{fallback}</>;
}

/**
 * Higher-order component version of PermissionGate.
 * Useful for wrapping components that need permission checks.
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string | string[],
  fallback: ReactNode = null
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}
