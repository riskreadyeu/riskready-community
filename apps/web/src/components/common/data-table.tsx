"use client";

import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render: (item: T, index: number) => ReactNode;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick?: (item: T) => void;
  href?: (item: T) => string;
  variant?: "default" | "destructive";
  separator?: boolean;
  hidden?: (item: T) => boolean;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  rowActions?: RowAction<T>[] | ((item: T) => RowAction<T>[]);
  onRowClick?: (item: T) => void;
  rowHref?: (item: T) => string;
  emptyMessage?: string;
  filterSlot?: ReactNode;
  headerActions?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
  };
  loading?: boolean;
  className?: string;
  // Selection props
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  // Aggregation row
  aggregationRow?: {
    columns: Record<string, ReactNode>;
    className?: string;
  };
}

export function DataTable<T>({
  title,
  description,
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search...",
  searchFilter,
  rowActions,
  onRowClick,
  rowHref,
  emptyMessage = "No data found",
  filterSlot,
  headerActions,
  pagination,
  loading,
  className,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  aggregationRow,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = searchFilter
    ? data.filter((item) => searchFilter(item, searchQuery))
    : data;

  // Selection handlers
  const handleToggleItem = (id: string) => {
    if (!onSelectionChange) return;
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    const allIds = filteredData.map((item) => keyExtractor(item));
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    onSelectionChange(allSelected ? [] : allIds);
  };

  const allSelected = filteredData.length > 0 && filteredData.every((item) => selectedIds.includes(keyExtractor(item)));
  const someSelected = selectedIds.length > 0 && !allSelected;

  // Build columns with optional checkbox column
  const displayColumns = selectable
    ? [
        {
          key: "__selection",
          header: "",
          className: "w-[40px]",
          headerClassName: "w-[40px]",
          render: (item: T) => (
            <Checkbox
              checked={selectedIds.includes(keyExtractor(item))}
              onCheckedChange={() => handleToggleItem(keyExtractor(item))}
              onClick={(e) => e.stopPropagation()}
            />
          ),
        } as Column<T>,
        ...columns,
      ]
    : columns;

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;
  
  const pageSizeOptions = pagination?.pageSizeOptions || [10, 25, 50, 100];
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const endItem = pagination 
    ? Math.min(pagination.page * pagination.pageSize, pagination.total) 
    : filteredData.length;
  const totalItems = pagination?.total || filteredData.length;

  return (
    <Card className={cn("bg-card border-border glass-card", className)}>
      {(title || headerActions || searchFilter || filterSlot) && (
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {title && (
              <div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {searchFilter && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-64 bg-secondary/50 border-border"
                  />
                </div>
              )}
              {filterSlot}
              {!filterSlot && searchFilter && (
                <Button variant="outline" size="sm" className="h-9 gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              )}
              {headerActions}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={!title && !headerActions ? "pt-6" : ""}>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                {displayColumns.map((col, index) => (
                  <TableHead
                    key={col.key}
                    className={cn("font-semibold", col.headerClassName)}
                  >
                    {col.key === "__selection" && selectable ? (
                      <Checkbox
                        checked={allSelected}
                        ref={(el: any) => {
                          if (el) {
                            el.indeterminate = someSelected;
                          }
                        }}
                        onCheckedChange={handleToggleAll}
                      />
                    ) : col.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        {col.header} <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <TableHead className="w-[50px]" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={displayColumns.length + (rowActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={displayColumns.length + (rowActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  const key = keyExtractor(item);
                  const isClickable = onRowClick || rowHref;

                  const rowContent = (
                    <>
                      {displayColumns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render(item, index)}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell>
                          {(() => {
                            const actions = typeof rowActions === 'function' ? rowActions(item) : rowActions;
                            if (!actions || actions.length === 0) return null;
                            return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {actions
                                .filter((action) => !action.hidden || !action.hidden(item))
                                .map((action, actionIndex) => (
                                <div key={actionIndex}>
                                  {action.separator && <DropdownMenuSeparator />}
                                  {action.href ? (
                                    <DropdownMenuItem
                                      className={cn(
                                        "gap-2",
                                        action.variant === "destructive" &&
                                          "text-destructive focus:text-destructive"
                                      )}
                                      asChild
                                    >
                                      <Link to={action.href(item)}>
                                        {action.icon}
                                        {action.label}
                                      </Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className={cn(
                                        "gap-2",
                                        action.variant === "destructive" &&
                                          "text-destructive focus:text-destructive"
                                      )}
                                      onClick={() => action.onClick?.(item)}
                                    >
                                      {action.icon}
                                      {action.label}
                                    </DropdownMenuItem>
                                  )}
                                </div>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                            );
                          })()}
                        </TableCell>
                      )}
                    </>
                  );

                  return (
                    <TableRow
                      key={key}
                      className={cn(
                        "group hover:bg-secondary/20",
                        isClickable && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {rowContent}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {aggregationRow && (
              <TableFooter>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20 font-medium">
                  {displayColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(col.className, aggregationRow.className)}
                    >
                      {aggregationRow.columns[col.key] || null}
                    </TableCell>
                  ))}
                  {rowActions && <TableCell />}
                </TableRow>
              </TableFooter>
            )}
            {pagination && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={displayColumns.length + (rowActions ? 1 : 0)} className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Rows per page selector and info */}
                      <div className="flex items-center gap-4">
                        {pagination.onPageSizeChange && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              Rows per page:
                            </span>
                            <Select
                              value={pagination.pageSize.toString()}
                              onValueChange={(value) => {
                                pagination.onPageSizeChange?.(Number(value));
                                pagination.onPageChange(1); // Reset to first page
                              }}
                            >
                              <SelectTrigger className="h-8 w-16 bg-transparent border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {pageSizeOptions.map((size) => (
                                  <SelectItem key={size} value={size.toString()}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Showing {startItem}-{endItem} of {totalItems} items
                        </span>
                      </div>

                      {/* Right: Pagination controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          disabled={pagination.page <= 1}
                          onClick={() => pagination.onPageChange(1)}
                          title="First page"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          disabled={pagination.page <= 1}
                          onClick={() => pagination.onPageChange(pagination.page - 1)}
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        {/* Page numbers */}
                        <div className="flex items-center gap-1 mx-1">
                          {(() => {
                            const maxVisible = 5;
                            let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                            
                            if (endPage - startPage < maxVisible - 1) {
                              startPage = Math.max(1, endPage - maxVisible + 1);
                            }

                            const pages = [];
                            
                            // First page if not in range
                            if (startPage > 1) {
                              pages.push(
                                <Button
                                  key={1}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => pagination.onPageChange(1)}
                                >
                                  1
                                </Button>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <span key="ellipsis-start" className="px-1 text-muted-foreground">
                                    ...
                                  </span>
                                );
                              }
                            }

                            // Visible page range
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-8 w-8",
                                    pagination.page === i
                                      ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                                      : "bg-transparent"
                                  )}
                                  onClick={() => pagination.onPageChange(i)}
                                >
                                  {i}
                                </Button>
                              );
                            }

                            // Last page if not in range
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <span key="ellipsis-end" className="px-1 text-muted-foreground">
                                    ...
                                  </span>
                                );
                              }
                              pages.push(
                                <Button
                                  key={totalPages}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => pagination.onPageChange(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              );
                            }

                            return pages;
                          })()}
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          disabled={pagination.page >= totalPages}
                          onClick={() => pagination.onPageChange(pagination.page + 1)}
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          disabled={pagination.page >= totalPages}
                          onClick={() => pagination.onPageChange(totalPages)}
                          title="Last page"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Common row action presets
export const commonRowActions = {
  view: <T,>(hrefFn: (item: T) => string): RowAction<T> => ({
    label: "View Details",
    icon: <Eye className="w-4 h-4" />,
    href: hrefFn,
  }),
  edit: <T,>(onClick: (item: T) => void): RowAction<T> => ({
    label: "Edit",
    icon: <Edit3 className="w-4 h-4" />,
    onClick,
  }),
  delete: <T,>(onClick: (item: T) => void): RowAction<T> => ({
    label: "Delete",
    icon: <Trash2 className="w-4 h-4" />,
    onClick,
    variant: "destructive",
    separator: true,
  }),
};

// Status badge helper
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "success" | "warning" | "destructive" | "default" | "secondary";
}) {
  const variantClasses = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px]", variantClasses[variant])}>
      {status}
    </Badge>
  );
}

// Criticality badge helper
export function CriticalityBadge({ level }: { level: string }) {
  const variants: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
    critical: "destructive",
    high: "warning",
    medium: "default",
    low: "secondary",
  };

  return <StatusBadge status={level} variant={variants[level] || "secondary"} />;
}
