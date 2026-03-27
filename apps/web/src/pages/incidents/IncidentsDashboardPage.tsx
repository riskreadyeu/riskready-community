import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle2,
  FileWarning,
  Bell,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  getIncidents,
  getIncidentStats,
  type Incident,
  type IncidentStats,
  severityLabels,
  statusLabels,
  categoryLabels,
} from "@/lib/incidents-api";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const variantStyles = {
    default: "bg-card",
    warning: "bg-amber-500/10 border-amber-500/20",
    danger: "bg-red-500/10 border-red-500/20",
    success: "bg-emerald-500/10 border-emerald-500/20",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    warning: "text-amber-500",
    danger: "text-red-500",
    success: "text-emerald-500",
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`rounded-lg bg-background/50 p-3 ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, "destructive" | "warning" | "secondary" | "outline"> = {
    CRITICAL: "destructive",
    HIGH: "warning",
    MEDIUM: "secondary",
    LOW: "outline",
  };
  return (
    <Badge variant={variants[severity] || "secondary"} className="text-[10px]">
      {severityLabels[severity as keyof typeof severityLabels] || severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "destructive" | "warning" | "secondary" | "success" | "outline"> = {
    DETECTED: "destructive",
    TRIAGED: "warning",
    INVESTIGATING: "warning",
    CONTAINING: "warning",
    ERADICATING: "secondary",
    RECOVERING: "secondary",
    POST_INCIDENT: "outline",
    CLOSED: "success",
  };
  return (
    <Badge variant={variants[status] || "secondary"} className="text-[10px]">
      {statusLabels[status as keyof typeof statusLabels] || status}
    </Badge>
  );
}

export default function IncidentsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, incidentsData] = await Promise.all([
        getIncidentStats(),
        getIncidents({ take: 5 }),
      ]);
      setStats(statsData);
      setRecentIncidents(incidentsData.results);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const openIncidents = stats?.open || 0;
  const criticalCount = stats?.bySeverity?.CRITICAL || 0;
  const highCount = stats?.bySeverity?.HIGH || 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Incident Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Security incident response and regulatory compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/incidents/register">View All Incidents</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/incidents/new">Report Incident</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          subtitle={`${criticalCount} critical, ${highCount} high`}
          icon={AlertTriangle}
          variant={criticalCount > 0 ? "danger" : openIncidents > 0 ? "warning" : "default"}
        />
        <StatCard
          title="MTTR (Avg)"
          value={stats?.avgMTTR ? `${Math.round(stats.avgMTTR)}h` : "N/A"}
          subtitle="Mean Time to Resolve"
          icon={Clock}
        />
        <StatCard
          title="Closed (30d)"
          value={stats?.closed || 0}
          subtitle="Incidents resolved"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Overdue Notifications"
          value={stats?.overdueNotifications || 0}
          subtitle="Regulatory deadlines"
          icon={Bell}
          variant={stats?.overdueNotifications ? "danger" : "default"}
        />
      </div>

      {/* Regulatory Compliance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">
              NIS2 Compliance
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Significant Incidents
              </span>
              <Badge variant={stats?.nis2Significant ? "destructive" : "secondary"}>
                {stats?.nis2Significant || 0}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Early Warning (24h)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notification (72h)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final Report (1 month)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">
              DORA Compliance
            </CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Major ICT Incidents
              </span>
              <Badge variant={stats?.doraMajor ? "destructive" : "secondary"}>
                {stats?.doraMajor || 0}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Initial Notification (4h)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intermediate Report (72h)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final Report (1 month)</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents & Response Metrics */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">
              Recent Incidents
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/incidents/register">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No incidents reported yet
                </p>
                <Button size="sm" className="mt-4" asChild>
                  <Link to="/incidents/new">Report First Incident</Link>
                </Button>
              </div>
            ) : (
              recentIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/incidents/${incident.id}`}
                  className="block"
                >
                  <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/40 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {incident.referenceNumber}
                        </span>
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {incident.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {categoryLabels[incident.category]} • Detected{" "}
                        {new Date(incident.detectedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {incident.nis2Assessment?.isSignificantIncident && (
                        <Badge variant="outline" className="text-[10px]">
                          NIS2
                        </Badge>
                      )}
                      {incident.doraAssessment?.isMajorIncident && (
                        <Badge variant="outline" className="text-[10px]">
                          DORA
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Response Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MTTD</span>
                <span className="text-lg font-semibold">
                  {stats?.avgMTTD ? `${Math.round(stats.avgMTTD)}h` : "N/A"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Mean Time to Detect
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MTTC</span>
                <span className="text-lg font-semibold">
                  {stats?.avgMTTC ? `${Math.round(stats.avgMTTC)}h` : "N/A"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Mean Time to Contain
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MTTR</span>
                <span className="text-lg font-semibold">
                  {stats?.avgMTTR ? `${Math.round(stats.avgMTTR)}h` : "N/A"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Mean Time to Resolve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Incidents by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats?.byCategory || {}).map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <span className="text-sm text-muted-foreground">
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

