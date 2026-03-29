
import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Shield, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard-api";

interface Insight {
  type: "warning" | "success" | "info";
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  action: string;
  href: string;
}

function buildInsights(metrics: DashboardMetrics): Insight[] {
  const insights: Insight[] = [];

  // Risk-related insights
  const { openRisks } = metrics;
  if (openRisks.critical > 0 || openRisks.high > 0) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      title: `${openRisks.critical + openRisks.high} high-impact risks open`,
      description: `${openRisks.critical} critical and ${openRisks.high} high severity risks require attention.`,
      action: "View Risks",
      href: "/risks",
    });
  }

  // Compliance-related insights
  const { complianceRate } = metrics;
  if (complianceRate.percentage >= 80) {
    insights.push({
      type: "success",
      icon: Shield,
      title: `Compliance at ${complianceRate.percentage}%`,
      description: `${complianceRate.frameworksTracked} framework${complianceRate.frameworksTracked !== 1 ? 's' : ''} tracked with ${metrics.controls.implemented} of ${metrics.controls.total} controls implemented.`,
      action: "View Controls",
      href: "/controls",
    });
  } else if (complianceRate.percentage > 0) {
    insights.push({
      type: "warning",
      icon: Shield,
      title: `Compliance at ${complianceRate.percentage}%`,
      description: `${metrics.controls.notImplemented} controls still need implementation across ${complianceRate.frameworksTracked} framework${complianceRate.frameworksTracked !== 1 ? 's' : ''}.`,
      action: "View Controls",
      href: "/controls",
    });
  }

  // Incidents insights
  const { activeIncidents } = metrics;
  if (activeIncidents.total > 0) {
    insights.push({
      type: activeIncidents.critical > 0 ? "warning" : "info",
      icon: AlertTriangle,
      title: `${activeIncidents.total} active incident${activeIncidents.total !== 1 ? 's' : ''}`,
      description: activeIncidents.critical > 0
        ? `${activeIncidents.critical} critical incident${activeIncidents.critical !== 1 ? 's' : ''} requiring immediate response.`
        : "All incidents are being handled without critical severity.",
      action: "View Incidents",
      href: "/incidents",
    });
  }

  // Pending actions insights
  const { pendingActions } = metrics;
  if (pendingActions.overdue > 0) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      title: `${pendingActions.overdue} overdue action${pendingActions.overdue !== 1 ? 's' : ''}`,
      description: `${pendingActions.total} total pending actions, ${pendingActions.dueThisWeek} due this week.`,
      action: "View Policies",
      href: "/policies",
    });
  }

  // Policy insights
  const { policies } = metrics;
  if (policies.pendingReview > 0 || policies.pendingApproval > 0) {
    insights.push({
      type: "info",
      icon: TrendingUp,
      title: `${policies.pendingReview + policies.pendingApproval} policies need action`,
      description: `${policies.pendingReview} pending review and ${policies.pendingApproval} pending approval.`,
      action: "View Policies",
      href: "/policies",
    });
  }

  // If no issues detected, show positive message
  if (insights.length === 0) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: "All systems nominal",
      description: "No critical items require attention at this time.",
      action: "View Dashboard",
      href: "/dashboard",
    });
  }

  return insights.slice(0, 3);
}

export function ExecutiveInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then((metrics) => {
        setInsights(buildInsights(metrics));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Executive Insights</h3>
            <p className="text-xs text-muted-foreground">Summary of key findings from live data</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] bg-primary/5 text-primary border-primary/20">
            Live
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-md p-1.5 ${
                      insight.type === "warning" ? "bg-warning/10 text-warning" :
                      insight.type === "success" ? "bg-success/10 text-success" :
                      "bg-primary/10 text-primary"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-xs text-primary gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        asChild
                      >
                        <Link to={insight.href}>
                          {insight.action}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
