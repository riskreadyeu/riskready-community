"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Minus, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { getControlStats, type ControlStats } from "@/lib/controls-api";

export function ControlMetrics() {
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getControlStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load control stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const effectivePercent = stats && stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0;
  const notStartedCount = stats?.notStarted ?? 0;
  const partialCount = stats?.partial ?? 0;

  const metrics = [
    {
      label: "Total Controls",
      value: stats?.total ?? 0,
      trendLabel: `${stats?.applicable ?? 0} applicable`,
      icon: Shield,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Implemented",
      value: stats?.implemented ?? 0,
      trendLabel: `${effectivePercent}% of total`,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Partial",
      value: partialCount,
      trendLabel: "in progress",
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Not Started",
      value: notStartedCount,
      trendLabel: "pending implementation",
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className="hover:border-primary/30 transition-colors duration-300 group"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${metric.bg} group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-bold text-foreground tracking-tight">{metric.value}</span>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{metric.trendLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
