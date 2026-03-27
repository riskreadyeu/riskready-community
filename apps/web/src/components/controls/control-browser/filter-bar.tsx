"use client";

import { Search, Filter, X, SlidersHorizontal, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  type ControlBrowserFilters,
  type ControlFramework,
  type ControlTheme,
  type ImplementationStatus,
  FRAMEWORK_LABELS,
  THEME_LABELS,
  STATUS_LABELS,
  EFFECTIVENESS_LABELS,
} from "./types";

interface FilterBarProps {
  filters: ControlBrowserFilters;
  onFilterChange: (filters: Partial<ControlBrowserFilters>) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction?: (action: string) => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  selectedCount,
  onClearSelection,
  onBulkAction,
}: FilterBarProps) {
  const activeFiltersCount = [
    filters.framework !== 'all',
    filters.theme !== 'all',
    filters.status !== 'all',
    filters.applicable !== 'all',
    filters.effectivenessRating !== 'all',
    filters.search.length > 0,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onFilterChange({
      framework: 'all',
      theme: 'all',
      status: 'all',
      applicable: 'all',
      effectivenessRating: 'all',
      search: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search controls, capabilities..."
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="pl-9 h-9"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onFilterChange({ search: '' })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        {/* Framework Filter */}
        <Select
          value={filters.framework}
          onValueChange={(value) => onFilterChange({ framework: value as ControlFramework | 'all' })}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {Object.entries(FRAMEWORK_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Theme Filter */}
        <Select
          value={filters.theme}
          onValueChange={(value) => onFilterChange({ theme: value as ControlTheme | 'all' })}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {Object.entries(THEME_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ status: value as ImplementationStatus | 'all' })}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Effectiveness Filter */}
        <Select
          value={filters.effectivenessRating}
          onValueChange={(value) => onFilterChange({ effectivenessRating: value as ControlBrowserFilters['effectivenessRating'] })}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Effectiveness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {Object.entries(EFFECTIVENESS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* More Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              More
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => onFilterChange({ applicable: filters.applicable === true ? 'all' : true })}
            >
              <span className={cn(
                "mr-2",
                filters.applicable === true && "text-primary font-medium"
              )}>
                ✓
              </span>
              Applicable Only
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange({ applicable: filters.applicable === false ? 'all' : false })}
            >
              <span className={cn(
                "mr-2",
                filters.applicable === false && "text-primary font-medium"
              )}>
                ✓
              </span>
              Not Applicable Only
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Selection Bar (shown when items are selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onBulkAction?.('assess')}>
              Bulk Assess
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onBulkAction?.('test')}>
              Bulk Test
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onBulkAction?.('status')}>
              Update Status
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </div>
      )}
      
      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} controls
          {activeFiltersCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-2 text-xs"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </span>
        
        {filters.search && (
          <span>
            Search: "{filters.search}"
          </span>
        )}
      </div>
    </div>
  );
}
