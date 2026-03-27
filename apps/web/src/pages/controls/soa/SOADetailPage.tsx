import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Send, Check, RefreshCw, Copy, Download, AlertCircle, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArcherTabSet } from "@/components/archer/tab-set";
import { RecordHeader } from "@/components/archer/record-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SOAOverviewTab,
  SOAEntriesTab,
  SOAChangesTab,
  SOAApprovalTab,
  type SOAStats,
} from "@/components/controls/tabs/soa";
import {
  getSOA,
  submitSOAForReview,
  approveSOA,
  syncSOAToControls,
  updateSOAEntry,
  type StatementOfApplicability,
  type SOAStatus,
  type ImplementationStatus,
} from "@/lib/controls-api";

// =============================================================================
// Configuration
// =============================================================================

const statusConfig: Record<
  SOAStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
  PENDING_REVIEW: { label: "Pending Review", variant: "outline", icon: Clock },
  APPROVED: { label: "Approved", variant: "default", icon: CheckCircle2 },
  SUPERSEDED: { label: "Superseded", variant: "destructive", icon: XCircle },
};

// =============================================================================
// Component
// =============================================================================

export default function SOADetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [soa, setSOA] = useState<StatementOfApplicability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<"submit" | "approve" | "sync" | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getSOA(id);
        setSOA(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load SOA");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Compute stats
  const stats: SOAStats | null = useMemo(() => {
    if (!soa?.entries) return null;
    const entries = soa.entries;
    return {
      total: entries.length,
      applicable: entries.filter((e) => e.applicable).length,
      notApplicable: entries.filter((e) => !e.applicable).length,
      implemented: entries.filter((e) => e.implementationStatus === "IMPLEMENTED").length,
      partial: entries.filter((e) => e.implementationStatus === "PARTIAL").length,
      notStarted: entries.filter((e) => e.implementationStatus === "NOT_STARTED").length,
    };
  }, [soa?.entries]);

  // Action handlers
  const handleSubmitForReview = async () => {
    if (!soa) return;
    try {
      setActionLoading(true);
      const updated = await submitSOAForReview(soa.id);
      setSOA((prev) => (prev ? { ...prev, status: updated.status } : null));
      setConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit for review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!soa) return;
    try {
      setActionLoading(true);
      const updated = await approveSOA(soa.id, "current-user-id");
      setSOA((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              approvedAt: updated.approvedAt,
              approvedBy: updated.approvedBy,
            }
          : null
      );
      setConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve SOA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncToControls = async () => {
    if (!soa) return;
    try {
      setActionLoading(true);
      const result = await syncSOAToControls(soa.id);
      alert(`Successfully synced ${result.updatedCount} controls`);
      setConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync to controls");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEntryUpdate = async (
    entryId: string,
    data: {
      applicable: boolean;
      justificationIfNa?: string;
      implementationStatus: ImplementationStatus;
      implementationDesc?: string;
      parentRiskId?: string;
      scenarioIds?: string;
    }
  ) => {
    await updateSOAEntry(entryId, data);
    setSOA((prev) => {
      if (!prev?.entries) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => (e.id === entryId ? { ...e, ...data } : e)),
      };
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !soa) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error || "SOA not found"}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/controls/soa")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SOA List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[soa.status];
  const isEditable = soa.status === "DRAFT";
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Archer RecordHeader */}
      <RecordHeader
        breadcrumbs={[
          { label: "Controls", href: "/controls" },
          { label: "SOA", href: "/controls/soa" },
          { label: `v${soa.version}` },
        ]}
        identifier={`SOA-${soa.version}`}
        title={soa.name || `Statement of Applicability v${soa.version}`}
        status={{
          label: config.label,
          variant: config.variant,
          icon: StatusIcon,
        }}
        badges={[
          { label: `${stats?.total ?? 0} Controls`, variant: "outline" as const },
          { label: `${stats?.applicable ?? 0} Applicable`, variant: "secondary" as const },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {soa.status === "DRAFT" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmDialog("submit")}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {soa.status === "PENDING_REVIEW" && (
              <Button size="sm" onClick={() => setConfirmDialog("approve")}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {soa.status === "APPROVED" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmDialog("sync")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync to Controls
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/controls/soa/${soa.id}/new-version`)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  New Version
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Notes */}
      {soa.notes && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {soa.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <ArcherTabSet
        syncWithUrl
        defaultValue="overview"
        tabs={[
          {
            value: "overview",
            label: "OVERVIEW",
            content: stats ? <SOAOverviewTab soa={soa} stats={stats} /> : null,
          },
          {
            value: "entries",
            label: "ENTRIES",
            badge: soa.entries?.length,
            content: (
              <SOAEntriesTab
                entries={soa.entries || []}
                isEditable={isEditable}
                onEntryUpdate={handleEntryUpdate}
              />
            ),
          },
          {
            value: "changes",
            label: "CHANGES",
            content: <SOAChangesTab />,
          },
          {
            value: "approval",
            label: "APPROVAL",
            content: <SOAApprovalTab soa={soa} />,
          },
        ]}
      />

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog === "submit"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Review</DialogTitle>
            <DialogDescription>
              This will submit the SOA for review. Once submitted, it cannot be edited until
              approved or rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForReview} disabled={actionLoading}>
              {actionLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog === "approve"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve SOA</DialogTitle>
            <DialogDescription>
              This will approve the Statement of Applicability. Previous approved versions will be
              marked as superseded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog === "sync"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync to Controls</DialogTitle>
            <DialogDescription>
              This will update all Control records with the applicability and implementation data
              from this SOA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSyncToControls} disabled={actionLoading}>
              {actionLoading ? "Syncing..." : "Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
