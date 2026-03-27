import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { BulkActionBarProps } from "@/lib/archer/types";

/**
 * BulkActionBar - Fixed position bar for multi-select actions.
 *
 * Appears when items are selected, showing the selection count
 * and available bulk actions.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform",
        "flex items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg",
        className
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
