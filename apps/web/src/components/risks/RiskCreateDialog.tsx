import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { createRisk, type RiskTier, type RiskStatus, type ControlFramework } from "@/lib/risks-api";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useZodForm, z } from "@/lib/form-utils";
import { FieldErrorMessage } from "@/components/common/form-field";

const riskCreateSchema = z.object({
  riskId: z.string().min(1, "Risk ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  tier: z.enum(["CORE", "EXTENDED", "ADVANCED"]).default("CORE"),
  status: z.enum(["IDENTIFIED", "ASSESSED", "TREATING", "ACCEPTED", "CLOSED"]).default("IDENTIFIED"),
  framework: z.enum(["ISO", "SOC2", "NIS2", "DORA"]).default("ISO"),
  riskOwner: z.string().optional().default(""),
  likelihood: z.string().optional().default(""),
  impact: z.string().optional().default(""),
  applicable: z.boolean().default(true),
  justificationIfNa: z.string().optional().default(""),
  soc2Criteria: z.string().optional().default(""),
  tscCategory: z.string().optional().default(""),
  orgSize: z.string().optional().default(""),
});

type RiskCreateFormValues = z.infer<typeof riskCreateSchema>;

interface RiskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RiskCreateDialog({ open, onOpenChange, onSuccess }: RiskCreateDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm(riskCreateSchema, {
    riskId: "",
    title: "",
    description: "",
    tier: "CORE",
    status: "IDENTIFIED",
    framework: "ISO",
    riskOwner: "",
    likelihood: "",
    impact: "",
    applicable: true,
    justificationIfNa: "",
    soc2Criteria: "",
    tscCategory: "",
    orgSize: "",
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const applicable = watch("applicable");
  const framework = watch("framework");

  const onSubmit = handleSubmit(async (data: RiskCreateFormValues) => {
    try {
      setSaving(true);
      setError(null);
      await createRisk(data);
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      console.error("Error creating risk:", err);
      setError(err instanceof Error ? err.message : "Failed to create risk");
    } finally {
      setSaving(false);
    }
  });

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Create New Risk
          </DialogTitle>
          <DialogDescription>
            Define a new risk for your organization's risk register.
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
                <Label htmlFor="riskId">Risk ID *</Label>
                <Input
                  id="riskId"
                  {...register("riskId")}
                  placeholder="e.g., RISK-001"
                />
                <FieldErrorMessage error={errors.riskId} />
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
                placeholder="Brief risk title"
              />
              <FieldErrorMessage error={errors.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Detailed risk description..."
                rows={4}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Risk Tier</Label>
                <Select
                  value={watch("tier")}
                  onValueChange={(v) => setValue("tier", v as RiskTier, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">Core (All organizations)</SelectItem>
                    <SelectItem value="EXTENDED">Extended (Medium/Large)</SelectItem>
                    <SelectItem value="ADVANCED">Advanced (Large only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as RiskStatus, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDENTIFIED">Identified</SelectItem>
                    <SelectItem value="ASSESSED">Assessed</SelectItem>
                    <SelectItem value="TREATING">Treating</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assessment */}
            <div className="grid grid-cols-3 gap-4">
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
                    <SelectItem value="RARE">Rare</SelectItem>
                    <SelectItem value="UNLIKELY">Unlikely</SelectItem>
                    <SelectItem value="POSSIBLE">Possible</SelectItem>
                    <SelectItem value="LIKELY">Likely</SelectItem>
                    <SelectItem value="ALMOST_CERTAIN">Almost Certain</SelectItem>
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
                    <SelectItem value="INSIGNIFICANT">Insignificant</SelectItem>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="MODERATE">Moderate</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                    <SelectItem value="CATASTROPHIC">Catastrophic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskOwner">Risk Owner</Label>
                <Input
                  id="riskOwner"
                  {...register("riskOwner")}
                  placeholder="Name or role"
                />
              </div>
            </div>

            {/* Applicability & Framework */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Applicability & Framework</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="applicable">Applicable</Label>
                <Switch
                  id="applicable"
                  checked={applicable}
                  onCheckedChange={(checked) => setValue("applicable", checked, { shouldValidate: true })}
                />
              </div>

              {!applicable && (
                <div className="space-y-2">
                  <Label htmlFor="justificationIfNa">Justification (if N/A)</Label>
                  <Textarea
                    id="justificationIfNa"
                    {...register("justificationIfNa")}
                    placeholder="Explain why this risk is not applicable..."
                    rows={2}
                  />
                </div>
              )}

              {framework === "SOC2" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="soc2Criteria">SOC 2 Criteria</Label>
                    <Input
                      id="soc2Criteria"
                      {...register("soc2Criteria")}
                      placeholder="e.g., CC6.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tscCategory">TSC Category</Label>
                    <Input
                      id="tscCategory"
                      {...register("tscCategory")}
                      placeholder="e.g., Security"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="orgSize">Organization Size</Label>
                <Input
                  id="orgSize"
                  {...register("orgSize")}
                  placeholder="e.g., SME, Large Enterprise"
                />
              </div>
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
                  Creating...
                </>
              ) : (
                "Create Risk"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
