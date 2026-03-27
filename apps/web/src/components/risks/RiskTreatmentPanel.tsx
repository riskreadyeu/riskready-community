import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Plus,
  Shield,
  Target,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  type Risk,
  type RiskStatus,
  type TreatmentPlan,
  type TreatmentAction,
  type TreatmentType,
  updateRisk,
  getTreatmentPlansByRisk,
  createTreatmentPlan,
  updateTreatmentPlan,
  createTreatmentAction,
  updateTreatmentAction,
  deleteTreatmentAction,
} from "@/lib/risks-api";
import { cn } from "@/lib/utils";

const STATUS_WORKFLOW: { status: RiskStatus; label: string; icon: LucideIcon; color: string }[] = [
  { status: "IDENTIFIED", label: "Identified", icon: AlertCircle, color: "text-gray-600" },
  { status: "ASSESSED", label: "Assessed", icon: BarChart3, color: "text-blue-600" },
  { status: "TREATING", label: "Treating", icon: Clock, color: "text-amber-600" },
  { status: "ACCEPTED", label: "Accepted", icon: CheckCircle2, color: "text-green-600" },
  { status: "CLOSED", label: "Closed", icon: CheckCircle2, color: "text-muted-foreground" },
];

const TREATMENT_OPTIONS = [
  { value: "MITIGATE", label: "Mitigate", description: "Implement controls to reduce risk" },
  { value: "TRANSFER", label: "Transfer", description: "Transfer risk to third party (insurance, outsourcing)" },
  { value: "ACCEPT", label: "Accept", description: "Accept the risk as-is within appetite" },
  { value: "AVOID", label: "Avoid", description: "Eliminate the risk by removing the activity" },
];

interface RiskTreatmentPanelProps {
  risk: Risk;
  onUpdate?: () => void;
}

export function RiskTreatmentPanel({ risk, onUpdate }: RiskTreatmentPanelProps) {
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePlanLoading, setActivePlanLoading] = useState(true);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [planDescription, setPlanDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [treatmentType, setTreatmentType] = useState<string>("MITIGATE");

  // Action creation state
  const [newActionTitle, setNewActionTitle] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);

  const currentStatusIndex = STATUS_WORKFLOW.findIndex(s => s.status === risk.status);

  // Fetch treatment plan on mount
  const fetchTreatmentPlan = useCallback(async () => {
    try {
      setActivePlanLoading(true);
      const plans = await getTreatmentPlansByRisk(risk.id);
      // Use the most recent active plan (or just the most recent one for now)
      if (plans.length > 0) {
        const plan = plans[0]!; // ordered by createdAt desc in service
        setActivePlan(plan);
        setPlanDescription(plan.description || "");
        setAcceptanceCriteria(plan.acceptanceCriteria || "");
        setTreatmentType(plan.treatmentType);
      } else {
        setActivePlan(null);
        // Pre-fill from Risk legacy fields if available and no plan exists
        setPlanDescription(risk.treatmentPlan || "");
        setAcceptanceCriteria(risk.acceptanceCriteria || "");
      }
    } catch (err) {
      console.error("Error fetching treatment plans:", err);
      toast.error("Failed to load treatment plan");
    } finally {
      setActivePlanLoading(false);
    }
  }, [risk.id, risk.treatmentPlan, risk.acceptanceCriteria]);

  useEffect(() => {
    fetchTreatmentPlan();
  }, [fetchTreatmentPlan]);

  const handleSavePlan = async () => {
    try {
      setLoading(true);

      if (activePlan) {
        // Update existing plan
        await updateTreatmentPlan(activePlan.id, {
          description: planDescription,
          acceptanceCriteria: acceptanceCriteria,
          treatmentType: treatmentType as TreatmentType,
        });
        toast.success("Treatment plan updated");
      } else {
        // Create new plan
        await createTreatmentPlan({
          riskId: risk.id,
          organisationId: risk.organisationId,
          treatmentId: `TP-${Date.now()}`, // Generate a temporary ID or let backend handle if configured
          title: `Treatment for ${risk.riskId}`,
          description: planDescription,
          acceptanceCriteria: acceptanceCriteria,
          treatmentType: treatmentType as TreatmentType,
          status: 'DRAFT',

        });
        toast.success("Treatment plan created");
      }

      // Also update the risk entity for legacy compatibility/display
      await updateRisk(risk.id, {
        treatmentPlan: planDescription,
        acceptanceCriteria: acceptanceCriteria
      });

      await fetchTreatmentPlan();
      setEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error("Error saving treatment plan:", err);
      toast.error("Failed to save treatment plan");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RiskStatus) => {
    try {
      setLoading(true);
      await updateRisk(risk.id, { status: newStatus });
      onUpdate?.();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = async () => {
    if (!newActionTitle.trim() || !activePlan) return;

    try {
      setCreatingAction(true);
      await createTreatmentAction(activePlan.id, {
        actionId: `ACT-${Date.now()}`, // Temp ID
        title: newActionTitle,
        status: 'NOT_STARTED',
      });
      setNewActionTitle("");
      await fetchTreatmentPlan();
      toast.success("Action added");
    } catch (err) {
      console.error("Error adding action:", err);
      toast.error("Failed to add action");
    } finally {
      setCreatingAction(false);
    }
  };

  const handleToggleAction = async (action: TreatmentAction) => {
    try {
      const newStatus = action.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
      // Optimistic update could go here, but for now we refresh
      await updateTreatmentAction(action.id, {
        status: newStatus,
        completedDate: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      });
      await fetchTreatmentPlan();
    } catch (err) {
      console.error("Error updating action:", err);
      toast.error("Failed to update action status");
    }
  };

  const handleRemoveAction = async (actionId: string) => {
    try {
      await deleteTreatmentAction(actionId);
      await fetchTreatmentPlan();
      toast.success("Action removed");
    } catch (err) {
      console.error("Error removing action:", err);
      toast.error("Failed to remove action");
    }
  };

  const actions = activePlan?.actions || [];
  const completedActionsCount = actions.filter(a => a.status === 'COMPLETED').length;
  const progressPercent = activePlan?.progressPercentage || 0;

  if (activePlanLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Workflow */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Risk Status Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {STATUS_WORKFLOW.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.status === risk.status;
              const isPast = index < currentStatusIndex;
              const isFuture = index > currentStatusIndex;

              return (
                <div key={step.status} className="flex items-center">
                  <button
                    onClick={() => handleStatusChange(step.status)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                      isActive && "bg-primary/10 ring-2 ring-primary",
                      isPast && "opacity-60",
                      isFuture && "opacity-40",
                      !isActive && "hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isActive ? "bg-primary text-primary-foreground" :
                        isPast ? "bg-green-500/20 text-green-600" :
                          "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {index < STATUS_WORKFLOW.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1",
                      index < currentStatusIndex ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plan */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Treatment Plan
          </CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {activePlan ? "Edit Plan" : "Create Plan"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>Treatment Strategy</Label>
                <Select value={treatmentType} onValueChange={setTreatmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            - {opt.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Treatment Plan Details</Label>
                <Textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Describe how this risk will be treated..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Acceptance Criteria</Label>
                <Textarea
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder="Define criteria for accepting the residual risk..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {activePlan ? "Save Plan" : "Create Plan"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Strategy: {treatmentType || "Not Set"}
                </Badge>
                {activePlan && (
                  <Badge variant={activePlan.status === 'APPROVED' ? "default" : "secondary"} className="text-xs">
                    {activePlan.status}
                  </Badge>
                )}
              </div>

              {activePlan ? (
                <div className="p-3 rounded-lg bg-secondary/30 text-sm whitespace-pre-wrap">
                  {activePlan.description}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No treatment plan defined yet. Click "Create Plan" to start.
                </p>
              )}

              {acceptanceCriteria && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground">Acceptance Criteria</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{acceptanceCriteria}</p>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Treatment Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Treatment Actions
            </CardTitle>
            {actions.length > 0 && (
              <Badge variant="outline">
                {completedActionsCount}/{actions.length} completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activePlan ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Create a treatment plan first</p>
              <p className="text-xs">You need a plan before adding actions.</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              {actions.length > 0 && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {progressPercent}% complete
                  </p>
                </div>
              )}

              {/* Action List */}
              <div className="space-y-2">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      action.status === 'COMPLETED' ? "bg-green-500/5 border-green-500/20" : "bg-secondary/30"
                    )}
                  >
                    <Checkbox
                      checked={action.status === 'COMPLETED'}
                      onCheckedChange={() => handleToggleAction(action)}
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      action.status === 'COMPLETED' && "line-through text-muted-foreground"
                    )}>
                      {action.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveAction(action.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Action */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a treatment action..."
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
                  disabled={creatingAction}
                />
                <Button variant="outline" onClick={handleAddAction} disabled={!newActionTitle.trim() || creatingAction}>
                  {creatingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>

              {actions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No treatment actions defined</p>
                  <p className="text-xs">Add actions to track treatment progress</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
