import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { PROGRESS_STATUS_CLASSES } from "@/lib/archer/constants";
import type { ProgressTrackerProps, ProgressStatus } from "@/lib/archer/types";

/**
 * Get icon component for a given progress status
 */
function getStatusIcon(status: ProgressStatus) {
  if (status === "completed") return Check;
  if (status === "error") return X;
  return null;
}

/**
 * ProgressTracker - Workflow stage visualization component.
 *
 * Displays a sequence of steps with visual status indicators, supporting both
 * horizontal and vertical orientations with different size variants.
 */
export function ProgressTracker({
  steps,
  orientation = "horizontal",
  size = "md",
  className,
}: ProgressTrackerProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const lineClasses = {
    sm: orientation === "horizontal" ? "h-0.5 flex-1" : "w-0.5 flex-1",
    md: orientation === "horizontal" ? "h-0.5 flex-1" : "w-0.5 flex-1",
    lg: orientation === "horizontal" ? "h-1 flex-1" : "w-1 flex-1",
  };

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      role="list"
      aria-label="Progress tracker"
      className={cn(
        "flex",
        isHorizontal ? "flex-row items-center gap-2" : "flex-col items-start gap-3",
        className
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Icon = getStatusIcon(step.status);
        const statusClasses = PROGRESS_STATUS_CLASSES[step.status];

        return (
          <div
            key={step.id}
            role="listitem"
            aria-current={step.status === "current" ? "step" : undefined}
            className={cn(
              "flex",
              isHorizontal ? "flex-col items-center gap-2 flex-1" : "flex-row items-start gap-3 w-full"
            )}
          >
            <div className={cn("flex", isHorizontal ? "flex-col items-center gap-2" : "flex-row items-center gap-3 flex-1")}>
              {/* Step indicator */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 font-semibold transition-all",
                  sizeClasses[size],
                  statusClasses
                )}
                aria-label={`${step.label}: ${step.status}`}
              >
                {Icon ? (
                  <Icon className={cn(size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5")} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label and description */}
              <div className={cn("flex flex-col", isHorizontal ? "items-center text-center" : "items-start flex-1")}>
                <span className={cn("text-sm font-medium", step.status === "current" && "text-primary")}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "bg-border transition-colors",
                  lineClasses[size],
                  step.status === "completed" && "bg-emerald-500",
                  isHorizontal ? "mt-0" : "ml-4 -mt-3"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
