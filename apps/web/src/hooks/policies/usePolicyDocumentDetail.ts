import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { notifyError } from "@/lib/app-errors";
import {
  createReview,
  createWorkflow,
  getControlMappings,
  getCurrentWorkflow,
  getDefaultWorkflowByDocumentType,
  getPolicy,
  getReviews,
  getRiskMappings,
  getVersions,
  type ApprovalWorkflow,
  type ControlMapping,
  type DefaultWorkflowConfig,
  type DocumentReview,
  type DocumentVersion,
  type PolicyDocument,
  type ReviewOutcome,
  type RiskMapping,
} from "@/lib/policies-api";

export type PolicyWorkflowStepDraft = {
  stepOrder: number;
  stepName: string;
  approverId?: string;
  approverRole: string;
  dueDate: string;
};

export function usePolicyDocumentDetail(documentId: string | undefined) {
  const { userId: currentUserId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<PolicyDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [controlMappings, setControlMappings] = useState<ControlMapping[]>([]);
  const [riskMappings, setRiskMappings] = useState<RiskMapping[]>([]);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"start" | "schedule">("start");
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>("NO_CHANGES");
  const [reviewFindings, setReviewFindings] = useState("");
  const [reviewRecommendations, setReviewRecommendations] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalConfig, setApprovalConfig] = useState<DefaultWorkflowConfig | null>(null);
  const [loadingApprovalConfig, setLoadingApprovalConfig] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<PolicyWorkflowStepDraft[]>([]);

  async function refresh() {
    if (!documentId) {
      setLoading(false);
      setDocument(null);
      setVersions([]);
      setReviews([]);
      setWorkflow(null);
      setControlMappings([]);
      setRiskMappings([]);
      return;
    }

    try {
      setLoading(true);
      const [docData, versionsData, reviewsData, workflowData, controlsData, risksData] =
        await Promise.all([
          getPolicy(documentId),
          getVersions(documentId),
          getReviews(documentId),
          getCurrentWorkflow(documentId),
          getControlMappings(documentId),
          getRiskMappings(documentId),
        ]);
      setDocument(docData);
      setVersions(versionsData);
      setReviews(reviewsData);
      setWorkflow(workflowData);
      setControlMappings(controlsData);
      setRiskMappings(risksData);
    } catch (error) {
      notifyError("Error loading document:", error, "Failed to load document");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [documentId]);

  const isOverdue = Boolean(
    document?.nextReviewDate && new Date(document.nextReviewDate) < new Date()
  );
  const isDueSoon = Boolean(
    document?.nextReviewDate &&
      !isOverdue &&
      new Date(document.nextReviewDate) <
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  function openReviewDialog(type: "start" | "schedule") {
    setReviewType(type);
    setReviewOutcome("NO_CHANGES");
    setReviewFindings("");
    setReviewRecommendations("");
    setReviewDialogOpen(true);
  }

  async function submitReview() {
    if (!documentId || !currentUserId || !document) return;

    try {
      setSubmittingReview(true);
      await createReview(documentId, {
        reviewType: reviewType === "start" ? "SCHEDULED" : "REQUEST",
        outcome: reviewOutcome,
        findings: reviewFindings || undefined,
        recommendations: reviewRecommendations || undefined,
        changesRequired: reviewOutcome !== "NO_CHANGES",
        reviewedById: currentUserId,
      });
      setReviewDialogOpen(false);
      await refresh();
    } catch (error) {
      notifyError("Error submitting review:", error, "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function openApprovalDialog() {
    if (!document) return;

    try {
      setLoadingApprovalConfig(true);
      setApprovalComments("");
      setApprovalConfig(null);
      setApprovalDialogOpen(true);

      const config = await getDefaultWorkflowByDocumentType(
        document.documentType,
        document.documentOwnerId || undefined
      );

      setApprovalConfig(config);

      if (config.steps.length > 0) {
        setWorkflowSteps(
          config.steps.map((step) => ({
            stepOrder: step.stepOrder,
            stepName: step.stepName,
            approverId: step.approverId,
            approverRole: step.approverRole || "",
            dueDate: "",
          }))
        );
      } else {
        setWorkflowSteps([
          {
            stepOrder: 1,
            stepName: "CISO/CIO Approval",
            approverRole: "CISO",
            dueDate: "",
          },
        ]);
      }
    } catch (error) {
      notifyError(
        "Error loading approval config:",
        error,
        "Failed to load approval workflow defaults"
      );
      setWorkflowSteps([
        {
          stepOrder: 1,
          stepName: "Manager Review",
          approverRole: "MANAGEMENT",
          dueDate: "",
        },
      ]);
    } finally {
      setLoadingApprovalConfig(false);
    }
  }

  async function submitForApproval() {
    if (!document || !documentId || !currentUserId) return;

    try {
      setSubmittingApproval(true);
      await createWorkflow(documentId, {
        workflowType: document.status === "UNDER_REVISION" ? "REVISION" : "NEW_DOCUMENT",
        steps: workflowSteps.map((step) => ({
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          approverId: step.approverId,
          approverRole: step.approverRole,
          dueDate: step.dueDate || undefined,
        })),
        initiatedById: currentUserId,
        comments: approvalComments || undefined,
      });

      setApprovalDialogOpen(false);
      setApprovalComments("");
      await refresh();
    } catch (error) {
      notifyError(
        "Error submitting for approval:",
        error,
        "Failed to submit document for approval"
      );
    } finally {
      setSubmittingApproval(false);
    }
  }

  function addWorkflowStep() {
    setWorkflowSteps((currentSteps) => [
      ...currentSteps,
      {
        stepOrder: currentSteps.length + 1,
        stepName: `Step ${currentSteps.length + 1}`,
        approverRole: "MANAGEMENT",
        dueDate: "",
      },
    ]);
  }

  function removeWorkflowStep(index: number) {
    setWorkflowSteps((currentSteps) => {
      if (currentSteps.length <= 1) {
        return currentSteps;
      }

      return currentSteps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({
          ...step,
          stepOrder: stepIndex + 1,
        }));
    });
  }

  function updateWorkflowStep(
    index: number,
    field: "stepName" | "approverRole" | "dueDate",
    value: string
  ) {
    setWorkflowSteps((currentSteps) =>
      currentSteps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )
    );
  }

  return {
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
  };
}
