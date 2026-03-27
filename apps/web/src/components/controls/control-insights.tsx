"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Loader2, Shield, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { getControlStats, getGapAnalysis, type ControlStats, type GapAnalysis } from "@/lib/controls-api";
import { getNonconformityStats, type NonconformityStats } from "@/lib/audits-api";

interface Insight {
  type: string;
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  action: string;
  link?: string;
  color: string;
  bg: string;
  border: string;
}

function buildInsights(
  stats: ControlStats | null,
  gapAnalysis: GapAnalysis | null,
  ncStats: NonconformityStats | null,
): Insight[] {
  const items: Insight[] = [];

  // Critical gaps insight
  if (gapAnalysis?.summary?.criticalGaps) {
    items.push({
      type: "critical",
      icon: AlertTriangle,
      title: `${gapAnalysis.summary.criticalGaps} Critical Gap${gapAnalysis.summary.criticalGaps > 1 ? "s" : ""} Identified`,
      description: `${gapAnalysis.summary.criticalGaps} control${gapAnalysis.summary.criticalGaps > 1 ? "s have" : " has"} critical gaps requiring immediate remediation.`,
      action: "View Gaps",
      link: "/controls/gaps?priority=critical",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    });
  }

  // Not-started controls insight
  if (stats && stats.notStarted > 0) {
    items.push({
      type: "warning",
      icon: Shield,
      title: `${stats.notStarted} Control${stats.notStarted > 1 ? "s" : ""} Not Yet Implemented`,
      description: `${stats.notStarted} of ${stats.total} controls have not started implementation.`,
      action: "View Controls",
      link: "/controls/library?status=NOT_STARTED",
      color: stats.notStarted > 10 ? "text-destructive" : "text-warning",
      bg: stats.notStarted > 10 ? "bg-destructive/10" : "bg-warning/10",
      border: stats.notStarted > 10 ? "border-destructive/20" : "border-warning/20",
    });
  }

  // Open nonconformities insight
  const openNCs = ncStats
    ? (ncStats.byStatus?.['OPEN'] ?? 0) + (ncStats.byStatus?.['IN_PROGRESS'] ?? 0)
    : 0;
  if (openNCs > 0) {
    items.push({
      type: "trend",
      icon: Target,
      title: `${openNCs} Open Nonconformit${openNCs > 1 ? "ies" : "y"}`,
      description: `There ${openNCs > 1 ? "are" : "is"} ${openNCs} nonconformit${openNCs > 1 ? "ies" : "y"} requiring attention from audit findings.`,
      action: "View Issues",
      link: "/audits/nonconformities",
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    });
  }

  // High implementation rate - positive insight
  if (stats && stats.total > 0) {
    const implRate = Math.round((stats.implemented / stats.total) * 100);
    if (implRate >= 80) {
      items.push({
        type: "positive",
        icon: TrendingUp,
        title: `${implRate}% Implementation Rate`,
        description: `${stats.implemented} of ${stats.total} controls are fully implemented. Strong control posture.`,
        action: "View Analysis",
        link: "/controls/effectiveness",
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
      });
    }
  }

  return items.slice(0, 3);
}

export function ControlInsights() {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [stats, gapData, ncStats] = await Promise.all([
          getControlStats().catch(() => null),
          getGapAnalysis().catch(() => null),
          getNonconformityStats().catch(() => null),
        ]);
        setInsights(buildInsights(stats, gapData, ncStats));
      } catch (err) {
        console.error("Failed to load control insights:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="border-border overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const visibleInsights = insights.filter((_, i) => !dismissed.includes(i));

  if (visibleInsights.length === 0) return null;

  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Control Insights</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => {
            if (dismissed.includes(index)) return null;
            return (
              <div
                key={index}
                className={`relative p-4 rounded-xl ${insight.bg} border ${insight.border} group transition-all duration-300 hover:scale-[1.02]`}
              >
                <button
                  type="button"
                  onClick={() => setDismissed([...dismissed, index])}
                  className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-background/50 ${insight.color}`}>
                    <insight.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm ${insight.color}`}>{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`mt-2 h-7 px-0 ${insight.color} hover:bg-transparent group/btn`}
                    >
                      {insight.action}
                      <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
