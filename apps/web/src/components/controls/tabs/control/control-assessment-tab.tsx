import { Section } from "@/components/archer/section";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Target, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { ControlEffectiveness } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface ControlAssessmentTabProps {
  effectiveness: ControlEffectiveness;
  protectionScore: {
    current: number;
    target: number;
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * ControlAssessmentTab - Assessment metrics tab for Control detail page.
 *
 * Displays effectiveness breakdown with visual donut chart and maturity summary.
 * Uses Section and inline visualizations for assessment data.
 */
export function ControlAssessmentTab({ effectiveness, protectionScore }: ControlAssessmentTabProps) {
  const scoreColor =
    effectiveness.score >= 80
      ? "text-success"
      : effectiveness.score >= 50
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Effectiveness Breakdown */}
      <Section title="Effectiveness Breakdown" icon={Target}>
        <div className="flex items-center gap-8">
          {/* Visual Score Donut */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-secondary"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${effectiveness.score * 2.51} 251`}
                className={cn(scoreColor)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{effectiveness.score}%</span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="text-xl font-bold text-success">{effectiveness.passCount}</p>
                <p className="text-xs text-muted-foreground">Effective</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-xl font-bold text-warning">{effectiveness.partialCount}</p>
                <p className="text-xs text-muted-foreground">Partial</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-xl font-bold text-destructive">{effectiveness.failCount}</p>
                <p className="text-xs text-muted-foreground">Failing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{effectiveness.notTestedCount}</p>
                <p className="text-xs text-muted-foreground">Not Tested</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Text */}
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <p>
            {effectiveness.passCount} of {effectiveness.totalLayers} layers are fully effective.
            {effectiveness.partialCount > 0 && ` ${effectiveness.partialCount} have partial effectiveness.`}
            {effectiveness.notTestedCount > 0 && ` ${effectiveness.notTestedCount} have not been tested.`}
          </p>
        </div>
      </Section>

      {/* Protection Score Summary */}
      <Section title="Protection Score" icon={Target}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Current Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{protectionScore.current}%</span>
                <Badge variant="secondary" className="text-xs">
                  Average
                </Badge>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Target Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{protectionScore.target}%</span>
                <Badge variant="outline" className="text-xs">
                  Goal
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to target</span>
              <span>
                {protectionScore.target > 0
                  ? Math.round((protectionScore.current / protectionScore.target) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-primary transition-all", {
                  "bg-success": protectionScore.current >= protectionScore.target,
                  "bg-warning": protectionScore.current >= protectionScore.target * 0.5,
                  "bg-destructive": protectionScore.current < protectionScore.target * 0.5,
                })}
                style={{
                  width: `${
                    protectionScore.target > 0
                      ? Math.min((protectionScore.current / protectionScore.target) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
