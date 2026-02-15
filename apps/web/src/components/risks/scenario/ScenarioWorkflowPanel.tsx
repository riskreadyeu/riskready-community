import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  AlertTriangle,
  Shield,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Info,
  FileText,
  Loader2,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTreatmentPlansByRisk,
  createTreatmentPlan,
  deleteTreatmentPlan,
  type TreatmentPlan,
} from "@/lib/risks-api";

import type { ScenarioStatus, Transition, ScenarioWorkflowPanelProps } from "./workflow-types";
import { STATUS_CONFIG, AVAILABLE_TRANSITIONS, getDecisionGuidance } from "./workflow-config";

// ============================================
// MAIN COMPONENT
// ============================================

export function ScenarioWorkflowPanel({
  status,
  toleranceStatus,
  residualScore,
  toleranceThreshold,
  onTransition,
  isLoading,
  approvalLevel,
  factorsComplete = true,
  riskId,
  scenarioId,
  scenarioTitle,
}: ScenarioWorkflowPanelProps) {
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null);
  const [justification, setJustification] = useState("");
  const [reviewOutcome, setReviewOutcome] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Treatment plan state
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false);
  const [treatmentPlanOption, setTreatmentPlanOption] = useState<"existing" | "new">("new");
  const [selectedTreatmentPlanId, setSelectedTreatmentPlanId] = useState<string>("");
  const [newTreatmentTitle, setNewTreatmentTitle] = useState("");
  const [creatingTreatmentPlan, setCreatingTreatmentPlan] = useState(false);
  // Pre-generated treatment ID to prevent duplicates on retry
  const [pendingTreatmentId, setPendingTreatmentId] = useState<string>("");

  // Success state for showing link to treatment plan
  const [showTreatmentSuccess, setShowTreatmentSuccess] = useState(false);
  const [createdTreatmentPlanId, setCreatedTreatmentPlanId] = useState<string | null>(null);

  // Error state for user-friendly error display
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const currentConfig = STATUS_CONFIG[status];
  const allTransitions = AVAILABLE_TRANSITIONS[status] || [];

  // Filter transitions based on tolerance status
  const transitions = allTransitions.filter(t => {
    if (!t.showWhen) return true;
    return t.showWhen(toleranceStatus);
  });

  const decisionGuidance = getDecisionGuidance(status, toleranceStatus, residualScore);

  const handleTransitionClick = async (transition: Transition) => {
    setSelectedTransition(transition);
    setJustification("");
    setReviewOutcome("");
    setTransitionError(null); // Clear any previous error

    // Reset treatment plan state
    setTreatmentPlanOption("new");
    setSelectedTreatmentPlanId("");
    setNewTreatmentTitle(scenarioTitle ? `Treatment for: ${scenarioTitle}` : "");
    // Pre-generate treatment ID to prevent duplicates on retry/double-click
    setPendingTreatmentId(`TP-${Date.now().toString(36).toUpperCase()}`);

    // If this transition requires a treatment plan, fetch existing plans
    if (transition.requiresTreatmentPlan && riskId) {
      setLoadingTreatmentPlans(true);
      try {
        const plans = await getTreatmentPlansByRisk(riskId);
        // Filter to show only relevant plans (DRAFT, PROPOSED, or APPROVED)
        const availablePlans = plans.filter(
          (p) => p.status === "DRAFT" || p.status === "PROPOSED" || p.status === "APPROVED"
        );
        setTreatmentPlans(availablePlans);
        // If there are existing plans, default to selecting one
        if (availablePlans.length > 0) {
          setTreatmentPlanOption("existing");
          setSelectedTreatmentPlanId(availablePlans[0]!.id);
        }
      } catch (error) {
        console.error("Failed to fetch treatment plans:", error);
        setTreatmentPlans([]);
      } finally {
        setLoadingTreatmentPlans(false);
      }
    }

    setShowTransitionDialog(true);
  };

  const handleConfirmTransition = async () => {
    if (!selectedTransition) return;

    if (selectedTransition.requiresJustification && !justification.trim()) {
      return;
    }

    if (selectedTransition.requiresReviewOutcome && !reviewOutcome) {
      return;
    }

    // Declare outside try block so it's accessible in catch for rollback
    let treatmentPlanId: string | undefined;

    try {
      setSubmitting(true);

      // Handle treatment plan requirement
      if (selectedTransition.requiresTreatmentPlan) {
        if (treatmentPlanOption === "existing" && selectedTreatmentPlanId) {
          treatmentPlanId = selectedTreatmentPlanId;
        } else if (treatmentPlanOption === "new" && riskId) {
          // Create new treatment plan with auto-populated fields
          setCreatingTreatmentPlan(true);
          try {
            // Use pre-generated treatment ID to prevent duplicates on retry
            const treatmentId = pendingTreatmentId;

            // Calculate smart defaults
            const threshold = toleranceThreshold ?? 15;
            const currentScore = residualScore ?? 0;

            // Target score should be within tolerance (threshold - 2 as buffer, min 1)
            const targetScore = Math.max(1, threshold - 2);

            // Calculate target dates based on priority
            const today = new Date();
            const startDate = today.toISOString().split('T')[0]; // Today
            const daysToAdd = toleranceStatus === "CRITICAL" ? 30 : toleranceStatus === "EXCEEDS" ? 60 : 90;
            const endDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Determine priority
            const priority = toleranceStatus === "CRITICAL" ? "CRITICAL" : toleranceStatus === "EXCEEDS" ? "HIGH" : "MEDIUM";

            const newPlan = await createTreatmentPlan({
              treatmentId,
              riskId,
              scenarioId, // Link treatment plan to this specific scenario
              // organisationId is auto-fetched from the risk by the backend
              title: newTreatmentTitle || `Treatment for: ${scenarioTitle || "Risk Scenario"}`,
              description: justification || `Treatment plan to reduce risk score from ${currentScore} to ${targetScore} (within tolerance threshold of ${threshold}). Current tolerance status: ${toleranceStatus}.`,
              treatmentType: "MITIGATE",
              priority,
              status: "IN_PROGRESS",
              targetResidualScore: targetScore,
              targetStartDate: startDate,
              targetEndDate: endDate,
              costBenefit: `Reducing risk from ${toleranceStatus} tolerance to WITHIN tolerance. Expected score reduction: ${currentScore} → ${targetScore} (${currentScore - targetScore} points).`,
            });
            treatmentPlanId = newPlan.id;
            // Store for success message
            setCreatedTreatmentPlanId(newPlan.id);
            setShowTreatmentSuccess(true);
          } catch (error: unknown) {
            console.error("Failed to create treatment plan:", error);
            // Parse the error message for user-friendly display
            let errorMessage = "Failed to create treatment plan. Please try again.";
            try {
              const rawMessage = error instanceof Error ? error.message : String(error);
              const errorData = typeof rawMessage === 'string' && rawMessage.startsWith('{')
                ? JSON.parse(rawMessage)
                : null;
              if (errorData?.message) {
                errorMessage = errorData.message;
              } else if (rawMessage) {
                errorMessage = rawMessage;
              }
            } catch {
              // Keep default error message
            }
            setTransitionError(errorMessage);
            setCreatingTreatmentPlan(false);
            setSubmitting(false);
            return;
          }
          setCreatingTreatmentPlan(false);
        }
      }

      await onTransition(selectedTransition.targetStatus, {
        justification: justification || undefined,
        reviewOutcome: reviewOutcome || undefined,
        treatmentPlanId,
      });
      setShowTransitionDialog(false);
      setSelectedTransition(null);
    } catch (error) {
      console.error("Transition failed:", error);

      // Rollback: If we created a new treatment plan but the transition failed, delete it
      if (treatmentPlanId && treatmentPlanOption === "new") {
        try {
          await deleteTreatmentPlan(treatmentPlanId);
          setCreatedTreatmentPlanId(null);
          setShowTreatmentSuccess(false);
        } catch (rollbackError) {
          console.error("Failed to rollback treatment plan:", rollbackError);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Workflow Status
            </CardTitle>
            <Badge className={cn("font-medium", currentConfig.bgColor, currentConfig.color)}>
              {currentConfig.icon}
              <span className="ml-1">{currentConfig.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Current Status Card */}
          <div className={cn(
            "p-4 rounded-lg border-2",
            currentConfig.bgColor,
            currentConfig.borderColor
          )}>
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-full", currentConfig.bgColor, currentConfig.color)}>
                {currentConfig.icon}
              </div>
              <div className="flex-1">
                <h3 className={cn("font-semibold", currentConfig.color)}>
                  {currentConfig.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Plan Created Success Message */}
          {showTreatmentSuccess && createdTreatmentPlanId && status === "TREATING" && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">Treatment Plan Created!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your treatment plan has been created. Add detailed actions, assign owners, and set deadlines.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={`/risks/${riskId}?tab=treatments`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Treatment Plans
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTreatmentSuccess(false)}
                      className="text-green-700 hover:text-green-800 hover:bg-green-100"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* What To Do Next - Always Visible */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800">What to do next</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {currentConfig.whatToDo}
                </p>
              </div>
            </div>
          </div>

          {/* Decision Guidance for EVALUATED status */}
          {decisionGuidance && (
            <div className={cn(
              "p-4 rounded-lg border",
              toleranceStatus === "WITHIN" ? "bg-green-50 border-green-200" :
              toleranceStatus === "EXCEEDS" ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            )}>
              <div className="flex items-start gap-3">
                <div className={decisionGuidance.color}>
                  {decisionGuidance.icon}
                </div>
                <div className="flex-1">
                  <h4 className={cn("font-medium", decisionGuidance.color)}>
                    {decisionGuidance.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {decisionGuidance.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Recommended: {decisionGuidance.recommendedAction}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tolerance Status Display - only show when NOT in ASSESSED (since ASSESSED means evaluation hasn't happened yet) */}
          {toleranceStatus && residualScore !== null && residualScore !== undefined && !decisionGuidance && status !== "ASSESSED" && (
            <div className={cn(
              "p-3 rounded-lg flex items-center justify-between",
              toleranceStatus === "WITHIN" ? "bg-green-50 border border-green-200" :
              toleranceStatus === "EXCEEDS" ? "bg-amber-50 border border-amber-200" :
              "bg-red-50 border border-red-200"
            )}>
              <div className="flex items-center gap-2">
                {toleranceStatus === "WITHIN" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : toleranceStatus === "EXCEEDS" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  toleranceStatus === "WITHIN" ? "text-green-700" :
                  toleranceStatus === "EXCEEDS" ? "text-amber-700" :
                  "text-red-700"
                )}>
                  {toleranceStatus === "WITHIN" ? "Within Tolerance" :
                   toleranceStatus === "EXCEEDS" ? "Exceeds Tolerance" :
                   "Critical - Exceeds Tolerance"}
                </span>
              </div>
              <div className="text-right text-sm">
                <span className="font-mono font-medium">{residualScore}</span>
                <span className="text-muted-foreground"> / {toleranceThreshold || 15}</span>
              </div>
            </div>
          )}

          {/* Approval Level Indicator */}
          {approvalLevel && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Requires {approvalLevel} Approval
                </span>
              </div>
            </div>
          )}

          {/* Available Actions */}
          {transitions.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Available Actions</Label>
              <div className="space-y-2">
                {transitions.map((transition) => (
                  <div
                    key={transition.code}
                    className={cn(
                      "p-3 rounded-lg border flex items-center justify-between gap-3",
                      transition.recommendation === "recommended"
                        ? "bg-primary/5 border-primary/30"
                        : transition.recommendation === "escalation"
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          transition.recommendation === "recommended" && "text-primary",
                          transition.recommendation === "escalation" && "text-red-700"
                        )}>
                          {transition.label}
                        </span>
                        {transition.recommendation === "recommended" && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transition.description}
                      </p>
                    </div>
                    <Button
                      variant={transition.buttonVariant}
                      size="sm"
                      onClick={() => handleTransitionClick(transition)}
                      disabled={isLoading}
                    >
                      {transition.icon}
                      <span className="ml-2">{transition.label}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show unavailable options for EVALUATED - disabled with explanation */}
          {status === "EVALUATED" && allTransitions.length > transitions.length && (
            <details className="group">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Other options ({allTransitions.length - transitions.length} unavailable)
              </summary>
              <div className="mt-2 space-y-2">
                {allTransitions
                  .filter(t => t.showWhen && !t.showWhen(toleranceStatus))
                  .map((transition) => (
                    <div
                      key={transition.code}
                      className="p-3 rounded-lg border bg-muted/50 border-muted flex items-center justify-between gap-3 opacity-60"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-sm text-muted-foreground">
                          {transition.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transition.code === "T03" && toleranceStatus === "WITHIN"
                            ? "Not available: Risk is within tolerance. Use Accept instead."
                            : transition.code === "T04" && toleranceStatus !== "WITHIN"
                            ? "Not available: Risk exceeds tolerance. Reduce or escalate instead."
                            : transition.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={true}
                        className="opacity-50 cursor-not-allowed"
                      >
                        {transition.icon}
                        <span className="ml-2">{transition.label}</span>
                      </Button>
                    </div>
                  ))}
              </div>
            </details>
          )}

          {/* ASSESSED waiting state with manual trigger */}
          {transitions.length === 0 && status === "ASSESSED" && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Awaiting System Evaluation</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The system will automatically evaluate your assessment against tolerance thresholds
                      and determine the approval level required.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => onTransition("EVALUATED" as ScenarioStatus, {})}
                disabled={isLoading}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Trigger Evaluation Now
              </Button>
            </div>
          )}

          {/* Generic waiting state */}
          {transitions.length === 0 && status !== "ARCHIVED" && status !== "ASSESSED" && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-4 h-4" />
                <span className="text-sm">No actions available at this time.</span>
              </div>
            </div>
          )}

          {/* Workflow Phase Indicator */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Phase: {currentConfig.phase.charAt(0).toUpperCase() + currentConfig.phase.slice(1)}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    <HelpCircle className="w-3 h-3" />
                    <span>View workflow</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    <strong>Assessment:</strong> Draft → Assessed → Evaluated<br />
                    <strong>Decision:</strong> Evaluated → Accept/Treat/Escalate<br />
                    <strong>Treatment:</strong> Treating → Treated → Re-assess<br />
                    <strong>Acceptance:</strong> Accepted → Monitoring → Review
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>

        {/* Transition Confirmation Dialog */}
        <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTransition?.icon}
                {selectedTransition?.label}
              </DialogTitle>
              <DialogDescription>
                {selectedTransition?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Transition Flow Visual */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge className={cn(currentConfig.bgColor, currentConfig.color)}>
                  {currentConfig.icon}
                  <span className="ml-1">{currentConfig.label}</span>
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {selectedTransition && (
                  <Badge className={cn(
                    STATUS_CONFIG[selectedTransition.targetStatus].bgColor,
                    STATUS_CONFIG[selectedTransition.targetStatus].color
                  )}>
                    {STATUS_CONFIG[selectedTransition.targetStatus].icon}
                    <span className="ml-1">{STATUS_CONFIG[selectedTransition.targetStatus].label}</span>
                  </Badge>
                )}
              </div>

              {/* Review Outcome Selection */}
              {selectedTransition?.requiresReviewOutcome && (
                <div className="space-y-2">
                  <Label>Review Outcome <span className="text-destructive">*</span></Label>
                  <Select value={reviewOutcome} onValueChange={setReviewOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the review outcome..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_CHANGE">No Change Required</SelectItem>
                      <SelectItem value="SCORE_INCREASED">Score Increased</SelectItem>
                      <SelectItem value="SCORE_DECREASED">Score Decreased</SelectItem>
                      <SelectItem value="TREATMENT_REQUIRED">Treatment Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Treatment Plan Selection/Creation */}
              {selectedTransition?.requiresTreatmentPlan && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Treatment Plan <span className="text-destructive">*</span></Label>

                  {loadingTreatmentPlans ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading treatment plans...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <RadioGroup
                        value={treatmentPlanOption}
                        onValueChange={(v) => setTreatmentPlanOption(v as "existing" | "new")}
                      >
                        {treatmentPlans.length > 0 && (
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="existing" id="existing" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="existing" className="font-medium cursor-pointer">
                                Use existing treatment plan
                              </Label>
                              {treatmentPlanOption === "existing" && (
                                <div className="mt-2">
                                  <Select
                                    value={selectedTreatmentPlanId}
                                    onValueChange={setSelectedTreatmentPlanId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a treatment plan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {treatmentPlans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span>{plan.title || plan.treatmentId}</span>
                                            <Badge variant="outline" className="text-xs ml-2">
                                              {plan.treatmentType}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="new" id="new" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="new" className="font-medium cursor-pointer">
                              Create new treatment plan
                            </Label>
                            {treatmentPlanOption === "new" && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                {/* Show auto-populated summary with calculated defaults */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Title:</span>
                                    <span className="font-medium truncate max-w-[200px]">{newTreatmentTitle || `Treatment for ${scenarioTitle || "Scenario"}`}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      MITIGATE
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Priority:</span>
                                    <Badge variant={toleranceStatus === "CRITICAL" ? "destructive" : toleranceStatus === "EXCEEDS" ? "default" : "secondary"} className="text-xs">
                                      {toleranceStatus === "CRITICAL" ? "Critical" : toleranceStatus === "EXCEEDS" ? "High" : "Medium"}
                                    </Badge>
                                  </div>
                                  <div className="pt-2 border-t mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Target Score:</span>
                                      <span className="font-medium">{Math.max(1, (toleranceThreshold ?? 15) - 2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Target Date:</span>
                                      <span className="font-medium">
                                        {new Date(Date.now() + (toleranceStatus === "CRITICAL" ? 30 : toleranceStatus === "EXCEEDS" ? 60 : 90) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Expected Reduction:</span>
                                      <span className="font-medium text-green-600">
                                        {residualScore ?? 0} → {Math.max(1, (toleranceThreshold ?? 15) - 2)} ({(residualScore ?? 0) - Math.max(1, (toleranceThreshold ?? 15) - 2)} pts)
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                                    These defaults are calculated automatically. You can adjust them in the Treatment Plans section after creation.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )}

              {/* Justification */}
              {selectedTransition?.requiresJustification && (
                <div className="space-y-2">
                  <Label>
                    Justification <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Explain the reason for this action..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {justification.length}/10 characters minimum
                  </p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {transitionError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Unable to proceed</h4>
                    <p className="text-sm text-red-700 mt-1">{transitionError}</p>
                    {transitionError.includes("tolerance") && (
                      <p className="text-xs text-red-600 mt-2">
                        <strong>Tip:</strong> Risk tolerance is defined in the Risk Tolerance Statement (RTS) linked to this risk.
                        You can view and manage RTS at <a href="/risks/rts" className="underline hover:text-red-800">/risks/rts</a>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTransitionDialog(false)}
                disabled={submitting || creatingTreatmentPlan}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmTransition}
                disabled={
                  submitting ||
                  creatingTreatmentPlan ||
                  loadingTreatmentPlans ||
                  (selectedTransition?.requiresJustification && justification.trim().length < 10) ||
                  (selectedTransition?.requiresReviewOutcome && !reviewOutcome) ||
                  (selectedTransition?.requiresTreatmentPlan && treatmentPlanOption === "existing" && !selectedTreatmentPlanId)
                  // Removed: newTreatmentTitle validation - title is auto-populated
                }
              >
                {creatingTreatmentPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating plan...
                  </>
                ) : submitting ? (
                  "Processing..."
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}
