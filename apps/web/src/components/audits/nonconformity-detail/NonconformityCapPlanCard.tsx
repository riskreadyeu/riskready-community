import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DetailStatCard } from "@/components/controls/detail-components/detail-stat-card";
import { cn } from "@/lib/utils";
import { type CAPStatus, type Nonconformity } from "@/lib/audits-api";
import {
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  SkipForward,
  Target,
  User,
  XCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

const CAP_STATUS_CONFIG: Record<
  CAPStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  NOT_REQUIRED: {
    label: "Not Required",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: SkipForward,
  },
  NOT_DEFINED: {
    label: "Not Defined",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    icon: AlertCircle,
  },
  DRAFT: {
    label: "Draft",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: FileText,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    icon: XCircle,
  },
};

type NonconformityCapPlanCardProps = {
  nc: Nonconformity;
  isOverdue: boolean;
  canDefineCap: boolean;
  onDefineCap: () => void;
};

export function NonconformityCapPlanCard({
  nc,
  isOverdue,
  canDefineCap,
  onDefineCap,
}: NonconformityCapPlanCardProps) {
  const capStatusConfig = CAP_STATUS_CONFIG[nc.capStatus];
  const CapStatusIcon = capStatusConfig.icon;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Corrective Action Plan (CAP)
          <Badge className={cn("text-xs ml-2", capStatusConfig.bgColor, capStatusConfig.color)}>
            <CapStatusIcon className="w-3 h-3 mr-1" />
            {capStatusConfig.label}
          </Badge>
        </CardTitle>
        {canDefineCap && (
          <Button variant="outline" size="sm" onClick={onDefineCap}>
            <Edit className="w-4 h-4 mr-2" />
            {nc.capStatus === "NOT_DEFINED" ? "Define" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {nc.correctiveAction ? (
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Action Plan</Label>
            <p className="mt-2 text-sm whitespace-pre-wrap">{nc.correctiveAction}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No corrective action plan defined yet</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          {nc.responsibleUser && (
            <DetailStatCard
              icon={<User className="w-4 h-4 text-primary" />}
              label="Responsible"
              value={`${nc.responsibleUser.firstName} ${nc.responsibleUser.lastName}`}
              className="col-span-1"
            />
          )}

          {nc.targetClosureDate && (
            <DetailStatCard
              icon={<Target className="w-4 h-4 text-primary" />}
              label="Target Date"
              value={format(new Date(nc.targetClosureDate), "dd MMM yyyy")}
              status={isOverdue ? "destructive" : undefined}
              className="col-span-1"
            />
          )}
        </div>

        {nc.capStatus === "APPROVED" && nc.capApprovedBy && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Approved by {nc.capApprovedBy.firstName} {nc.capApprovedBy.lastName}
                {nc.capApprovedAt && ` on ${format(new Date(nc.capApprovedAt), "dd MMM yyyy")}`}
              </span>
            </div>
            {nc.capApprovalComments && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{nc.capApprovalComments}"
              </p>
            )}
          </div>
        )}

        {nc.capDraftedBy && nc.capStatus !== "APPROVED" && (
          <div className="text-xs text-muted-foreground pt-2">
            Last edited by {nc.capDraftedBy.firstName} {nc.capDraftedBy.lastName}
            {nc.capDraftedAt && ` on ${format(new Date(nc.capDraftedAt), "dd MMM yyyy")}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
