"use client";

import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronRight } from "lucide-react";
import { ArcherWidget } from "@/components/archer/widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EffectivenessSummary {
  effective: number;
  partiallyEffective: number;
  notEffective: number;
  notTested: number;
  avgScore: number;
}

interface EffectivenessSummaryWidgetProps {
  summary?: EffectivenessSummary;
  loading?: boolean;
  onRefresh?: () => void;
  onExpand?: () => void;
  className?: string;
}

const defaultSummary: EffectivenessSummary = {
  effective: 0,
  partiallyEffective: 0,
  notEffective: 0,
  notTested: 0,
  avgScore: 0,
};

export function EffectivenessSummaryWidget({
  summary = defaultSummary,
  loading = false,
  onRefresh,
  onExpand,
  className,
}: EffectivenessSummaryWidgetProps) {
  const total = summary.effective + summary.partiallyEffective + summary.notEffective + summary.notTested;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const items = [
    {
      label: 'Effective',
      count: summary.effective,
      percentage: pct(summary.effective),
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      ring: 'ring-success/30',
    },
    {
      label: 'Partial',
      count: summary.partiallyEffective,
      percentage: pct(summary.partiallyEffective),
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
      ring: 'ring-warning/30',
    },
    {
      label: 'Not Effective',
      count: summary.notEffective,
      percentage: pct(summary.notEffective),
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      ring: 'ring-destructive/30',
    },
    {
      label: 'Not Tested',
      count: summary.notTested,
      percentage: pct(summary.notTested),
      icon: HelpCircle,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      ring: 'ring-muted',
    },
  ];

  return (
    <ArcherWidget
      title="Control Effectiveness"
      subtitle={`${summary.avgScore}% Avg Score`}
      onRefresh={onRefresh}
      onExpand={onExpand}
      loading={loading}
      className={className}
    >
      <div className="flex items-center gap-6">
        {/* Score Circle */}
        <div className="relative">
          <svg className="w-24 h-24 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-secondary"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(summary.avgScore / 100) * 251.2} 251.2`}
              strokeLinecap="round"
              className={cn(
                summary.avgScore >= 80 ? "text-success" :
                summary.avgScore >= 60 ? "text-warning" :
                "text-destructive"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              summary.avgScore >= 80 ? "text-success" :
              summary.avgScore >= 60 ? "text-warning" :
              "text-destructive"
            )}>
              {summary.avgScore}%
            </span>
            <span className="text-[10px] text-muted-foreground">Avg Score</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={`/controls/effectiveness?rating=${item.label.toUpperCase().replace(' ', '_')}`}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all",
                  "hover:ring-2",
                  item.bg,
                  item.ring
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
                <div className="min-w-0">
                  <p className="text-sm font-bold tabular-nums">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bar representation */}
      <div className="mt-4 h-2 rounded-full overflow-hidden flex bg-secondary">
        <div
          className="bg-success transition-all"
          style={{ width: `${items[0]!.percentage}%` }}
        />
        <div
          className="bg-warning transition-all"
          style={{ width: `${items[1]!.percentage}%` }}
        />
        <div
          className="bg-destructive transition-all"
          style={{ width: `${items[2]!.percentage}%` }}
        />
      </div>
    </ArcherWidget>
  );
}
