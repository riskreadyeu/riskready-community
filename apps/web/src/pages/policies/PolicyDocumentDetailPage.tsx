"use client";

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMe } from "@/lib/api";
import {
  FileText,
  Edit3,
  GitBranch,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  AlertCircle,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  Download,
  FileDown,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getPolicy,
  getVersions,
  getReviews,
  getCurrentWorkflow,
  getControlMappings,
  getRiskMappings,
  createReview,
  createWorkflow,
  getDefaultWorkflowByDocumentType,
  type PolicyDocument,
  type DocumentVersion,
  type DocumentReview,
  type ApprovalWorkflow,
  type ControlMapping,
  type RiskMapping,
  type ReviewOutcome,
  type DefaultWorkflowConfig,
} from "@/lib/policies-api";
import {
  exportPolicyToPDF,
  exportPolicyToMarkdown,
  exportPolicyToHTML,
} from "@/lib/policy-export-utils";
import { PolicyContentTab, PolicyRawContentTab } from "@/components/policies/tabs/PolicyContentTab";
import { PolicyVersionsTab } from "@/components/policies/tabs/PolicyVersionsTab";
import { PolicyReviewsTab } from "@/components/policies/tabs/PolicyReviewsTab";
import { PolicyMappingsTab } from "@/components/policies/tabs/PolicyMappingsTab";
import { PolicyWorkflowSidebar } from "@/components/policies/tabs/PolicyWorkflowSidebar";

const documentTypeColors: Record<string, string> = {
  POLICY: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  STANDARD: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  PROCEDURE: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  WORK_INSTRUCTION: "bg-green-500/10 text-green-500 border-green-500/30",
  FORM: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  TEMPLATE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  CHECKLIST: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  GUIDELINE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  RECORD: "bg-pink-500/10 text-pink-500 border-pink-500/30",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  PENDING_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/30",
  PUBLISHED: "bg-green-500/10 text-green-500 border-green-500/30",
  UNDER_REVISION: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  SUPERSEDED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  RETIRED: "bg-red-500/10 text-red-500 border-red-500/30",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

const classificationColors: Record<string, string> = {
  PUBLIC: "bg-green-500/10 text-green-500 border-green-500/30",
  INTERNAL: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  CONFIDENTIAL: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  RESTRICTED: "bg-red-500/10 text-red-500 border-red-500/30",
};

export default function PolicyDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<PolicyDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [controlMappings, setControlMappings] = useState<ControlMapping[]>([]);
  const [riskMappings, setRiskMappings] = useState<RiskMapping[]>([]);

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"start" | "schedule">("start");
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>("NO_CHANGES");
  const [reviewFindings, setReviewFindings] = useState("");
  const [reviewRecommendations, setReviewRecommendations] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Approval workflow dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalConfig, setApprovalConfig] = useState<DefaultWorkflowConfig | null>(null);
  const [loadingApprovalConfig, setLoadingApprovalConfig] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<Array<{
    stepOrder: number;
    stepName: string;
    approverId?: string;
    approverRole: string;
    dueDate: string;
  }>>([]);

  useEffect(() => {
    // Load current user ID
    getMe().then((data) => setCurrentUserId(data.user.id)).catch(console.error);

    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (docId: string) => {
    try {
      setLoading(true);
      const [docData, versionsData, reviewsData, workflowData, controlsData, risksData] =
        await Promise.all([
          getPolicy(docId),
          getVersions(docId),
          getReviews(docId),
          getCurrentWorkflow(docId),
          getControlMappings(docId),
          getRiskMappings(docId),
        ]);
      setDocument(docData);
      setVersions(versionsData);
      setReviews(reviewsData);
      setWorkflow(workflowData);
      setControlMappings(controlsData);
      setRiskMappings(risksData);
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const isOverdue =
    document.nextReviewDate && new Date(document.nextReviewDate) < new Date();
  const isDueSoon =
    document.nextReviewDate &&
    !isOverdue &&
    new Date(document.nextReviewDate) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Handle opening review dialog
  const openReviewDialog = (type: "start" | "schedule") => {
    setReviewType(type);
    setReviewOutcome("NO_CHANGES");
    setReviewFindings("");
    setReviewRecommendations("");
    setReviewDialogOpen(true);
  };

  // Handle submitting review
  const handleSubmitReview = async () => {
    if (!document || !id || !currentUserId) return;

    try {
      setSubmittingReview(true);
      await createReview(id, {
        reviewType: reviewType === "start" ? "SCHEDULED" : "REQUEST",
        outcome: reviewOutcome,
        findings: reviewFindings || undefined,
        recommendations: reviewRecommendations || undefined,
        changesRequired: reviewOutcome !== "NO_CHANGES",
        reviewedById: currentUserId
      });
      setReviewDialogOpen(false);
      // Reload to show updated data
      loadDocument(id);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle submitting for approval
  const handleSubmitForApproval = async () => {
    if (!document || !id) return;

    try {
      setSubmittingApproval(true);

      // Create the approval workflow (this also updates document status to PENDING_APPROVAL)
      await createWorkflow(id, {
        workflowType: document.status === "UNDER_REVISION" ? "REVISION" : "NEW_DOCUMENT",
        steps: workflowSteps.map(step => ({
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

      // Reload to show updated data
      loadDocument(id);
    } catch (error) {
      console.error("Error submitting for approval:", error);
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Open approval dialog and load default workflow based on document type
  const openApprovalDialog = async () => {
    if (!document) return;

    try {
      setLoadingApprovalConfig(true);
      setApprovalDialogOpen(true);

      // Load default workflow config based on document type
      const config = await getDefaultWorkflowByDocumentType(
        document.documentType,
        document.documentOwnerId || undefined
      );

      setApprovalConfig(config);

      // Populate workflow steps from config (now includes steering committee members for policies)
      if (config.steps.length > 0) {
        setWorkflowSteps(config.steps.map(step => ({
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          approverId: step.approverId,
          approverRole: step.approverRole || '',
          dueDate: '',
        })));
      } else {
        // Fallback defaults
        setWorkflowSteps([
          { stepOrder: 1, stepName: "CISO/CIO Approval", approverRole: "CISO", dueDate: "" },
        ]);
      }
    } catch (error) {
      console.error("Error loading approval config:", error);
      // Fallback to basic workflow
      setWorkflowSteps([
        { stepOrder: 1, stepName: "Manager Review", approverRole: "MANAGEMENT", dueDate: "" },
      ]);
    } finally {
      setLoadingApprovalConfig(false);
    }
  };

  // Add a workflow step
  const addWorkflowStep = () => {
    setWorkflowSteps([
      ...workflowSteps,
      {
        stepOrder: workflowSteps.length + 1,
        stepName: `Step ${workflowSteps.length + 1}`,
        approverRole: "MANAGEMENT",
        dueDate: "",
      },
    ]);
  };

  // Remove a workflow step
  const removeWorkflowStep = (index: number) => {
    if (workflowSteps.length <= 1) return;
    const newSteps = workflowSteps.filter((_, i) => i !== index);
    // Renumber steps
    setWorkflowSteps(newSteps.map((step, i) => ({ ...step, stepOrder: i + 1 })));
  };

  // Update a workflow step
  const updateWorkflowStep = (index: number, field: string, value: string) => {
    const newSteps = [...workflowSteps];
    newSteps[index] = { ...newSteps[index]!, [field]: value };
    setWorkflowSteps(newSteps);
  };

  return (
    <div className="space-y-6 pb-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link
              to="/policies/documents"
              className="hover:text-foreground transition-colors"
            >
              Documents
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>{document.documentId}</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={documentTypeColors[document.documentType] || ""}>
              {document.documentType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={statusColors[document.status] || ""}>
              {document.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={classificationColors[document.classification] || ""}>
              {document.classification}
            </Badge>
            <span className="text-sm text-muted-foreground">v{document.version}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportPolicyToPDF(document)}>
                <Printer className="h-4 w-4 mr-2" />
                Print / PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPolicyToMarkdown(document)}>
                <FileDown className="h-4 w-4 mr-2" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPolicyToHTML(document)}>
                <FileText className="h-4 w-4 mr-2" />
                HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to={`/policies/versions?documentId=${id}`}>
            <Button variant="outline" size="sm">
              <GitBranch className="h-4 w-4 mr-2" />
              Versions
            </Button>
          </Link>
          <Link to={`/policies/documents/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {(document.status === "DRAFT" || document.status === "UNDER_REVISION") && (
            <Button size="sm" onClick={openApprovalDialog}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewType === "start" ? "Start Document Review" : "Schedule Document Review"}
            </DialogTitle>
            <DialogDescription>
              {document && (
                <span>
                  Reviewing <span className="font-mono">{document.documentId}</span> - {document.title}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Outcome</label>
              <Select value={reviewOutcome} onValueChange={(v) => setReviewOutcome(v as ReviewOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CHANGES">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      No Changes Required
                    </div>
                  </SelectItem>
                  <SelectItem value="MINOR_CHANGES">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Minor Changes Needed
                    </div>
                  </SelectItem>
                  <SelectItem value="MAJOR_CHANGES">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Major Revision Required
                    </div>
                  </SelectItem>
                  <SelectItem value="SUPERSEDE">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Supersede with New Document
                    </div>
                  </SelectItem>
                  <SelectItem value="RETIRE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Retire Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Findings</label>
              <Textarea
                placeholder="Document any findings from the review..."
                value={reviewFindings}
                onChange={(e) => setReviewFindings(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recommendations</label>
              <Textarea
                placeholder="Add recommendations or action items..."
                value={reviewRecommendations}
                onChange={(e) => setReviewRecommendations(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? "Submitting..." : "Complete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Workflow Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Configure the approval workflow for{" "}
              <span className="font-mono">{document.documentId}</span> - {document.title}
            </DialogDescription>
          </DialogHeader>

          {loadingApprovalConfig ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Document Type Approval Requirements Banner */}
            {document.documentType === 'POLICY' && approvalConfig?.committeeMembers && approvalConfig.committeeMembers.length > 0 ? (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Information Security Steering Committee
                    </p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      {approvalConfig.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {approvalConfig.committeeMembers.map((member) => (
                        <span key={member.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {member.firstName} {member.lastName} ({member.role})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : document.documentType === 'POLICY' ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      No Steering Committee Configured
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      {approvalConfig?.description || 'Please configure the Information Security Steering Committee in the Organisation module, or manually add approvers below.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Default Approvers Applied for {document.documentType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      {approvalConfig?.description || 'Default approval workflow has been applied. You can modify if needed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Approval Steps</Label>
                <Button variant="outline" size="sm" onClick={addWorkflowStep}>
                  + Add Step
                </Button>
              </div>

              {workflowSteps.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No approval steps defined.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "+ Add Step" to add approvers.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {workflowSteps.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {step.stepOrder}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Step Name</Label>
                          <Input
                            value={step.stepName}
                            onChange={(e) => updateWorkflowStep(index, "stepName", e.target.value)}
                            placeholder="e.g., Manager Review"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Approver Role</Label>
                          <Select
                            value={step.approverRole}
                            onValueChange={(v) => updateWorkflowStep(index, "approverRole", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CISO">CISO</SelectItem>
                              <SelectItem value="CIO">CIO</SelectItem>
                              <SelectItem value="Control Owner">Control Owner</SelectItem>
                              <SelectItem value="SENIOR_MANAGEMENT">Senior Management</SelectItem>
                              <SelectItem value="EXECUTIVE">Executive</SelectItem>
                              <SelectItem value="BOARD">Board</SelectItem>
                              <SelectItem value="MANAGEMENT">Management</SelectItem>
                              <SelectItem value="LEGAL">Legal</SelectItem>
                              <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Due Date (Optional)</Label>
                          <Input
                            type="date"
                            value={step.dueDate}
                            onChange={(e) => updateWorkflowStep(index, "dueDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => removeWorkflowStep(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Comments (Optional)</Label>
              <Textarea
                placeholder="Add any comments or context for the approvers..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
              />
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Approval Process
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    The document will progress through each step sequentially. Each approver will receive a
                    notification and can approve, reject, or request changes. The document status will change
                    to "Pending Approval" once submitted.
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForApproval}
              disabled={submittingApproval || workflowSteps.length === 0 || loadingApprovalConfig}
            >
              {submittingApproval ? (
                <>Submitting...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
