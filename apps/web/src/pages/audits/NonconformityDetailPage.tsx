import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { DetailStatCard } from "@/components/controls/detail-components/detail-stat-card";
import { DefineCapDialog } from "@/components/audits/DefineCapDialog";
import { ApproveCapDialog } from "@/components/audits/ApproveCapDialog";
import { NonconformityCapPlanCard } from "@/components/audits/nonconformity-detail/NonconformityCapPlanCard";
import { NonconformityCapStatusBanners } from "@/components/audits/nonconformity-detail/NonconformityCapStatusBanners";
import { NonconformityDetailHeader } from "@/components/audits/nonconformity-detail/NonconformityDetailHeader";
import { useNonconformityDetail } from "@/hooks/audits/useNonconformityDetail";
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  ExternalLink,
  Shield,
  Layers3,
  TestTube,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function NonconformityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const {
    loading,
    nc,
    users,
    currentUserId,
    defineCapOpen,
    setDefineCapOpen,
    approveCapOpen,
    setApproveCapOpen,
    isOverdue,
    canDefineCap,
    canSkipCap,
    handleClose,
    handleSaveCapDraft,
    handleSubmitForApproval,
    handleApproveCap,
    handleRejectCap,
    handleSkipCap,
  } = useNonconformityDetail(id, isNew);

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

  return (
    <div className="space-y-6 pb-8">
      <NonconformityDetailHeader nc={nc} isOverdue={isOverdue} onClose={handleClose} />

      <NonconformityCapStatusBanners
        nc={nc}
        isOverdue={isOverdue}
        canSkipCap={canSkipCap}
        onSkipCap={handleSkipCap}
        onDefineCap={() => setDefineCapOpen(true)}
        onApproveCap={() => setApproveCapOpen(true)}
      />

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

          <NonconformityCapPlanCard
            nc={nc}
            isOverdue={isOverdue}
            canDefineCap={canDefineCap}
            onDefineCap={() => setDefineCapOpen(true)}
          />

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
