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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createKRI,
  updateKRI,
  type KeyRiskIndicator,
  type RiskTier,
  type ControlFramework,
  type CollectionFrequency,
} from "@/lib/risks-api";
import { Activity, Loader2 } from "lucide-react";
import { useZodForm, z } from "@/lib/form-utils";
import { FieldErrorMessage } from "@/components/common/form-field";

const kriSchema = z.object({
  kriId: z.string().min(1, "KRI ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  tier: z.enum(["CORE", "EXTENDED", "ADVANCED"]).default("CORE"),
  framework: z.enum(["ISO", "SOC2", "NIS2", "DORA"]).default("ISO"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "PER_EVENT", "PER_INCIDENT"]).default("MONTHLY"),
  unit: z.string().optional().default(""),
  formula: z.string().optional().default(""),
  dataSource: z.string().optional().default(""),
  automated: z.boolean().default(false),
  thresholdGreen: z.string().optional().default(""),
  thresholdAmber: z.string().optional().default(""),
  thresholdRed: z.string().optional().default(""),
  soc2Criteria: z.string().optional().default(""),
});

type KRIFormValues = z.infer<typeof kriSchema>;

interface KRIDialogProps {
  kri?: KeyRiskIndicator | null;
  riskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function KRIDialog({
  kri,
  riskId,
  open,
  onOpenChange,
  onSuccess
}: KRIDialogProps) {
  const isEditing = !!kri;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm(kriSchema, {
    kriId: "",
    name: "",
    description: "",
    tier: "CORE",
    framework: "ISO",
    frequency: "MONTHLY",
    unit: "",
    formula: "",
    dataSource: "",
    automated: false,
    thresholdGreen: "",
    thresholdAmber: "",
    thresholdRed: "",
    soc2Criteria: "",
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const framework = watch("framework");
  const automated = watch("automated");

  useEffect(() => {
    if (kri) {
      reset({
        kriId: kri.kriId || "",
        name: kri.name || "",
        description: kri.description || "",
        tier: kri.tier,
        framework: kri.framework,
        frequency: kri.frequency as KRIFormValues["frequency"],
        unit: kri.unit || "",
        formula: kri.formula || "",
        dataSource: kri.dataSource || "",
        automated: kri.automated || false,
        thresholdGreen: kri.thresholdGreen || "",
        thresholdAmber: kri.thresholdAmber || "",
        thresholdRed: kri.thresholdRed || "",
        soc2Criteria: kri.soc2Criteria || "",
      });
    } else {
      reset({
        kriId: "",
        name: "",
        description: "",
        tier: "CORE",
        framework: "ISO",
        frequency: "MONTHLY",
        unit: "",
        formula: "",
        dataSource: "",
        automated: false,
        thresholdGreen: "",
        thresholdAmber: "",
        thresholdRed: "",
        soc2Criteria: "",
      });
    }
  }, [kri, reset]);

  const onSubmit = handleSubmit(async (data: KRIFormValues) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...data,
        frequency: data.frequency as CollectionFrequency,
        riskId: riskId || kri?.riskId,
      };

      if (isEditing && kri) {
        await updateKRI(kri.id, payload);
      } else {
        await createKRI(payload);
      }

      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) reset();
    } catch (err: unknown) {
      console.error("Error saving KRI:", err);
      setError(err instanceof Error ? err.message : "Failed to save KRI");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {isEditing ? `Edit KRI - ${kri.kriId}` : "Create New KRI"}
          </DialogTitle>
          <DialogDescription>
            Define a key risk indicator to monitor risk levels.
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
                <Label htmlFor="kriId">KRI ID *</Label>
                <Input
                  id="kriId"
                  {...register("kriId")}
                  placeholder="e.g., KRI-001"
                  disabled={isEditing}
                />
                <FieldErrorMessage error={errors.kriId} />
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Brief KRI name"
              />
              <FieldErrorMessage error={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="What does this KRI measure and why is it important?"
                rows={3}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={watch("tier")}
                  onValueChange={(v) => setValue("tier", v as RiskTier, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">Core</SelectItem>
                    <SelectItem value="EXTENDED">Extended</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Collection Frequency</Label>
                <Select
                  value={watch("frequency")}
                  onValueChange={(v) => setValue("frequency", v as KRIFormValues["frequency"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="PER_EVENT">Per Event</SelectItem>
                    <SelectItem value="PER_INCIDENT">Per Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Input
                  id="unit"
                  {...register("unit")}
                  placeholder="e.g., %, hours, count"
                />
              </div>
            </div>

            {/* Formula & Data Source */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Measurement Details</h4>

              <div className="space-y-2">
                <Label htmlFor="formula">Formula</Label>
                <Textarea
                  id="formula"
                  {...register("formula")}
                  placeholder="How is this KRI calculated? e.g., (Failed logins / Total logins) x 100"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Input
                    id="dataSource"
                    {...register("dataSource")}
                    placeholder="e.g., SIEM, ServiceNow, Manual"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-6">
                  <Label htmlFor="automated" className="text-sm">Automated Collection</Label>
                  <Switch
                    id="automated"
                    checked={automated}
                    onCheckedChange={(checked) => setValue("automated", checked, { shouldValidate: true })}
                  />
                </div>
              </div>

              {framework === "SOC2" && (
                <div className="space-y-2">
                  <Label htmlFor="soc2Criteria">SOC 2 Criteria</Label>
                  <Input
                    id="soc2Criteria"
                    {...register("soc2Criteria")}
                    placeholder="e.g., CC6.1"
                  />
                </div>
              )}
            </div>

            {/* Thresholds */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">RAG Thresholds</h4>
              <p className="text-xs text-muted-foreground">Define thresholds for status classification (e.g., "&lt;5" or "5-10" or "&gt;10")</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thresholdGreen" className="text-green-600">Green</Label>
                  <Input
                    id="thresholdGreen"
                    {...register("thresholdGreen")}
                    placeholder="e.g., <5%"
                    className="border-green-500/50 focus-visible:ring-green-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Acceptable</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thresholdAmber" className="text-amber-600">Amber</Label>
                  <Input
                    id="thresholdAmber"
                    {...register("thresholdAmber")}
                    placeholder="e.g., 5-10%"
                    className="border-amber-500/50 focus-visible:ring-amber-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Warning</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thresholdRed" className="text-red-600">Red</Label>
                  <Input
                    id="thresholdRed"
                    {...register("thresholdRed")}
                    placeholder="e.g., >10%"
                    className="border-red-500/50 focus-visible:ring-red-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Critical</p>
                </div>
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create KRI"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
