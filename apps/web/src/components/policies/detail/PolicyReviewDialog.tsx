import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type PolicyDocument, type ReviewOutcome } from "@/lib/policies-api";

type PolicyReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PolicyDocument;
  reviewType: "start" | "schedule";
  reviewOutcome: ReviewOutcome;
  onReviewOutcomeChange: (value: ReviewOutcome) => void;
  reviewFindings: string;
  onReviewFindingsChange: (value: string) => void;
  reviewRecommendations: string;
  onReviewRecommendationsChange: (value: string) => void;
  submittingReview: boolean;
  onSubmit: () => void;
};

export function PolicyReviewDialog({
  open,
  onOpenChange,
  document,
  reviewType,
  reviewOutcome,
  onReviewOutcomeChange,
  reviewFindings,
  onReviewFindingsChange,
  reviewRecommendations,
  onReviewRecommendationsChange,
  submittingReview,
  onSubmit,
}: PolicyReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {reviewType === "start" ? "Start Document Review" : "Schedule Document Review"}
          </DialogTitle>
          <DialogDescription>
            <span>
              Reviewing <span className="font-mono">{document.documentId}</span> - {document.title}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Review Outcome</label>
            <Select
              value={reviewOutcome}
              onValueChange={(value) => onReviewOutcomeChange(value as ReviewOutcome)}
            >
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
              onChange={(event) => onReviewFindingsChange(event.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Recommendations</label>
            <Textarea
              placeholder="Add recommendations or action items..."
              value={reviewRecommendations}
              onChange={(event) => onReviewRecommendationsChange(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submittingReview}>
            {submittingReview ? "Submitting..." : "Complete Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
