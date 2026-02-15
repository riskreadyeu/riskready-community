import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAvailableTransitions,
  executeTransition,
  getTreatmentPlansByRisk,
  type AvailableTransition,
  type TransitionCode,
  type ScenarioStatus,
  type TreatmentPlan,
} from "@/lib/risks-api";
import { Play, Loader2, AlertCircle, ArrowRight } from "lucide-react";

interface TransitionDialogProps {
  scenarioId: string;
  currentStatus: ScenarioStatus;
  riskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ASSESSED: "Assessed",
  EVALUATED: "Evaluated",
  TREATING: "Treating",
  TREATED: "Treated",
  ACCEPTED: "Accepted",
  MONITORING: "Monitoring",
  ESCALATED: "Escalated",
  REVIEW: "Review",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

export function TransitionDialog({
  scenarioId,
  currentStatus,
  riskId,
  open,
  onOpenChange,
  onSuccess,
}: TransitionDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<AvailableTransition[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TransitionCode | null>(null);
  const [justification, setJustification] = useState("");
  const [treatmentPlanId, setTreatmentPlanId] = useState("");
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [escalationDecision, setEscalationDecision] = useState("");
  const [reviewOutcome, setReviewOutcome] = useState("");

  useEffect(() => {
    if (open && scenarioId) {
      loadTransitions();
    }
  }, [open, scenarioId]);

  const loadTransitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableTransitions(scenarioId);
      setAvailableTransitions(data.availableTransitions);

      // Load treatment plans if any transition requires one
      if (riskId && data.availableTransitions.some(t => t.requiresTreatmentPlan)) {
        const plans = await getTreatmentPlansByRisk(riskId);
        setTreatmentPlans(plans);
      }
    } catch (err: unknown) {
      console.error("Error loading transitions:", err);
      setError(err instanceof Error ? err.message : "Failed to load available transitions");
    } finally {
      setLoading(false);
    }
  };

  const selectedTransitionDetails = availableTransitions.find(t => t.code === selectedTransition);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTransition) {
      setError("Please select a transition");
      return;
    }

    const transition = selectedTransitionDetails;
    if (!transition) return;

    if (transition.requiresJustification && !justification.trim()) {
      setError("Justification is required for this transition");
      return;
    }

    if (transition.requiresTreatmentPlan && !treatmentPlanId) {
      setError("A treatment plan must be selected for this transition");
      return;
    }

    if (transition.requiresEscalationDecision && !escalationDecision.trim()) {
      setError("Escalation decision is required for this transition");
      return;
    }

    if (transition.requiresReviewOutcome && !reviewOutcome.trim()) {
      setError("Review outcome is required for this transition");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await executeTransition(scenarioId, selectedTransition, {
        justification: justification.trim() || undefined,
        treatmentPlanId: treatmentPlanId || undefined,
        escalationDecision: escalationDecision.trim() || undefined,
        reviewOutcome: reviewOutcome.trim() || undefined,
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      console.error("Error executing transition:", err);
      setError(err instanceof Error ? err.message : "Failed to execute transition");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedTransition(null);
    setJustification("");
    setTreatmentPlanId("");
    setEscalationDecision("");
    setReviewOutcome("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Workflow Transition
          </DialogTitle>
          <DialogDescription>
            Move the scenario from <Badge variant="outline">{statusLabels[currentStatus]}</Badge> to a new status.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {availableTransitions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No transitions available from the current status.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="transition">Select Transition *</Label>
                    <Select
                      value={selectedTransition || ""}
                      onValueChange={(v) => setSelectedTransition(v as TransitionCode)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a transition..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTransitions.map((t) => (
                          <SelectItem key={t.code} value={t.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{t.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {statusLabels[t.targetStatus]}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTransitionDetails?.requiresJustification && (
                    <div className="space-y-2">
                      <Label htmlFor="justification">Justification *</Label>
                      <Textarea
                        id="justification"
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Provide justification for this transition..."
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {selectedTransitionDetails?.requiresTreatmentPlan && (
                    <div className="space-y-2">
                      <Label htmlFor="treatmentPlan">Treatment Plan *</Label>
                      <Select
                        value={treatmentPlanId}
                        onValueChange={setTreatmentPlanId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a treatment plan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentPlans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.treatmentId} - {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {treatmentPlans.length === 0 && (
                        <p className="text-xs text-amber-600">
                          No treatment plans found. Create one first.
                        </p>
                      )}
                    </div>
                  )}

                  {selectedTransitionDetails?.requiresEscalationDecision && (
                    <div className="space-y-2">
                      <Label htmlFor="escalationDecision">Escalation Decision *</Label>
                      <Textarea
                        id="escalationDecision"
                        value={escalationDecision}
                        onChange={(e) => setEscalationDecision(e.target.value)}
                        placeholder="Document the escalation decision..."
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {selectedTransitionDetails?.requiresReviewOutcome && (
                    <div className="space-y-2">
                      <Label htmlFor="reviewOutcome">Review Outcome *</Label>
                      <Textarea
                        id="reviewOutcome"
                        value={reviewOutcome}
                        onChange={(e) => setReviewOutcome(e.target.value)}
                        placeholder="Document the review outcome..."
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  {selectedTransitionDetails && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{statusLabels[currentStatus]}</Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="default">{statusLabels[selectedTransitionDetails.targetStatus]}</Badge>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || availableTransitions.length === 0 || !selectedTransition}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transitioning...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Transition
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
