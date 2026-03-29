
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield, ChevronDown, ChevronUp, ExpandIcon, ShrinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getControls, getControlStats, type ControlStats } from "@/lib/controls-api";
import { FilterBar } from "./filter-bar";
import { ControlRow } from "./control-row";
import {
  type ControlWithLayers,
  type ControlBrowserFilters,
  type ControlBrowserState,
  type ControlFramework,
  FRAMEWORK_LABELS,
  FRAMEWORK_COLORS,
} from "./types";

interface ControlBrowserProps {
  onControlSelect?: (controlId: string) => void;
  onLayerSelect?: (controlId: string, layerId: string) => void;
  className?: string;
}

export function ControlBrowser({
  onControlSelect,
  onLayerSelect,
  className,
}: ControlBrowserProps) {
  const navigate = useNavigate();

  // Data state
  const [controls, setControls] = useState<ControlWithLayers[]>([]);
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ControlBrowserFilters>({
    framework: 'all',
    theme: 'all',
    status: 'all',
    applicable: 'all',
    search: '',
    effectivenessRating: 'all',
  });

  // UI state
  const [browserState, setBrowserState] = useState<ControlBrowserState>({
    expandedControls: new Set(),
    selectedControls: new Set(),
    selectedLayers: new Set(),
    activeControlId: null,
    activeLayerId: null,
  });
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [controlsResponse, statsData] = await Promise.all([
        getControls({ take: 500 }),
        getControlStats(),
      ]);
      
      // Transform controls with calculated effectiveness
      const controlsWithStatus = controlsResponse.results.map(control => ({
        ...control,
        layers: control.layers || [],
        effectivenessScore: control.effectiveness?.score,
        effectivenessRating: control.effectiveness?.rating as ControlWithLayers['effectivenessRating'],
      }));

      setControls(controlsWithStatus as ControlWithLayers[]);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load controls');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter controls
  const filteredControls = useMemo(() => {
    return controls.filter(control => {
      // Framework filter
      if (filters.framework !== 'all' && control.framework !== filters.framework) {
        return false;
      }
      
      // Theme filter
      if (filters.theme !== 'all' && control.theme !== filters.theme) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && control.implementationStatus !== filters.status) {
        return false;
      }
      
      // Applicable filter
      if (filters.applicable !== 'all' && control.applicable !== filters.applicable) {
        return false;
      }
      
      // Effectiveness filter
      if (filters.effectivenessRating !== 'all') {
        const rating = control.effectivenessRating || 'NOT_TESTED';
        if (rating !== filters.effectivenessRating) {
          return false;
        }
      }
      
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesControl =
          control.controlId.toLowerCase().includes(search) ||
          control.name.toLowerCase().includes(search) ||
          control.description?.toLowerCase().includes(search);

        const matchesLayer = control.layers?.some(layer =>
          layer.layer.toLowerCase().includes(search) ||
          layer.description?.toLowerCase().includes(search)
        );

        if (!matchesControl && !matchesLayer) {
          return false;
        }
      }

      return true;
    });
  }, [controls, filters]);

  // Group controls by framework
  const controlsByFramework = useMemo(() => {
    const grouped: Record<string, ControlWithLayers[]> = {
      all: filteredControls,
      ISO: [],
      SOC2: [],
      NIS2: [],
      DORA: [],
    };
    
    for (const control of filteredControls) {
      const framework = control.framework || 'ISO';
      if (grouped[framework]) {
        grouped[framework].push(control);
      }
    }
    
    return grouped;
  }, [filteredControls]);
  
  // Handlers
  const handleFilterChange = useCallback((updates: Partial<ControlBrowserFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);
  
  const handleToggleExpand = useCallback((controlId: string) => {
    setBrowserState(prev => {
      const expanded = new Set(prev.expandedControls);
      if (expanded.has(controlId)) {
        expanded.delete(controlId);
      } else {
        expanded.add(controlId);
      }
      return { ...prev, expandedControls: expanded };
    });
  }, []);
  
  const handleToggleSelect = useCallback((controlId: string) => {
    setBrowserState(prev => {
      const selected = new Set(prev.selectedControls);
      if (selected.has(controlId)) {
        selected.delete(controlId);
      } else {
        selected.add(controlId);
      }
      return { ...prev, selectedControls: selected };
    });
  }, []);
  
  const handleToggleLayerSelect = useCallback((layerId: string) => {
    setBrowserState(prev => {
      const selected = new Set(prev.selectedLayers);
      if (selected.has(layerId)) {
        selected.delete(layerId);
      } else {
        selected.add(layerId);
      }
      return { ...prev, selectedLayers: selected };
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setBrowserState(prev => ({
      ...prev,
      selectedControls: new Set(),
      selectedLayers: new Set(),
    }));
  }, []);
  
  const handleExpandAll = useCallback(() => {
    setBrowserState(prev => ({
      ...prev,
      expandedControls: new Set(filteredControls.map(c => c.id)),
    }));
  }, [filteredControls]);
  
  const handleCollapseAll = useCallback(() => {
    setBrowserState(prev => ({
      ...prev,
      expandedControls: new Set(),
    }));
  }, []);
  
  const handleViewControl = useCallback((controlId: string) => {
    if (onControlSelect) {
      onControlSelect(controlId);
    } else {
      navigate(`/controls/${controlId}`);
    }
  }, [navigate, onControlSelect]);
  
  const handleViewLayer = useCallback((controlId: string, layerId: string) => {
    if (onLayerSelect) {
      onLayerSelect(controlId, layerId);
    } else {
      navigate(`/controls/${controlId}/layers/${layerId}`);
    }
  }, [navigate, onLayerSelect]);

  const handleBulkAction = useCallback((_action: string) => {
    toast.info("Bulk actions are not yet available");
    // TODO: Implement bulk actions
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
            <p className="text-destructive font-medium">Failed to load controls</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSelected = browserState.selectedControls.size + browserState.selectedLayers.size;
  const hasExpanded = browserState.expandedControls.size > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalCount={controls.length}
        filteredCount={filteredControls.length}
        selectedCount={totalSelected}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
      />
      
      {/* Framework Tabs + Stats */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={filters.framework}
          onValueChange={(v) => handleFilterChange({ framework: v as ControlFramework | 'all' })}
        >
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              All ({controlsByFramework['all']!.length})
            </TabsTrigger>
            {(['ISO', 'SOC2', 'NIS2', 'DORA'] as const).map(fw => (
              <TabsTrigger key={fw} value={fw} className="text-xs px-3">
                <span className={cn(
                  "w-2 h-2 rounded-full mr-1.5",
                  FRAMEWORK_COLORS[fw]
                )} />
                {fw} ({controlsByFramework[fw]?.length ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Expand/Collapse All */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={hasExpanded ? handleCollapseAll : handleExpandAll}
          >
            {hasExpanded ? (
              <>
                <ShrinkIcon className="h-3.5 w-3.5" />
                Collapse All
              </>
            ) : (
              <>
                <ExpandIcon className="h-3.5 w-3.5" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Controls List */}
      <Card>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b bg-secondary/30 font-medium">
          <div className="w-6" /> {/* Checkbox */}
          <div className="w-6" /> {/* Expand */}
          <div className="w-16">Control</div>
          <div className="w-12">FW</div>
          <div className="flex-1">Name</div>
          <div className="w-24">Theme</div>
          <div className="w-24 text-center">Status</div>
          <div className="w-20 text-center">Score</div>
          <div className="w-16 text-center">Caps</div>
          <div className="w-16" /> {/* Actions */}
        </div>
        
        {/* Rows */}
        <CardContent className="p-0">
          {filteredControls.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No controls match your filters</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => handleFilterChange({
                  framework: 'all',
                  theme: 'all',
                  status: 'all',
                  applicable: 'all',
                  effectivenessRating: 'all',
                  search: '',
                })}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredControls.map(control => (
                <ControlRow
                  key={control.id}
                  control={control}
                  isExpanded={browserState.expandedControls.has(control.id)}
                  isSelected={browserState.selectedControls.has(control.id)}
                  onToggleExpand={() => handleToggleExpand(control.id)}
                  onToggleSelect={() => handleToggleSelect(control.id)}
                  onViewDetails={() => handleViewControl(control.id)}
                  onLayerClick={(layerId) => handleViewLayer(control.id, layerId)}
                  selectedLayers={browserState.selectedLayers}
                  onToggleLayerSelect={handleToggleLayerSelect}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Stats Summary */}
      {stats && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-medium text-foreground">{stats.implemented}</span> implemented
            </span>
            <span>
              <span className="font-medium text-foreground">{stats.partial}</span> partial
            </span>
            <span>
              <span className="font-medium text-foreground">{stats.notStarted}</span> not started
            </span>
          </div>
          <div className="flex items-center gap-4">
            {Object.entries(stats.byTheme || {}).map(([theme, count]) => (
              <span key={theme}>
                {theme}: <span className="font-medium text-foreground">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
