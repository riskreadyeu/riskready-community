"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ArrowRight,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  Filter,
  ChevronRight,
  ChevronDown,
  Send,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getPolicies,
  getWorkflows,
  getCurrentWorkflow,
  processApprovalStep,
  PolicyDocument,
  ApprovalWorkflow,
  ApprovalStep,
  ApprovalStepStatus,
  WorkflowStatus,
  ApprovalDecision,
} from "@/lib/policies-api";

// Status colors
const stepStatusColors: Record<ApprovalStepStatus, string> = {
  PENDING: "bg-gray-500",
  IN_REVIEW: "bg-blue-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  SKIPPED: "bg-gray-400",
  DELEGATED: "bg-purple-500",
};

const workflowStatusBadges: Record<WorkflowStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  ESCALATED: { label: "Escalated", variant: "destructive" },
};

interface WorkflowProgressProps {
  workflow: ApprovalWorkflow;
  onProcess?: (stepId: string) => void;
}

function WorkflowProgress({ workflow, onProcess }: WorkflowProgressProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">
                {workflow.document?.title || "Document"}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {workflow.document?.documentId}
              </CardDescription>
            </div>
          </div>
          <Badge variant={workflowStatusBadges[workflow.status].variant}>
            {workflowStatusBadges[workflow.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {workflow.steps.map((step, index) => {
              const isActive = step.stepOrder === workflow.currentStepOrder;
              const isCompleted = step.status === "APPROVED" || step.status === "SKIPPED";
              const isRejected = step.status === "REJECTED";

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted && "border-green-500 bg-green-500 text-white",
                      isRejected && "border-red-500 bg-red-500 text-white",
                      isActive && !isCompleted && !isRejected && "border-primary bg-primary/10 text-primary",
                      !isActive && !isCompleted && !isRejected && "border-muted-foreground/30 bg-muted"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isRejected ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.stepOrder}</span>
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  {/* Connector Line */}
                  {index < workflow.steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Labels */}
          <div className="flex items-start justify-between">
            {workflow.steps.map((step) => (
              <div key={step.id} className="flex-1 text-center px-2">
                <p className="text-xs font-medium truncate">{step.stepName}</p>
                {step.approver && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {step.approver.firstName} {step.approver.lastName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Details */}
        <div className="space-y-3">
          {workflow.steps.map((step) => {
            const isActive = step.stepOrder === workflow.currentStepOrder && 
                           workflow.status === "IN_PROGRESS";
            const statusColor = stepStatusColors[step.status];

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border",
                  isActive && "border-primary bg-primary/5"
                )}
              >
                <div className={cn("h-2 w-2 rounded-full", statusColor)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.stepName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      Step {step.stepOrder}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {step.approver 
                      ? `${step.approver.firstName} ${step.approver.lastName}`
                      : step.approverRole || "Unassigned"
                    }
                    {step.dueDate && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        Due: {new Date(step.dueDate).toLocaleDateString()}
                      </>
                    )}
                  </div>
                  {step.comments && (
                    <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mt-0.5" />
                      <span className="italic">"{step.comments}"</span>
                    </div>
                  )}
                </div>
                {isActive && onProcess && (
                  <Button size="sm" onClick={() => onProcess(step.id)}>
                    Process
                  </Button>
                )}
                {step.status === "APPROVED" && (
                  <CheckCheck className="h-5 w-5 text-green-500" />
                )}
                {step.status === "REJECTED" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Initiated by {workflow.initiatedBy?.firstName} {workflow.initiatedBy?.lastName} on{" "}
            {new Date(workflow.initiatedAt).toLocaleDateString()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/policies/documents/${workflow.document?.id}`)}
          >
            View Document
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | "ALL">("ALL");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Process dialog
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision>("APPROVE");
  const [comments, setComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get documents with pending approval status
      const docsData = await getPolicies({ status: "PENDING_APPROVAL", take: 100 });
      setDocuments(docsData.results);

      // Load workflows for each document
      const allWorkflows: ApprovalWorkflow[] = [];
      for (const doc of docsData.results) {
        try {
          const docWorkflows = await getWorkflows(doc.id);
          allWorkflows.push(...docWorkflows.map(w => ({
            ...w,
            document: { id: doc.id, documentId: doc.documentId, title: doc.title }
          })));
        } catch (e) {
          console.error(`Failed to load workflows for document ${doc.id}:`, e);
        }
      }
      setWorkflows(allWorkflows);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (stepId: string) => {
    setSelectedStep(stepId);
    setDecision("APPROVE");
    setComments("");
    setProcessDialogOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedStep) return;

    try {
      setProcessing(true);
      await processApprovalStep(selectedStep, {
        decision,
        comments,
        userId: "current-user-id", // Replace with actual user
      });
      setProcessDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error processing step:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Filter workflows
  const filteredWorkflows = filterStatus === "ALL"
    ? workflows
    : workflows.filter(w => w.status === filterStatus);

  // Count by status
  const countByStatus = workflows.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground">
            Review and process document approvals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className={cn("cursor-pointer", filterStatus === "IN_PROGRESS" && "ring-2 ring-primary")}
          onClick={() => setFilterStatus(filterStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus["IN_PROGRESS"] || 0}</div>
          </CardContent>
        </Card>
        <Card
          className={cn("cursor-pointer", filterStatus === "PENDING" && "ring-2 ring-primary")}
          onClick={() => setFilterStatus(filterStatus === "PENDING" ? "ALL" : "PENDING")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus["PENDING"] || 0}</div>
          </CardContent>
        </Card>
        <Card
          className={cn("cursor-pointer", filterStatus === "APPROVED" && "ring-2 ring-primary")}
          onClick={() => setFilterStatus(filterStatus === "APPROVED" ? "ALL" : "APPROVED")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus["APPROVED"] || 0}</div>
          </CardContent>
        </Card>
        <Card
          className={cn("cursor-pointer", filterStatus === "REJECTED" && "ring-2 ring-primary")}
          onClick={() => setFilterStatus(filterStatus === "REJECTED" ? "ALL" : "REJECTED")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus["REJECTED"] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No approval workflows</h3>
            <p className="text-muted-foreground">
              {filterStatus !== "ALL"
                ? `No workflows with status "${filterStatus.toLowerCase().replace("_", " ")}"`
                : "All caught up! No pending approvals at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => (
            <WorkflowProgress
              key={workflow.id}
              workflow={workflow}
              onProcess={workflow.status === "IN_PROGRESS" ? handleProcess : undefined}
            />
          ))}
        </div>
      )}

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Approval Step</DialogTitle>
            <DialogDescription>
              Select your decision and provide any comments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Decision</label>
              <Select value={decision} onValueChange={(v) => setDecision(v as ApprovalDecision)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVE">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Approve
                    </div>
                  </SelectItem>
                  <SelectItem value="APPROVE_WITH_CHANGES">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                      Approve with Changes
                    </div>
                  </SelectItem>
                  <SelectItem value="REQUEST_CHANGES">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Request Changes
                    </div>
                  </SelectItem>
                  <SelectItem value="REJECT">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reject
                    </div>
                  </SelectItem>
                  <SelectItem value="DELEGATE">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-purple-500" />
                      Delegate
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                placeholder="Add any comments or feedback..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDecision} disabled={processing}>
              {processing ? "Processing..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
