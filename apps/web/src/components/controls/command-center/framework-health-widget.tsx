"use client";

import { Link } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";
import { ArcherWidget } from "@/components/archer/widget";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FRAMEWORK_LABELS, FRAMEWORK_COLORS } from "@/components/controls/control-browser/types";

interface FrameworkHealth {
  framework: 'ISO' | 'SOC2' | 'NIS2' | 'DORA';
  total: number;
  implemented: number;
  partial: number;
  notStarted: number;
  effectiveness: number;
}

interface FrameworkHealthWidgetProps {
  frameworks?: FrameworkHealth[];
  loading?: boolean;
  onRefresh?: () => void;
  onExpand?: () => void;
  className?: string;
}

const defaultFrameworks: FrameworkHealth[] = [];

export function FrameworkHealthWidget({
  frameworks = defaultFrameworks,
  loading = false,
  onRefresh,
  onExpand,
  className,
}: FrameworkHealthWidgetProps) {
  const totalFrameworks = frameworks.length;
  const avgEffectiveness = totalFrameworks > 0
    ? Math.round(frameworks.reduce((sum, fw) => sum + fw.effectiveness, 0) / totalFrameworks)
    : 0;

  return (
    <ArcherWidget
      title="Framework Health"
      subtitle={`${totalFrameworks} Frameworks`}
      onRefresh={onRefresh}
      onExpand={onExpand}
      loading={loading}
      className={className}
    >
      {frameworks.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">No frameworks configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add controls to see framework health metrics
          </p>
        </div>
      ) : (
      <div className="space-y-4">
        {frameworks.map(fw => {
          const implementedPct = Math.round((fw.implemented / fw.total) * 100);
          const partialPct = Math.round((fw.partial / fw.total) * 100);

          return (
            <Link
              key={fw.framework}
              to={`/controls/library?framework=${fw.framework}`}
              className="block group"
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      FRAMEWORK_COLORS[fw.framework]
                    )} />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {FRAMEWORK_LABELS[fw.framework]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({fw.total} controls)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn(
                      "font-bold tabular-nums",
                      fw.effectiveness >= 80 ? "text-success" :
                      fw.effectiveness >= 60 ? "text-warning" :
                      "text-destructive"
                    )}>
                      {fw.effectiveness}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                  <div
                    className="bg-success transition-all"
                    style={{ width: `${implementedPct}%` }}
                  />
                  <div
                    className="bg-warning transition-all"
                    style={{ width: `${partialPct}%` }}
                  />
                  {/* Rest is implicit (not started) */}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    {fw.implemented} implemented
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    {fw.partial} partial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted" />
                    {fw.notStarted} pending
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )}
    </ArcherWidget>
  );
}
