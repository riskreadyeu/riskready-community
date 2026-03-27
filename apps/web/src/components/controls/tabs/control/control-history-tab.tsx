import { Section } from "@/components/archer/section";
import { AuditLog } from "@/components/archer/audit-log";
import { History } from "lucide-react";
import type { AuditLogEntry } from "@/lib/archer/types";

// =============================================================================
// Types
// =============================================================================

export interface ControlHistoryTabProps {
  auditEntries: AuditLogEntry[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ControlHistoryTab - Audit history tab for Control detail page.
 *
 * Displays chronological audit log of control changes.
 * Uses Section and AuditLog components for history visualization.
 */
export function ControlHistoryTab({
  auditEntries,
  loading = false,
  onLoadMore,
  hasMore = false,
}: ControlHistoryTabProps) {
  return (
    <div className="space-y-6">
      <Section title="Audit History" icon={History}>
        <AuditLog
          entries={auditEntries}
          groupByDate={true}
          expandable={true}
          onLoadMore={onLoadMore}
          loading={loading}
          hasMore={hasMore}
        />
      </Section>
    </div>
  );
}
