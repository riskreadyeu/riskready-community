import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type DefaultWorkflowConfig, type PolicyDocument } from "@/lib/policies-api";
import { type PolicyWorkflowStepDraft } from "@/hooks/policies/usePolicyDocumentDetail";

type PolicyApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PolicyDocument;
  loadingApprovalConfig: boolean;
  approvalConfig: DefaultWorkflowConfig | null;
  workflowSteps: PolicyWorkflowStepDraft[];
  onAddWorkflowStep: () => void;
  onRemoveWorkflowStep: (index: number) => void;
  onUpdateWorkflowStep: (
    index: number,
    field: "stepName" | "approverRole" | "dueDate",
    value: string
  ) => void;
  approvalComments: string;
  onApprovalCommentsChange: (value: string) => void;
  submittingApproval: boolean;
  onSubmit: () => void;
};

export function PolicyApprovalDialog({
  open,
  onOpenChange,
  document,
  loadingApprovalConfig,
  approvalConfig,
  workflowSteps,
  onAddWorkflowStep,
  onRemoveWorkflowStep,
  onUpdateWorkflowStep,
  approvalComments,
  onApprovalCommentsChange,
  submittingApproval,
  onSubmit,
}: PolicyApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {document.documentType === "POLICY" &&
            approvalConfig?.committeeMembers &&
            approvalConfig.committeeMembers.length > 0 ? (
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
                        <span
                          key={member.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        >
                          {member.firstName} {member.lastName} ({member.role})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : document.documentType === "POLICY" ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      No Steering Committee Configured
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      {approvalConfig?.description ||
                        "Please configure the Information Security Steering Committee in the Organisation module, or manually add approvers below."}
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
                      Default Approvers Applied for {document.documentType.replace(/_/g, " ")}
                    </p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      {approvalConfig?.description ||
                        "Default approval workflow has been applied. You can modify if needed."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Approval Steps</Label>
                <Button variant="outline" size="sm" onClick={onAddWorkflowStep}>
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
                  <Card key={`${step.stepOrder}-${index}`} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {step.stepOrder}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Step Name</Label>
                          <Input
                            value={step.stepName}
                            onChange={(event) =>
                              onUpdateWorkflowStep(index, "stepName", event.target.value)
                            }
                            placeholder="e.g., Manager Review"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Approver Role</Label>
                          <Select
                            value={step.approverRole}
                            onValueChange={(value) =>
                              onUpdateWorkflowStep(index, "approverRole", value)
                            }
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
                          <Label className="text-xs text-muted-foreground">
                            Due Date (Optional)
                          </Label>
                          <Input
                            type="date"
                            value={step.dueDate}
                            onChange={(event) =>
                              onUpdateWorkflowStep(index, "dueDate", event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => onRemoveWorkflowStep(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Comments (Optional)</Label>
              <Textarea
                placeholder="Add any comments or context for the approvers..."
                value={approvalComments}
                onChange={(event) => onApprovalCommentsChange(event.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Approval Process
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    The document will progress through each step sequentially. Each approver will
                    receive a notification and can approve, reject, or request changes. The
                    document status will change to "Pending Approval" once submitted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
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
  );
}
