import { useState } from "react";
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AuditLogProps, AuditLogEntry } from "@/lib/archer/types";

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format timestamp as relative time
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? parseISO(timestamp) : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format date for grouping
 */
function formatDateGroup(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? parseISO(timestamp) : timestamp;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

/**
 * Group entries by date
 */
function groupEntriesByDate(entries: AuditLogEntry[]): Map<string, AuditLogEntry[]> {
  const groups = new Map<string, AuditLogEntry[]>();

  entries.forEach((entry) => {
    const dateKey = formatDateGroup(entry.timestamp);
    const group = groups.get(dateKey) || [];
    group.push(entry);
    groups.set(dateKey, group);
  });

  return groups;
}

/**
 * AuditLog - Chronological activity history component.
 *
 * Displays audit trail entries with user avatars, timestamps, and expandable details.
 * Supports date grouping and infinite scroll with Load More.
 */
export function AuditLog({
  entries,
  groupByDate = true,
  expandable = true,
  onLoadMore,
  loading = false,
  hasMore = false,
  className,
}: AuditLogProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const renderEntry = (entry: AuditLogEntry) => {
    const isExpanded = expandedIds.has(entry.id);
    const hasDetails = expandable && entry.details;

    const entryContent = (
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
          <AvatarFallback className="text-xs">
            {getInitials(entry.user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{entry.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{entry.action}</p>
        </div>

        {hasDetails && (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        )}
      </div>
    );

    if (!hasDetails) {
      return (
        <div key={entry.id} className="border-b last:border-0">
          {entryContent}
        </div>
      );
    }

    return (
      <Collapsible
        key={entry.id}
        open={isExpanded}
        onOpenChange={() => toggleExpanded(entry.id)}
        className="border-b last:border-0"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left hover:bg-muted/50 transition-colors px-4 -mx-4"
          >
            {entryContent}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-11 pb-3 text-sm">{entry.details}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderGroupedEntries = () => {
    const groups = groupEntriesByDate(entries);

    return Array.from(groups.entries()).map(([dateKey, groupEntries]) => (
      <div key={dateKey} className="space-y-0">
        <div className="sticky top-0 bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {dateKey}
        </div>
        <div className="px-4">
          {groupEntries.map(renderEntry)}
        </div>
      </div>
    ));
  };

  if (entries.length === 0) {
    return (
      <div
        role="log"
        aria-live="polite"
        className={cn(
          "flex items-center justify-center rounded-lg border bg-card p-8 text-sm text-muted-foreground",
          className
        )}
      >
        No audit entries found
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-live="polite"
      className={cn("rounded-lg border bg-card", className)}
    >
      <div className="divide-y">
        {groupByDate ? (
          renderGroupedEntries()
        ) : (
          <div className="px-4">{entries.map(renderEntry)}</div>
        )}
      </div>

      {onLoadMore && hasMore && (
        <div className="border-t p-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
