import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Circle } from "lucide-react";
import type { WorkflowSidebarProps } from "@/lib/archer/types";

/**
 * Get the background color class for a score level.
 */
function getScoreLevelColor(level?: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-500";
    case "high":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
    default:
      return "bg-primary";
  }
}

/**
 * Get the tolerance status styling.
 */
function getToleranceStyles(status: "WITHIN" | "EXCEEDS" | "CRITICAL"): {
  label: string;
  className: string;
} {
  switch (status) {
    case "WITHIN":
      return {
        label: "Within Tolerance",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      };
    case "EXCEEDS":
      return {
        label: "Exceeds Tolerance",
        className: "bg-amber-500/10 text-amber-700 border-amber-200",
      };
    case "CRITICAL":
      return {
        label: "Critical - Above Appetite",
        className: "bg-red-500/10 text-red-700 border-red-200",
      };
  }
}

/**
 * WorkflowSidebar - Fixed 280px workflow panel for detail pages.
 *
 * Displays status, workflow stages, scores, tolerance status,
 * actions, and metadata in a vertical sidebar layout.
 */
export function WorkflowSidebar({
  status,
  stages,
  scores,
  toleranceStatus,
  actions,
  metadata,
}: WorkflowSidebarProps) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l bg-muted/30">
      {/* Status */}
      <div className="border-b p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: status.color }}
          >
            {status.icon}
          </div>
          <span className="font-semibold">{status.label}</span>
        </div>
      </div>

      {/* Workflow Stages */}
      {stages && stages.length > 0 && (
        <div className="border-b p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workflow Progress
          </div>
          <div className="mt-3 space-y-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    stage.complete
                      ? "bg-emerald-500 text-white"
                      : stage.current
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {stage.complete ? (
                    <Check className="h-3 w-3" />
                  ) : stage.current ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    stage.complete
                      ? "text-muted-foreground line-through"
                      : stage.current
                        ? "font-medium"
                        : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scores */}
      {scores && scores.length > 0 && (
        <div className="border-b p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Risk Scores
          </div>
          <div className="mt-3 space-y-3">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {score.label}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      getScoreLevelColor(score.level)
                    )}
                  />
                  <span className="text-sm font-semibold tabular-nums">
                    {score.value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tolerance Status */}
      {toleranceStatus && (
        <div className="border-b p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tolerance
          </div>
          <div className="mt-2">
            <Badge
              variant="outline"
              className={cn(
                "w-full justify-center py-1",
                getToleranceStyles(toleranceStatus).className
              )}
            >
              {getToleranceStyles(toleranceStatus).label}
            </Badge>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex-1 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Actions
        </div>
        <div className="mt-3 space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="w-full justify-start"
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <div className="space-y-2">
              {metadata.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
