import { Link, useParams } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PolicyApprovalDialog } from "@/components/policies/detail/PolicyApprovalDialog";
import { PolicyDetailActions } from "@/components/policies/detail/PolicyDetailActions";
import { PolicyDetailHeader } from "@/components/policies/detail/PolicyDetailHeader";
import { PolicyReviewDialog } from "@/components/policies/detail/PolicyReviewDialog";
import { PolicyContentTab, PolicyRawContentTab } from "@/components/policies/tabs/PolicyContentTab";
import { PolicyVersionsTab } from "@/components/policies/tabs/PolicyVersionsTab";
import { PolicyReviewsTab } from "@/components/policies/tabs/PolicyReviewsTab";
import { PolicyMappingsTab } from "@/components/policies/tabs/PolicyMappingsTab";
import { PolicyWorkflowSidebar } from "@/components/policies/tabs/PolicyWorkflowSidebar";
import { usePolicyDocumentDetail } from "@/hooks/policies/usePolicyDocumentDetail";

export default function PolicyDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    document,
    versions,
    reviews,
    workflow,
    controlMappings,
    riskMappings,
    isOverdue,
    isDueSoon,
    reviewDialogOpen,
    setReviewDialogOpen,
    reviewType,
    reviewOutcome,
    setReviewOutcome,
    reviewFindings,
    setReviewFindings,
    reviewRecommendations,
    setReviewRecommendations,
    submittingReview,
    openReviewDialog,
    submitReview,
    approvalDialogOpen,
    setApprovalDialogOpen,
    submittingApproval,
    approvalComments,
    setApprovalComments,
    approvalConfig,
    loadingApprovalConfig,
    workflowSteps,
    openApprovalDialog,
    submitForApproval,
    addWorkflowStep,
    removeWorkflowStep,
    updateWorkflowStep,
  } = usePolicyDocumentDetail(id);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The document you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/policies/documents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-slide-up">
      <div className="flex items-start justify-between">
        <PolicyDetailHeader document={document} />
        <PolicyDetailActions
          document={document}
          documentId={id ?? document.id}
          onOpenApprovalDialog={openApprovalDialog}
        />
      </div>

      {/* Alert Banners */}
      {isOverdue && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Review Overdue</p>
            <p className="text-sm text-muted-foreground">
              This document was due for review on{" "}
              {new Date(document.nextReviewDate!).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            onClick={() => openReviewDialog("start")}
          >
            Start Review
          </Button>
        </div>
      )}

      {isDueSoon && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="font-medium text-warning">Review Due Soon</p>
            <p className="text-sm text-muted-foreground">
              This document is due for review on{" "}
              {new Date(document.nextReviewDate!).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => openReviewDialog("schedule")}
          >
            Schedule Review
          </Button>
        </div>
      )}

      {/* Workflow Banner */}
      {workflow && workflow.status === "IN_PROGRESS" && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Approval Workflow in Progress</span>
            </div>
            <Link to={`/policies/documents/${id}/workflow`}>
              <Button variant="outline" size="sm">
                View Workflow
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {workflow.steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step.status === "APPROVED"
                      ? "bg-success text-white"
                      : step.status === "IN_REVIEW"
                      ? "bg-primary text-white"
                      : step.status === "REJECTED"
                      ? "bg-destructive text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.status === "APPROVED" ? "\u2713" : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    step.status === "IN_REVIEW"
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {step.stepName}
                </span>
                {idx < workflow.steps.length - 1 && (
                  <div className="w-8 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="structured" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="structured">Structured</TabsTrigger>
              <TabsTrigger value="content">Raw</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="mappings">Mappings</TabsTrigger>
              <TabsTrigger value="acknowledgments">Ack</TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="mt-4">
              <PolicyContentTab
                document={document}
                versions={versions}
                controlMappings={controlMappings}
              />
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <PolicyRawContentTab document={document} />
            </TabsContent>

            <TabsContent value="versions" className="mt-4">
              <PolicyVersionsTab versions={versions} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <PolicyReviewsTab reviews={reviews} />
            </TabsContent>

            <TabsContent value="mappings" className="mt-4">
              <PolicyMappingsTab
                controlMappings={controlMappings}
                riskMappings={riskMappings}
              />
            </TabsContent>

            <TabsContent value="acknowledgments" className="mt-4">
              <Card>
                <div className="p-6">
                  <h3 className="text-base font-semibold mb-4">Acknowledgment Status</h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {document.requiresAcknowledgment
                        ? "Acknowledgment tracking enabled"
                        : "Acknowledgment not required"}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <PolicyWorkflowSidebar
          document={document}
          isOverdue={!!isOverdue}
          isDueSoon={!!isDueSoon}
        />
      </div>

      <PolicyReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        document={document}
        reviewType={reviewType}
        reviewOutcome={reviewOutcome}
        onReviewOutcomeChange={setReviewOutcome}
        reviewFindings={reviewFindings}
        onReviewFindingsChange={setReviewFindings}
        reviewRecommendations={reviewRecommendations}
        onReviewRecommendationsChange={setReviewRecommendations}
        submittingReview={submittingReview}
        onSubmit={submitReview}
      />

      <PolicyApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        document={document}
        loadingApprovalConfig={loadingApprovalConfig}
        approvalConfig={approvalConfig}
        workflowSteps={workflowSteps}
        onAddWorkflowStep={addWorkflowStep}
        onRemoveWorkflowStep={removeWorkflowStep}
        onUpdateWorkflowStep={updateWorkflowStep}
        approvalComments={approvalComments}
        onApprovalCommentsChange={setApprovalComments}
        submittingApproval={submittingApproval}
        onSubmit={submitForApproval}
      />
    </div>
  );
}
