import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { updateKRIValue, type KeyRiskIndicator, type RAGStatus } from "@/lib/risks-api";
import { format, formatDistanceToNow } from "date-fns";

const RAG_CONFIG: Record<RAGStatus, { color: string; bgColor: string; label: string }> = {
  GREEN: { color: "text-success", bgColor: "bg-success/10", label: "Green" },
  AMBER: { color: "text-warning", bgColor: "bg-warning/10", label: "Amber" },
  RED: { color: "text-destructive", bgColor: "bg-destructive/10", label: "Red" },
  NOT_MEASURED: { color: "text-muted-foreground", bgColor: "bg-muted", label: "Not Measured" },
};

const TREND_CONFIG = {
  IMPROVING: { icon: TrendingUp, color: "text-success", label: "Improving" },
  STABLE: { icon: Minus, color: "text-muted-foreground", label: "Stable" },
  DECLINING: { icon: TrendingDown, color: "text-destructive", label: "Declining" },
  NEW: { icon: Activity, color: "text-blue-600", label: "New" },
};

interface KRIInlineCardProps {
  kri: KeyRiskIndicator;
  onValueUpdated?: (kri: KeyRiskIndicator) => void;
  compact?: boolean;
  showRecordButton?: boolean;
  className?: string;
}

export function KRIInlineCard({
  kri,
  onValueUpdated,
  compact = false,
  showRecordButton = true,
  className,
}: KRIInlineCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const ragConfig = RAG_CONFIG[kri.status || "NOT_MEASURED"];
  const trendConfig = kri.trend ? TREND_CONFIG[kri.trend] : null;
  const TrendIcon = trendConfig?.icon || Minus;

  // Calculate progress against threshold
  const calculateThresholdProgress = (): { percent: number; isOverThreshold: boolean } | null => {
    if (!kri.currentValue || !kri.thresholdRed) return null;

    const current = parseFloat(kri.currentValue);
    const threshold = parseFloat(kri.thresholdRed);

    if (isNaN(current) || isNaN(threshold) || threshold === 0) return null;

    // Determine if higher is worse (most KRIs) or lower is worse
    const greenThreshold = kri.thresholdGreen ? parseFloat(kri.thresholdGreen) : 0;
    const higherIsWorse = greenThreshold < threshold;

    if (higherIsWorse) {
      return {
        percent: Math.min((current / threshold) * 100, 150),
        isOverThreshold: current > threshold,
      };
    } else {
      // Lower is worse (e.g., compliance rate)
      return {
        percent: Math.min(((threshold - current) / threshold) * 100 + 100, 150),
        isOverThreshold: current < threshold,
      };
    }
  };

  const thresholdProgress = calculateThresholdProgress();

  const handleSaveValue = async () => {
    if (!newValue.trim()) return;

    try {
      setSaving(true);
      const updated = await updateKRIValue(kri.id, newValue.trim());
      setNewValue("");
      setIsRecording(false);
      onValueUpdated?.(updated);
    } catch (err) {
      console.error("Error updating KRI value:", err);
      toast.error("Failed to record value");
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors",
        className
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-1.5 rounded-md", ragConfig.bgColor)}>
            <Activity className={cn("w-4 h-4", ragConfig.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{kri.kriId}</span>
              <Badge variant="outline" className={cn("text-[10px] border-transparent px-1.5", ragConfig.bgColor, ragConfig.color)}>
                {ragConfig.label}
              </Badge>
              {trendConfig && (
                <TrendIcon className={cn("w-3 h-3", trendConfig.color)} />
              )}
            </div>
            <p className="text-sm font-medium truncate">{kri.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {kri.currentValue ? (
            <div className="text-right">
              <p className={cn("text-lg font-bold", ragConfig.color)}>
                {kri.currentValue}
              </p>
              <p className="text-[10px] text-muted-foreground">{kri.unit}</p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}

          {showRecordButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={`/risks/kris/${kri.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>View details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("glass-card", className)}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardContent className="pt-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn("p-2 rounded-lg", ragConfig.bgColor)}>
                <Activity className={cn("w-5 h-5", ragConfig.color)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{kri.kriId}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] border-transparent", ragConfig.bgColor, ragConfig.color)}
                  >
                    {ragConfig.label}
                  </Badge>
                  {trendConfig && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <TrendIcon className={cn("w-3 h-3", trendConfig.color)} />
                            <span className={cn("text-[10px]", trendConfig.color)}>
                              {trendConfig.label}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Trend: {trendConfig.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm font-medium mt-1">{kri.name}</p>
                {kri.lastMeasured && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last measured {formatDistanceToNow(new Date(kri.lastMeasured), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              {kri.currentValue ? (
                <>
                  <p className={cn("text-2xl font-bold", ragConfig.color)}>
                    {kri.currentValue}
                  </p>
                  <p className="text-xs text-muted-foreground">{kri.unit}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </div>
          </div>

          {/* Threshold Progress Bar */}
          {thresholdProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {kri.thresholdGreen && `Green: ${kri.thresholdGreen}`}
                </span>
                <span className="text-muted-foreground">
                  {kri.thresholdRed && `Red: ${kri.thresholdRed}`}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    thresholdProgress.percent <= 50 ? "bg-success" :
                    thresholdProgress.percent <= 80 ? "bg-warning" :
                    "bg-destructive"
                  )}
                  style={{ width: `${Math.min(thresholdProgress.percent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-muted-foreground">Current: {kri.currentValue} {kri.unit}</span>
                {kri.thresholdRed && (
                  <span className={cn(
                    thresholdProgress.isOverThreshold ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    {thresholdProgress.isOverThreshold ? "Threshold exceeded!" : `${Math.round(thresholdProgress.percent)}% of threshold`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Inline Value Recording */}
          {showRecordButton && (
            <div className="mt-4 pt-4 border-t">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={`Enter value (${kri.unit || "value"})`}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1 h-9"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveValue();
                      if (e.key === "Escape") {
                        setIsRecording(false);
                        setNewValue("");
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSaveValue} disabled={saving || !newValue.trim()}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsRecording(false);
                      setNewValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecording(true)}
                  >
                    Record New Value
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      {expanded ? (
                        <>
                          Less <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          More <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              )}
            </div>
          )}

          {/* Expanded Details */}
          <CollapsibleContent>
            <div className="mt-4 pt-4 border-t space-y-3">
              {kri.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{kri.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Frequency</p>
                  <p>{kri.frequency?.replace(/_/g, " ") || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Data Source</p>
                  <p>{kri.dataSource || "Manual"}</p>
                </div>
              </div>

              {kri.formula && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Formula</p>
                  <code className="text-xs bg-secondary px-2 py-1 rounded">{kri.formula}</code>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-success/10">
                  <p className="text-muted-foreground">Green</p>
                  <p className="font-medium text-success">{kri.thresholdGreen || "—"}</p>
                </div>
                <div className="p-2 rounded bg-warning/10">
                  <p className="text-muted-foreground">Amber</p>
                  <p className="font-medium text-warning">{kri.thresholdAmber || "—"}</p>
                </div>
                <div className="p-2 rounded bg-destructive/10">
                  <p className="text-muted-foreground">Red</p>
                  <p className="font-medium text-destructive">{kri.thresholdRed || "—"}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to={`/risks/kris/${kri.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Full Details
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Bulk KRI value entry component
 */
interface BulkKRIEntryProps {
  kris: KeyRiskIndicator[];
  onValuesUpdated?: () => void;
  className?: string;
}

export function BulkKRIEntry({ kris, onValuesUpdated, className }: BulkKRIEntryProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const handleSaveAll = async () => {
    const entriesToSave = Object.entries(values).filter(([_, v]) => v.trim());
    if (entriesToSave.length === 0) return;

    setSaving(true);
    const newSavedIds = new Set<string>();

    try {
      await Promise.all(
        entriesToSave.map(async ([kriId, value]) => {
          await updateKRIValue(kriId, value);
          newSavedIds.add(kriId);
        })
      );

      setSavedIds(newSavedIds);
      setValues({});
      onValuesUpdated?.();

      // Clear saved indicators after 2 seconds
      setTimeout(() => setSavedIds(new Set()), 2000);
    } catch (err) {
      console.error("Error saving KRI values:", err);
      toast.error("Some values failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filledCount = Object.values(values).filter((v) => v.trim()).length;

  return (
    <Card className={cn("glass-card", className)}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Bulk KRI Entry</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Recording for: {format(new Date(), "dd MMM yyyy")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {kris.map((kri) => {
            const ragConfig = RAG_CONFIG[kri.status || "NOT_MEASURED"];
            const isSaved = savedIds.has(kri.id);

            return (
              <div
                key={kri.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                  isSaved && "bg-success/10 border-success/30"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", ragConfig.bgColor.replace("/10", ""))} />
                <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                  {kri.kriId}
                </span>
                <span className="text-sm flex-1 truncate">{kri.name}</span>
                <Input
                  type="text"
                  placeholder={kri.unit || "value"}
                  value={values[kri.id] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [kri.id]: e.target.value }))}
                  className="w-24 h-8 text-sm"
                  disabled={saving}
                />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {kri.unit || ""}
                </span>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", ragConfig.bgColor)}>
                  {isSaved ? (
                    <Save className="w-3 h-3 text-success" />
                  ) : (
                    <Activity className={cn("w-3 h-3", ragConfig.color)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filledCount} of {kris.length} values entered
          </span>
          <Button onClick={handleSaveAll} disabled={saving || filledCount === 0}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Values
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
