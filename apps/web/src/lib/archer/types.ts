import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// =============================================================================
// Common Types
// =============================================================================

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface StatusBadge {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "warning" | "success";
  icon?: LucideIcon;
}

export interface BadgeItem {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning" | "success";
}

// =============================================================================
// RecordHeader Types
// =============================================================================

export interface RecordHeaderProps {
  breadcrumbs: Breadcrumb[];
  identifier: string;
  title: string;
  status: StatusBadge;
  badges?: BadgeItem[];
  actions?: ReactNode;
}

// =============================================================================
// Section Types
// =============================================================================

export interface SectionProps {
  id?: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

// =============================================================================
// CrossReferenceGrid Types
// =============================================================================

export interface CrossReferenceEmptyState {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface CrossReferenceColumn<T> {
  key: string;
  header: string;
  render?: (record: T) => ReactNode;
  width?: string;
  className?: string;
}

export interface CrossReferenceGridProps<T> {
  title: string;
  records: T[];
  columns: CrossReferenceColumn<T>[];
  onAdd?: () => void;
  onRemove?: (ids: string[]) => void;
  onCreate?: () => void;
  onRowClick?: (record: T) => void;
  emptyState?: CrossReferenceEmptyState;
  maxHeight?: string;
  getRowId?: (record: T) => string;
}

// =============================================================================
// WorkflowSidebar Types
// =============================================================================

export interface WorkflowStage {
  id: string;
  label: string;
  complete: boolean;
  current: boolean;
}

export interface WorkflowScore {
  label: string;
  value: number;
  level?: "low" | "medium" | "high" | "critical";
}

export type ToleranceStatus = "WITHIN" | "EXCEEDS" | "CRITICAL";

export interface WorkflowAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface WorkflowMetadata {
  label: string;
  value: string;
}

export interface WorkflowSidebarProps {
  status: {
    label: string;
    color: string;
    icon: ReactNode;
  };
  stages?: WorkflowStage[];
  scores?: WorkflowScore[];
  toleranceStatus?: ToleranceStatus;
  actions: WorkflowAction[];
  metadata?: WorkflowMetadata[];
}

// =============================================================================
// SmartSelect Types
// =============================================================================

export interface SmartSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SmartSelectProps {
  options: SmartSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

// =============================================================================
// PermissionGate Types
// =============================================================================

export interface PermissionGateProps {
  permission: string | string[];
  fallback?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

// =============================================================================
// BulkActionBar Types
// =============================================================================

export interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  className?: string;
}

// =============================================================================
// AuditFooter Types
// =============================================================================

export interface AuditFooterProps {
  createdAt?: string | Date;
  createdBy?: string;
  updatedAt?: string | Date;
  updatedBy?: string;
  className?: string;
}

// =============================================================================
// FieldWithHelp Types
// =============================================================================

export interface FieldWithHelpProps {
  label: string;
  help: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

// =============================================================================
// EmptyState Types
// =============================================================================

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline";
  };
  className?: string;
}

// =============================================================================
// ListPageLayout Types
// =============================================================================

export interface ListPageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
}

// =============================================================================
// DetailPageLayout Types
// =============================================================================

export interface DetailPageLayoutProps {
  header: RecordHeaderProps;
  sidebar?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// =============================================================================
// ArcherFieldGroup Types
// =============================================================================

export interface ArcherField {
  label: string;
  value: ReactNode;
  help?: string;
  span?: 1 | 2;
  loading?: boolean;
}

export interface ArcherFieldGroupProps {
  fields: ArcherField[];
  columns?: 1 | 2;
  className?: string;
}

// =============================================================================
// ArcherWidget Types
// =============================================================================

export interface ArcherWidgetProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  onConfigure?: () => void;
  loading?: boolean;
  error?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

// =============================================================================
// ProgressTracker Types
// =============================================================================

export type ProgressStatus = "completed" | "current" | "pending" | "error";

export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStatus;
  description?: string;
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// =============================================================================
// ArcherTabSet Types
// =============================================================================

export interface ArcherTab {
  value: string;
  label: string;
  badge?: number | string;
  disabled?: boolean;
  hidden?: boolean;
  content: ReactNode;
}

export interface ArcherTabSetProps {
  tabs: ArcherTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  syncWithUrl?: boolean;
  className?: string;
}

// =============================================================================
// AuditLog Types
// =============================================================================

export interface AuditLogEntry {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  timestamp: Date | string;
  details?: ReactNode;
}

export interface AuditLogProps {
  entries: AuditLogEntry[];
  groupByDate?: boolean;
  expandable?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  className?: string;
}
