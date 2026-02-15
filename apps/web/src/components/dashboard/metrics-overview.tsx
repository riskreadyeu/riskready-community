"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, TrendingDown, TrendingUp, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard-api";

export function MetricsOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card overflow-hidden border-border bg-card">
            <CardContent className="flex h-32 items-center justify-center p-5">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const metricItems = [
    {
      label: "Open Risks",
      value: metrics.openRisks.total,
      change: metrics.openRisks.change,
      trend: metrics.openRisks.trend,
      description: `${metrics.openRisks.critical} critical, ${metrics.openRisks.high} high`,
      icon: ShieldAlert,
      sparkColor: "#ef4444",
      trendBad: true,
    },
    {
      label: "Compliance Rate",
      value: metrics.complianceRate.percentage,
      suffix: "%",
      change: metrics.complianceRate.change,
      trend: metrics.complianceRate.trend,
      description: `${metrics.complianceRate.frameworksTracked} frameworks tracked`,
      icon: CheckCircle,
      sparkColor: "#22c55e",
      trendBad: false,
    },
    {
      label: "Pending Actions",
      value: metrics.pendingActions.total,
      change: metrics.pendingActions.change,
      trend: metrics.pendingActions.trend,
      description: `${metrics.pendingActions.dueThisWeek} due this week`,
      icon: Clock,
      sparkColor: "#3b82f6",
      trendBad: false,
    },
    {
      label: "Active Incidents",
      value: metrics.activeIncidents.total,
      change: metrics.activeIncidents.change,
      trend: metrics.activeIncidents.trend,
      description: `${metrics.activeIncidents.critical} critical severity`,
      icon: AlertTriangle,
      sparkColor: "#f59e0b",
      trendBad: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricItems.map((metric, index) => (
        <Card
          key={metric.label}
          className={cn(
            "glass-card overflow-hidden border-border bg-card transition-all duration-300",
            "hover:border-border/80",
            "animate-slide-up",
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="flex h-full flex-col p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-lg bg-secondary/50 p-2">
                <metric.icon className="h-4 w-4 text-foreground" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{metric.label}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">{metric.value.toLocaleString()}</span>
                {metric.suffix ? <span className="text-lg text-muted-foreground">{metric.suffix}</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
            </div>

            <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
              {metric.trend === "up" ? (
                <TrendingUp className={cn("h-3.5 w-3.5", metric.trendBad ? "text-destructive" : "text-success")} />
              ) : metric.trend === "down" ? (
                <TrendingDown className={cn("h-3.5 w-3.5", metric.trendBad ? "text-success" : "text-success")} />
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  metric.trendBad && metric.trend === "up" ? "text-destructive" : "text-success",
                )}
              >
                {metric.trend === "up" ? "+" : ""}
                {metric.change}
                {metric.suffix || ""}
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
