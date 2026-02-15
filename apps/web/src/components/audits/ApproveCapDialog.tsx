import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Target,
  FileText,
  AlertTriangle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { Nonconformity } from "@/lib/audits-api";

interface ApproveCapDialogProps {
  nc: Nonconformity;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (comments?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

type Mode = "review" | "approve" | "reject";

export function ApproveCapDialog({
  nc,
  currentUserId,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApproveCapDialogProps) {
  const [mode, setMode] = useState<Mode>("review");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Self-approval check
  const isSelfApproval = nc.capDraftedById === currentUserId;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(approvalComments || undefined);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    setProcessing(true);
    try {
      await onReject(rejectionReason);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  const resetAndClose = () => {
    setMode("review");
    setApprovalComments("");
    setRejectionReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Review CAP for Approval</DialogTitle>
            <Badge className="bg-purple-100 text-purple-600 text-xs">
              Pending Approval
            </Badge>
          </div>
          <DialogDescription>
            Review the Corrective Action Plan for <span className="font-mono font-semibold">{nc.ncId}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Self-approval Warning */}
        {isSelfApproval && (
          <div className="rounded-lg border border-amber-500 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-700">Self-approval not allowed</p>
                <p className="text-sm text-amber-600 mt-1">
                  You drafted this CAP and cannot approve it. Please have another team member review and approve.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Mode */}
        {mode === "review" && (
          <>
            {/* NC Summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="font-semibold">{nc.title}</h4>
              <p className="text-sm text-muted-foreground">{nc.description}</p>
              <div className="flex gap-2 pt-1">
                <Badge variant="outline" className="text-xs">
                  {nc.severity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {nc.source.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* CAP Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Corrective Action Plan
              </h4>

              {/* Root Cause */}
              {nc.rootCause && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Root Cause Analysis</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {nc.rootCause}
                  </p>
                </div>
              )}

              {/* Corrective Action */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Corrective Action</Label>
                <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {nc.correctiveAction || "Not defined"}
                </p>
              </div>

              {/* Responsible & Target */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-xs">Responsible Person</span>
                  </div>
                  <p className="font-medium">
                    {nc.responsibleUser 
                      ? `${nc.responsibleUser.firstName || ""} ${nc.responsibleUser.lastName || ""}`.trim() || nc.responsibleUser.email
                      : "Not assigned"}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs">Target Completion</span>
                  </div>
                  <p className="font-medium">
                    {nc.targetClosureDate 
                      ? format(new Date(nc.targetClosureDate), "dd MMM yyyy")
                      : "Not set"}
                  </p>
                </div>
              </div>

              {/* Drafted By */}
              {nc.capDraftedBy && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Drafted by {nc.capDraftedBy.firstName} {nc.capDraftedBy.lastName}
                  {nc.capDraftedAt && ` on ${format(new Date(nc.capDraftedAt), "dd MMM yyyy")}`}
                </div>
              )}
            </div>

            <Separator />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setMode("reject")}
                disabled={processing}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject CAP
              </Button>
              <Button
                onClick={() => setMode("approve")}
                disabled={isSelfApproval || processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve CAP
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Approve Mode */}
        {mode === "approve" && (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-700">Approve Corrective Action Plan</p>
                  <p className="text-sm text-green-600 mt-1">
                    Once approved, the NC will move to "In Progress" and work can begin on implementing the corrective actions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalComments">Approval Comments (Optional)</Label>
              <Textarea
                id="approvalComments"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="Add any comments or notes about the approval..."
                className="min-h-[100px]"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("review")}
                disabled={processing}
              >
                Back
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirm Approval
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Reject Mode */}
        {mode === "reject" && (
          <>
            <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
              <div className="flex gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Reject Corrective Action Plan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The CAP will be sent back for revision. Please provide a clear reason so the author can improve the plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the CAP is being rejected and what needs to be improved..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what needs to change for the CAP to be approved
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("review")}
                disabled={processing}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject CAP
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}











