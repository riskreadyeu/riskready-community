import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  type ImpactCategory,
  type ImpactLevel,
  type EffectiveThreshold,
  type CategoryWeight,
  type ScenarioImpactAssessment,
  getEffectiveThresholds,
  saveScenarioImpactAssessments,
} from "@/lib/risks-api";
import {
  IMPACT_CATEGORY_LABELS,
  IMPACT_CATEGORIES,
  IMPACT_LEVELS,
  IMPACT_LABELS,
  IMPACT_VALUES,
  getCategoryColor,
  getCategoryBgColor,
  calculateWeightedImpact,
  getRiskScoreColor,
  getRiskScoreBgColor,
  getRiskLevelLabel,
} from "@/lib/risk-scoring";
import { cn } from "@/lib/utils";
import {
  Scale,
  AlertTriangle,
  Shield,
  CheckCircle,
  Info,
  Save,
  X,
  DollarSign,
  Gavel,
  Star,
  Activity,
  Target,
} from "lucide-react";

interface ImpactAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: string;
  organisationId: string;
  isResidual?: boolean;
  existingAssessments?: ScenarioImpactAssessment[];
  onSaved?: (weightedImpact: number) => void;
}

interface CategoryAssessmentState {
  level: ImpactLevel | null;
  value: number;
  rationale: string;
}

const CATEGORY_ICONS: Record<ImpactCategory, React.ReactNode> = {
  FINANCIAL: <DollarSign className="w-4 h-4" />,
  OPERATIONAL: <Activity className="w-4 h-4" />,
  LEGAL_REGULATORY: <Gavel className="w-4 h-4" />,
  REPUTATIONAL: <Star className="w-4 h-4" />,
  STRATEGIC: <Target className="w-4 h-4" />,
};

export function ImpactAssessmentDialog({
  open,
  onOpenChange,
  scenarioId,
  organisationId,
  isResidual = false,
  existingAssessments,
  onSaved,
}: ImpactAssessmentDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ImpactCategory>("FINANCIAL");
  const [thresholds, setThresholds] = useState<EffectiveThreshold[]>([]);
  const [weights, setWeights] = useState<CategoryWeight[]>([]);
  
  const [assessments, setAssessments] = useState<
    Record<ImpactCategory, CategoryAssessmentState>
  >({
    FINANCIAL: { level: null, value: 0, rationale: "" },
    OPERATIONAL: { level: null, value: 0, rationale: "" },
    LEGAL_REGULATORY: { level: null, value: 0, rationale: "" },
    REPUTATIONAL: { level: null, value: 0, rationale: "" },
    STRATEGIC: { level: null, value: 0, rationale: "" },
  });

  // Load effective thresholds and initialize assessments
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, organisationId]);

  // Initialize from existing assessments
  useEffect(() => {
    if (existingAssessments && existingAssessments.length > 0) {
      const newState: Record<ImpactCategory, CategoryAssessmentState> = {
        FINANCIAL: { level: null, value: 0, rationale: "" },
        OPERATIONAL: { level: null, value: 0, rationale: "" },
        LEGAL_REGULATORY: { level: null, value: 0, rationale: "" },
        REPUTATIONAL: { level: null, value: 0, rationale: "" },
        STRATEGIC: { level: null, value: 0, rationale: "" },
      };

      for (const assessment of existingAssessments) {
        newState[assessment.category] = {
          level: assessment.level,
          value: assessment.value,
          rationale: assessment.rationale || "",
        };
      }

      setAssessments(newState);
    }
  }, [existingAssessments]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getEffectiveThresholds(organisationId);
      setThresholds(data.thresholds);
      setWeights(data.weights);
    } catch (err) {
      console.error("Error loading thresholds:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get thresholds for a specific category
  const getCategoryThresholds = (category: ImpactCategory) => {
    return thresholds.filter((t) => t.category === category);
  };

  // Get weight for a category
  const getWeight = (category: ImpactCategory): number => {
    const weight = weights.find((w) => w.category === category);
    return weight?.weight ?? 20;
  };

  // Calculate current weighted impact
  const currentWeightedImpact = calculateWeightedImpact(
    Object.entries(assessments)
      .filter(([_, state]) => state.value > 0)
      .map(([category, state]) => ({
        category: category as ImpactCategory,
        value: state.value,
      })),
    weights.map((w) => ({ category: w.category, weight: w.weight }))
  );

  // Select a threshold level for a category
  const selectLevel = (category: ImpactCategory, level: ImpactLevel) => {
    setAssessments((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        level,
        value: IMPACT_VALUES[level],
      },
    }));
  };

  // Update rationale
  const updateRationale = (category: ImpactCategory, rationale: string) => {
    setAssessments((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        rationale,
      },
    }));
  };

  // Check if assessment is complete (all categories have a value)
  const isComplete = Object.values(assessments).every((a) => a.value > 0);

  // Get completion status
  const completedCount = Object.values(assessments).filter(
    (a) => a.value > 0
  ).length;

  // Save assessments
  const handleSave = async () => {
    try {
      setSaving(true);

      const assessmentData = Object.entries(assessments)
        .filter(([_, state]) => state.value > 0)
        .map(([category, state]) => ({
          category: category as ImpactCategory,
          level: state.level!,
          value: state.value,
          rationale: state.rationale || undefined,
        }));

      const result = await saveScenarioImpactAssessments(
        scenarioId,
        assessmentData,
        isResidual,
        organisationId
      );

      toast.success("Impact assessment saved", {
        description: `Weighted impact: ${result.weightedImpact.toFixed(1)}`
      });
      onSaved?.(result.weightedImpact);
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving assessments:", err);
      toast.error("Failed to save assessments", {
        description: err instanceof Error ? err.message : "Please try again"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            {isResidual ? "Residual" : "Inherent"} Impact Assessment
          </DialogTitle>
          <DialogDescription>
            Assess the impact across all five categories. The weighted impact
            will be calculated based on your selections.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Progress: {completedCount} of {IMPACT_CATEGORIES.length}{" "}
                  categories assessed
                </span>
              </div>
              {isComplete && (
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </div>

            {/* Category tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as ImpactCategory)}
            >
              <TabsList className="grid grid-cols-5 w-full">
                {IMPACT_CATEGORIES.map((category) => {
                  const hasValue = assessments[category].value > 0;
                  return (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className={cn(
                        "relative",
                        hasValue && "border-b-2 border-success"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {CATEGORY_ICONS[category]}
                        <span className="hidden sm:inline">
                          {IMPACT_CATEGORY_LABELS[category].split("/")[0]}
                        </span>
                        {hasValue && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-[10px] h-4 px-1"
                          >
                            {assessments[category].value}
                          </Badge>
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {IMPACT_CATEGORIES.map((category) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="space-y-4">
                    {/* Category header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            getCategoryBgColor(category)
                          )}
                        >
                          {CATEGORY_ICONS[category]}
                        </div>
                        <div>
                          <h4 className={cn("font-semibold", getCategoryColor(category))}>
                            {IMPACT_CATEGORY_LABELS[category]}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Weight: {getWeight(category)}%
                          </p>
                        </div>
                      </div>
                      {assessments[category].level && (
                        <Badge
                          className={cn(
                            "text-sm",
                            getRiskScoreBgColor(assessments[category].value)
                          )}
                        >
                          {IMPACT_LABELS[assessments[category].level!]} (
                          {assessments[category].value})
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Threshold selection */}
                    <div className="grid gap-3">
                      {getCategoryThresholds(category).map((threshold) => {
                        const isSelected =
                          assessments[category].level === threshold.level;
                        return (
                          <button
                            key={threshold.level}
                            type="button"
                            onClick={() => selectLevel(category, threshold.level)}
                            className={cn(
                              "w-full p-4 rounded-lg border text-left transition-all",
                              "hover:bg-secondary/50",
                              isSelected
                                ? "ring-2 ring-primary border-primary bg-primary/5"
                                : "border-border",
                              threshold.isRegulatoryMinimum &&
                                "border-destructive/50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-medium",
                                      getRiskScoreBgColor(threshold.value)
                                    )}
                                  >
                                    {threshold.value}
                                  </Badge>
                                  <span className="font-medium">
                                    {IMPACT_LABELS[threshold.level]}
                                  </span>
                                  {threshold.isRegulatoryMinimum && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                                    >
                                      <Shield className="w-3 h-3 mr-1" />
                                      Regulatory Min
                                    </Badge>
                                  )}
                                  {threshold.isOverridden && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30"
                                    >
                                      Customized
                                    </Badge>
                                  )}
                                </div>

                                {/* Amount/Duration */}
                                {(threshold.minAmount ||
                                  threshold.maxAmount ||
                                  threshold.duration) && (
                                  <div className="text-sm font-medium text-muted-foreground">
                                    {threshold.duration ||
                                      (threshold.minAmount && threshold.maxAmount
                                        ? `$${threshold.minAmount.toLocaleString()} - $${threshold.maxAmount.toLocaleString()}`
                                        : threshold.maxAmount
                                          ? `< $${threshold.maxAmount.toLocaleString()}`
                                          : threshold.minAmount
                                            ? `> $${threshold.minAmount.toLocaleString()}`
                                            : "")}
                                  </div>
                                )}

                                <p className="text-sm text-muted-foreground">
                                  {threshold.description}
                                </p>

                                {threshold.regulatorySource && (
                                  <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{threshold.regulatorySource}</span>
                                  </div>
                                )}
                              </div>

                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Rationale */}
                    <div className="space-y-2">
                      <Label htmlFor={`rationale-${category}`}>
                        Rationale (Optional)
                      </Label>
                      <Textarea
                        id={`rationale-${category}`}
                        placeholder="Explain why you selected this impact level..."
                        value={assessments[category].rationale}
                        onChange={(e) =>
                          updateRationale(category, e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Weighted impact preview */}
            <div className="p-4 rounded-lg border bg-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Calculated Weighted Impact</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on category weights and your selections
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-4xl font-bold",
                      getRiskScoreColor(currentWeightedImpact)
                    )}
                  >
                    {currentWeightedImpact || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getRiskLevelLabel(currentWeightedImpact)}
                  </div>
                </div>
              </div>

              {/* Formula display */}
              {completedCount > 0 && (
                <div className="mt-3 p-2 rounded bg-background/50 text-xs font-mono">
                  (
                  {Object.entries(assessments)
                    .filter(([_, state]) => state.value > 0)
                    .map(([category, state], idx, arr) => (
                      <span key={category}>
                        {state.value} × {getWeight(category as ImpactCategory)}%
                        {idx < arr.length - 1 ? " + " : ""}
                      </span>
                    ))}
                  ) / {Object.entries(assessments)
                    .filter(([_, state]) => state.value > 0)
                    .reduce(
                      (sum, [category]) =>
                        sum + getWeight(category as ImpactCategory),
                      0
                    )}
                  % = {currentWeightedImpact}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || completedCount === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
