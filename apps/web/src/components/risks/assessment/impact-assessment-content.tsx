// =============================================================================
// ImpactAssessmentContent - Headless Impact Assessment
// =============================================================================
// A headless version of ImpactSummaryCard that renders only the category list
// and weighted total without header/wrapper. Parent controls sheet state and
// provides action button via render props.
// =============================================================================

import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Scale,
  Check,
  DollarSign,
  Gavel,
  Star,
  Activity,
  AlertTriangle,
  Shield,
  CheckCircle,
  Info,
  Save,
  X,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  IMPACT_LABELS,
  IMPACT_VALUES,
  getCategoryColor,
  getCategoryBgColor,
  calculateWeightedImpact,
  getRiskScoreColor,
  getRiskScoreBgColor,
  getRiskLevelLabel,
} from "@/lib/risk-scoring";

// =============================================================================
// Types
// =============================================================================

export interface ImpactActionState {
  isComplete: boolean;
  assessedCount: number;
  totalCount: number;
  onOpenSheet: () => void;
  disabled: boolean;
}

export interface ImpactAssessmentContentProps {
  scenarioId: string;
  organisationId?: string;
  isResidual?: boolean;
  existingAssessments?: ScenarioImpactAssessment[];
  weightedImpact?: number | null;
  onSaved?: (weightedImpact: number) => void;
  disabled?: boolean;
  className?: string;

  /** Controlled sheet state - parent controls when sheet opens */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;

  /** Render prop for action button (e.g., "Assess" / "Edit" button) */
  renderAction?: (state: ImpactActionState) => ReactNode;

  /** Render prop for completion badge */
  renderBadge?: (state: { isComplete: boolean; assessedCount: number; totalCount: number }) => ReactNode;
}

interface CategoryAssessmentState {
  level: ImpactLevel | null;
  value: number;
  rationale: string;
}

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_ICONS: Record<ImpactCategory, React.ReactNode> = {
  FINANCIAL: <DollarSign className="w-4 h-4" />,
  OPERATIONAL: <Activity className="w-4 h-4" />,
  LEGAL_REGULATORY: <Gavel className="w-4 h-4" />,
  REPUTATIONAL: <Star className="w-4 h-4" />,
  STRATEGIC: <Target className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<ImpactCategory, string> = {
  FINANCIAL: "text-emerald-600",
  OPERATIONAL: "text-blue-600",
  LEGAL_REGULATORY: "text-purple-600",
  REPUTATIONAL: "text-amber-600",
  STRATEGIC: "text-indigo-600",
};

const CATEGORY_SHORT_LABELS: Record<ImpactCategory, string> = {
  FINANCIAL: "Financial",
  OPERATIONAL: "Operational",
  LEGAL_REGULATORY: "Legal/Reg",
  REPUTATIONAL: "Reputation",
  STRATEGIC: "Strategic",
};

function getImpactColor(score: number | null | undefined): string {
  if (!score) return "text-muted-foreground";
  if (score >= 4.5) return "text-red-600";
  if (score >= 3.5) return "text-orange-600";
  if (score >= 2.5) return "text-amber-600";
  if (score >= 1.5) return "text-blue-600";
  return "text-green-600";
}

function getImpactLabel(score: number | null | undefined): string {
  if (!score) return "Not Set";
  if (score >= 4.5) return "Severe";
  if (score >= 3.5) return "Major";
  if (score >= 2.5) return "Moderate";
  if (score >= 1.5) return "Minor";
  return "Negligible";
}

// =============================================================================
// Component
// =============================================================================

export function ImpactAssessmentContent({
  scenarioId,
  organisationId,
  isResidual = false,
  existingAssessments = [],
  weightedImpact,
  onSaved,
  disabled = false,
  className,
  sheetOpen: controlledSheetOpen,
  onSheetOpenChange,
  renderAction,
  renderBadge,
}: ImpactAssessmentContentProps) {
  // Use internal state if not controlled
  const [internalSheetOpen, setInternalSheetOpen] = useState(false);
  const sheetOpen = controlledSheetOpen ?? internalSheetOpen;
  const setSheetOpen = onSheetOpenChange ?? setInternalSheetOpen;

  const [loading, setLoading] = useState(false);
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

  // Count assessed categories
  const assessedCount = existingAssessments.length;
  const allAssessed = assessedCount === IMPACT_CATEGORIES.length;

  // Build assessment map for preview
  const assessmentMap = new Map(
    existingAssessments.map((a) => [a.category, a.value])
  );

  // =============================================================================
  // Effects
  // =============================================================================

  // Load thresholds when sheet opens
  useEffect(() => {
    if (sheetOpen && organisationId) {
      loadData();
    }
  }, [sheetOpen, organisationId]);

  // Initialize from existing assessments when sheet opens
  useEffect(() => {
    if (sheetOpen && existingAssessments && existingAssessments.length > 0) {
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
  }, [sheetOpen, existingAssessments]);

  // Call render props when state changes
  useEffect(() => {
    renderAction?.({
      isComplete: allAssessed,
      assessedCount,
      totalCount: IMPACT_CATEGORIES.length,
      onOpenSheet: () => setSheetOpen(true),
      disabled: disabled || !organisationId,
    });
  }, [allAssessed, assessedCount, disabled, organisationId, renderAction, setSheetOpen]);

  useEffect(() => {
    renderBadge?.({
      isComplete: allAssessed,
      assessedCount,
      totalCount: IMPACT_CATEGORIES.length,
    });
  }, [allAssessed, assessedCount, renderBadge]);

  // =============================================================================
  // Data Loading
  // =============================================================================

  const loadData = async () => {
    if (!organisationId) return;
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

  // =============================================================================
  // Helpers
  // =============================================================================

  const getCategoryThresholds = (category: ImpactCategory) => {
    return thresholds.filter((t) => t.category === category);
  };

  const getWeight = (category: ImpactCategory): number => {
    const weight = weights.find((w) => w.category === category);
    return weight?.weight ?? 20;
  };

  const currentWeightedImpact = calculateWeightedImpact(
    Object.entries(assessments)
      .filter(([_, state]) => state.value > 0)
      .map(([category, state]) => ({
        category: category as ImpactCategory,
        value: state.value,
      })),
    weights.map((w) => ({ category: w.category, weight: w.weight }))
  );

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

  const updateRationale = (category: ImpactCategory, rationale: string) => {
    setAssessments((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        rationale,
      },
    }));
  };

  const isComplete = Object.values(assessments).every((a) => a.value > 0);

  const sheetCompletedCount = Object.values(assessments).filter(
    (a) => a.value > 0
  ).length;

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleSave = async () => {
    if (!organisationId) return;
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
        description: `Weighted impact: ${result.weightedImpact.toFixed(1)}`,
      });
      onSaved?.(result.weightedImpact);
      setSheetOpen(false);
    } catch (err) {
      console.error("Error saving assessments:", err);
      toast.error("Failed to save assessments", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Category Scores - Explicit listing */}
        <div className="space-y-1">
          {IMPACT_CATEGORIES.map((cat) => {
            const value = assessmentMap.get(cat);
            const isAssessed = value != null;
            return (
              <div key={cat} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-4 h-4 flex items-center justify-center",
                    isAssessed ? CATEGORY_COLORS[cat] : "text-muted-foreground"
                  )}>
                    {CATEGORY_ICONS[cat]}
                  </span>
                  <span className="text-muted-foreground">{CATEGORY_SHORT_LABELS[cat]}</span>
                </div>
                <span className={cn(
                  "font-medium tabular-nums",
                  isAssessed ? getImpactColor(value) : "text-muted-foreground"
                )}>
                  {value ?? "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Weighted Total */}
        <div className="pt-2 border-t border-purple-200/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Weighted</span>
          <div className="flex items-center gap-2">
            <span className={cn("font-bold tabular-nums", getImpactColor(weightedImpact))}>
              {weightedImpact != null ? weightedImpact.toFixed(1) : "—"}
            </span>
            {weightedImpact != null && (
              <span className={cn("text-xs", getImpactColor(weightedImpact))}>
                {getImpactLabel(weightedImpact)}
              </span>
            )}
          </div>
        </div>

        {/* Internal Action Button (shown when renderAction is not provided) */}
        {!renderAction && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetOpen(true)}
              disabled={disabled || !organisationId}
              className="w-full gap-1"
            >
              <Scale className="w-4 h-4" />
              {allAssessed ? "Edit Assessment" : "Assess Impact"}
            </Button>
          </div>
        )}
      </div>

      {/* Impact Assessment Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[700px] sm:max-w-[700px] overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              {isResidual ? "Residual" : "Inherent"} Impact Assessment
            </SheetTitle>
            <SheetDescription>
              Assess the impact across all five BIRT categories. The weighted impact
              will be calculated based on your selections and category weights.
            </SheetDescription>
          </SheetHeader>

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
                    Progress: {sheetCompletedCount} of {IMPACT_CATEGORIES.length}{" "}
                    categories assessed
                  </span>
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1 text-green-600">
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
                          hasValue && "border-b-2 border-green-500"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {CATEGORY_ICONS[category]}
                          <span className="hidden sm:inline text-xs">
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
                            <h4
                              className={cn(
                                "font-semibold",
                                getCategoryColor(category)
                              )}
                            >
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
                              onClick={() =>
                                selectLevel(category, threshold.level)
                              }
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
                                        (threshold.minAmount &&
                                        threshold.maxAmount
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
                                      <span>
                                        {threshold.regulatorySource}
                                      </span>
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
                {sheetCompletedCount > 0 && (
                  <div className="mt-3 p-2 rounded bg-background/50 text-xs font-mono">
                    (
                    {Object.entries(assessments)
                      .filter(([_, state]) => state.value > 0)
                      .map(([category, state], idx, arr) => (
                        <span key={category}>
                          {state.value} x{" "}
                          {getWeight(category as ImpactCategory)}%
                          {idx < arr.length - 1 ? " + " : ""}
                        </span>
                      ))}
                    ) /{" "}
                    {Object.entries(assessments)
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

              {/* Footer actions */}
              <SheetFooter className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || sheetCompletedCount === 0}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Assessment"}
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ImpactAssessmentContent;
