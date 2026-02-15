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
import { cn } from "@/lib/utils";

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
  const [form, setForm] = useState({
    scenarioId: "",
    title: "",
    cause: "",
    event: "",
    consequence: "",
    framework: "ISO" as ControlFramework,
    likelihood: "",
    impact: "",
    sleLow: 0,
    sleLikely: 0,
    sleHigh: 0,
    aro: 0,
    controlIds: "",
  });

  // Calculate ALE
  const calculatedALE = form.sleLikely * form.aro;

  useEffect(() => {
    if (scenario) {
      setForm({
        scenarioId: scenario.scenarioId || "",
        title: scenario.title || "",
        cause: scenario.cause || "",
        event: scenario.event || "",
        consequence: scenario.consequence || "",
        framework: scenario.framework || "ISO",
        likelihood: scenario.likelihood || "",
        impact: scenario.impact || "",
        sleLow: scenario.sleLow ? Number(scenario.sleLow) : 0,
        sleLikely: scenario.sleLikely ? Number(scenario.sleLikely) : 0,
        sleHigh: scenario.sleHigh ? Number(scenario.sleHigh) : 0,
        aro: scenario.aro ? Number(scenario.aro) : 0,
        controlIds: scenario.controlIds || "",
      });
    } else {
      resetForm();
    }
  }, [scenario]);

  const resetForm = () => {
    setForm({
      scenarioId: "",
      title: "",
      cause: "",
      event: "",
      consequence: "",
      framework: "ISO",
      likelihood: "",
      impact: "",
      sleLow: 0,
      sleLikely: 0,
      sleHigh: 0,
      aro: 0,
      controlIds: "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.scenarioId || !form.title) {
      setError("Scenario ID and Title are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        likelihood: form.likelihood ? form.likelihood as LikelihoodLevel : undefined,
        impact: form.impact ? form.impact as ImpactLevel : undefined,
        ale: calculatedALE,
        riskId: riskId || scenario?.riskId,
      };

      if (isEditing && scenario) {
        await updateRiskScenario(scenario.id, payload);
      } else {
        await createRiskScenario(payload);
      }
      
      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (err: any) {
      console.error("Error saving scenario:", err);
      setError(err.message || "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) resetForm();
    setError(null);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
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
            Define the cause-event-consequence chain and financial impact estimates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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
                  value={form.scenarioId}
                  onChange={(e) => setForm({ ...form, scenarioId: e.target.value })}
                  placeholder="e.g., SCN-001"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Select
                  value={form.framework}
                  onValueChange={(v) => setForm({ ...form, framework: v as ControlFramework })}
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
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief scenario title"
                required
              />
            </div>

            {/* Cause-Event-Consequence */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Risk Flow (Cause → Event → Consequence)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="cause" className="text-blue-600">Cause</Label>
                <Textarea
                  id="cause"
                  value={form.cause}
                  onChange={(e) => setForm({ ...form, cause: e.target.value })}
                  placeholder="What triggers or enables this risk scenario?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event" className="text-amber-600">Event</Label>
                <Textarea
                  id="event"
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  placeholder="What happens when this risk materializes?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consequence" className="text-red-600">Consequence</Label>
                <Textarea
                  id="consequence"
                  value={form.consequence}
                  onChange={(e) => setForm({ ...form, consequence: e.target.value })}
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
                  value={form.likelihood}
                  onValueChange={(v) => setForm({ ...form, likelihood: v })}
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
                  value={form.impact}
                  onValueChange={(v) => setForm({ ...form, impact: v })}
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

            {/* Financial Impact - SLE */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Financial Impact Estimates</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleLow" className="text-green-600">SLE (Low)</Label>
                  <Input
                    id="sleLow"
                    type="number"
                    min={0}
                    value={form.sleLow || ""}
                    onChange={(e) => setForm({ ...form, sleLow: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Best case loss</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleLikely" className="text-amber-600">SLE (Likely)</Label>
                  <Input
                    id="sleLikely"
                    type="number"
                    min={0}
                    value={form.sleLikely || ""}
                    onChange={(e) => setForm({ ...form, sleLikely: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Expected loss</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleHigh" className="text-red-600">SLE (High)</Label>
                  <Input
                    id="sleHigh"
                    type="number"
                    min={0}
                    value={form.sleHigh || ""}
                    onChange={(e) => setForm({ ...form, sleHigh: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Worst case loss</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="aro">ARO (Annual Rate of Occurrence)</Label>
                  <Input
                    id="aro"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.aro || ""}
                    onChange={(e) => setForm({ ...form, aro: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">Expected times per year (e.g., 0.5 = once every 2 years)</p>
                </div>
                <div className="space-y-2">
                  <Label>ALE (Calculated)</Label>
                  <div className={cn(
                    "h-10 flex items-center px-3 rounded-md border bg-muted text-lg font-bold",
                    calculatedALE > 100000 ? "text-red-600" :
                    calculatedALE > 50000 ? "text-orange-600" :
                    calculatedALE > 10000 ? "text-amber-600" : "text-green-600"
                  )}>
                    {formatCurrency(calculatedALE)}
                  </div>
                  <p className="text-xs text-muted-foreground">SLE (Likely) × ARO</p>
                </div>
              </div>
            </div>

            {/* Related Controls */}
            <div className="space-y-2">
              <Label htmlFor="controlIds">Related Control IDs</Label>
              <Input
                id="controlIds"
                value={form.controlIds}
                onChange={(e) => setForm({ ...form, controlIds: e.target.value })}
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
