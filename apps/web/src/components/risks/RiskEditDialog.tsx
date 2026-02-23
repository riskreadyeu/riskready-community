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
import { Switch } from "@/components/ui/switch";
import { updateRisk, type Risk, type RiskTier, type RiskStatus, type ControlFramework } from "@/lib/risks-api";
import { Edit, Loader2 } from "lucide-react";

interface RiskEditDialogProps {
  risk: Risk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RiskEditDialog({ risk, open, onOpenChange, onSuccess }: RiskEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tier: "CORE" as RiskTier,
    status: "IDENTIFIED" as RiskStatus,
    framework: "ISO" as ControlFramework,
    riskOwner: "",
    likelihood: "",
    impact: "",
    treatmentPlan: "",
    acceptanceCriteria: "",
    inherentScore: 0,
    residualScore: 0,
    applicable: true,
    justificationIfNa: "",
    soc2Criteria: "",
    tscCategory: "",
    orgSize: "",
  });

  useEffect(() => {
    if (risk) {
      setForm({
        title: risk.title || "",
        description: risk.description || "",
        tier: risk.tier,
        status: risk.status,
        framework: risk.framework,
        riskOwner: risk.riskOwner || "",
        likelihood: risk.likelihood || "",
        impact: risk.impact || "",
        treatmentPlan: risk.treatmentPlan || "",
        acceptanceCriteria: risk.acceptanceCriteria || "",
        inherentScore: risk.inherentScore || 0,
        residualScore: risk.residualScore || 0,
        applicable: risk.applicable ?? true,
        justificationIfNa: risk.justificationIfNa || "",
        soc2Criteria: risk.soc2Criteria || "",
        tscCategory: risk.tscCategory || "",
        orgSize: risk.orgSize || "",
      });
    }
  }, [risk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!risk || !form.title) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateRisk(risk.id, form);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Error updating risk:", err);
      setError(err instanceof Error ? err.message : "Failed to update risk");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Risk - {risk.riskId}
          </DialogTitle>
          <DialogDescription>
            Update the risk details and assessment information.
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
                <Label htmlFor="riskId">Risk ID</Label>
                <Input
                  id="riskId"
                  value={risk.riskId}
                  disabled
                  className="bg-muted"
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
                placeholder="Brief risk title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed risk description..."
                rows={4}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Risk Tier</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm({ ...form, tier: v as RiskTier })}
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
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as RiskStatus })}
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
                  value={form.likelihood}
                  onValueChange={(v) => setForm({ ...form, likelihood: v })}
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
                  value={form.impact}
                  onValueChange={(v) => setForm({ ...form, impact: v })}
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
                  value={form.riskOwner}
                  onChange={(e) => setForm({ ...form, riskOwner: e.target.value })}
                  placeholder="Name or role"
                />
              </div>
            </div>

            {/* Risk Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inherentScore">Inherent Risk Score (1-25)</Label>
                <Input
                  id="inherentScore"
                  type="number"
                  min={0}
                  max={25}
                  value={form.inherentScore || ""}
                  onChange={(e) => setForm({ ...form, inherentScore: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residualScore">Residual Risk Score (1-25)</Label>
                <Input
                  id="residualScore"
                  type="number"
                  min={0}
                  max={25}
                  value={form.residualScore || ""}
                  onChange={(e) => setForm({ ...form, residualScore: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label htmlFor="treatmentPlan">Treatment Plan</Label>
              <Textarea
                id="treatmentPlan"
                value={form.treatmentPlan}
                onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
                placeholder="Describe the risk treatment approach..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
              <Textarea
                id="acceptanceCriteria"
                value={form.acceptanceCriteria}
                onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                placeholder="Criteria for accepting residual risk..."
                rows={2}
              />
            </div>

            {/* Applicability & Framework */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Applicability & Framework</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="applicable">Applicable</Label>
                <Switch
                  id="applicable"
                  checked={form.applicable}
                  onCheckedChange={(checked) => setForm({ ...form, applicable: checked })}
                />
              </div>

              {!form.applicable && (
                <div className="space-y-2">
                  <Label htmlFor="justificationIfNa">Justification (if N/A)</Label>
                  <Textarea
                    id="justificationIfNa"
                    value={form.justificationIfNa}
                    onChange={(e) => setForm({ ...form, justificationIfNa: e.target.value })}
                    placeholder="Explain why this risk is not applicable..."
                    rows={2}
                  />
                </div>
              )}

              {form.framework === "SOC2" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="soc2Criteria">SOC 2 Criteria</Label>
                    <Input
                      id="soc2Criteria"
                      value={form.soc2Criteria}
                      onChange={(e) => setForm({ ...form, soc2Criteria: e.target.value })}
                      placeholder="e.g., CC6.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tscCategory">TSC Category</Label>
                    <Input
                      id="tscCategory"
                      value={form.tscCategory}
                      onChange={(e) => setForm({ ...form, tscCategory: e.target.value })}
                      placeholder="e.g., Security"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="orgSize">Organization Size</Label>
                <Input
                  id="orgSize"
                  value={form.orgSize}
                  onChange={(e) => setForm({ ...form, orgSize: e.target.value })}
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
