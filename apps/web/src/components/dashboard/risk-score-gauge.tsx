
import { useEffect, useState } from "react";
import { ArrowRight, TrendingDown, TrendingUp, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard-api";

export function RiskScoreGauge() {
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
      <Card className="glass-card h-full border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const score = metrics?.riskScore.current || 0;
  const change = metrics?.riskScore.change || 0;
  const trend = metrics?.riskScore.trend || 'stable';
  const maxScore = 100;
  const percentage = (score / maxScore) * 100;

  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine risk level
  const getRiskLevel = (s: number) => {
    if (s >= 80) return { label: "High Risk", color: "destructive", bgClass: "bg-destructive/10 text-destructive" };
    if (s >= 50) return { label: "Medium Risk", color: "warning", bgClass: "bg-warning/10 text-warning" };
    return { label: "Low Risk", color: "success", bgClass: "bg-success/10 text-success" };
  };

  const riskLevel = getRiskLevel(score);

  return (
    <Card className="glass-card h-full border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Risk Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col items-center pt-0">
        <div className="relative mb-2 h-32 w-52">
          <svg className="h-full w-full" viewBox="0 0 200 115">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--success))" />
                <stop offset="40%" stopColor="hsl(var(--warning))" />
                <stop offset="100%" stopColor="hsl(var(--destructive))" />
              </linearGradient>
            </defs>
            {/* Progress arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Scale labels */}
            <text x="15" y="112" className="fill-muted-foreground text-[9px]">0</text>
            <text x="95" y="25" className="fill-muted-foreground text-[9px]">50</text>
            <text x="175" y="112" className="fill-muted-foreground text-[9px]">100</text>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <span className="text-5xl font-bold text-foreground tracking-tight">{score}</span>
            <Badge variant="outline" className={`${riskLevel.bgClass} mt-1`}>
              {riskLevel.label}
            </Badge>
          </div>
        </div>

        <div className="w-full space-y-3 mt-auto">
          {/* Trend indicator */}
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${change < 0 ? 'bg-success/5 border border-success/20' : 'bg-destructive/5 border border-destructive/20'}`}>
            {trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-success" />
            ) : trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : null}
            <span className={`text-sm font-semibold ${change < 0 ? 'text-success' : 'text-destructive'}`}>
              {change > 0 ? '+' : ''}{change} pts
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-secondary/30 p-2">
              <div className="text-lg font-bold text-destructive">{metrics?.openRisks.critical || 0}</div>
              <div className="text-[10px] text-muted-foreground">Critical</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-2">
              <div className="text-lg font-bold text-warning">{metrics?.openRisks.high || 0}</div>
              <div className="text-[10px] text-muted-foreground">High</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-2">
              <div className="text-lg font-bold text-muted-foreground">{metrics?.openRisks.total || 0}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Link to risks */}
          <Link
            to="/risks"
            className="flex items-center justify-center gap-1 py-2 text-xs text-primary transition-colors hover:text-primary/80 border-t border-border"
          >
            View risk register
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
