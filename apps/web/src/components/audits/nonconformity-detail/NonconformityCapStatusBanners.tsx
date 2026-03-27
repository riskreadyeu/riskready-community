import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Nonconformity } from "@/lib/audits-api";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Edit,
  FileText,
  SkipForward,
  ThumbsUp,
  XCircle,
} from "lucide-react";

type NonconformityCapStatusBannersProps = {
  nc: Nonconformity;
  isOverdue: boolean;
  canSkipCap: boolean;
  onSkipCap: () => void;
  onDefineCap: () => void;
  onApproveCap: () => void;
};

export function NonconformityCapStatusBanners({
  nc,
  isOverdue,
  canSkipCap,
  onSkipCap,
  onDefineCap,
  onApproveCap,
}: NonconformityCapStatusBannersProps) {
  return (
    <>
      {nc.status === "DRAFT" && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400">Pending Review</p>
                <p className="text-sm text-muted-foreground">
                  This nonconformity was auto-created from a failed test and needs manual review.
                  Please complete the review to confirm or reject this NC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {nc.status === "OPEN" && nc.capStatus === "NOT_DEFINED" && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">CAP Required</p>
                  <p className="text-sm text-muted-foreground">
                    Define a Corrective Action Plan before work can begin on this nonconformity.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {canSkipCap && (
                  <Button variant="outline" size="sm" onClick={onSkipCap}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip CAP
                  </Button>
                )}
                <Button size="sm" onClick={onDefineCap}>
                  <FileText className="w-4 h-4 mr-2" />
                  Define CAP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {nc.capStatus === "PENDING_APPROVAL" && (
        <Card className="border-purple-500 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-400">
                    CAP Awaiting Approval
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The Corrective Action Plan has been submitted and is waiting for approval.
                    {nc.capSubmittedAt &&
                      ` Submitted on ${format(new Date(nc.capSubmittedAt), "dd MMM yyyy")}.`}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={onApproveCap}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Review CAP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {nc.capStatus === "REJECTED" && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">CAP Rejected</p>
                  <p className="text-sm text-muted-foreground">{nc.capRejectionReason}</p>
                  {nc.capRejectedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rejected by {nc.capRejectedBy.firstName} {nc.capRejectedBy.lastName}
                      {nc.capRejectedAt &&
                        ` on ${format(new Date(nc.capRejectedAt), "dd MMM yyyy")}`}
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={onDefineCap}>
                <Edit className="w-4 h-4 mr-2" />
                Revise CAP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOverdue && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Overdue</p>
                <p className="text-sm text-muted-foreground">
                  Target closure date was {format(new Date(nc.targetClosureDate!), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
