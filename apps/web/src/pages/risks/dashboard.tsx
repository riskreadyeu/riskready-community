// =============================================================================
// RisksV2DashboardPage - Risk Dashboard with Stats, Heatmap, KRI Summary
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Eye,
  Grid3X3,
  RefreshCw,
  Shield,
  Target,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Archer Components
import { EmptyState, Section } from "@/components/archer";

// API
import {
  getRiskStats,
  getRisks,
  getKRIDashboard,
  getTreatmentPlanStats,
  type Risk,
  type RiskStats,
  type RiskTier,
  type KRIDashboard,
  type TreatmentPlanStats,
  type TreatmentStatus,
} from "@/lib/risks-api";
import { cn } from "@/lib/utils";

// Shared Constants
import {
  tierLabels,
  tierColors,
  statusLabels,
  statusColors,
  treatmentStatusLabels,
  treatmentStatusColors,
  getRiskLevel,
  getHeatmapColor,
} from "./_shared";

export function RisksV2DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [kriDashboard, setKriDashboard] = useState<KRIDashboard | null>(null);
  const [treatmentStats, setTreatmentStats] = useState<TreatmentPlanStats | null>(null);
  const [recentRisks, setRecentRisks] = useState<Risk[]>([]);
  const [allRisks, setAllRisks] = useState<Risk[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, kriData, treatmentData, risksData, allRisksData] = await Promise.all([
        getRiskStats(),
        getKRIDashboard().catch(() => null),
        getTreatmentPlanStats().catch(() => null),
        getRisks({ take: 5 }),
        getRisks({ take: 200 }),
      ]);
      setStats(statsData);
      setKriDashboard(kriData);
      setTreatmentStats(treatmentData);
      setRecentRisks(risksData.results);
      setAllRisks(allRisksData.results);
    } catch (err) {
      console.error("Error loading risk data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    const matrix: Record<string, number> = {};
    allRisks.forEach((risk) => {
      if (risk.residualScore) {
        // Approximate L×I from score (simplified)
        const score = risk.residualScore;
        const likelihood = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(score))));
        const impact = Math.min(5, Math.max(1, Math.ceil(score / likelihood)));
        const key = `${likelihood}-${impact}`;
        matrix[key] = (matrix[key] || 0) + 1;
      }
    });
    return matrix;
  }, [allRisks]);

  // Calculate top risks by residual score
  const topRisks = useMemo(() => {
    return [...allRisks]
      .filter((r) => r.residualScore)
      .sort((a, b) => (b.residualScore || 0) - (a.residualScore || 0))
      .slice(0, 5);
  }, [allRisks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Risk Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your risk posture and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/risks/register">
              View Register
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Risks</p>
                  <p className="text-3xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.scenarioCount || 0} scenarios
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical/High</p>
                  <p className="text-3xl font-bold text-red-600">
                    {allRisks.filter((r) => (r.residualScore || 0) >= 15).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require attention
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">KRI Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-green-600">
                      {kriDashboard?.statusCounts?.GREEN || 0}
                    </span>
                    <span className="text-xl font-bold text-amber-600">
                      {kriDashboard?.statusCounts?.AMBER || 0}
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      {kriDashboard?.statusCounts?.RED || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kriDashboard?.total || 0} total KRIs
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Treatment Progress</p>
                  <p className="text-3xl font-bold">
                    {treatmentStats?.completedThisMonth || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed this month
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Heatmap Section */}
          <Section
            title="Risk Heatmap"
            icon={Grid3X3}
            description="Distribution of risks by likelihood and impact"
            collapsible
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              {/* Heatmap Grid */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col items-center mr-2">
                  <span className="text-xs text-muted-foreground mb-1 -rotate-90 w-4">
                    Likelihood
                  </span>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-5 gap-1">
                    {/* Row labels and cells */}
                    {[5, 4, 3, 2, 1].map((likelihood) => (
                      [1, 2, 3, 4, 5].map((impact) => {
                        const key = `${likelihood}-${impact}`;
                        const count = heatmapData[key] || 0;
                        return (
                          <TooltipProvider key={key}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "h-12 rounded flex items-center justify-center text-white font-medium",
                                    getHeatmapColor(likelihood, impact),
                                    count > 0 ? "opacity-100" : "opacity-30"
                                  )}
                                >
                                  {count > 0 ? count : ""}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>L{likelihood} x I{impact} = {likelihood * impact}</p>
                                <p>{count} risk(s)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-2">
                    <span className="text-xs text-muted-foreground">Low Impact</span>
                    <span className="text-xs text-muted-foreground">High Impact</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-xs text-muted-foreground">Low (1-7)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Medium (8-14)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500" />
                  <span className="text-xs text-muted-foreground">High (15-19)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-xs text-muted-foreground">Critical (20-25)</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Top Risks Section */}
          <Section
            title="Top Risks"
            icon={AlertTriangle}
            description="Highest residual scores"
            collapsible
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/risks/register">View All</Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {topRisks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assessed risks
                </p>
              ) : (
                topRisks.map((risk) => {
                  const level = getRiskLevel(risk.residualScore || 0);
                  return (
                    <Link
                      key={risk.id}
                      to={`/risks/${risk.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{risk.title}</p>
                        <p className="text-xs text-muted-foreground">{risk.riskId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={level.color}>
                          {risk.residualScore}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Section>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* KRI Status Summary */}
          <Section
            title="KRI Status Summary"
            icon={Activity}
            description="Key Risk Indicators by tier"
            collapsible
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/risks/kris">View All</Link>
              </Button>
            }
          >
            {kriDashboard ? (
              <div className="space-y-4">
                {/* Status bars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Green</span>
                    <span className="text-sm font-medium">
                      {kriDashboard.statusCounts.GREEN || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      kriDashboard.total > 0
                        ? ((kriDashboard.statusCounts.GREEN || 0) / kriDashboard.total) * 100
                        : 0
                    }
                    className="h-2 bg-muted [&>div]:bg-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Amber</span>
                    <span className="text-sm font-medium">
                      {kriDashboard.statusCounts.AMBER || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      kriDashboard.total > 0
                        ? ((kriDashboard.statusCounts.AMBER || 0) / kriDashboard.total) * 100
                        : 0
                    }
                    className="h-2 bg-muted [&>div]:bg-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Red</span>
                    <span className="text-sm font-medium">
                      {kriDashboard.statusCounts.RED || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      kriDashboard.total > 0
                        ? ((kriDashboard.statusCounts.RED || 0) / kriDashboard.total) * 100
                        : 0
                    }
                    className="h-2 bg-muted [&>div]:bg-red-500"
                  />
                </div>

                {/* By Tier */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">By Tier</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(["CORE", "EXTENDED", "ADVANCED"] as RiskTier[]).map((tier) => {
                      const tierData = kriDashboard.byTier[tier];
                      return (
                        <div key={tier} className="text-center">
                          <Badge variant="outline" className={tierColors[tier]}>
                            {tierLabels[tier]}
                          </Badge>
                          <div className="mt-2 text-lg font-semibold">
                            {tierData?.total || 0}
                          </div>
                          <div className="flex justify-center gap-1 mt-1">
                            <span className="text-xs text-green-600">{tierData?.green || 0}</span>
                            <span className="text-xs text-muted-foreground">/</span>
                            <span className="text-xs text-amber-600">{tierData?.amber || 0}</span>
                            <span className="text-xs text-muted-foreground">/</span>
                            <span className="text-xs text-red-600">{tierData?.red || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="No KRI Data"
                description="KRI dashboard data is not available"
              />
            )}
          </Section>

          {/* Treatment Progress Summary */}
          <Section
            title="Treatment Progress"
            icon={Target}
            description="Treatment plan status overview"
            collapsible
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/risks/treatments">View All</Link>
              </Button>
            }
          >
            {treatmentStats ? (
              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{treatmentStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Plans</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10">
                    <div className="text-2xl font-bold text-amber-600">
                      {treatmentStats.overdueCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold text-green-600">
                      {treatmentStats.completedThisMonth}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>

                {/* By Status */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">By Status</h4>
                  <div className="space-y-2">
                    {Object.entries(treatmentStats.byStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={treatmentStatusColors[status as TreatmentStatus] || ""}
                        >
                          {treatmentStatusLabels[status as TreatmentStatus] || status}
                        </Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Milestones */}
                {treatmentStats.upcomingMilestones && treatmentStats.upcomingMilestones.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Upcoming Milestones</h4>
                    <div className="space-y-2">
                      {treatmentStats.upcomingMilestones.slice(0, 3).map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{milestone.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {milestone.treatmentPlanTitle}
                            </p>
                          </div>
                          {milestone.dueDate && (
                            <Badge variant="outline">
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="h-12 w-12" />}
                title="No Treatment Data"
                description="Treatment plan statistics are not available"
              />
            )}
          </Section>
        </div>

        {/* Recent Risks */}
        <Section
          title="Recent Risks"
          icon={Clock}
          description="Recently updated risks"
          collapsible
          defaultCollapsed
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No risks found
                  </TableCell>
                </TableRow>
              ) : (
                recentRisks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-mono text-xs">{risk.riskId}</TableCell>
                    <TableCell>
                      <Link
                        to={`/risks/${risk.id}`}
                        className="font-medium hover:underline"
                      >
                        {risk.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tierColors[risk.tier]}>
                        {tierLabels[risk.tier]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[risk.status]}>
                        {statusLabels[risk.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(risk.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/risks/${risk.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Section>
      </div>
    </div>
  );
}
