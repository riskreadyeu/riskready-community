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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Nonconformity } from "@/lib/audits-api";

interface CompleteNCDialogProps {
  nc: Nonconformity;
  users: Array<{ id: string; email: string; firstName?: string; lastName?: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: {
    responsibleUserId: string;
    targetClosureDate: Date;
    additionalContext?: string;
  }) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function CompleteNCDialog({
  nc,
  users,
  open,
  onOpenChange,
  onComplete,
  onReject,
}: CompleteNCDialogProps) {
  const [mode, setMode] = useState<"review" | "complete" | "reject">("review");
  const [responsibleUserId, setResponsibleUserId] = useState<string>("");
  const [targetDate, setTargetDate] = useState<Date>();
  const [additionalContext, setAdditionalContext] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!responsibleUserId || !targetDate) return;

    try {
      setIsSubmitting(true);
      await onComplete({
        responsibleUserId,
        targetClosureDate: targetDate,
        additionalContext: additionalContext || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error completing NC:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    try {
      setIsSubmitting(true);
      await onReject(rejectReason);
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error rejecting NC:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMode("review");
    setResponsibleUserId("");
    setTargetDate(undefined);
    setAdditionalContext("");
    setRejectReason("");
  };

  const isFormValid = responsibleUserId && targetDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {mode === "review" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <DialogTitle>Review Auto-Created Nonconformity</DialogTitle>
              </div>
              <DialogDescription>
                This nonconformity was automatically created from a failed test.
                Please review the details and decide the next action.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* NC Summary */}
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">NC ID</Label>
                  <p className="font-mono font-semibold">{nc.ncId}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="font-medium">{nc.title}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm text-muted-foreground">{nc.description}</p>
                </div>

                {nc.findings && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Findings</Label>
                    <p className="text-sm">{nc.findings}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Severity</Label>
                    <p className="font-semibold text-sm">
                      {nc.severity === "MAJOR" ? "🔴 Major" : "🟡 Minor"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <p className="text-sm">{nc.source.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>

              {/* Decision */}
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
                <Label className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  What would you like to do?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirm this is a valid nonconformity or reject if it's not a real issue.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("reject")}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject NC
              </Button>
              <Button
                onClick={() => setMode("complete")}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete & Open NC
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "complete" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Nonconformity Details</DialogTitle>
              <DialogDescription>
                Please provide the required information to open this nonconformity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Responsible Person */}
              <div className="space-y-2">
                <Label htmlFor="responsible" className="required">
                  Responsible Person *
                </Label>
                <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
                  <SelectTrigger id="responsible">
                    <SelectValue placeholder="Select person responsible for remediation" />
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
                <p className="text-xs text-muted-foreground">
                  Person responsible for implementing corrective actions
                </p>
              </div>

              {/* Target Closure Date */}
              <div className="space-y-2">
                <Label htmlFor="target-date" className="required">
                  Target Completion Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="target-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !targetDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP") : "Pick a date"}
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
                <p className="text-xs text-muted-foreground">
                  {nc.severity === "MAJOR"
                    ? "Major NCs typically require closure within 30 days"
                    : "Minor NCs typically require closure within 90 days"}
                </p>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any additional context or notes about this NC..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("review")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!isFormValid || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Open Nonconformity
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "reject" && (
          <>
            <DialogHeader>
              <DialogTitle>Reject Nonconformity</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this auto-created nonconformity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Rejecting this NC means it's not a valid nonconformity. It will be marked
                  as REJECTED and archived for audit trail purposes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason" className="required">
                  Reason for Rejection *
                </Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this is not a valid nonconformity..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be recorded in the audit trail
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("review")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject Nonconformity
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}











