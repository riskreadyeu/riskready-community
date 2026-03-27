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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import {
  CalendarIcon,
  FileText,
  User,
  Target,
  AlertTriangle,
  Save,
  Send,
  Loader2,
} from "lucide-react";
import type { Nonconformity, UserBasic, CAPStatus } from "@/lib/audits-api";

interface DefineCapDialogProps {
  nc: Nonconformity;
  users: UserBasic[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveDraft: (data: {
    correctiveAction: string;
    rootCause?: string;
    responsibleUserId: string;
    targetClosureDate: Date;
  }) => Promise<void>;
  onSubmitForApproval: () => Promise<void>;
}

const CAP_STATUS_CONFIG: Record<CAPStatus, { label: string; color: string; bgColor: string }> = {
  NOT_REQUIRED: { label: "Not Required", color: "text-muted-foreground", bgColor: "bg-muted" },
  NOT_DEFINED: { label: "Not Defined", color: "text-amber-600", bgColor: "bg-amber-100" },
  DRAFT: { label: "Draft", color: "text-blue-600", bgColor: "bg-blue-100" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "text-purple-600", bgColor: "bg-purple-100" },
  APPROVED: { label: "Approved", color: "text-green-600", bgColor: "bg-green-100" },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10" },
};

export function DefineCapDialog({
  nc,
  users,
  open,
  onOpenChange,
  onSaveDraft,
  onSubmitForApproval,
}: DefineCapDialogProps) {
  // Form state - initialize with existing values if any
  const [correctiveAction, setCorrectiveAction] = useState(nc.correctiveAction || "");
  const [rootCause, setRootCause] = useState(nc.rootCause || "");
  const [responsibleUserId, setResponsibleUserId] = useState(nc.responsibleUserId || "");
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    nc.targetClosureDate ? new Date(nc.targetClosureDate) : undefined
  );
  
  // Loading states
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isFormValid = correctiveAction.trim() && responsibleUserId && targetDate;
  const canEdit = ["NOT_DEFINED", "DRAFT", "REJECTED"].includes(nc.capStatus);
  const canSubmit = nc.capStatus === "DRAFT" && isFormValid;

  // Suggested target dates based on severity
  const getSuggestedDays = () => {
    switch (nc.severity) {
      case "MAJOR": return 30;
      case "MINOR": return 60;
      case "OBSERVATION": return 90;
      default: return 30;
    }
  };

  const handleSaveDraft = async () => {
    if (!isFormValid || !targetDate) return;
    
    setSavingDraft(true);
    try {
      await onSaveDraft({
        correctiveAction,
        rootCause: rootCause || undefined,
        responsibleUserId,
        targetClosureDate: targetDate,
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!canSubmit) return;
    
    setSubmitting(true);
    try {
      await onSubmitForApproval();
    } finally {
      setSubmitting(false);
    }
  };

  const capStatusConfig = CAP_STATUS_CONFIG[nc.capStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Define Corrective Action Plan (CAP)</DialogTitle>
            <Badge className={cn("text-xs", capStatusConfig.bgColor, capStatusConfig.color)}>
              {capStatusConfig.label}
            </Badge>
          </div>
          <DialogDescription>
            Define the corrective action plan for nonconformity <span className="font-mono font-semibold">{nc.ncId}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Rejection Warning */}
        {nc.capStatus === "REJECTED" && nc.capRejectionReason && (
          <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">CAP was rejected</p>
                <p className="text-sm text-muted-foreground mt-1">{nc.capRejectionReason}</p>
                {nc.capRejectedBy && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Rejected by {nc.capRejectedBy.firstName} {nc.capRejectedBy.lastName}
                    {nc.capRejectedAt && ` on ${format(new Date(nc.capRejectedAt), "dd MMM yyyy")}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NC Summary */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <h4 className="font-semibold text-sm">{nc.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{nc.description}</p>
          <div className="flex gap-2 pt-1">
            <Badge variant="outline" className="text-xs">
              {nc.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {nc.category.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <div className="space-y-5 py-2">
          {/* Root Cause Analysis */}
          <div className="space-y-2">
            <Label htmlFor="rootCause" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Root Cause Analysis
            </Label>
            <Textarea
              id="rootCause"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Describe the root cause of this nonconformity. What underlying factors led to this issue?"
              className="min-h-[80px]"
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              Understanding the root cause helps prevent recurrence
            </p>
          </div>

          {/* Corrective Action */}
          <div className="space-y-2">
            <Label htmlFor="correctiveAction" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Corrective Action Plan *
            </Label>
            <Textarea
              id="correctiveAction"
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Describe the specific actions that will be taken to address this nonconformity and prevent recurrence..."
              className="min-h-[120px]"
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what actions will be taken, by whom, and how success will be measured
            </p>
          </div>

          {/* Responsible Person */}
          <div className="space-y-2">
            <Label htmlFor="responsible" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Responsible Person *
            </Label>
            <Select 
              value={responsibleUserId} 
              onValueChange={setResponsibleUserId}
              disabled={!canEdit}
            >
              <SelectTrigger id="responsible">
                <SelectValue placeholder="Select person responsible for implementing corrective actions" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Target Completion Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                  disabled={!canEdit}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : "Select target completion date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {nc.severity === "MAJOR" && "Major NCs typically require closure within 30 days"}
                {nc.severity === "MINOR" && "Minor NCs typically require closure within 60 days"}
                {nc.severity === "OBSERVATION" && "Observations typically require closure within 90 days"}
              </p>
              {canEdit && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setTargetDate(addDays(new Date(), getSuggestedDays()))}
                >
                  Set suggested date
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!isFormValid || savingDraft || submitting}
              >
                {savingDraft ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save as Draft
              </Button>
              
              {nc.capStatus === "DRAFT" && (
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={!canSubmit || savingDraft || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit for Approval
                </Button>
              )}
            </>
          )}

          {!canEdit && (
            <p className="text-sm text-muted-foreground">
              CAP cannot be edited while in {capStatusConfig.label} status
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}











