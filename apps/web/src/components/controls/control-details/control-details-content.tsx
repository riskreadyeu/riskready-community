
import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Edit3,
  Shield,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TestTube,
  Target,
  Activity,
  ChevronRight,
  FileText,
  History,
  ExternalLink,
  MoreHorizontal,
  Copy,
  Bookmark,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getControl, type Control, type ControlLayer, type ControlLayerTest } from "@/lib/controls-api";
import { DetailHero, DetailStatCard } from "../detail-components";
import { ControlEnableDisable } from "../ControlEnableDisable";

// Labels
const THEME_LABELS: Record<string, string> = {
  ORGANISATIONAL: "Organisational",
  PEOPLE: "People",
  PHYSICAL: "Physical",
  TECHNOLOGICAL: "Technological",
};

const THEME_COLORS: Record<string, string> = {
  ORGANISATIONAL: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PEOPLE: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  PHYSICAL: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  TECHNOLOGICAL: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

type StatusColor = "success" | "warning" | "destructive" | "primary" | "muted";

const STATUS_CONFIG: Record<string, { label: string; color: StatusColor; icon: typeof CheckCircle2 }> = {
  IMPLEMENTED: { label: "Implemented", color: "success", icon: CheckCircle2 },
  PARTIAL: { label: "Partial", color: "warning", icon: AlertTriangle },
  NOT_STARTED: { label: "Not Started", color: "muted", icon: Clock },
};

const FRAMEWORK_COLORS: Record<string, string> = {
  ISO: "bg-blue-500",
  SOC2: "bg-violet-500",
  NIS2: "bg-emerald-500",
  DORA: "bg-amber-500",
};

// Calculate effectiveness from layers
function calculateEffectiveness(layers: ControlLayer[] | undefined) {
  if (!layers || layers.length === 0) {
    return { score: 0, effective: 0, partial: 0, failing: 0, notTested: 0 };
  }

  let effective = 0, partial = 0, failing = 0, notTested = 0;

  for (const layer of layers) {
    const tests = layer.tests || [];
    if (tests.length === 0) {
      notTested++;
      continue;
    }

    const passCount = tests.filter((t: ControlLayerTest) => t.result === "PASS").length;
    const failCount = tests.filter((t: ControlLayerTest) => t.result === "FAIL").length;
    const testedCount = tests.filter((t: ControlLayerTest) => t.result && t.result !== "NOT_TESTED").length;

    if (testedCount === 0) {
      notTested++;
    } else if (failCount > 0) {
      failing++;
    } else if (passCount === testedCount) {
      effective++;
    } else {
      partial++;
    }
  }

  const total = layers.length;
  const score = total > 0 ? Math.round(((effective + partial * 0.5) / total) * 100) : 0;

  return { score, effective, partial, failing, notTested };
}

// Calculate average protection score
function calculateProtectionScore(layers: ControlLayer[] | undefined) {
  if (!layers || layers.length === 0) return { current: 0, target: 100 };

  let totalScore = 0, count = 0;

  for (const layer of layers) {
    if (layer.protectionScore !== undefined && layer.protectionScore !== null) {
      totalScore += layer.protectionScore;
      count++;
    }
  }

  return {
    current: count > 0 ? Math.round(totalScore / count) : 0,
    target: 100,
  };
}

export function ControlDetailsContent(props: { controlId?: string }) {
  const navigate = useNavigate();
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchControl() {
      if (!props.controlId) {
        setError("No control ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getControl(props.controlId);
        setControl(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load control");
      } finally {
        setLoading(false);
      }
    }
    fetchControl();
  }, [props.controlId]);

  // Computed values
  const effectiveness = useMemo(
    () => calculateEffectiveness(control?.layers),
    [control?.layers]
  );
  const protectionScore = useMemo(
    () => calculateProtectionScore(control?.layers),
    [control?.layers]
  );
  const layerCount = control?._count?.['layers'] ?? control?.layers?.length ?? 0;
  const statusConfig = STATUS_CONFIG[control?.implementationStatus || "NOT_STARTED"]!;

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !control) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Control Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The control you're looking for doesn't exist."}</p>
        <Button onClick={() => navigate("/controls/library")}>
          Back to Controls
        </Button>
      </div>
    );
  }

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Section */}
      <DetailHero
        backLink="/controls/library"
        backLabel="Back to Controls"
        icon={<Shield className="w-6 h-6 text-primary" />}
        iconBg="bg-primary/10"
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1", THEME_COLORS[control.theme])}>
              {THEME_LABELS[control.theme] || control.theme}
            </Badge>
            {control.framework && (
              <Badge variant="outline" className="gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", FRAMEWORK_COLORS[control.framework])} />
                {control.framework}
              </Badge>
            )}
          </div>
        }
        subtitle={control.controlId}
        title={control.name}
        description={control.description}
        metadata={[
          {
            label: "Implementation",
            value: (
              <span className={cn(
                "flex items-center gap-1",
                statusConfig.color === "success" && "text-success",
                statusConfig.color === "warning" && "text-warning",
                statusConfig.color === "muted" && "text-muted-foreground"
              )}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            ),
          },
          {
            label: "Framework",
            value: control.framework || "ISO",
          },
          {
            label: "Layers",
            value: layerCount.toString(),
            icon: <Layers className="w-3 h-3 text-muted-foreground" />,
          },
        ]}
        statusColor={statusConfig.color}
        actions={
          <div className="flex items-center gap-3">
            <ControlEnableDisable
              control={control}
              onStateChange={(updated) => setControl(updated)}
            />
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <DetailStatCard
          icon={<Target className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
          label="Effectiveness Score"
          value={`${effectiveness.score}%`}
          status={
            effectiveness.score >= 80 ? "success" :
            effectiveness.score >= 50 ? "warning" : "destructive"
          }
        />
        <DetailStatCard
          icon={<Layers className="w-5 h-5 text-chart-2" />}
          iconBg="bg-chart-2/10"
          label="Layers"
          value={layerCount}
          subValue={`${effectiveness.effective} effective`}
        />
        <DetailStatCard
          icon={<TestTube className="w-5 h-5 text-chart-1" />}
          iconBg="bg-chart-1/10"
          label="Tests Status"
          value={`${effectiveness.effective + effectiveness.partial}/${layerCount}`}
          subValue="tested"
        />
        <DetailStatCard
          icon={<Activity className="w-5 h-5 text-chart-3" />}
          iconBg="bg-chart-3/10"
          label="Protection Score"
          value={`${protectionScore.current}%`}
          subValue={`/ ${protectionScore.target}% target`}
        />
      </div>

      {/* Quick Actions + Effectiveness Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Effectiveness Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Effectiveness Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              {/* Visual Score */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-secondary"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${effectiveness.score * 2.51} 251`}
                    className={cn(
                      effectiveness.score >= 80 ? "text-success" :
                      effectiveness.score >= 50 ? "text-warning" : "text-destructive"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{effectiveness.score}%</span>
                </div>
              </div>

              {/* Breakdown Stats */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-xl font-bold text-success">{effectiveness.effective}</p>
                    <p className="text-xs text-muted-foreground">Effective</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="text-xl font-bold text-warning">{effectiveness.partial}</p>
                    <p className="text-xs text-muted-foreground">Partial</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-xl font-bold text-destructive">{effectiveness.failing}</p>
                    <p className="text-xs text-muted-foreground">Failing</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xl font-bold">{effectiveness.notTested}</p>
                    <p className="text-xs text-muted-foreground">Not Tested</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <TestTube className="w-4 h-4" />
              Run Effectiveness Tests
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Target className="w-4 h-4" />
              New Assessment
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Activity className="w-4 h-4" />
              Update Metrics
            </Button>
            <Separator className="my-3" />
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <FileText className="w-4 h-4" />
              View SOA Entry
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <History className="w-4 h-4" />
              View History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Layers List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Layers
              <Badge variant="secondary" className="ml-2">{layerCount}</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!control.layers || control.layers.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No layers defined for this control</p>
            </div>
          ) : (
            <div className="space-y-2">
              {control.layers.slice(0, 8).map((layer) => {
                const tests = layer.tests || [];
                const passCount = tests.filter((t: ControlLayerTest) => t.result === "PASS").length;
                const testedCount = tests.filter((t: ControlLayerTest) => t.result && t.result !== "NOT_TESTED").length;

                const effectStatus = testedCount === 0 ? "notTested" :
                  passCount === testedCount ? "effective" :
                  passCount > 0 ? "partial" : "failing";

                const layerColorMap: Record<string, { bg: string; text: string }> = {
                  GOVERNANCE: { bg: "bg-chart-1/10", text: "text-chart-1" },
                  PLATFORM: { bg: "bg-chart-2/10", text: "text-chart-2" },
                  CONSUMPTION: { bg: "bg-chart-3/10", text: "text-chart-3" },
                  OVERSIGHT: { bg: "bg-chart-4/10", text: "text-chart-4" },
                };
                const colors = layerColorMap[layer.layer] || { bg: "bg-muted", text: "text-muted-foreground" };

                return (
                  <Link
                    key={layer.id}
                    to={`/controls/${control.id}/layers/${layer.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/30 hover:bg-secondary/30 transition-all group"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                      <Layers className={cn("w-4 h-4", colors.text)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {layer.layer}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {layer.description || `${layer.layer} Layer`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Tests */}
                      <div className="text-center w-16">
                        <div className={cn(
                          "text-xs font-medium",
                          effectStatus === "effective" && "text-success",
                          effectStatus === "partial" && "text-warning",
                          effectStatus === "failing" && "text-destructive",
                          effectStatus === "notTested" && "text-muted-foreground",
                        )}>
                          {passCount}/{testedCount || tests.length}
                        </div>
                        <p className="text-[10px] text-muted-foreground">tests</p>
                      </div>

                      {/* Protection Score */}
                      <div className="text-center w-14">
                        <div className="text-xs font-medium">
                          {layer.protectionScore ?? 0}%
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          score
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}

              {control.layers.length > 8 && (
                <Button variant="ghost" className="w-full mt-2" size="sm">
                  View all {control.layers.length} layers
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Details */}
      {(control.implementationDesc || control.justificationIfNa) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Implementation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {control.implementationDesc && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Implementation Description</p>
                <p className="text-sm">{control.implementationDesc}</p>
              </div>
            )}
            {!control.applicable && control.justificationIfNa && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Justification for Non-Applicability</p>
                <p className="text-sm">{control.justificationIfNa}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Audit Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm font-medium">
                {new Date(control.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created By</p>
              <p className="text-sm font-medium">{control.createdBy?.email || "System"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(control.updatedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Updated By</p>
              <p className="text-sm font-medium">{control.updatedBy?.email || "System"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
