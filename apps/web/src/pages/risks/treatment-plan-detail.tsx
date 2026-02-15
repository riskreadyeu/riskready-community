import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Plus,
  RefreshCw,
  Shield,
  Target,
  User,
  XCircle,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Archer Components
import {
  AuditFooter,
  DetailPageLayout,
  EmptyState,
  Section,
  WorkflowSidebar,
} from "@/components/archer";

// API
import {
  getTreatmentPlan,
  updateTreatmentPlanProgress,
  approveTreatmentPlan,
  type TreatmentPlan,
  type TreatmentAction,
} from "@/lib/risks-api";

// V2 Dialogs
import {
  ConfirmationDialog,
  TreatmentPlanDialog,
  TreatmentActionDialog,
} from "@/components/risks";

// Shared constants
import {
  tierColors,
  tierLabels,
  statusColors,
  statusLabels,
  treatmentStatusLabels,
  treatmentTypeLabels,
  priorityColors,
  actionStatusLabels,
  actionStatusColors,
  getScoreLevel,
} from "./_shared";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TreatmentPlanDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<TreatmentAction | undefined>(undefined);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getTreatmentPlan(id);
      setPlan(data);
    } catch (err) {
      console.error("Error loading treatment plan:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !plan) {
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

  const actionCount = plan._count?.actions || plan.actions?.length || 0;
  const completedActions = plan.actions?.filter((a) => a.status === "COMPLETED").length || 0;

  const isOverdue = plan.targetEndDate && plan.status !== "COMPLETED" && plan.status !== "CANCELLED" && new Date(plan.targetEndDate) < new Date();

  return (
    <>
    <DetailPageLayout
      header={{
        breadcrumbs: [
          { label: "Risks", href: "/risks" },
          { label: "Treatment Plans", href: "/risks/treatments" },
          { label: plan.treatmentId },
        ],
        identifier: plan.treatmentId,
        title: plan.title,
        status: {
          label: treatmentStatusLabels[plan.status],
          variant: plan.status === "COMPLETED" ? "success" : plan.status === "IN_PROGRESS" ? "warning" : "secondary",
          icon: plan.status === "COMPLETED" ? CheckCircle2 : plan.status === "IN_PROGRESS" ? Clock : FileText,
        },
        badges: [
          { label: treatmentTypeLabels[plan.treatmentType], variant: "outline" },
          { label: plan.priority, variant: plan.priority === "CRITICAL" ? "destructive" : "secondary" },
          ...(isOverdue ? [{ label: "Overdue", variant: "destructive" as const }] : []),
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
            {plan.status === "PROPOSED" && (
              <Button size="sm" onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
          </div>
        ),
      }}
      sidebar={
        <WorkflowSidebar
          status={{
            label: treatmentStatusLabels[plan.status],
            color: plan.status === "COMPLETED" ? "#22c55e" : plan.status === "IN_PROGRESS" ? "#f59e0b" : "#6b7280",
            icon: <Target className="h-4 w-4" />,
          }}
          scores={[
            ...(plan.currentResidualScore ? [{ label: "Current Score", value: plan.currentResidualScore, level: getScoreLevel(plan.currentResidualScore) }] : []),
            ...(plan.targetResidualScore ? [{ label: "Target Score", value: plan.targetResidualScore, level: getScoreLevel(plan.targetResidualScore) }] : []),
          ]}
          actions={[
            { label: "Update Progress", onClick: async () => {
              const newProgress = Math.min(100, (plan.progressPercentage || 0) + 10);
              try {
                await updateTreatmentPlanProgress(plan.id, newProgress);
                loadData();
                toast.success("Progress updated");
              } catch (err) {
                toast.error("Failed to update progress");
              }
            }, icon: RefreshCw },
            { label: "Edit Plan", onClick: () => setEditDialogOpen(true), icon: Edit, variant: "outline" },
            ...(plan.status === "PROPOSED" ? [{ label: "Approve", onClick: () => setApproveDialogOpen(true), icon: CheckCircle2 }] : []),
          ]}
          metadata={[
            { label: "Progress", value: `${plan.progressPercentage}%` },
            { label: "Actions", value: `${completedActions}/${actionCount}` },
            ...(plan.targetEndDate ? [{ label: "Target Date", value: new Date(plan.targetEndDate).toLocaleDateString() }] : []),
            ...(plan.estimatedCost ? [{ label: "Est. Cost", value: `$${plan.estimatedCost.toLocaleString()}` }] : []),
          ]}
        />
      }
      footer={
        <AuditFooter
          createdAt={plan.createdAt}
          createdBy={plan.createdBy?.email}
          updatedAt={plan.updatedAt}
          updatedBy={plan.updatedBy?.email}
        />
      }
    >
      <div className="space-y-6">
        {/* Progress Section */}
        <Section title="Progress" icon={BarChart3}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-bold">{plan.progressPercentage}%</span>
              </div>
              <Progress value={plan.progressPercentage} className="h-3" />
              {plan.progressNotes && (
                <p className="text-sm text-muted-foreground mt-3">{plan.progressNotes}</p>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* Description Section */}
        <Section title="Description" icon={FileText}>
          <p className="text-sm">{plan.description}</p>

          {plan.treatmentType === "ACCEPT" && plan.acceptanceRationale && (
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm font-medium text-amber-700 mb-1">Acceptance Rationale</p>
              <p className="text-sm">{plan.acceptanceRationale}</p>
            </div>
          )}
        </Section>

        {/* Timeline Section */}
        <Section title="Timeline" icon={Calendar}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Target Start</p>
                <p className="text-lg font-medium">
                  {plan.targetStartDate ? new Date(plan.targetStartDate).toLocaleDateString() : "-"}
                </p>
                {plan.actualStartDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Actual: {new Date(plan.actualStartDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className={cn(isOverdue && "border-red-500")}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Target End</p>
                <p className={cn("text-lg font-medium", isOverdue && "text-red-600")}>
                  {plan.targetEndDate ? new Date(plan.targetEndDate).toLocaleDateString() : "-"}
                </p>
                {plan.actualEndDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Actual: {new Date(plan.actualEndDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Action Items */}
        <Section
          title="Action Items"
          icon={CheckCircle2}
          actions={
            <Button size="sm" variant="outline" onClick={() => {
              setEditingAction(undefined);
              setActionDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          }
        >
          {plan.actions && plan.actions.length > 0 ? (
            <div className="space-y-3">
              {plan.actions.map((action) => (
                <Card
                  key={action.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    action.status === "COMPLETED" && "opacity-60"
                  )}
                  onClick={() => {
                    setEditingAction(action);
                    setActionDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                          action.status === "COMPLETED" ? "bg-green-500" :
                          action.status === "IN_PROGRESS" ? "bg-amber-500" :
                          action.status === "BLOCKED" ? "bg-red-500" : "bg-muted"
                        )}>
                          {action.status === "COMPLETED" && <CheckCircle2 className="h-3 w-3 text-white" />}
                          {action.status === "BLOCKED" && <XCircle className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium",
                            action.status === "COMPLETED" && "line-through"
                          )}>{action.title}</p>
                          {action.description && (
                            <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className={actionStatusColors[action.status]}>
                              {actionStatusLabels[action.status]}
                            </Badge>
                            <Badge variant="outline" className={priorityColors[action.priority]}>
                              {action.priority}
                            </Badge>
                            {action.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(action.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {action.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {action.assignedTo.email}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12" />}
              title="No Actions"
              description="Add action items to track treatment activities."
              action={{
                label: "Add Action",
                onClick: () => {
                  setEditingAction(undefined);
                  setActionDialogOpen(true);
                },
              }}
            />
          )}
        </Section>

        {/* Linked Risk */}
        {plan.risk && (
          <Section title="Linked Risk" icon={Shield} collapsible defaultCollapsed>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/risks/${plan.risk?.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{plan.risk.riskId}</p>
                    <p className="font-medium">{plan.risk.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {plan.risk.tier && (
                        <Badge variant="outline" className={tierColors[plan.risk.tier]}>
                          {tierLabels[plan.risk.tier]}
                        </Badge>
                      )}
                      {plan.risk.status && (
                        <Badge variant="outline" className={statusColors[plan.risk.status]}>
                          {statusLabels[plan.risk.status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Section>
        )}
      </div>
    </DetailPageLayout>

    {/* Edit Treatment Plan Dialog */}
    <TreatmentPlanDialog
      plan={plan}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success("Treatment plan updated successfully");
      }}
    />

    {/* Approve Treatment Plan Confirmation */}
    <ConfirmationDialog
      open={approveDialogOpen}
      onOpenChange={setApproveDialogOpen}
      title="Approve Treatment Plan?"
      description="This will approve the treatment plan and move it to the IN_PROGRESS status."
      confirmLabel="Approve"
      onConfirm={async () => {
        await approveTreatmentPlan(plan.id);
        loadData();
        toast.success("Treatment plan approved");
      }}
    />

    {/* Add/Edit Action Dialog */}
    <TreatmentActionDialog
      treatmentPlanId={plan.id}
      action={editingAction}
      open={actionDialogOpen}
      onOpenChange={setActionDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success(editingAction ? "Action updated successfully" : "Action added successfully");
      }}
    />
    </>
  );
}
