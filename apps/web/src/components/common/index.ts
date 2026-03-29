export { PageHeader } from './page-header';
export { DataTable, type Column, type RowAction, StatusBadge, CriticalityBadge, commonRowActions } from './data-table';
// Legacy page composition helpers.
// Prefer the canonical list/detail page wrappers from "@/components/archer" for new work.
export { DetailPageLayout } from './detail-page-layout';
export { StatCard, StatCardGrid } from './stat-card';
export { FormDialog, ConfirmDialog } from './form-dialog';
export { FormField, FormSection, FormRow, RHFFormField, FieldErrorMessage } from './form-field';
export { SlideOver, SlideOverForm } from './slide-over';

// Archer GRC components
export { ArcherTabs, ArcherTabsList, ArcherTabsTrigger, ArcherTabsContent } from './archer-tabs';
export { RecordActionsMenu, type RecordAction } from './record-actions-menu';
export { HistoryTab, HistorySummary, type AuditEntry } from './history-tab';
