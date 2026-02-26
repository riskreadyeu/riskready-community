// =============================================================================
// RiskScenarioDetailV2Page - Scenario Detail Page
// =============================================================================
// Displays comprehensive scenario details with assessment,
// controls, and treatment plans using Archer design patterns

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  GitBranch,
  Link2,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Target,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Archer Components
import {
  AuditFooter,
  CrossReferenceGrid,
  DetailPageLayout,
  Section,
  WorkflowSidebar,
} from "@/components/archer";

// API
import {
  getRiskScenario,
  getScenarioLinkedControls,
  calculateResidualFromControls,
  type RiskScenario,
  type ScenarioControlLink,
  type ScenarioStatus,
  type LikelihoodLevel,
  type ImpactLevel,
} from "@/lib/risks-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// V2 Dialogs
import {
  ScenarioEditDialog,
  TransitionDialog,
  AssessmentDialog,
  ScenarioControlLinker,
} from "@/components/risks";

// Shared Constants
import {
  tierLabels,
  treatmentTypeLabels,
  treatmentTypeColors,
  treatmentStatusLabels,
  treatmentStatusColors,
} from "./_shared";

// =============================================================================
// Local Constants & Helpers
// =============================================================================

const getScoreLevel = (score: number): "low" | "medium" | "high" | "critical" => {
  if (score >= 20) return "critical";
  if (score >= 15) return "high";
  if (score >= 8) return "medium";
  return "low";
};

const scenarioStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ASSESSED: "Assessed",
  EVALUATED: "Evaluated",
  TREATING: "Treating",
  TREATED: "Treated",
  MONITORING: "Monitoring",
  ACCEPTED: "Accepted",
  CLOSED: "Closed",
};

const scenarioStatusColors: Record<string, string> = {
  DRAFT: "#6b7280",
  ASSESSED: "#3b82f6",
  EVALUATED: "#8b5cf6",
  TREATING: "#f59e0b",
  TREATED: "#10b981",
  MONITORING: "#06b6d4",
  ACCEPTED: "#22c55e",
  CLOSED: "#9ca3af",
};

const likelihoodLabels: Record<LikelihoodLevel, string> = {
  RARE: "Rare",
  UNLIKELY: "Unlikely",
  POSSIBLE: "Possible",
  LIKELY: "Likely",
  ALMOST_CERTAIN: "Almost Certain",
};

const impactLabels: Record<ImpactLevel, string> = {
  NEGLIGIBLE: "Negligible",
  MINOR: "Minor",
  MODERATE: "Moderate",
  MAJOR: "Major",
  SEVERE: "Severe",
};

// =============================================================================
// RiskScenarioDetailV2Page Component
// =============================================================================

export function RiskScenarioDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organisationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<RiskScenario | null>(null);
  const [controls, setControls] = useState<ScenarioControlLink[]>([]);
  const [activeTab, setActiveTab] = useState("assessment");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [inherentAssessmentOpen, setInherentAssessmentOpen] = useState(false);
  const [residualAssessmentOpen, setResidualAssessmentOpen] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [scenarioData, controlsData] = await Promise.all([
        getRiskScenario(id),
        getScenarioLinkedControls(id).catch(() => []),
      ]);
      setScenario(scenarioData);
      setControls(controlsData);
    } catch (err) {
      console.error("Error loading scenario:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !scenario) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="w-[280px] h-96" />
        </div>
      </div>
    );
  }

  const inherentScore = scenario.inherentScore || 0;
  const residualScore = scenario.residualScore || 0;
  const treatmentCount = scenario.treatmentPlans?.length || 0;

  // Build workflow stages
  const stages = [
    { id: "DRAFT", label: "Draft", complete: ["ASSESSED", "EVALUATED", "TREATING", "TREATED", "MONITORING", "ACCEPTED", "CLOSED"].includes(scenario.status), current: scenario.status === "DRAFT" },
    { id: "ASSESSED", label: "Assessed", complete: ["EVALUATED", "TREATING", "TREATED", "MONITORING", "ACCEPTED", "CLOSED"].includes(scenario.status), current: scenario.status === "ASSESSED" },
    { id: "TREATING", label: "Treating", complete: ["TREATED", "MONITORING", "ACCEPTED", "CLOSED"].includes(scenario.status), current: scenario.status === "TREATING" },
    { id: "MONITORING", label: "Monitoring", complete: ["ACCEPTED", "CLOSED"].includes(scenario.status), current: scenario.status === "MONITORING" },
    { id: "CLOSED", label: "Closed", complete: scenario.status === "CLOSED", current: scenario.status === "CLOSED" },
  ];

  return (
    <>
    <DetailPageLayout
      header={{
        breadcrumbs: [
          { label: "Risks", href: "/risks" },
          { label: scenario.risk?.riskId || "Risk", href: scenario.risk ? `/risks/${scenario.riskId}` : undefined },
          { label: scenario.scenarioId },
        ],
        identifier: scenario.scenarioId,
        title: scenario.title,
        status: {
          label: scenarioStatusLabels[scenario.status] || scenario.status,
          variant: scenario.status === "CLOSED" ? "secondary" : scenario.status === "TREATING" ? "warning" : "default",
          icon: scenario.status === "CLOSED" ? CheckCircle2 : scenario.status === "TREATING" ? Clock : Circle,
        },
        badges: [
          { label: scenario.framework, variant: "secondary" },
        ],
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button size="sm" onClick={() => setTransitionDialogOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              Transition
            </Button>
          </div>
        ),
      }}
      sidebar={
        <WorkflowSidebar
          status={{
            label: scenarioStatusLabels[scenario.status] || scenario.status,
            color: scenarioStatusColors[scenario.status] || "#6b7280",
            icon: <Circle className="h-4 w-4" />,
          }}
          stages={stages}
          scores={[
            { label: "Inherent Score", value: inherentScore, level: getScoreLevel(inherentScore) },
            { label: "Residual Score", value: residualScore, level: getScoreLevel(residualScore) },
            ...(scenario.targetResidualScore ? [{ label: "Target", value: scenario.targetResidualScore, level: getScoreLevel(scenario.targetResidualScore) }] : []),
          ]}
          toleranceStatus={scenario.toleranceStatus}
          actions={[
            { label: "Edit Scenario", onClick: () => setEditDialogOpen(true), icon: Edit, variant: "outline" },
            { label: "Assess Inherent", onClick: () => setInherentAssessmentOpen(true), icon: Sliders },
            { label: "Link Controls", onClick: () => setActiveTab("controls"), icon: Link2, variant: "outline" },
            { label: "Add Treatment", onClick: () => navigate(`/risks/treatments/new?riskId=${scenario.riskId}`), icon: Target, variant: "outline" },
          ]}
          metadata={[
            { label: "Controls", value: String(controls.length) },
            { label: "Treatments", value: String(treatmentCount) },
          ]}
        />
      }
      tabs={
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="controls">Controls ({controls.length})</TabsTrigger>
            <TabsTrigger value="treatments">Treatment Plans ({treatmentCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      }
      footer={
        <AuditFooter
          createdAt={scenario.createdAt}
          createdBy={scenario.createdBy?.email}
          updatedAt={scenario.updatedAt}
          updatedBy={scenario.updatedBy?.email}
        />
      }
    >
      {activeTab === "assessment" && (
        <div className="space-y-6">
          {/* Cause-Event-Consequence */}
          <Section title="Scenario Definition" icon={GitBranch}>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cause</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{scenario.cause || "Not specified"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{scenario.event || "Not specified"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Consequence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{scenario.consequence || "Not specified"}</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Score Summary */}
          <Section title="Risk Scores" icon={AlertTriangle}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Inherent Score */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Inherent Risk (Before Controls)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Likelihood</p>
                      <p className="text-lg font-semibold">
                        {scenario.likelihood ? likelihoodLabels[scenario.likelihood] : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Impact</p>
                      <p className="text-lg font-semibold">
                        {scenario.impact ? impactLabels[scenario.impact] : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{inherentScore || "-"}</p>
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          inherentScore >= 20 ? "bg-red-500" :
                          inherentScore >= 15 ? "bg-orange-500" :
                          inherentScore >= 8 ? "bg-amber-500" : "bg-green-500"
                        )} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Residual Score */}
              <Card className="border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Residual Risk (After Controls)</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await calculateResidualFromControls(scenario.id);
                          loadData();
                          toast.success("Residual calculated from controls");
                        } catch (err) {
                          toast.error("Failed to calculate residual");
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Calculate
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Likelihood</p>
                      <p className="text-lg font-semibold">
                        {scenario.residualLikelihood ? likelihoodLabels[scenario.residualLikelihood] : "-"}
                      </p>
                      {scenario.residualOverridden && (
                        <Badge variant="outline" className="mt-1 text-xs">Override</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Impact</p>
                      <p className="text-lg font-semibold">
                        {scenario.residualImpact ? impactLabels[scenario.residualImpact] : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{residualScore || "-"}</p>
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          residualScore >= 20 ? "bg-red-500" :
                          residualScore >= 15 ? "bg-orange-500" :
                          residualScore >= 8 ? "bg-amber-500" : "bg-green-500"
                        )} />
                      </div>
                    </div>
                  </div>
                  {scenario.residualOverrideJustification && (
                    <div className="mt-3 p-2 rounded bg-muted/50 text-xs">
                      <span className="text-muted-foreground">Override: </span>
                      {scenario.residualOverrideJustification}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Section>
        </div>
      )}


      {activeTab === "controls" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ScenarioControlLinker
              scenarioId={scenario.id}
              onLinksChanged={() => {
                loadData();
                toast.success("Controls updated");
              }}
            />
          </div>
          <CrossReferenceGrid<ScenarioControlLink>
            title="Linked Controls"
            records={controls}
            columns={[
              { key: "controlId", header: "Control ID", width: "120px", render: (c) => (
                <span className="font-mono text-xs">{c.control.controlId}</span>
              )},
              { key: "name", header: "Name", render: (c) => (
                <span className="font-medium">{c.control.name}</span>
              )},
              { key: "effectiveness", header: "Weight", width: "100px", render: (c) => (
                <span>{(c.effectivenessWeight * 100).toFixed(0)}%</span>
              )},
              { key: "primary", header: "Primary", width: "80px", render: (c) => (
                c.isPrimaryControl ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : null
              )},
            ]}
            getRowId={(c) => c.id}
            onRowClick={(c) => navigate(`/controls/${c.control.id}`)}
            emptyState={{
              icon: <ShieldCheck className="h-12 w-12" />,
              title: "No Controls Linked",
              description: "Link controls to calculate residual risk automatically.",
            }}
          />
        </div>
      )}

      {activeTab === "treatments" && (
        <CrossReferenceGrid<NonNullable<RiskScenario["treatmentPlans"]>[number]>
          title="Treatment Plans"
          records={scenario.treatmentPlans || []}
          columns={[
            { key: "treatmentId", header: "ID", width: "120px", render: (t) => (
              <span className="font-mono text-xs">{t.treatmentId}</span>
            )},
            { key: "title", header: "Title", render: (t) => (
              <span className="font-medium">{t.title}</span>
            )},
            { key: "type", header: "Type", width: "100px", render: (t) => (
              <Badge variant="outline" className={treatmentTypeColors[t.treatmentType]}>
                {treatmentTypeLabels[t.treatmentType]}
              </Badge>
            )},
            { key: "status", header: "Status", width: "120px", render: (t) => (
              <Badge variant="outline" className={treatmentStatusColors[t.status]}>
                {treatmentStatusLabels[t.status]}
              </Badge>
            )},
            { key: "progress", header: "Progress", width: "100px", render: (t) => (
              <div className="flex items-center gap-2">
                <Progress value={t.progressPercentage} className="w-12 h-2" />
                <span className="text-xs">{t.progressPercentage}%</span>
              </div>
            )},
          ]}
          getRowId={(t) => t.id}
          onRowClick={(t) => navigate(`/risks/treatments/${t.id}`)}
          onCreate={() => navigate(`/risks/treatments/new?riskId=${scenario.riskId}`)}
          emptyState={{
            icon: <Target className="h-12 w-12" />,
            title: "No Treatment Plans",
            description: "Create a treatment plan to address this scenario.",
          }}
        />
      )}
    </DetailPageLayout>

    {/* Edit Scenario Dialog */}
    <ScenarioEditDialog
      scenario={scenario}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success("Scenario updated successfully");
      }}
    />

    {/* Workflow Transition Dialog */}
    <TransitionDialog
      scenarioId={scenario.id}
      currentStatus={scenario.status as ScenarioStatus}
      riskId={scenario.riskId}
      open={transitionDialogOpen}
      onOpenChange={setTransitionDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success("Transition executed successfully");
      }}
    />

    {/* Inherent Assessment Dialog */}
    <AssessmentDialog
      scenario={scenario}
      mode="inherent"
      open={inherentAssessmentOpen}
      onOpenChange={setInherentAssessmentOpen}
      onSuccess={() => {
        loadData();
        toast.success("Inherent assessment saved");
      }}
    />

    {/* Residual Assessment Dialog */}
    <AssessmentDialog
      scenario={scenario}
      mode="residual"
      open={residualAssessmentOpen}
      onOpenChange={setResidualAssessmentOpen}
      onSuccess={() => {
        loadData();
        toast.success("Residual assessment saved");
      }}
    />

    </>
  );
}
