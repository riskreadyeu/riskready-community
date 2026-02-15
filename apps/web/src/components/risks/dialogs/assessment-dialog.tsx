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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateRiskScenario,
  type RiskScenario,
  type LikelihoodLevel,
  type ImpactLevel,
} from "@/lib/risks-api";
import { Sliders, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentDialogProps {
  scenario: RiskScenario | null;
  mode: "inherent" | "residual";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const likelihoodOptions: { value: LikelihoodLevel; label: string; score: number }[] = [
  { value: "RARE", label: "Rare", score: 1 },
  { value: "UNLIKELY", label: "Unlikely", score: 2 },
  { value: "POSSIBLE", label: "Possible", score: 3 },
  { value: "LIKELY", label: "Likely", score: 4 },
  { value: "ALMOST_CERTAIN", label: "Almost Certain", score: 5 },
];

const impactOptions: { value: ImpactLevel; label: string; score: number }[] = [
  { value: "NEGLIGIBLE", label: "Negligible", score: 1 },
  { value: "MINOR", label: "Minor", score: 2 },
  { value: "MODERATE", label: "Moderate", score: 3 },
  { value: "MAJOR", label: "Major", score: 4 },
  { value: "SEVERE", label: "Severe", score: 5 },
];

function getScoreColor(score: number): string {
  if (score >= 20) return "bg-red-500";
  if (score >= 15) return "bg-orange-500";
  if (score >= 8) return "bg-amber-500";
  return "bg-green-500";
}

function getScoreLabel(score: number): string {
  if (score >= 20) return "Critical";
  if (score >= 15) return "High";
  if (score >= 8) return "Medium";
  if (score >= 4) return "Low";
  return "Very Low";
}

export function AssessmentDialog({
  scenario,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: AssessmentDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likelihood, setLikelihood] = useState<LikelihoodLevel | "">("");
  const [impact, setImpact] = useState<ImpactLevel | "">("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");

  const isResidual = mode === "residual";
  const title = isResidual ? "Residual Assessment" : "Inherent Assessment";

  useEffect(() => {
    if (scenario) {
      if (isResidual) {
        setLikelihood(scenario.residualLikelihood || "");
        setImpact(scenario.residualImpact || "");
        setOverrideEnabled(scenario.residualOverridden || false);
        setOverrideJustification(scenario.residualOverrideJustification || "");
      } else {
        setLikelihood(scenario.likelihood || "");
        setImpact(scenario.impact || "");
        setOverrideEnabled(false);
        setOverrideJustification("");
      }
    }
  }, [scenario, isResidual]);

  const likelihoodScore = likelihoodOptions.find(l => l.value === likelihood)?.score || 0;
  const impactScore = impactOptions.find(i => i.value === impact)?.score || 0;
  const calculatedScore = likelihoodScore * impactScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scenario) return;

    if (!likelihood || !impact) {
      setError("Both Likelihood and Impact are required");
      return;
    }

    if (isResidual && overrideEnabled && !overrideJustification.trim()) {
      setError("Override justification is required when overriding calculated residual");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = isResidual
        ? {
            residualLikelihood: likelihood as LikelihoodLevel,
            residualImpact: impact as ImpactLevel,
            residualOverrideJustification: overrideEnabled ? overrideJustification : undefined,
          }
        : {
            likelihood: likelihood as LikelihoodLevel,
            impact: impact as ImpactLevel,
          };

      await updateRiskScenario(scenario.id, payload);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving assessment:", err);
      setError(err.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!scenario) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isResidual
              ? "Assess the scenario's risk level after controls are applied."
              : "Assess the scenario's inherent risk level before controls."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood *</Label>
                <Select
                  value={likelihood}
                  onValueChange={(v) => setLikelihood(v as LikelihoodLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select likelihood..." />
                  </SelectTrigger>
                  <SelectContent>
                    {likelihoodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center font-mono text-xs text-muted-foreground">
                            {opt.score}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact *</Label>
                <Select
                  value={impact}
                  onValueChange={(v) => setImpact(v as ImpactLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {impactOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center font-mono text-xs text-muted-foreground">
                            {opt.score}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Score Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Calculated Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-bold">
                      {likelihood && impact ? calculatedScore : "-"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({likelihoodScore} x {impactScore})
                    </span>
                  </div>
                </div>
                {calculatedScore > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full", getScoreColor(calculatedScore))} />
                    <Badge variant="outline">{getScoreLabel(calculatedScore)}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Override option for residual */}
            {isResidual && (
              <div className="space-y-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="override" className="text-sm font-medium">
                      Override Calculated Residual
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable to override the system-calculated residual from control effectiveness
                    </p>
                  </div>
                  <Switch
                    id="override"
                    checked={overrideEnabled}
                    onCheckedChange={setOverrideEnabled}
                  />
                </div>

                {overrideEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="justification">Override Justification *</Label>
                    <Textarea
                      id="justification"
                      value={overrideJustification}
                      onChange={(e) => setOverrideJustification(e.target.value)}
                      placeholder="Explain why you're overriding the calculated residual..."
                      rows={3}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Current values reference */}
            {!isResidual && scenario.likelihood && scenario.impact && (
              <div className="text-xs text-muted-foreground">
                Current: {scenario.likelihood} x {scenario.impact} = {scenario.inherentScore || "-"}
              </div>
            )}

            {isResidual && scenario.calculatedResidualScore && (
              <div className="text-xs text-muted-foreground">
                System calculated residual: {scenario.calculatedResidualScore}
                {scenario.residualOverridden && " (currently overridden)"}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Assessment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
