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
  createTreatmentPlan, 
  updateTreatmentPlan,
  getRisks,
  getUsers,
  type TreatmentPlan, 
  type TreatmentType, 
  type TreatmentStatus,
  type TreatmentPriority,
  type Risk,
  type User,
} from "@/lib/risks-api";
import { Wrench, Loader2 } from "lucide-react";

interface TreatmentPlanDialogProps {
  plan?: TreatmentPlan | null;
  riskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TreatmentPlanDialog({ 
  plan, 
  riskId,
  open, 
  onOpenChange, 
  onSuccess 
}: TreatmentPlanDialogProps) {
  const isEditing = !!plan;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    treatmentId: "",
    title: "",
    description: "",
    treatmentType: "MITIGATE" as TreatmentType,
    priority: "MEDIUM" as TreatmentPriority,
    status: "DRAFT" as TreatmentStatus,
    targetResidualScore: "",
    expectedReduction: "",
    estimatedCost: "",
    roi: "",
    costBenefit: "",
    proposedDate: "",
    targetStartDate: "",
    targetEndDate: "",
    riskOwnerId: "",
    implementerId: "",
    acceptanceRationale: "",
    acceptanceCriteria: "",
    acceptanceExpiryDate: "",
    controlIds: "",
    riskId: riskId || "",
  });

  useEffect(() => {
    loadRisks();
    loadUsers();
  }, []);

  useEffect(() => {
    if (plan) {
      setForm({
        treatmentId: plan.treatmentId || "",
        title: plan.title || "",
        description: plan.description || "",
        treatmentType: plan.treatmentType,
        priority: plan.priority,
        status: plan.status,
        targetResidualScore: plan.targetResidualScore?.toString() || "",
        expectedReduction: plan.expectedReduction?.toString() || "",
        estimatedCost: plan.estimatedCost?.toString() || "",
        roi: plan.roi?.toString() || "",
        costBenefit: plan.costBenefit || "",
        proposedDate: plan.proposedDate ? plan.proposedDate.split("T")[0]! : "",
        targetStartDate: plan.targetStartDate ? plan.targetStartDate.split("T")[0]! : "",
        targetEndDate: plan.targetEndDate ? plan.targetEndDate.split("T")[0]! : "",
        riskOwnerId: plan.riskOwnerId || "",
        implementerId: plan.implementerId || "",
        acceptanceRationale: plan.acceptanceRationale || "",
        acceptanceCriteria: plan.acceptanceCriteria || "",
        acceptanceExpiryDate: plan.acceptanceExpiryDate ? plan.acceptanceExpiryDate.split("T")[0]! : "",
        controlIds: plan.controlIds || "",
        riskId: plan.riskId || riskId || "",
      });
    } else {
      resetForm();
    }
  }, [plan, riskId]);

  const loadRisks = async () => {
    try {
      const data = await getRisks({ take: 500 });
      setRisks(data.results);
    } catch (err) {
      console.error("Error loading risks:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const resetForm = () => {
    setForm({
      treatmentId: "",
      title: "",
      description: "",
      treatmentType: "MITIGATE",
      priority: "MEDIUM",
      status: "DRAFT",
      targetResidualScore: "",
      expectedReduction: "",
      estimatedCost: "",
      roi: "",
      costBenefit: "",
      proposedDate: "",
      targetStartDate: "",
      targetEndDate: "",
      riskOwnerId: "",
      implementerId: "",
      acceptanceRationale: "",
      acceptanceCriteria: "",
      acceptanceExpiryDate: "",
      controlIds: "",
      riskId: riskId || "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.treatmentId || !form.title || !form.description || !form.riskId) {
      setError("Treatment ID, Title, Description, and Risk are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        targetResidualScore: form.targetResidualScore ? parseInt(form.targetResidualScore) : undefined,
        expectedReduction: form.expectedReduction ? parseInt(form.expectedReduction) : undefined,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        roi: form.roi ? parseFloat(form.roi) : undefined,
        proposedDate: form.proposedDate || undefined,
        targetStartDate: form.targetStartDate || undefined,
        targetEndDate: form.targetEndDate || undefined,
        riskOwnerId: form.riskOwnerId || undefined,
        implementerId: form.implementerId || undefined,
        acceptanceExpiryDate: form.acceptanceExpiryDate || undefined,
      };

      if (isEditing && plan) {
        await updateTreatmentPlan(plan.id, payload);
      } else {
        await createTreatmentPlan(payload);
      }
      
      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (err: any) {
      console.error("Error saving treatment plan:", err);
      setError(err.message || "Failed to save Treatment Plan");
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
            <Wrench className="w-5 h-5 text-primary" />
            {isEditing ? `Edit Treatment Plan - ${plan.treatmentId}` : "Create Treatment Plan"}
          </DialogTitle>
          <DialogDescription>
            Define a risk treatment strategy and action plan.
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
                <Label htmlFor="treatmentId">Treatment ID *</Label>
                <Input
                  id="treatmentId"
                  value={form.treatmentId}
                  onChange={(e) => setForm({ ...form, treatmentId: e.target.value })}
                  placeholder="e.g., TP-001"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskId">Associated Risk *</Label>
                <Select
                  value={form.riskId}
                  onValueChange={(v) => setForm({ ...form, riskId: v })}
                  disabled={!!riskId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.riskId} - {risk.title}
                      </SelectItem>
                    ))}
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
                placeholder="Brief title for the treatment plan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description of the treatment approach..."
                rows={3}
                required
              />
            </div>

            {/* Treatment Type & Classification */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Select
                  value={form.treatmentType}
                  onValueChange={(v) => setForm({ ...form, treatmentType: v as TreatmentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MITIGATE">Mitigate</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="ACCEPT">Accept</SelectItem>
                    <SelectItem value="AVOID">Avoid</SelectItem>
                    <SelectItem value="SHARE">Share</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as TreatmentPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as TreatmentStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PROPOSED">Proposed</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ownership & Responsibility */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Ownership & Responsibility</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="riskOwnerId">Risk Owner</Label>
                  <Select
                    value={form.riskOwnerId}
                    onValueChange={(v) => setForm({ ...form, riskOwnerId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="implementerId">Implementer</Label>
                  <Select
                    value={form.implementerId}
                    onValueChange={(v) => setForm({ ...form, implementerId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select implementer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cost & Target */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Financial & Risk Reduction Targets</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={form.estimatedCost}
                    onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedReduction">Expected Reduction (%)</Label>
                  <Input
                    id="expectedReduction"
                    type="number"
                    value={form.expectedReduction}
                    onChange={(e) => setForm({ ...form, expectedReduction: e.target.value })}
                    placeholder="e.g., 60"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roi">Expected ROI (%)</Label>
                  <Input
                    id="roi"
                    type="number"
                    value={form.roi}
                    onChange={(e) => setForm({ ...form, roi: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetResidualScore">Target Residual Score</Label>
                  <Input
                    id="targetResidualScore"
                    type="number"
                    value={form.targetResidualScore}
                    onChange={(e) => setForm({ ...form, targetResidualScore: e.target.value })}
                    placeholder="1-25"
                    min="1"
                    max="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedDate">Proposed Date</Label>
                  <Input
                    id="proposedDate"
                    type="date"
                    value={form.proposedDate}
                    onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costBenefit">Cost/Benefit Analysis</Label>
                <Textarea
                  id="costBenefit"
                  value={form.costBenefit}
                  onChange={(e) => setForm({ ...form, costBenefit: e.target.value })}
                  placeholder="Describe the expected benefits relative to the cost..."
                  rows={2}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetStartDate">Target Start Date</Label>
                <Input
                  id="targetStartDate"
                  type="date"
                  value={form.targetStartDate}
                  onChange={(e) => setForm({ ...form, targetStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetEndDate">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={form.targetEndDate}
                  onChange={(e) => setForm({ ...form, targetEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Accept-specific fields */}
            {form.treatmentType === "ACCEPT" && (
              <div className="space-y-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
                <h4 className="font-medium text-sm text-warning">Risk Acceptance Details</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="acceptanceRationale">Acceptance Rationale *</Label>
                  <Textarea
                    id="acceptanceRationale"
                    value={form.acceptanceRationale}
                    onChange={(e) => setForm({ ...form, acceptanceRationale: e.target.value })}
                    placeholder="Why is accepting this risk appropriate?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
                  <Textarea
                    id="acceptanceCriteria"
                    value={form.acceptanceCriteria}
                    onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                    placeholder="Under what conditions is this acceptance valid?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptanceExpiryDate">Acceptance Expiry Date</Label>
                  <Input
                    id="acceptanceExpiryDate"
                    type="date"
                    value={form.acceptanceExpiryDate}
                    onChange={(e) => setForm({ ...form, acceptanceExpiryDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Date when this acceptance must be reviewed</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2">
              <Label htmlFor="controlIds">Related Controls</Label>
              <Input
                id="controlIds"
                value={form.controlIds}
                onChange={(e) => setForm({ ...form, controlIds: e.target.value })}
                placeholder="e.g., A.8.8, A.12.6 (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">Controls to be implemented as part of this treatment</p>
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
                isEditing ? "Save Changes" : "Create Treatment Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
