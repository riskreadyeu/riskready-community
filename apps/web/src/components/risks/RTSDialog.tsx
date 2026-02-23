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
import {
  createRTS,
  updateRTS,
  type RiskToleranceStatement,
  type ToleranceLevel,
  type RTSStatus,
  type ControlFramework,
  type AppetiteLevel,
  type ImpactCategory,
} from "@/lib/risks-api";
import { Shield, Loader2 } from "lucide-react";

interface RTSDialogProps {
  rts?: RiskToleranceStatement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RTSDialog({ 
  rts, 
  open, 
  onOpenChange, 
  onSuccess 
}: RTSDialogProps) {
  const isEditing = !!rts;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    rtsId: "",
    title: "",
    objective: "",
    domain: "",
    proposedToleranceLevel: "MEDIUM" as ToleranceLevel,
    proposedRTS: "",
    anticipatedOperationalImpact: "",
    rationale: "",
    status: "DRAFT" as RTSStatus,
    framework: "ISO" as ControlFramework,
    controlIds: "",
    appetiteLevel: "" as AppetiteLevel | "",
    category: "" as ImpactCategory | "",
    toleranceThreshold: undefined as number | undefined,
    effectiveDate: "",
    reviewDate: "",
  });

  useEffect(() => {
    if (rts) {
      setForm({
        rtsId: rts.rtsId || "",
        title: rts.title || "",
        objective: rts.objective || "",
        domain: rts.domain || "",
        proposedToleranceLevel: rts.proposedToleranceLevel,
        proposedRTS: rts.proposedRTS || "",
        anticipatedOperationalImpact: rts.anticipatedOperationalImpact || "",
        rationale: rts.rationale || "",
        status: rts.status,
        framework: rts.framework,
        controlIds: rts.controlIds || "",
        appetiteLevel: rts.appetiteLevel || "",
        category: rts.category || "",
        toleranceThreshold: rts.toleranceThreshold ?? undefined,
        effectiveDate: rts.effectiveDate ? rts.effectiveDate.split("T")[0]! : "",
        reviewDate: rts.reviewDate ? rts.reviewDate.split("T")[0]! : "",
      });
    } else {
      resetForm();
    }
  }, [rts]);

  const resetForm = () => {
    setForm({
      rtsId: "",
      title: "",
      objective: "",
      domain: "",
      proposedToleranceLevel: "MEDIUM",
      proposedRTS: "",
      anticipatedOperationalImpact: "",
      rationale: "",
      status: "DRAFT",
      framework: "ISO",
      controlIds: "",
      appetiteLevel: "",
      category: "",
      toleranceThreshold: undefined,
      effectiveDate: "",
      reviewDate: "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.rtsId || !form.title || !form.objective || !form.proposedRTS) {
      setError("RTS ID, Title, Objective, and Proposed RTS are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        appetiteLevel: form.appetiteLevel || undefined,
        category: form.category || undefined,
        toleranceThreshold: form.toleranceThreshold,
        effectiveDate: form.effectiveDate || undefined,
        reviewDate: form.reviewDate || undefined,
      };

      if (isEditing && rts) {
        await updateRTS(rts.id, payload);
      } else {
        await createRTS(payload);
      }
      
      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (err: unknown) {
      console.error("Error saving RTS:", err);
      setError(err instanceof Error ? err.message : "Failed to save Risk Tolerance Statement");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) resetForm();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {isEditing ? `Edit RTS - ${rts.rtsId}` : "Create Risk Tolerance Statement"}
          </DialogTitle>
          <DialogDescription>
            Define acceptable risk levels for your organization.
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
                <Label htmlFor="rtsId">RTS ID *</Label>
                <Input
                  id="rtsId"
                  value={form.rtsId}
                  onChange={(e) => setForm({ ...form, rtsId: e.target.value })}
                  placeholder="e.g., RTS-001"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="e.g., Vulnerability Management"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title for the tolerance statement"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective *</Label>
              <Textarea
                id="objective"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="What objective does this tolerance statement aim to achieve?"
                rows={2}
                required
              />
            </div>

            {/* Tolerance Level */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Tolerance Definition</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposedToleranceLevel">Tolerance Level *</Label>
                  <Select
                    value={form.proposedToleranceLevel}
                    onValueChange={(v) => setForm({ ...form, proposedToleranceLevel: v as ToleranceLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High Tolerance</SelectItem>
                      <SelectItem value="MEDIUM">Medium Tolerance</SelectItem>
                      <SelectItem value="LOW">Low Tolerance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as RTSStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedRTS">Tolerance Statement *</Label>
                <Textarea
                  id="proposedRTS"
                  value={form.proposedRTS}
                  onChange={(e) => setForm({ ...form, proposedRTS: e.target.value })}
                  placeholder="The full text of the risk tolerance statement..."
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Impact and Rationale */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anticipatedOperationalImpact">Anticipated Operational Impact</Label>
                <Textarea
                  id="anticipatedOperationalImpact"
                  value={form.anticipatedOperationalImpact}
                  onChange={(e) => setForm({ ...form, anticipatedOperationalImpact: e.target.value })}
                  placeholder="What operational impact is expected if this tolerance is breached?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rationale">Rationale</Label>
                <Textarea
                  id="rationale"
                  value={form.rationale}
                  onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                  placeholder="Why was this tolerance level chosen?"
                  rows={2}
                />
              </div>
            </div>

            {/* Framework & Controls */}
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="controlIds">Related Controls</Label>
                <Input
                  id="controlIds"
                  value={form.controlIds}
                  onChange={(e) => setForm({ ...form, controlIds: e.target.value })}
                  placeholder="e.g., A.8.8, A.12.6"
                />
              </div>
            </div>

            {/* Appetite & Category */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Risk Appetite & Category</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appetiteLevel">Appetite Level</Label>
                  <Select
                    value={form.appetiteLevel}
                    onValueChange={(v) => setForm({ ...form, appetiteLevel: v as AppetiteLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINIMAL">Minimal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Impact Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v as ImpactCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="LEGAL_REGULATORY">Legal/Regulatory</SelectItem>
                      <SelectItem value="REPUTATIONAL">Reputational</SelectItem>
                      <SelectItem value="STRATEGIC">Strategic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toleranceThreshold">Tolerance Threshold</Label>
                  <Input
                    id="toleranceThreshold"
                    type="number"
                    min={0}
                    value={form.toleranceThreshold ?? ""}
                    onChange={(e) => setForm({ ...form, toleranceThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Score threshold"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDate">Review Date</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create RTS"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
