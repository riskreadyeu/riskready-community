
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MATURITY_COLORS, MATURITY_LABELS } from "./types";

interface MaturityIndicatorProps {
  current: number | null | undefined;
  target?: number | null;
  maxLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showGap?: boolean;
  className?: string;
}

export function MaturityIndicator({
  current,
  target,
  maxLevel = 5,
  size = 'md',
  showLabel = false,
  showGap = false,
  className,
}: MaturityIndicatorProps) {
  const currentLevel = current ?? 0;
  const targetLevel = target ?? maxLevel;
  const gap = targetLevel - currentLevel;
  
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const fontSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxLevel + 1 }, (_, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    dotSize,
                    "rounded-full transition-all",
                    i <= currentLevel
                      ? MATURITY_COLORS[currentLevel]
                      : i <= targetLevel
                        ? "bg-muted ring-1 ring-primary/30 ring-offset-1"
                        : "bg-muted/50"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">Level {i}: {MATURITY_LABELS[i]}</p>
                {i === currentLevel && <p className="text-primary">Current Level</p>}
                {i === targetLevel && i !== currentLevel && <p className="text-muted-foreground">Target Level</p>}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {showLabel && (
          <span className={cn(fontSize, "font-medium tabular-nums")}>
            L{currentLevel}
            {target !== undefined && target !== currentLevel && (
              <span className="text-muted-foreground">→L{targetLevel}</span>
            )}
          </span>
        )}
        
        {showGap && gap > 0 && (
          <span className={cn(
            fontSize,
            "px-1.5 py-0.5 rounded-full font-medium",
            gap >= 3 ? "bg-destructive/10 text-destructive" :
            gap >= 2 ? "bg-warning/10 text-warning" :
            "bg-muted text-muted-foreground"
          )}>
            -{gap}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}

interface MaturitySliderProps {
  current: number | null | undefined;
  target?: number | null;
  maxLevel?: number;
  onChange?: (level: number) => void;
  onTargetChange?: (level: number) => void;
  disabled?: boolean;
  className?: string;
}

export function MaturitySlider({
  current,
  target,
  maxLevel = 5,
  onChange,
  onTargetChange,
  disabled = false,
  className,
}: MaturitySliderProps) {
  const currentLevel = current ?? 0;
  const targetLevel = target ?? maxLevel;
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Maturity Assessment</span>
        <span className="font-medium">
          L{currentLevel} <span className="text-muted-foreground">→</span> L{targetLevel}
        </span>
      </div>
      
      {/* Slider Track */}
      <div className="relative pt-1">
        {/* Background Track */}
        <div className="flex h-10 rounded-lg overflow-hidden border">
          {Array.from({ length: maxLevel + 1 }, (_, i) => {
            const isCurrentOrBelow = i <= currentLevel;
            const isTarget = i === targetLevel;
            const isBetween = i > currentLevel && i <= targetLevel;
            
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(i)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center transition-all relative group",
                  "hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isCurrentOrBelow && MATURITY_COLORS[currentLevel],
                  isCurrentOrBelow && "text-white",
                  !isCurrentOrBelow && "bg-secondary/30",
                  isBetween && "bg-primary/10",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span className={cn(
                  "text-lg font-bold",
                  !isCurrentOrBelow && "text-muted-foreground"
                )}>
                  {i}
                </span>
                <span className={cn(
                  "text-[10px] leading-none",
                  isCurrentOrBelow ? "text-white/80" : "text-muted-foreground"
                )}>
                  {MATURITY_LABELS[i]!.slice(0, 3)}
                </span>
                
                {/* Current indicator */}
                {i === currentLevel && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                )}
                
                {/* Target indicator */}
                {isTarget && i !== currentLevel && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/50 rounded-full border border-primary" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Labels */}
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Non-existent</span>
          <span>Optimizing</span>
        </div>
      </div>
      
      {/* Gap indicator */}
      {targetLevel > currentLevel && (
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg text-sm",
          targetLevel - currentLevel >= 3 ? "bg-destructive/10 text-destructive" :
          targetLevel - currentLevel >= 2 ? "bg-warning/10 text-warning" :
          "bg-muted"
        )}>
          <span>Maturity Gap</span>
          <span className="font-bold">{targetLevel - currentLevel} level{targetLevel - currentLevel !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
