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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRiskScenario, updateRiskScenario, type RiskScenario, type ControlFramework, type LikelihoodLevel, type ImpactLevel } from "@/lib/risks-api";
import { Target, Loader2 } from "lucide-react";
import { useZodForm, z } from "@/lib/form-utils";
import { FieldErrorMessage } from "@/components/common/form-field";

const scenarioSchema = z.object({
  scenarioId: z.string().min(1, "Scenario ID is required"),
  title: z.string().min(1, "Title is required"),
  cause: z.string().optional().default(""),
  event: z.string().optional().default(""),
  consequence: z.string().optional().default(""),
  framework: z.enum(["ISO", "SOC2", "NIS2", "DORA"]).default("ISO"),
  likelihood: z.string().optional().default(""),
  impact: z.string().optional().default(""),
  controlIds: z.string().optional().default(""),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

interface RiskScenarioDialogProps {
  scenario?: RiskScenario | null;
  riskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RiskScenarioDialog({
  scenario,
  riskId,
  open,
  onOpenChange,
  onSuccess
}: RiskScenarioDialogProps) {
  const isEditing = !!scenario;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm(scenarioSchema, {
    scenarioId: "",
    title: "",
    cause: "",
    event: "",
    consequence: "",
    framework: "ISO",
    likelihood: "",
    impact: "",
    controlIds: "",
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  useEffect(() => {
    if (scenario) {
      reset({
        scenarioId: scenario.scenarioId || "",
        title: scenario.title || "",
        cause: scenario.cause || "",
        event: scenario.event || "",
        consequence: scenario.consequence || "",
        framework: scenario.framework || "ISO",
        likelihood: scenario.likelihood || "",
        impact: scenario.impact || "",
        controlIds: scenario.controlIds || "",
      });
    } else {
      reset({
        scenarioId: "",
        title: "",
        cause: "",
        event: "",
        consequence: "",
        framework: "ISO",
        likelihood: "",
        impact: "",
        controlIds: "",
      });
    }
  }, [scenario, reset]);

  const onSubmit = handleSubmit(async (data: ScenarioFormValues) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...data,
        likelihood: data.likelihood ? data.likelihood as LikelihoodLevel : undefined,
        impact: data.impact ? data.impact as ImpactLevel : undefined,
        riskId: riskId || scenario?.riskId,
      };

      if (isEditing && scenario) {
        await updateRiskScenario(scenario.id, payload);
      } else {
        await createRiskScenario(payload);
      }

      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) reset();
    } catch (err: unknown) {
      console.error("Error saving scenario:", err);
      setError(err instanceof Error ? err.message : "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  });

  const handleClose = () => {
    if (!isEditing) reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {isEditing ? `Edit Scenario - ${scenario.scenarioId}` : "Create New Risk Scenario"}
          </DialogTitle>
          <DialogDescription>
            Define the cause-event-consequence chain, likelihood, and impact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioId">Scenario ID *</Label>
                <Input
                  id="scenarioId"
                  {...register("scenarioId")}
                  placeholder="e.g., SCN-001"
                  disabled={isEditing}
                />
                <FieldErrorMessage error={errors.scenarioId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Select
                  value={watch("framework")}
                  onValueChange={(v) => setValue("framework", v as ControlFramework, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO">ISO 27001</SelectItem>
                    <SelectItem value="SOC2">SOC 2</SelectItem>
                    <SelectItem value="NIS2">NIS2</SelectItem>
                    <SelectItem value="DORA">DORA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Brief scenario title"
              />
              <FieldErrorMessage error={errors.title} />
            </div>

            {/* Cause-Event-Consequence */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Risk Flow (Cause → Event → Consequence)</h4>

              <div className="space-y-2">
                <Label htmlFor="cause" className="text-blue-600">Cause</Label>
                <Textarea
                  id="cause"
                  {...register("cause")}
                  placeholder="What triggers or enables this risk scenario?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event" className="text-amber-600">Event</Label>
                <Textarea
                  id="event"
                  {...register("event")}
                  placeholder="What happens when this risk materializes?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consequence" className="text-red-600">Consequence</Label>
                <Textarea
                  id="consequence"
                  {...register("consequence")}
                  placeholder="What is the impact on the organization?"
                  rows={2}
                />
              </div>
            </div>

            {/* Assessment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood</Label>
                <Select
                  value={watch("likelihood")}
                  onValueChange={(v) => setValue("likelihood", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RARE">Rare (1)</SelectItem>
                    <SelectItem value="UNLIKELY">Unlikely (2)</SelectItem>
                    <SelectItem value="POSSIBLE">Possible (3)</SelectItem>
                    <SelectItem value="LIKELY">Likely (4)</SelectItem>
                    <SelectItem value="ALMOST_CERTAIN">Almost Certain (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select
                  value={watch("impact")}
                  onValueChange={(v) => setValue("impact", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEGLIGIBLE">Negligible (1)</SelectItem>
                    <SelectItem value="MINOR">Minor (2)</SelectItem>
                    <SelectItem value="MODERATE">Moderate (3)</SelectItem>
                    <SelectItem value="MAJOR">Major (4)</SelectItem>
                    <SelectItem value="SEVERE">Severe (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Related Controls */}
            <div className="space-y-2">
              <Label htmlFor="controlIds">Related Control IDs</Label>
              <Input
                id="controlIds"
                {...register("controlIds")}
                placeholder="e.g., A.5.1, A.5.2, A.6.1 (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of control IDs that mitigate this scenario</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create Scenario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
