import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import type { AuditFooterProps } from "@/lib/archer/types";

/**
 * Format a date for display in the audit footer.
 */
function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * AuditFooter - Displays created/modified metadata in a consistent format.
 *
 * Shows creation and last modification timestamps with user attribution.
 */
export function AuditFooter({
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  className,
}: AuditFooterProps) {
  const hasCreated = createdAt || createdBy;
  const hasUpdated = updatedAt || updatedBy;

  if (!hasCreated && !hasUpdated) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground",
        className
      )}
    >
      {hasCreated && (
        <div className="flex items-center gap-4">
          <span className="font-medium text-muted-foreground/80">Created</span>
          {createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(createdAt)}
            </span>
          )}
          {createdBy && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {createdBy}
            </span>
          )}
        </div>
      )}

      {hasUpdated && (
        <div className="flex items-center gap-4">
          <span className="font-medium text-muted-foreground/80">
            Last Modified
          </span>
          {updatedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(updatedAt)}
            </span>
          )}
          {updatedBy && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {updatedBy}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
