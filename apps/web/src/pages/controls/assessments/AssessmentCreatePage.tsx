import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNewAssessment } from "@/lib/controls-api";
import { PageHeader } from "@/components/common";

export default function AssessmentCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const suggestedRef = `ASM-${currentYear}-001`;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assessmentRef: suggestedRef,
    plannedStartDate: "",
    plannedEndDate: "",
    dueDate: "",
    periodStart: "",
    periodEnd: "",
    leadTester: "",
    reviewer: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      const orgId = "cmj7b9wys0000eocjc9zm0j9m";

      const assessment = await createNewAssessment({
        organisationId: orgId,
        title: formData.title,
        description: formData.description || undefined,
        assessmentRef: formData.assessmentRef || undefined,
        plannedStartDate: formData.plannedStartDate || undefined,
        plannedEndDate: formData.plannedEndDate || undefined,
        dueDate: formData.dueDate || undefined,
        periodStart: formData.periodStart || undefined,
        periodEnd: formData.periodEnd || undefined,
        leadTesterId: formData.leadTester || undefined,
        reviewerId: formData.reviewer || undefined,
      });

      navigate(`/controls/assessments/${assessment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create New Assessment"
        description="Define a new control assessment cycle"
        actions={
          <Button variant="outline" onClick={() => navigate("/controls/assessments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
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
        {/* Assessment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              Define the basic information for this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 2026 Control Assessment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessmentRef">Assessment Reference</Label>
              <Input
                id="assessmentRef"
                placeholder="e.g., ASM-2026-001"
                value={formData.assessmentRef}
                onChange={(e) => setFormData({ ...formData, assessmentRef: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Auto-suggested reference. You can customize it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the scope and objectives of this assessment..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              Set planned dates and assessment period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">Planned Start Date</Label>
                <Input
                  id="plannedStartDate"
                  type="date"
                  value={formData.plannedStartDate}
                  onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedEndDate">Planned End Date</Label>
                <Input
                  id="plannedEndDate"
                  type="date"
                  value={formData.plannedEndDate}
                  onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              Assign team members for this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leadTester">Lead Tester</Label>
              <Input
                id="leadTester"
                placeholder="Enter lead tester user ID or email"
                value={formData.leadTester}
                onChange={(e) => setFormData({ ...formData, leadTester: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The person responsible for coordinating testing activities
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Input
                id="reviewer"
                placeholder="Enter reviewer user ID or email"
                value={formData.reviewer}
                onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The person who will review and approve the assessment results
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/controls/assessments")}
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
                Create Assessment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
