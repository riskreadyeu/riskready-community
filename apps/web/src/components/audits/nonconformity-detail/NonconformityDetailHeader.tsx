import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { type NCStatus, type Nonconformity } from "@/lib/audits-api";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileWarning,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

const SEVERITY_CONFIG = {
  MAJOR: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    status: "destructive" as const,
  },
  MINOR: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    status: "warning" as const,
  },
  OBSERVATION: {
    icon: FileWarning,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    status: "muted" as const,
  },
};

const STATUS_CONFIG: Record<
  NCStatus,
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  DRAFT: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
    label: "Pending Review",
  },
  OPEN: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Open",
  },
  IN_PROGRESS: {
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "In Progress",
  },
  AWAITING_VERIFICATION: {
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Awaiting Verification",
  },
  VERIFIED_EFFECTIVE: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Verified Effective",
  },
  VERIFIED_INEFFECTIVE: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Verified Ineffective",
  },
  CLOSED: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Closed",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Rejected",
  },
};

type NonconformityDetailHeaderProps = {
  nc: Nonconformity;
  isOverdue: boolean;
  onClose: () => void;
};

export function NonconformityDetailHeader({
  nc,
  isOverdue,
  onClose,
}: NonconformityDetailHeaderProps) {
  const severityConfig = SEVERITY_CONFIG[nc.severity];
  const statusConfig = STATUS_CONFIG[nc.status];
  const SeverityIcon = severityConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <DetailHero
      backLink="/audits/nonconformities"
      backLabel="Back to NC Register"
      icon={<FileWarning className="w-6 h-6 text-primary" />}
      badge={
        <>
          <Badge
            variant="outline"
            className={`${severityConfig.bgColor} ${severityConfig.color} border-transparent`}
          >
            <SeverityIcon className="w-3 h-3 mr-1" />
            {nc.severity}
          </Badge>
          <Badge
            variant="outline"
            className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </>
      }
      title={nc.title}
      subtitle={nc.ncId}
      description={nc.description}
      metadata={[
        {
          label: "Source",
          value: (
            <Badge variant="secondary" className="text-[10px]">
              {nc.source.replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          label: "Category",
          value: (
            <Badge variant="outline" className="text-[10px]">
              {nc.category.replace(/_/g, " ")}
            </Badge>
          ),
        },
        ...(nc.isoClause
          ? [{ label: "ISO Clause", value: <span className="font-mono">{nc.isoClause}</span> }]
          : []),
        {
          label: "Raised",
          value: format(new Date(nc.dateRaised), "dd MMM yyyy"),
          icon: <Calendar className="w-3 h-3 text-muted-foreground" />,
        },
      ]}
      actions={
        <>
          {nc.status === "DRAFT" ? (
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={() => toast.info("Complete review coming soon")}
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Review
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Edit coming soon")}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {nc.status !== "CLOSED" && (
                <Button variant="default" size="sm" onClick={onClose}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Close NC
                </Button>
              )}
            </>
          )}
        </>
      }
      statusColor={isOverdue ? "destructive" : severityConfig.status}
    />
  );
}
