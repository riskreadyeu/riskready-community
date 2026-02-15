// =============================================================================
// RTSDetailV2Page - Risk Tolerance Statement Detail Page
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Layers,
  Link2,
  RefreshCw,
  Scale,
  Shield,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Archer Components
import {
  AuditFooter,
  CrossReferenceGrid,
  DetailPageLayout,
  Section,
  WorkflowSidebar,
} from "@/components/archer";

// API
import {
  getRTS,
  approveRTS,
  unlinkRisksFromRTS,
  type RiskToleranceStatement,
  type RiskTier,
  type RiskStatus,
} from "@/lib/risks-api";

// Shared Constants
import {
  rtsStatusLabels,
  rtsStatusColors,
  toleranceLevelLabels,
  toleranceLevelColors,
  tierLabels,
  tierColors,
  statusLabels,
  statusColors,
} from "./_shared";

// Dialogs
import { ConfirmationDialog, RTSDialog } from "@/components/risks";
import { toast } from "sonner";

// =============================================================================
// Component
// =============================================================================

export function RTSDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rts, setRts] = useState<RiskToleranceStatement | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getRTS(id);
      setRts(data);
    } catch (err) {
      console.error("Error loading RTS:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !rts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="w-[280px] h-96" />
        </div>
      </div>
    );
  }

  const riskCount = rts._count?.risks || rts.risks?.length || 0;

  return (
    <>
    <DetailPageLayout
      header={{
        breadcrumbs: [
          { label: "Risks", href: "/risks" },
          { label: "Tolerance Statements", href: "/risks/tolerance" },
          { label: rts.rtsId },
        ],
        identifier: rts.rtsId,
        title: rts.title,
        status: {
          label: rtsStatusLabels[rts.status],
          variant: rts.status === "ACTIVE" ? "success" : rts.status === "PENDING_APPROVAL" ? "warning" : "secondary",
          icon: rts.status === "ACTIVE" ? CheckCircle2 : rts.status === "PENDING_APPROVAL" ? Clock : Scale,
        },
        badges: [
          { label: toleranceLevelLabels[rts.proposedToleranceLevel], variant: "outline" },
          ...(rts.domain ? [{ label: rts.domain, variant: "secondary" as const }] : []),
        ],
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {rts.status === "PENDING_APPROVAL" && (
              <Button size="sm" onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
          </div>
        ),
      }}
      sidebar={
        <WorkflowSidebar
          status={{
            label: rtsStatusLabels[rts.status],
            color: rts.status === "ACTIVE" ? "#22c55e" : rts.status === "PENDING_APPROVAL" ? "#f59e0b" : "#6b7280",
            icon: <Scale className="h-4 w-4" />,
          }}
          actions={[
            { label: "Edit Statement", onClick: () => setEditDialogOpen(true), icon: Edit, variant: "outline" },
            { label: "Link Risks", onClick: () => toast.info("Risk linking dialog coming soon"), icon: Link2, variant: "outline" },
            ...(rts.status === "PENDING_APPROVAL" ? [{ label: "Approve", onClick: () => setApproveDialogOpen(true), icon: CheckCircle2 }] : []),
          ]}
          metadata={[
            { label: "Tolerance Level", value: toleranceLevelLabels[rts.proposedToleranceLevel] },
            { label: "Linked Risks", value: String(riskCount) },
            ...(rts.effectiveDate ? [{ label: "Effective", value: new Date(rts.effectiveDate).toLocaleDateString() }] : []),
            ...(rts.reviewDate ? [{ label: "Review Date", value: new Date(rts.reviewDate).toLocaleDateString() }] : []),
          ]}
        />
      }
      footer={
        <AuditFooter
          createdAt={rts.createdAt}
          createdBy={rts.createdBy?.email}
          updatedAt={rts.updatedAt}
          updatedBy={rts.updatedBy?.email}
        />
      }
    >
      <div className="space-y-6">
        {/* Statement Details */}
        <Section title="Statement Details" icon={FileText}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Objective</p>
              <p className="text-sm mt-1">{rts.objective}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Proposed Risk Tolerance Statement</p>
              <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">{rts.proposedRTS}</p>
            </div>
            {rts.rationale && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rationale</p>
                <p className="text-sm mt-1">{rts.rationale}</p>
              </div>
            )}
            {rts.anticipatedOperationalImpact && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anticipated Operational Impact</p>
                <p className="text-sm mt-1">{rts.anticipatedOperationalImpact}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Tolerance Level Conditions */}
        {rts.conditions && rts.conditions.length > 0 && (
          <Section title="Tolerance Conditions" icon={Layers} collapsible>
            <div className="space-y-4">
              {rts.conditions.map((condition, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={toleranceLevelColors[condition.level]}>
                        {toleranceLevelLabels[condition.level]}
                      </Badge>
                    </div>
                    <p className="text-sm">{condition.description}</p>
                    {condition.conditions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {condition.conditions.map((c, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">&#8226;</span> {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Linked Risks */}
        <Section title="Linked Risks" icon={Shield}>
          <CrossReferenceGrid<{ id: string; riskId: string; title: string; tier: RiskTier; status: RiskStatus }>
            title="Linked Risks"
            records={rts.risks || []}
            columns={[
              { key: "riskId", header: "Risk ID", width: "120px", render: (r) => (
                <span className="font-mono text-xs">{r.riskId}</span>
              )},
              { key: "title", header: "Title", render: (r) => (
                <span className="font-medium">{r.title}</span>
              )},
              { key: "tier", header: "Tier", width: "100px", render: (r) => (
                <Badge variant="outline" className={tierColors[r.tier]}>
                  {tierLabels[r.tier]}
                </Badge>
              )},
              { key: "status", header: "Status", width: "120px", render: (r) => (
                <Badge variant="outline" className={statusColors[r.status]}>
                  {statusLabels[r.status]}
                </Badge>
              )},
            ]}
            getRowId={(r) => r.id}
            onRowClick={(r) => navigate(`/risks/${r.id}`)}
            onAdd={() => toast.info("Risk linking dialog coming soon")}
            onRemove={async (ids) => {
              try {
                await unlinkRisksFromRTS(rts.id, ids);
                loadData();
                toast.success("Risks unlinked");
              } catch (err) {
                toast.error("Failed to unlink risks");
              }
            }}
            emptyState={{
              icon: <Shield className="h-12 w-12" />,
              title: "No Linked Risks",
              description: "Link risks to this tolerance statement.",
            }}
          />
        </Section>

        {/* Approval Workflow */}
        {rts.approvedBy && (
          <Section title="Approval" icon={CheckCircle2} collapsible defaultCollapsed>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Approved</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Approved by {rts.approvedBy.email} on {rts.approvedDate ? new Date(rts.approvedDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </Section>
        )}
      </div>
    </DetailPageLayout>

    {/* Edit RTS Dialog */}
    <RTSDialog
      rts={rts}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={() => {
        loadData();
        toast.success("Statement updated successfully");
      }}
    />

    {/* Approve RTS Confirmation */}
    <ConfirmationDialog
      open={approveDialogOpen}
      onOpenChange={setApproveDialogOpen}
      title="Approve Tolerance Statement?"
      description="This will approve the tolerance statement and make it active for the organization."
      confirmLabel="Approve"
      onConfirm={async () => {
        await approveRTS(rts.id);
        loadData();
        toast.success("Statement approved");
      }}
    />
    </>
  );
}
