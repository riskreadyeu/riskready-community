import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Link2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import type { CrossReferenceGridProps } from "@/lib/archer/types";

/**
 * Default function to extract ID from a record.
 */
function defaultGetRowId<T>(record: T): string {
  if (record && typeof record === "object") {
    const r = record as Record<string, unknown>;
    if ("id" in r && (typeof r['id'] === "string" || typeof r['id'] === "number")) {
      return String(r['id']);
    }
  }
  return String(Math.random());
}

/**
 * CrossReferenceGrid - Table for related records with Add/Remove/Create actions.
 *
 * Displays a list of related records in a table format with support for
 * selection, removal, and linking/creating new records.
 */
export function CrossReferenceGrid<T>({
  title,
  records,
  columns,
  onAdd,
  onRemove,
  onCreate,
  onRowClick,
  emptyState,
  maxHeight = "300px",
  getRowId = defaultGetRowId,
}: CrossReferenceGridProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasSelection = selectedIds.size > 0;
  const allSelected =
    records.length > 0 && selectedIds.size === records.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(getRowId)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleRemove = () => {
    if (onRemove && hasSelection) {
      onRemove(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const hasRecords = records.length > 0;

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">
            ({records.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove ({selectedIds.size})
            </Button>
          )}
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Existing
            </Button>
          )}
          {onCreate && (
            <Button variant="default" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {hasRecords ? (
        <ScrollArea style={{ maxHeight }}>
          <Table>
            <TableHeader>
              <TableRow>
                {onRemove && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={column.className}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const id = getRowId(record);
                const isSelected = selectedIds.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                    onClick={
                      onRowClick
                        ? (e) => {
                            // Don't trigger row click when clicking checkbox
                            if (
                              (e.target as HTMLElement).closest(
                                '[role="checkbox"]'
                              )
                            ) {
                              return;
                            }
                            onRowClick(record);
                          }
                        : undefined
                    }
                  >
                    {onRemove && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={`Select row ${id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render
                          ? column.render(record)
                          : String(
                              (record as Record<string, unknown>)[column.key] ??
                                ""
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : emptyState ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={
            onCreate
              ? {
                  label: "Create New",
                  onClick: onCreate,
                }
              : onAdd
                ? {
                    label: "Link Existing",
                    onClick: onAdd,
                    variant: "outline",
                  }
                : undefined
          }
        />
      ) : (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No records found
        </div>
      )}
    </div>
  );
}
