import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Target, Plus } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface MaturityLevelVisualizerProps {
  currentLevel: number; // 0-5
  targetLevel: number; // 1-5
  maxLevel?: number; // Default 5
  showLegend?: boolean;
  compact?: boolean;
  onAssess?: () => void;
  className?: string;
  labels?: string[]; // Optional L1-L5 descriptions
}

// =============================================================================
// Component
// =============================================================================

/**
 * MaturityLevelVisualizer - L1-L5 maturity progress with current/target visualization.
 *
 * Displays maturity levels as a vertical stack of progress indicators showing
 * achieved levels (green), target levels (warning border), and levels beyond max (dimmed).
 * Follows Archer design patterns.
 */
export function MaturityLevelVisualizer({
  currentLevel,
  targetLevel,
  maxLevel = 5,
  showLegend = true,
  compact = false,
  onAssess,
  className,
  labels,
}: MaturityLevelVisualizerProps) {
  const gap = targetLevel - currentLevel;
  const levels = [1, 2, 3, 4, 5];

  return (
    <div className={className}>
      {/* Header */}
      {showLegend && (
        <div className={cn("flex items-center justify-between mb-4", compact && "mb-3")}>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className={cn("text-sm text-muted-foreground", compact && "text-xs")}>
              Maturity Level
            </span>
          </div>
          {onAssess && (
            <Button variant="ghost" size="sm" onClick={onAssess} className={cn("gap-1 text-xs", compact && "h-7")}>
              <Plus className="w-3 h-3" /> Assess
            </Button>
          )}
        </div>
      )}

      {/* Current Level Display */}
      <div className={cn("flex items-center justify-between mb-4", compact && "mb-3")}>
        <span className={cn("text-sm text-muted-foreground", compact && "text-xs")}>Current Level</span>
        <span className={cn("text-2xl font-bold", compact && "text-xl")}>L{currentLevel}</span>
      </div>

      {/* Level Progress Bars */}
      <div
        role="progressbar"
        aria-valuenow={currentLevel}
        aria-valuemin={0}
        aria-valuemax={maxLevel}
        aria-label={`Maturity level ${currentLevel} of ${maxLevel}, target ${targetLevel}`}
        className={cn("space-y-2", compact && "space-y-1.5")}
      >
        {levels.map((level) => {
          const isAchieved = currentLevel >= level;
          const isTarget = targetLevel === level;
          const isBeyondMax = level > maxLevel;

          return (
            <div
              key={level}
              className={cn("flex items-center gap-3", isBeyondMax && "opacity-30", compact && "gap-2")}
              aria-label={`Level ${level}${isAchieved ? " - achieved" : ""}${isTarget ? " - target" : ""}`}
            >
              {/* Level Badge */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium border-2 shrink-0",
                  isAchieved && "bg-success/10 border-success text-success",
                  !isAchieved && isTarget && "bg-warning/10 border-warning text-warning",
                  !isAchieved && !isTarget && "bg-muted border-border text-muted-foreground",
                  compact && "w-7 h-7 text-xs"
                )}
              >
                L{level}
              </div>

              {/* Progress Bar */}
              <div className={cn("flex-1 h-2 bg-secondary rounded-full overflow-hidden", compact && "h-1.5")}>
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isAchieved ? "bg-success" : "bg-transparent"
                  )}
                  style={{ width: isAchieved ? "100%" : "0%" }}
                />
              </div>

              {/* Target Indicator */}
              {isTarget && !isAchieved && (
                <Badge variant="outline" className={cn("text-[10px] shrink-0", compact && "text-[9px] px-1.5 py-0")}>
                  Target
                </Badge>
              )}

              {/* Optional Label */}
              {labels && labels[level - 1] && !compact && (
                <span className="text-xs text-muted-foreground w-32 truncate">{labels[level - 1]}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Gap Indicator */}
      {showLegend && (
        <div className={cn("text-center py-3 mt-4 border-t", compact && "py-2 mt-3")}>
          <p className={cn("text-xs text-muted-foreground", compact && "text-[10px]")}>Gap to Target</p>
          <p
            className={cn(
              "text-xl font-bold mt-1",
              gap === 0 && "text-success",
              gap > 0 && "text-warning",
              gap < 0 && "text-muted-foreground",
              compact && "text-lg"
            )}
          >
            {gap > 0 ? `${gap} level${gap !== 1 ? "s" : ""}` : gap === 0 ? "Target met" : "Exceeds target"}
          </p>
        </div>
      )}
    </div>
  );
}
