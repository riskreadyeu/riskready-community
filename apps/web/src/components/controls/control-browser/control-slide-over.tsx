"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X,
  ExternalLink,
  Shield,
  Layers,
  TestTube,
  Target,
  Activity,
  Clock,
  User,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getControl, type Control } from "@/lib/controls-api";
import { EffectivenessIndicator } from "./effectiveness-indicator";
import { MaturityIndicator, MaturitySlider } from "./maturity-indicator";
import {
  THEME_LABELS,
  THEME_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  FRAMEWORK_LABELS,
} from "./types";

interface ControlSlideOverProps {
  controlId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLayerClick?: (layerId: string) => void;
}

export function ControlSlideOver({
  controlId,
  open,
  onOpenChange,
  onLayerClick,
}: ControlSlideOverProps) {
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (controlId && open) {
      loadControl(controlId);
    }
  }, [controlId, open]);

  const loadControl = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getControl(id);
      setControl(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load control");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = control ? STATUS_COLORS[control.implementationStatus] : STATUS_COLORS.NOT_STARTED;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <XCircle className="h-12 w-12 text-destructive/50 mb-4" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => controlId && loadControl(controlId)}>
              Try Again
            </Button>
          </div>
        ) : control ? (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{control.controlId}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {FRAMEWORK_LABELS[control.framework || 'ISO']}
                    </Badge>
                  </div>
                  <SheetTitle className="text-lg pr-8">{control.name}</SheetTitle>
                </div>
              </div>
            </SheetHeader>

            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Badge variant="outline" className={cn(THEME_COLORS[control.theme])}>
                {THEME_LABELS[control.theme]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(statusColors.bg, statusColors.text, statusColors.border)}
              >
                {STATUS_LABELS[control.implementationStatus]}
              </Badge>
              {!control.applicable && (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  Not Applicable
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-bold">{control._count?.['layers'] ?? control.layers?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Layers</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-bold">{control.effectiveness?.score ?? '--'}%</p>
                <p className="text-xs text-muted-foreground">Effectiveness</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-2xl font-bold">
                  {control.effectiveness?.passCount ?? 0}/{control.effectiveness?.totalLayers ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Tests Passed</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="layers">
                  Layers ({control.layers?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Description */}
                {control.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{control.description}</p>
                  </div>
                )}

                {/* Implementation Details */}
                {control.implementationDesc && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Implementation</h4>
                    <p className="text-sm text-muted-foreground">{control.implementationDesc}</p>
                  </div>
                )}

                {/* Not Applicable Justification */}
                {!control.applicable && control.justificationIfNa && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Not Applicable Justification
                    </h4>
                    <p className="text-sm text-muted-foreground">{control.justificationIfNa}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Source Standard</p>
                    <p className="font-medium">{control.sourceStandard || 'ISO 27001:2022'}</p>
                  </div>
                  {control.soc2Criteria && (
                    <div>
                      <p className="text-muted-foreground">SOC2 Criteria</p>
                      <p className="font-medium">{control.soc2Criteria}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{new Date(control.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {control.updatedBy && (
                    <div>
                      <p className="text-muted-foreground">Updated By</p>
                      <p className="font-medium">
                        {control.updatedBy.firstName} {control.updatedBy.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="layers" className="space-y-3">
                {control.layers && control.layers.length > 0 ? (
                  control.layers.map(layer => (
                    <Link
                      key={layer.id}
                      to={`/controls/${control.id}/layers/${layer.id}`}
                      className="block p-3 rounded-lg border hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {layer.layer}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{layer.description || `${layer.layer} Layer`}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>

                      {/* Layer Status */}
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Tests:</span>
                          <span className="text-xs font-medium">{layer.testsPassed}/{layer.testsTotal}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Score:</span>
                          <span className="text-xs font-medium">{layer.protectionScore ?? 0}%</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No layers defined</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-2">Framework Mapping</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ISO 27001:2022</span>
                      <span className="font-mono">{control.controlId}</span>
                    </div>
                    {control.soc2Criteria && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SOC2 TSC</span>
                        <span>{control.soc2Criteria}</span>
                      </div>
                    )}
                    {control.tscCategory && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TSC Category</span>
                        <span>{control.tscCategory}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Related Risks */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Related Risks</h4>
                  <p className="text-sm text-muted-foreground">
                    No risks linked to this control yet.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t">
              <Link to={`/controls/${control.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Full Details
                </Button>
              </Link>
              <Button className="flex-1 gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Control
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
