import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Send,
  Check,
  Download,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArcherTabSet } from "@/components/archer/tab-set";
import { RecordHeader } from "@/components/archer/record-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AssessmentOverviewTab,
  AssessmentTestsTab,
  AssessmentScopeTab,
  AssessmentFindingsTab,
} from "@/components/controls/tabs/assessment";
import {
  fetchAssessment,
  startAssessment,
  submitAssessmentForReview,
  completeAssessment,
  cancelAssessment,
  type Assessment,
  type ControlAssessmentStatus,
} from "@/lib/controls-api";

// =============================================================================
// Configuration
// =============================================================================

const statusConfig: Record<
  ControlAssessmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", variant: "outline", icon: Eye },
  COMPLETED: { label: "Completed", variant: "default", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

// =============================================================================
// Component
// =============================================================================

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<"start" | "submit" | "complete" | "cancel" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchAssessment(id);
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Action handlers
  const handleStart = async () => {
    if (!assessment) return;
    try {
      setActionLoading(true);
      const updated = await startAssessment(assessment.id);
      setAssessment(updated);
      setConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start assessment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!assessment) return;
    try {
      setActionLoading(true);
      const updated = await submitAssessmentForReview(assessment.id);
      setAssessment(updated);
      setConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit for review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!assessment) return;
    try {
      setActionLoading(true);
      const updated = await completeAssessment(assessment.id, reviewNotes || undefined);
      setAssessment(updated);
      setConfirmDialog(null);
      setReviewNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete assessment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!assessment || !cancelReason.trim()) return;
    try {
      setActionLoading(true);
      const updated = await cancelAssessment(assessment.id, cancelReason);
      setAssessment(updated);
      setConfirmDialog(null);
      setCancelReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel assessment");
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !assessment) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error || "Assessment not found"}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/controls/assessments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[assessment.status];
  const StatusIcon = config.icon;
  const totalTests = assessment.totalTests || 0;
  const completedTests = assessment.completedTests || 0;
  const passedTests = assessment.passedTests || 0;
  const passRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Record Header */}
      <RecordHeader
        breadcrumbs={[
          { label: "Controls", href: "/controls" },
          { label: "Assessments", href: "/controls/assessments" },
          { label: assessment.assessmentRef },
        ]}
        identifier={assessment.assessmentRef}
        title={assessment.title}
        status={{
          label: config.label,
          variant: config.variant,
          icon: StatusIcon,
        }}
        badges={[
          { label: `${totalTests} Tests`, variant: "outline" as const },
          { label: `${passRate}% Pass Rate`, variant: "secondary" as const },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {assessment.status === "DRAFT" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDialog("start")}>
                <Play className="h-4 w-4 mr-2" />
                Start Assessment
              </Button>
            )}
            {assessment.status === "IN_PROGRESS" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDialog("submit")}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {assessment.status === "UNDER_REVIEW" && (
              <Button size="sm" onClick={() => setConfirmDialog("complete")}>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            {assessment.status === "COMPLETED" && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {assessment.status !== "COMPLETED" && assessment.status !== "CANCELLED" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDialog("cancel")}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <ArcherTabSet
        syncWithUrl
        defaultValue="overview"
        tabs={[
          {
            value: "overview",
            label: "OVERVIEW",
            content: <AssessmentOverviewTab assessment={assessment} />,
          },
          {
            value: "tests",
            label: "TESTS",
            badge: totalTests,
            content: <AssessmentTestsTab assessmentId={assessment.id} />,
          },
          {
            value: "scope",
            label: "SCOPE",
            badge: (assessment.controls?.length || 0) + (assessment.scopeItems?.length || 0),
            content: <AssessmentScopeTab assessment={assessment} onUpdate={loadData} />,
          },
          {
            value: "findings",
            label: "FINDINGS",
            badge: (assessment.failedTests || 0) + (assessment.tests?.filter(t => t.result === "PARTIAL").length || 0),
            content: <AssessmentFindingsTab tests={assessment.tests || []} />,
          },
        ]}
      />

      {/* Start Confirmation */}
      <Dialog open={confirmDialog === "start"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Assessment</DialogTitle>
            <DialogDescription>
              This will move the assessment to &quot;In Progress&quot;. Tests will be generated based on
              the controls and scope items configured. Make sure the scope is correctly defined before starting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={actionLoading}>
              {actionLoading ? "Starting..." : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit for Review Confirmation */}
      <Dialog open={confirmDialog === "submit"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Review</DialogTitle>
            <DialogDescription>
              This will submit the assessment for review. The reviewer will be notified to review
              the test results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForReview} disabled={actionLoading}>
              {actionLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation */}
      <Dialog open={confirmDialog === "complete"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Assessment</DialogTitle>
            <DialogDescription>
              This will mark the assessment as completed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
            <Textarea
              id="reviewNotes"
              placeholder="Add any review notes or observations..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={actionLoading}>
              {actionLoading ? "Completing..." : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={confirmDialog === "cancel"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Assessment</DialogTitle>
            <DialogDescription>
              This will cancel the assessment. Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancelReason">Reason *</Label>
            <Input
              id="cancelReason"
              placeholder="Enter reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading || !cancelReason.trim()}
            >
              {actionLoading ? "Cancelling..." : "Cancel Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
