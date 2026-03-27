import { Section } from "@/components/archer/section";
import { ProgressTracker } from "@/components/archer/progress-tracker";
import { AuditLog } from "@/components/archer/audit-log";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText } from "lucide-react";
import type { StatementOfApplicability, SOAStatus } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface SOAApprovalTabProps {
  soa: StatementOfApplicability;
}

// =============================================================================
// Configuration
// =============================================================================

const statusConfig: Record<
  SOAStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_REVIEW: { label: "Pending Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  SUPERSEDED: { label: "Superseded", variant: "destructive" },
};

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
  if (!user) return "—";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email;
};

// =============================================================================
// Component
// =============================================================================

/**
 * SOAApprovalTab - Workflow progress and approval history.
 *
 * Displays workflow stages using ProgressTracker and approval audit trail
 * using AuditLog. Shows current status and approval metadata.
 */
export function SOAApprovalTab({ soa }: SOAApprovalTabProps) {
  const config = statusConfig[soa.status];

  // Build workflow stages
  const workflowStages = [
    {
      id: "draft",
      label: "Draft",
      complete: soa.status !== "DRAFT",
      current: soa.status === "DRAFT",
    },
    {
      id: "review",
      label: "Pending Review",
      complete: soa.status === "APPROVED" || soa.status === "SUPERSEDED",
      current: soa.status === "PENDING_REVIEW",
    },
    {
      id: "approved",
      label: "Approved",
      complete: soa.status === "APPROVED" || soa.status === "SUPERSEDED",
      current: soa.status === "APPROVED",
    },
  ];

  // Build audit entries from available data
  const auditEntries = [
    {
      id: "created",
      action: "Created",
      timestamp: soa.createdAt,
      user: { name: formatUserName(soa.createdBy) },
      details: `SOA version ${soa.version} created`,
    },
    soa.status === "PENDING_REVIEW" ||
    soa.status === "APPROVED" ||
    soa.status === "SUPERSEDED"
      ? {
          id: "submitted",
          action: "Submitted for Review",
          timestamp: soa.updatedAt,
          user: { name: formatUserName(soa.updatedBy) },
          details: "SOA submitted for approval",
        }
      : null,
    soa.approvedAt
      ? {
          id: "approved",
          action: "Approved",
          timestamp: soa.approvedAt,
          user: { name: formatUserName(soa.approvedBy) },
          details: "SOA approved and activated",
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    action: string;
    timestamp: string;
    user: { name: string };
    details: string;
  }>;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Section title="Current Status" icon={FileText}>
        <div className="flex items-center gap-4">
          <Badge variant={config.variant} className="text-base px-4 py-2">
            {config.label}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Last updated: {formatDate(soa.updatedAt)}
          </div>
        </div>
      </Section>

      {/* Workflow Progress */}
      <Section title="Workflow Progress" icon={Clock}>
        <ProgressTracker
          steps={workflowStages.map((stage) => ({
            id: stage.id,
            label: stage.label,
            status: stage.current
              ? ("current" as const)
              : stage.complete
                ? ("completed" as const)
                : ("pending" as const),
          }))}
        />
      </Section>

      {/* Approval Details */}
      {soa.approvedAt && (
        <Section title="Approval Details" icon={CheckCircle}>
          <div className="rounded-md bg-green-50 border border-green-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <CheckCircle className="h-5 w-5" />
              <span>Approved</span>
            </div>
            <div className="text-sm text-green-700">
              <div>
                <span className="font-medium">Date:</span> {formatDate(soa.approvedAt)}
              </div>
              <div>
                <span className="font-medium">Approver:</span> {formatUserName(soa.approvedBy)}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Audit History */}
      <Section title="Audit History" icon={FileText}>
        <AuditLog entries={auditEntries} />
      </Section>
    </div>
  );
}
