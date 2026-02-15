// =============================================================================
// Archer Component Library
// =============================================================================
// Reusable components following Archer GRC design patterns for the RisksV2 module.
// =============================================================================

// Components
export { ArcherFieldGroup } from "./field-group";
export { ArcherTabSet } from "./tab-set";
export { ArcherWidget } from "./widget";
export { AuditFooter } from "./audit-footer";
export { AuditLog } from "./audit-log";
export { BulkActionBar } from "./bulk-action-bar";
export { CrossReferenceGrid } from "./cross-reference-grid";
export { DetailPageLayout } from "./detail-page-layout";
export { EmptyState } from "./empty-state";
export { FieldWithHelp } from "./field-with-help";
export { ListPageLayout } from "./list-page-layout";
export { PermissionGate, withPermission } from "./permission-gate";
export { ProgressTracker } from "./progress-tracker";
export { RecordHeader } from "./record-header";
export { Section } from "./section";
export { SmartSelect } from "./smart-select";
export { WorkflowSidebar } from "./workflow-sidebar";

// Hooks
export { usePermissions } from "./hooks/use-permissions";
export type { UsePermissionsReturn } from "./hooks/use-permissions";
export {
  useCollapsedState,
  useBreakpoint,
  useConditionalSidebar,
  useLayoutConfig,
  BREAKPOINTS,
  DEFAULT_LAYOUT_CONFIG,
} from "./hooks/use-conditional-layout";
export type { Breakpoint, LayoutConfig } from "./hooks/use-conditional-layout";
export { useBulkSelection } from "./hooks/use-bulk-selection";
export type { UseBulkSelectionReturn } from "./hooks/use-bulk-selection";

// Types (re-export from lib/archer/types for convenience)
export type {
  ArcherField,
  ArcherFieldGroupProps,
  ArcherTab,
  ArcherTabSetProps,
  ArcherWidgetProps,
  AuditFooterProps,
  AuditLogEntry,
  AuditLogProps,
  BadgeItem,
  Breadcrumb,
  BulkAction,
  BulkActionBarProps,
  CrossReferenceColumn,
  CrossReferenceEmptyState,
  CrossReferenceGridProps,
  DetailPageLayoutProps,
  EmptyStateProps,
  FieldWithHelpProps,
  ListPageLayoutProps,
  PermissionGateProps,
  ProgressStatus,
  ProgressStep,
  ProgressTrackerProps,
  RecordHeaderProps,
  SectionProps,
  SmartSelectOption,
  SmartSelectProps,
  StatusBadge,
  ToleranceStatus,
  WorkflowAction,
  WorkflowMetadata,
  WorkflowScore,
  WorkflowSidebarProps,
  WorkflowStage,
} from "@/lib/archer/types";

// Permissions (re-export from lib/archer/permissions for convenience)
export {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
  getPermissionsForRoles,
} from "@/lib/archer/permissions";
