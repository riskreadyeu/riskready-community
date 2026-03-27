// =============================================================================
// RiskDetailV2Page Component
// =============================================================================
// Detail page for individual risks showing overview, scenarios, controls, and history

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  History,
  Layers,
  PieChart,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  getRisk,
  disableRisk,
  enableRisk,
  type Risk,
  type RiskScenario,
} from "@/lib/risks-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// V2 Dialogs
import {
  RiskEditDialog,
  ConfirmationDialog,
} from "@/components/risks";

// Shared Constants
import {
  tierLabels,
  statusLabels,
} from "./_shared";

// =============================================================================
// Helper Functions
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

// =============================================================================
// RiskDetailV2Page Component
// =============================================================================

export function RiskDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getRisk(id);
      setRisk(data);
    } catch (err) {
      console.error("Error loading risk:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load risk");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (loadError || !risk) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">{loadError || "Risk not found"}</p>
        <button
          onClick={() => navigate("/risks")}
          className="text-sm text-primary underline hover:no-underline"
        >
          Back to Risk Register
        </button>
      </div>
    );
  }

  const inherentScore = risk.inherentScore || 0;
  const residualScore = risk.residualScore || 0;
  const scenarioCount = risk._count?.scenarios || risk.scenarios?.length || 0;
  const kriCount = risk._count?.kris || risk.kris?.length || 0;
  const controlCount = risk.controls?.length || 0;

  // Calculate tolerance status from scenarios
  const toleranceStatus = risk.scenarios?.some((s) => s.toleranceStatus === "CRITICAL")
    ? "CRITICAL"
    : risk.scenarios?.some((s) => s.toleranceStatus === "EXCEEDS")
    ? "EXCEEDS"
    : "WITHIN";

  return (
    <>
    <DetailPageLayout
      header={{
        breadcrumbs: [
          { label: "Risks", href: "/risks" },
          { label: "Register", href: "/risks/register" },
          { label: risk.riskId },
        ],
        identifier: risk.riskId,
        title: risk.title,
        status: {
          label: statusLabels[risk.status],
          variant: risk.status === "CLOSED" ? "secondary" : risk.status === "TREATING" ? "warning" : "default",
          icon: risk.status === "ACCEPTED" ? CheckCircle2 : risk.status === "TREATING" ? Clock : Shield,
        },
        badges: [
          { label: tierLabels[risk.tier], variant: "outline" },
          { label: risk.framework, variant: "secondary" },
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
          </div>
        ),
      }}
      sidebar={
        <WorkflowSidebar
          status={{
            label: statusLabels[risk.status],
            color: risk.status === "CLOSED" ? "#9ca3af" : risk.status === "TREATING" ? "#f59e0b" : "#3b82f6",
            icon: <Shield className="h-4 w-4" />,
          }}
          scores={[
            { label: "Inherent Score", value: inherentScore, level: getScoreLevel(inherentScore) },
            { label: "Residual Score", value: residualScore, level: getScoreLevel(residualScore) },
          ]}
          toleranceStatus={toleranceStatus}
          actions={[
            { label: "Edit Risk", onClick: () => setEditDialogOpen(true), icon: Edit, variant: "outline" },
            { label: "Add Scenario", onClick: () => navigate(`/risks/scenarios/new?riskId=${risk.id}`), icon: Plus },
            { label: risk.enabled ? "Disable" : "Enable", onClick: () => setDisableDialogOpen(true), icon: risk.enabled ? XCircle : CheckCircle2, variant: "outline" },
          ]}
          metadata={[
            { label: "Scenarios", value: String(scenarioCount) },
            { label: "KRIs", value: String(kriCount) },
            { label: "Controls", value: String(controlCount) },
          ]}
        />
      }
      tabs={
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios ({scenarioCount})</TabsTrigger>
            <TabsTrigger value="controls">Controls ({controlCount})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
      }
      footer={
        <AuditFooter
          createdAt={risk.createdAt}
          createdBy={risk.createdBy?.email}
          updatedAt={risk.updatedAt}
          updatedBy={risk.updatedBy?.email}
        />
      }
    >
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Description Section */}
          <Section title="Description" icon={FileText}>
            <p className="text-sm text-muted-foreground">
              {risk.description || "No description provided."}
            </p>
          </Section>

          {/* Assessment Scores */}
          <Section title="Assessment Scores" icon={BarChart3}>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inherent Score</p>
                      <p className="text-3xl font-bold">{inherentScore || "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        L: {risk.likelihood || "-"} x I: {risk.impact || "-"}
                      </p>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      inherentScore >= 20 ? "bg-red-500" :
                      inherentScore >= 15 ? "bg-orange-500" :
                      inherentScore >= 8 ? "bg-amber-500" : "bg-green-500"
                    )} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Residual Score</p>
                      <p className="text-3xl font-bold">{residualScore || "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        After controls applied
                      </p>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      residualScore >= 20 ? "bg-red-500" :
                      residualScore >= 15 ? "bg-orange-500" :
                      residualScore >= 8 ? "bg-amber-500" : "bg-green-500"
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Quick Stats */}
          <Section title="Quick Stats" icon={PieChart} collapsible defaultCollapsed>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{scenarioCount}</div>
                <div className="text-xs text-muted-foreground">Scenarios</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{kriCount}</div>
                <div className="text-xs text-muted-foreground">KRIs</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{controlCount}</div>
                <div className="text-xs text-muted-foreground">Controls</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{risk.treatmentPlans?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Treatment Plans</div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {activeTab === "scenarios" && (
        <CrossReferenceGrid<RiskScenario>
          title="Risk Scenarios"
          records={risk.scenarios || []}
          columns={[
            { key: "scenarioId", header: "ID", width: "120px", render: (s) => (
              <span className="font-mono text-xs">{s.scenarioId}</span>
            )},
            { key: "title", header: "Title", render: (s) => (
              <span className="font-medium">{s.title}</span>
            )},
            { key: "status", header: "Status", width: "120px", render: (s) => (
              <Badge variant="outline" className={cn(
                s.status === "TREATING" && "border-amber-500 text-amber-600",
                s.status === "CLOSED" && "border-gray-500 text-gray-600",
              )}>
                {scenarioStatusLabels[s.status] || s.status}
              </Badge>
            )},
            { key: "residualScore", header: "Residual", width: "100px", render: (s) => (
              <Badge variant="outline" className={
                (s.residualScore || 0) >= 15 ? "text-red-600" : (s.residualScore || 0) >= 8 ? "text-amber-600" : "text-green-600"
              }>
                {s.residualScore || "-"}
              </Badge>
            )},
          ]}
          onRowClick={(s) => navigate(`/risks/scenarios/${s.id}`)}
          onCreate={() => navigate(`/risks/scenarios/new?riskId=${risk.id}`)}
          emptyState={{
            icon: <Layers className="h-12 w-12" />,
            title: "No Scenarios",
            description: "Create scenarios to assess specific risk events.",
          }}
        />
      )}

      {activeTab === "controls" && (
        <CrossReferenceGrid<{ id: string; controlId: string; name: string; theme: string; framework: string }>
          title="Linked Controls"
          records={risk.controls || []}
          columns={[
            { key: "controlId", header: "Control ID", width: "120px", render: (c) => (
              <span className="font-mono text-xs">{c.controlId}</span>
            )},
            { key: "name", header: "Name", render: (c) => (
              <span className="font-medium">{c.name}</span>
            )},
            { key: "theme", header: "Theme", width: "150px", render: (c) => (
              <Badge variant="outline">{c.theme}</Badge>
            )},
            { key: "framework", header: "Framework", width: "100px" },
          ]}
          onRowClick={(c) => navigate(`/controls/${c.id}`)}
          onAdd={() => toast.info("Control linking at risk level - feature coming soon")}
          emptyState={{
            icon: <ShieldCheck className="h-12 w-12" />,
            title: "No Controls Linked",
            description: "Link controls to this risk to track mitigation.",
          }}
        />
      )}

      {activeTab === "history" && (
        <Section title="Audit History" icon={History}>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Audit history tracking coming soon</p>
          </div>
        </Section>
      )}
    </DetailPageLayout>

    {/* Edit Risk Dialog */}
    <RiskEditDialog
      risk={risk}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success("Risk updated successfully");
      }}
    />

    {/* Disable/Enable Risk Confirmation */}
    <ConfirmationDialog
      open={disableDialogOpen}
      onOpenChange={setDisableDialogOpen}
      title={risk.enabled ? "Disable Risk?" : "Enable Risk?"}
      description={
        risk.enabled
          ? "Disabling this risk will mark it as inactive. All scenarios and KRIs will remain but won't be included in reports."
          : "Enabling this risk will make it active again and include it in reports."
      }
      confirmLabel={risk.enabled ? "Disable" : "Enable"}
      variant={risk.enabled ? "destructive" : "default"}
      requireReason={risk.enabled}
      reasonLabel="Reason for disabling"
      reasonPlaceholder="Why is this risk being disabled?"
      onConfirm={async (reason) => {
        if (risk.enabled) {
          await disableRisk(risk.id, reason || "No reason provided");
          toast.success("Risk disabled");
        } else {
          await enableRisk(risk.id);
          toast.success("Risk enabled");
        }
        loadData();
      }}
    />
    </>
  );
}
