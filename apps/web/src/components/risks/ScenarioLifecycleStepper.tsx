import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

// Lifecycle stages mapping
export type LifecycleStage = "identify" | "assess" | "decide" | "treat" | "monitor";

export interface StageConfig {
  id: LifecycleStage;
  label: string;
  shortLabel: string;
  description: string;
  workflowStatuses: string[];
}

export const LIFECYCLE_STAGES: StageConfig[] = [
  {
    id: "identify",
    label: "Identify",
    shortLabel: "1",
    description: "Define scenario narrative and link to parent risk",
    workflowStatuses: ["DRAFT"],
  },
  {
    id: "assess",
    label: "Assess",
    shortLabel: "2",
    description: "Score likelihood, impact, and link controls",
    workflowStatuses: ["ASSESSED"],
  },
  {
    id: "decide",
    label: "Decide",
    shortLabel: "3",
    description: "Evaluate against tolerance and choose treatment path",
    workflowStatuses: ["EVALUATED", "ESCALATED"],
  },
  {
    id: "treat",
    label: "Treat / Accept",
    shortLabel: "4",
    description: "Execute treatment plan or document risk acceptance",
    workflowStatuses: ["TREATING", "TREATED", "ACCEPTED"],
  },
  {
    id: "monitor",
    label: "Monitor",
    shortLabel: "5",
    description: "Track KRIs and conduct periodic reviews",
    workflowStatuses: ["MONITORING", "REVIEW", "CLOSED", "ARCHIVED"],
  },
];

// Map workflow status to lifecycle stage
export function getStageFromStatus(status: string): LifecycleStage {
  for (const stage of LIFECYCLE_STAGES) {
    if (stage.workflowStatuses.includes(status)) {
      return stage.id;
    }
  }
  return "identify"; // Default to first stage
}

// Get stage index (0-based)
export function getStageIndex(stage: LifecycleStage): number {
  return LIFECYCLE_STAGES.findIndex((s) => s.id === stage);
}

// Check if a stage is complete based on current status
export function isStageComplete(
  stageId: LifecycleStage,
  currentStatus: string
): boolean {
  const currentStageIndex = getStageIndex(getStageFromStatus(currentStatus));
  const targetStageIndex = getStageIndex(stageId);
  return targetStageIndex < currentStageIndex;
}

// Check if a stage is current
export function isStageCurrent(
  stageId: LifecycleStage,
  currentStatus: string
): boolean {
  return getStageFromStatus(currentStatus) === stageId;
}

// Check if a stage is locked (future)
export function isStageLocked(
  stageId: LifecycleStage,
  currentStatus: string
): boolean {
  const currentStageIndex = getStageIndex(getStageFromStatus(currentStatus));
  const targetStageIndex = getStageIndex(stageId);
  return targetStageIndex > currentStageIndex;
}

interface ScenarioLifecycleStepperProps {
  currentStatus: string;
  activeStage: LifecycleStage;
  onStageClick: (stage: LifecycleStage) => void;
  assessmentProgress?: number;
  className?: string;
}

export function ScenarioLifecycleStepper({
  currentStatus,
  activeStage,
  onStageClick,
  assessmentProgress = 0,
  className,
}: ScenarioLifecycleStepperProps) {
  const currentStage = getStageFromStatus(currentStatus);
  const currentStageIndex = getStageIndex(currentStage);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between relative">
        {/* Connector line - positioned behind circles */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20" style={{ marginLeft: '40px', marginRight: '40px' }}>
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(currentStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stages */}
        {LIFECYCLE_STAGES.map((stage, index) => {
          const isComplete = isStageComplete(stage.id, currentStatus);
          const isCurrent = isStageCurrent(stage.id, currentStatus);
          const isLocked = isStageLocked(stage.id, currentStatus);
          const canClick = !isLocked || isComplete || isCurrent;

          return (
            <button
              key={stage.id}
              onClick={() => canClick && onStageClick(stage.id)}
              disabled={!canClick}
              className={cn(
                "flex flex-col items-center gap-2 z-10",
                canClick ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2",
                  // Completed: green outline with checkmark
                  isComplete && "border-green-500 bg-white text-green-500",
                  // Current: blue filled
                  isCurrent && "border-primary bg-primary text-white",
                  // Future/locked: gray outline
                  !isComplete && !isCurrent && "border-muted-foreground/30 bg-white text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  isComplete && "text-green-600",
                  isCurrent && "text-primary",
                  !isComplete && !isCurrent && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Stage content header component
interface StageHeaderProps {
  stage: LifecycleStage;
  currentStatus: string;
  children?: React.ReactNode;
}

export function StageHeader({ stage, currentStatus, children }: StageHeaderProps) {
  const stageConfig = LIFECYCLE_STAGES.find((s) => s.id === stage);
  const isCurrent = isStageCurrent(stage, currentStatus);
  const isComplete = isStageComplete(stage, currentStatus);

  if (!stageConfig) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
              isCurrent && "bg-primary text-primary-foreground",
              isComplete && "bg-green-100 text-green-700",
              !isCurrent && !isComplete && "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? <Check className="w-4 h-4" /> : getStageIndex(stage) + 1}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{stageConfig.label}</h2>
            <p className="text-sm text-muted-foreground">{stageConfig.description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
