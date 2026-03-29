
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  FileText,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard-api";

const baseModules = [
  {
    title: "Risk Management",
    description: "Track and quantify risks using FAIR methodology",
    to: "/risks",
    icon: ShieldAlert,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    metricKey: "risks" as const,
  },
  {
    title: "Controls",
    description: "Manage control library and effectiveness testing",
    to: "/controls",
    icon: ShieldCheck,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    metricKey: "controls" as const,
  },
  {
    title: "Evidence",
    description: "Centralize evidence artifacts for audit readiness",
    to: "/evidence",
    icon: FileCheck,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    metricKey: "evidence" as const,
  },
  {
    title: "Policies",
    description: "Document lifecycle and approval workflows",
    to: "/policies",
    icon: FileText,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    metricKey: "policies" as const,
  },
  {
    title: "Organisation",
    description: "Configure regulatory scope and org structure",
    to: "/organisation",
    icon: Building2,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    metricKey: "organisation" as const,
  },
  {
    title: "Incidents",
    description: "Track and manage security incidents",
    to: "/incidents",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    metricKey: "incidents" as const,
  },
];

function getModuleStat(metrics: DashboardMetrics | null, key: string) {
  if (!metrics) {
    return { value: "-", label: "Loading", trend: "up" as const, change: 0 };
  }

  switch (key) {
    case "risks":
      return {
        value: metrics.openRisks.total,
        label: "Open Risks",
        trend: metrics.openRisks.trend,
        change: metrics.openRisks.change,
      };
    case "controls":
      return {
        value: metrics.controls.total > 0
          ? `${Math.round((metrics.controls.implemented / metrics.controls.total) * 100)}%`
          : "0%",
        label: "Implemented",
        trend: "up" as const,
        change: 0,
      };
    case "policies":
      return {
        value: metrics.policies.total,
        label: "Documents",
        trend: "stable" as const,
        change: 0,
      };
    case "incidents":
      return {
        value: metrics.activeIncidents.total,
        label: "Active",
        trend: metrics.activeIncidents.trend,
        change: metrics.activeIncidents.change,
      };
    default:
      return { value: "-", label: "-", trend: "stable" as const, change: 0 };
  }
}

export function ModuleCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Quick Access</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {baseModules.map((m, index) => {
          const stat = getModuleStat(metrics, m.metricKey);

          return (
            <Link
              key={m.title}
              to={m.to}
              className="block group"
            >
              <Card
                className={cn(
                  "glass-card border-border bg-card transition-all duration-300",
                  "hover:border-primary/30 hover:shadow-md",
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("rounded-lg p-2.5", m.bgColor)}>
                      <m.icon className={cn("h-5 w-5", m.color)} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {m.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {m.description}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold">{stat.value}</span>
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                        {stat.change !== 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] gap-0.5",
                              stat.trend === "up" ? "text-success border-success/30" : "text-muted-foreground"
                            )}
                          >
                            {stat.trend === "up" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {stat.change > 0 ? `+${stat.change}` : stat.change}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
