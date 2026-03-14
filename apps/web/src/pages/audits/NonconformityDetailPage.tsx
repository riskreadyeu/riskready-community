import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { DetailStatCard } from "@/components/controls/detail-components/detail-stat-card";
import { DefineCapDialog } from "@/components/audits/DefineCapDialog";
import { ApproveCapDialog } from "@/components/audits/ApproveCapDialog";
import {
  closeNonconformity,
  saveCapDraft,
  submitCapForApproval,
  approveCap,
  rejectCap,
  markCapNotRequired,
  type NCStatus,
  type CAPStatus,
} from "@/lib/audits-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNonconformityDetail } from "@/hooks/audits/useNonconformityDetail";
import { notifyError } from "@/lib/app-errors";
import {
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileWarning,
  Calendar,
  User,
  Target,
  AlertTriangle,
  ExternalLink,
  Clock,
  Shield,
  Layers3,
  TestTube,
  FileText,
  Send,
  ThumbsUp,
  SkipForward,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  MAJOR: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10", status: "destructive" as const },
  MINOR: { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10", status: "warning" as const },
  OBSERVATION: { icon: FileWarning, color: "text-blue-600", bgColor: "bg-blue-600/10", status: "muted" as const },
};

const STATUS_CONFIG: Record<NCStatus, { icon: LucideIcon, color: string, bgColor: string, label: string }> = {
  DRAFT: { icon: AlertCircle, color: "text-amber-600", bgColor: "bg-amber-600/10", label: "Pending Review" },
  OPEN: { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Open" },
  IN_PROGRESS: { icon: Clock, color: "text-primary", bgColor: "bg-primary/10", label: "In Progress" },
  AWAITING_VERIFICATION: { icon: Clock, color: "text-warning", bgColor: "bg-warning/10", label: "Awaiting Verification" },
  VERIFIED_EFFECTIVE: { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10", label: "Verified Effective" },
  VERIFIED_INEFFECTIVE: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Verified Ineffective" },
  CLOSED: { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10", label: "Closed" },
  REJECTED: { icon: XCircle, color: "text-muted-foreground", bgColor: "bg-muted", label: "Rejected" },
};

const CAP_STATUS_CONFIG: Record<CAPStatus, { label: string; color: string; bgColor: string; icon: LucideIcon }> = {
  NOT_REQUIRED: { label: "Not Required", color: "text-muted-foreground", bgColor: "bg-muted", icon: SkipForward },
  NOT_DEFINED: { label: "Not Defined", color: "text-amber-600", bgColor: "bg-amber-100", icon: AlertCircle },
  DRAFT: { label: "Draft", color: "text-blue-600", bgColor: "bg-blue-100", icon: FileText },
  PENDING_APPROVAL: { label: "Pending Approval", color: "text-purple-600", bgColor: "bg-purple-100", icon: Clock },
  APPROVED: { label: "Approved", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "text-destructive", bgColor: "bg-destructive/10", icon: XCircle },
};

export default function NonconformityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { loading, nc, users, refresh } = useNonconformityDetail(id, isNew);
  const { userId: currentUserId } = useCurrentUser();
  
  // Dialog states
  const [defineCapOpen, setDefineCapOpen] = useState(false);
  const [approveCapOpen, setApproveCapOpen] = useState(false);

  const handleClose = async () => {
    if (!nc || !id) return;
    const confirmed = window.confirm("Are you sure you want to close this nonconformity?");
    if (!confirmed) return;

    try {
      await closeNonconformity(id, currentUserId);
      await refresh();
    } catch (error) {
      notifyError("Failed to close nonconformity", error);
    }
  };

  const handleSaveCapDraft = async (data: {
    correctiveAction: string;
    rootCause?: string;
    responsibleUserId: string;
    targetClosureDate: Date;
  }) => {
    if (!id) return;
    try {
      await saveCapDraft(id, {
        ...data,
        targetClosureDate: data.targetClosureDate.toISOString(),
        draftedById: currentUserId,
      });
      await refresh();
    } catch (error) {
      notifyError("Failed to save CAP draft", error);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) return;
    try {
      await submitCapForApproval(id, currentUserId);
      await refresh();
      setDefineCapOpen(false);
    } catch (error) {
      notifyError("Failed to submit CAP for approval", error);
    }
  };

  const handleApproveCap = async (comments?: string) => {
    if (!id) return;
    try {
      await approveCap(id, currentUserId, comments);
      await refresh();
    } catch (error) {
      notifyError("Failed to approve CAP", error);
    }
  };

  const handleRejectCap = async (reason: string) => {
    if (!id) return;
    try {
      await rejectCap(id, currentUserId, reason);
      await refresh();
    } catch (error) {
      notifyError("Failed to reject CAP", error);
    }
  };

  const handleSkipCap = async () => {
    if (!id || !nc) return;
    if (nc.severity !== "OBSERVATION") {
      toast.error("Only Observations can skip CAP approval");
      return;
    }
    const confirmed = window.confirm(
      "Skip CAP approval for this Observation? The NC will move directly to In Progress."
    );
    if (!confirmed) return;

    try {
      await markCapNotRequired(id, currentUserId);
      await refresh();
    } catch (error) {
      notifyError("Failed to skip CAP", error);
    }
  };

  const isOverdue = () => {
    if (!nc?.targetClosureDate) return false;
    if (nc.status === "CLOSED") return false;
    return new Date(nc.targetClosureDate) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">
            {isNew ? "Create Nonconformity" : "Nonconformity Not Found"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {isNew
              ? "Nonconformity creation is available via Claude Code or Claude Desktop using MCP tools."
              : "The requested nonconformity could not be found."}
          </p>
          <Button onClick={() => navigate("/audits/nonconformities")} className="mt-4">
            Back to NC Register
          </Button>
        </div>
      </div>
    );
  }

  const severityConfig = SEVERITY_CONFIG[nc.severity];
  const statusConfig = STATUS_CONFIG[nc.status];
  const capStatusConfig = CAP_STATUS_CONFIG[nc.capStatus];
  const SeverityIcon = severityConfig.icon;
  const StatusIcon = statusConfig.icon;
  const CapStatusIcon = capStatusConfig.icon;

  // Determine what CAP actions are available
  const canDefineCap = nc.status === "OPEN" && ["NOT_DEFINED", "DRAFT", "REJECTED"].includes(nc.capStatus);
  const canApproveCap = nc.capStatus === "PENDING_APPROVAL";
  const canSkipCap = nc.status === "OPEN" && nc.severity === "OBSERVATION" && nc.capStatus === "NOT_DEFINED";

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <DetailHero
        backLink="/audits/nonconformities"
        backLabel="Back to NC Register"
        icon={<FileWarning className="w-6 h-6 text-primary" />}
        badge={
          <>
            <Badge variant="outline" className={`${severityConfig.bgColor} ${severityConfig.color} border-transparent`}>
              <SeverityIcon className="w-3 h-3 mr-1" />
              {nc.severity}
            </Badge>
            <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </>
        }
        title={nc.title}
        subtitle={nc.ncId}
        description={nc.description}
        metadata={[
          { label: "Source", value: <Badge variant="secondary" className="text-[10px]">{nc.source.replace(/_/g, " ")}</Badge> },
          { label: "Category", value: <Badge variant="outline" className="text-[10px]">{nc.category.replace(/_/g, " ")}</Badge> },
          ...(nc.isoClause ? [{ label: "ISO Clause", value: <span className="font-mono">{nc.isoClause}</span> }] : []),
          { label: "Raised", value: format(new Date(nc.dateRaised), "dd MMM yyyy"), icon: <Calendar className="w-3 h-3 text-muted-foreground" /> },
        ]}
        actions={
          <>
            {nc.status === "DRAFT" ? (
              <Button variant="default" size="sm" className="gap-2" onClick={() => toast.info("Complete review coming soon")}>
                <CheckCircle2 className="w-4 h-4" />
                Complete Review
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => toast.info("Edit coming soon")}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {nc.status !== "CLOSED" && (
                  <Button variant="default" size="sm" onClick={handleClose}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Close NC
                  </Button>
                )}
              </>
            )}
          </>
        }
        statusColor={isOverdue() ? "destructive" : severityConfig.status}
      />

      {/* Draft Status Warning */}
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

      {/* CAP Status Banners */}
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
                  <Button variant="outline" size="sm" onClick={handleSkipCap}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip CAP
                  </Button>
                )}
                <Button size="sm" onClick={() => setDefineCapOpen(true)}>
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
                  <p className="font-semibold text-purple-700 dark:text-purple-400">CAP Awaiting Approval</p>
                  <p className="text-sm text-muted-foreground">
                    The Corrective Action Plan has been submitted and is waiting for approval.
                    {nc.capSubmittedAt && ` Submitted on ${format(new Date(nc.capSubmittedAt), "dd MMM yyyy")}.`}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setApproveCapOpen(true)}>
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
                  <p className="text-sm text-muted-foreground">
                    {nc.capRejectionReason}
                  </p>
                  {nc.capRejectedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rejected by {nc.capRejectedBy.firstName} {nc.capRejectedBy.lastName}
                      {nc.capRejectedAt && ` on ${format(new Date(nc.capRejectedAt), "dd MMM yyyy")}`}
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={() => setDefineCapOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Revise CAP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Warning */}
      {isOverdue() && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {nc.findings && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Findings</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{nc.findings}</p>
                </div>
              )}

              {nc.rootCause && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Root Cause Analysis</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{nc.rootCause}</p>
                  </div>
                </>
              )}

              {nc.impact && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Impact</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{nc.impact}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Corrective Action Plan */}
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
                <Button variant="outline" size="sm" onClick={() => setDefineCapOpen(true)}>
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
                    status={isOverdue() ? "destructive" : undefined}
                    className="col-span-1"
                  />
                )}
              </div>

              {/* CAP Approval Info */}
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

              {/* CAP Draft Info */}
              {nc.capDraftedBy && nc.capStatus !== "APPROVED" && (
                <div className="text-xs text-muted-foreground pt-2">
                  Last edited by {nc.capDraftedBy.firstName} {nc.capDraftedBy.lastName}
                  {nc.capDraftedAt && ` on ${format(new Date(nc.capDraftedAt), "dd MMM yyyy")}`}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification */}
          {(nc.verificationMethod || nc.verificationDate) && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {nc.verificationMethod && (
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Method</Label>
                      <p className="mt-1 text-sm">{nc.verificationMethod}</p>
                    </div>
                  )}

                  {nc.verificationDate && (
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Date</Label>
                      <p className="mt-1 text-sm">{format(new Date(nc.verificationDate), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>

                {nc.verificationResult && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Result</Label>
                    <Badge variant={nc.verificationResult === "EFFECTIVE" ? "outline" : "destructive"} className="mt-1">
                      {nc.verificationResult}
                    </Badge>
                  </div>
                )}

                {nc.verificationNotes && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{nc.verificationNotes}</p>
                  </div>
                )}

                {nc.verifiedBy && (
                  <div className="pt-2">
                    <DetailStatCard
                      icon={<User className="w-4 h-4 text-primary" />}
                      label="Verified by"
                      value={`${nc.verifiedBy.firstName} ${nc.verifiedBy.lastName}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailStatCard
                icon={<Calendar className="w-4 h-4 text-primary" />}
                label="Raised"
                value={format(new Date(nc.dateRaised), "dd MMM yyyy")}
                subValue={`by ${nc.raisedBy.firstName} ${nc.raisedBy.lastName}`}
              />

              {nc.capApprovedAt && (
                <DetailStatCard
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                  label="CAP Approved"
                  value={format(new Date(nc.capApprovedAt), "dd MMM yyyy")}
                  subValue={nc.capApprovedBy ? `by ${nc.capApprovedBy.firstName} ${nc.capApprovedBy.lastName}` : undefined}
                  status="success"
                />
              )}

              {nc.closedAt && (
                <DetailStatCard
                  icon={<CheckCircle2 className="w-4 h-4 text-success" />}
                  label="Closed"
                  value={format(new Date(nc.closedAt), "dd MMM yyyy")}
                  status="success"
                />
              )}
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Related Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nc.control && (
                <Link
                  to={`/controls/${nc.control.id}`}
                  className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Control</p>
                        <p className="text-sm font-medium font-mono truncate">{nc.control.controlId}</p>
                        <p className="text-xs text-muted-foreground truncate">{nc.control.name}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              )}

              {nc.capability && (
                <Link
                  to={`/controls/${nc.capability.control?.id}/capabilities/${nc.capability.id}`}
                  className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Layers3 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Capability</p>
                        <p className="text-sm font-medium font-mono truncate">{nc.capability.capabilityId}</p>
                        <p className="text-xs text-muted-foreground truncate">{nc.capability.name}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              )}

              {nc.test && (
                <div className="p-3 rounded-lg border bg-secondary/30">
                  <div className="flex items-start gap-2">
                    <TestTube className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Test</p>
                      <p className="text-sm font-medium">{nc.test.testType} Test</p>
                      <Badge variant="destructive" className="mt-1 text-[10px]">
                        {nc.test.testResult}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {nc.risks && nc.risks.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Linked Risks</Label>
                    <div className="space-y-2 mt-2">
                      {nc.risks.map((risk) => (
                        <Link
                          key={risk.id}
                          to={`/risks/${risk.id}`}
                          className="block p-2 rounded-lg border hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium font-mono truncate">{risk.riskId}</p>
                              <p className="text-xs text-muted-foreground truncate">{risk.title}</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <DefineCapDialog
        nc={nc}
        users={users}
        open={defineCapOpen}
        onOpenChange={setDefineCapOpen}
        onSaveDraft={handleSaveCapDraft}
        onSubmitForApproval={handleSubmitForApproval}
      />

      <ApproveCapDialog
        nc={nc}
        currentUserId={currentUserId}
        open={approveCapOpen}
        onOpenChange={setApproveCapOpen}
        onApprove={handleApproveCap}
        onReject={handleRejectCap}
      />
    </div>
  );
}
