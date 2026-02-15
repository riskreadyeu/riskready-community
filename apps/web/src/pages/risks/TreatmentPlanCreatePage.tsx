import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createTreatmentPlan, getRisks, type Risk } from "@/lib/risks-api";
import { PageHeader } from "@/components/common";

export default function TreatmentPlanCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRiskId = searchParams.get("riskId");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  const [formData, setFormData] = useState({
    treatmentId: "",
    title: "",
    description: "",
    treatmentType: "MITIGATE" as string,
    priority: "MEDIUM" as string,
    targetResidualScore: "",
    estimatedCost: "",
    targetStartDate: "",
    targetEndDate: "",
    riskOwnerId: "",
    implementerId: "",
    acceptanceRationale: "",
    controlIds: "",
    riskId: preselectedRiskId || "",
  });

  useEffect(() => {
    getRisks().then(({ results }) => setRisks(results)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.treatmentId.trim()) {
      setError("Treatment ID is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.riskId) {
      setError("Risk is required");
      return;
    }

    try {
      setLoading(true);
      const plan = await createTreatmentPlan({
        treatmentId: formData.treatmentId,
        title: formData.title,
        description: formData.description,
        treatmentType: formData.treatmentType as any,
        priority: formData.priority as any,
        targetResidualScore: formData.targetResidualScore ? parseInt(formData.targetResidualScore) : undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        targetStartDate: formData.targetStartDate || undefined,
        targetEndDate: formData.targetEndDate || undefined,
        acceptanceRationale: formData.acceptanceRationale || undefined,
        controlIds: formData.controlIds || undefined,
        riskId: formData.riskId,
      });

      navigate(`/risks/treatments/${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create treatment plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create Treatment Plan"
        description="Define a new risk treatment strategy"
        actions={
          <Button variant="outline" onClick={() => navigate("/risks/treatments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Treatment Plans
          </Button>
        }
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>
              Define the treatment plan identifier, type, and priority
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentId">Treatment ID *</Label>
                <Input
                  id="treatmentId"
                  placeholder="e.g., TP-001"
                  value={formData.treatmentId}
                  onChange={(e) => setFormData({ ...formData, treatmentId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskId">Risk *</Label>
                <Select
                  value={formData.riskId}
                  onValueChange={(v) => setFormData({ ...formData, riskId: v })}
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
                placeholder="e.g., Implement MFA for all critical systems"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the treatment strategy, approach, and expected outcomes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentType">Treatment Type</Label>
                <Select
                  value={formData.treatmentType}
                  onValueChange={(v) => setFormData({ ...formData, treatmentType: v })}
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
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetStartDate">Target Start Date</Label>
                <Input
                  id="targetStartDate"
                  type="date"
                  value={formData.targetStartDate}
                  onChange={(e) => setFormData({ ...formData, targetStartDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetEndDate">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetResidualScore">Target Residual Score</Label>
                <Input
                  id="targetResidualScore"
                  type="number"
                  min="0"
                  max="25"
                  placeholder="e.g., 6"
                  value={formData.targetResidualScore}
                  onChange={(e) => setFormData({ ...formData, targetResidualScore: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  placeholder="e.g., 50000"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                />
              </div>
            </div>

            {formData.treatmentType === "ACCEPT" && (
              <div className="space-y-2">
                <Label htmlFor="acceptanceRationale">Acceptance Rationale</Label>
                <Textarea
                  id="acceptanceRationale"
                  placeholder="Explain why this risk is being accepted..."
                  value={formData.acceptanceRationale}
                  onChange={(e) => setFormData({ ...formData, acceptanceRationale: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/risks/treatments")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Treatment Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
