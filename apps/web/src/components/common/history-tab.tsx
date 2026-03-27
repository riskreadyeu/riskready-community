import * as React from "react";
import { History, User, Clock, FileEdit, Plus, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * HistoryTab - Archer GRC style audit history display
 *
 * Per Archer GRC Design Reference:
 * - History log should be included in every application
 * - Positioned at layout bottom or in dedicated History tab
 * - Shows audit trail of changes with timestamps and users
 */

export interface AuditEntry {
  id: string;
  action: "created" | "updated" | "deleted" | "viewed" | "approved" | "rejected" | "submitted" | "custom";
  actionLabel?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  timestamp: string | Date;
  metadata?: Record<string, unknown>;
}

interface HistoryTabProps {
  /** Audit entries to display */
  entries?: AuditEntry[];
  /** Loading state */
  isLoading?: boolean;
  /** Entity type for display (e.g., "Location", "Process") */
  entityType?: string;
  /** Entity ID for fetching history */
  entityId?: string;
  /** Record type label (alias for entityType) */
  recordType?: string;
  /** Record ID (alias for entityId) */
  recordId?: string;
  /** Record name for display */
  recordName?: string;
  /** Created date of the record */
  createdAt?: string | Date;
  /** Updated date of the record */
  updatedAt?: string | Date;
  /** Created by user */
  createdBy?: { name?: string; email?: string };
  /** Updated by user */
  updatedBy?: { name?: string; email?: string };
  /** Custom empty message */
  emptyMessage?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  updated: <FileEdit className="h-3.5 w-3.5" />,
  deleted: <Trash2 className="h-3.5 w-3.5" />,
  viewed: <Eye className="h-3.5 w-3.5" />,
  approved: <FileEdit className="h-3.5 w-3.5" />,
  rejected: <FileEdit className="h-3.5 w-3.5" />,
  submitted: <FileEdit className="h-3.5 w-3.5" />,
  custom: <FileEdit className="h-3.5 w-3.5" />,
};

const actionColors: Record<string, string> = {
  created: "text-success bg-success/10",
  updated: "text-primary bg-primary/10",
  deleted: "text-destructive bg-destructive/10",
  viewed: "text-muted-foreground bg-muted",
  approved: "text-success bg-success/10",
  rejected: "text-destructive bg-destructive/10",
  submitted: "text-warning bg-warning/10",
  custom: "text-muted-foreground bg-muted",
};

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  viewed: "Viewed",
  approved: "Approved",
  rejected: "Rejected",
  submitted: "Submitted",
  custom: "Changed",
};

function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(timestamp);
}

export function HistoryTab({
  entries = [],
  isLoading,
  entityType = "Record",
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  emptyMessage = "No history entries available",
}: HistoryTabProps) {
  // Build synthetic entries from createdAt/updatedAt if no entries provided
  const displayEntries = React.useMemo(() => {
    if (entries.length > 0) return entries;

    const synthetic: AuditEntry[] = [];

    if (createdAt) {
      synthetic.push({
        id: "created",
        action: "created",
        user: createdBy,
        timestamp: createdAt,
      });
    }

    if (updatedAt && updatedAt !== createdAt) {
      synthetic.push({
        id: "updated",
        action: "updated",
        user: updatedBy,
        timestamp: updatedAt,
      });
    }

    return synthetic.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [entries, createdAt, updatedAt, createdBy, updatedBy]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {displayEntries.map((entry, idx) => (
                <div key={entry.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2",
                      actionColors[entry.action] || actionColors['custom']
                    )}
                  >
                    {actionIcons[entry.action] || actionIcons['custom']}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {entry.actionLabel || actionLabels[entry.action] || "Changed"}
                          </span>
                          {entry.field && (
                            <Badge variant="outline" className="text-[10px]">
                              {entry.field}
                            </Badge>
                          )}
                        </div>

                        {/* Value change display */}
                        {(entry.oldValue || entry.newValue) && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {entry.oldValue && entry.newValue ? (
                              <>
                                <span className="line-through">{entry.oldValue}</span>
                                <span className="mx-1">→</span>
                                <span className="font-medium text-foreground">{entry.newValue}</span>
                              </>
                            ) : entry.newValue ? (
                              <span>Set to: <span className="font-medium text-foreground">{entry.newValue}</span></span>
                            ) : null}
                          </div>
                        )}

                        {/* User and timestamp */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {entry.user && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.user.name || entry.user.email || "System"}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Full timestamp on hover */}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact history summary for use outside tabs
 */
export function HistorySummary({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
}: Pick<HistoryTabProps, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {createdAt && (
        <div className="flex items-center gap-2">
          <span>Created:</span>
          <span>{formatTimestamp(createdAt)}</span>
          {createdBy && <span>by {createdBy.name || createdBy.email}</span>}
        </div>
      )}
      {updatedAt && updatedAt !== createdAt && (
        <div className="flex items-center gap-2">
          <span>Updated:</span>
          <span>{formatTimestamp(updatedAt)}</span>
          {updatedBy && <span>by {updatedBy.name || updatedBy.email}</span>}
        </div>
      )}
    </div>
  );
}
