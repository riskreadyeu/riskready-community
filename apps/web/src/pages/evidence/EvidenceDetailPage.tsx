import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  Send,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEvidence,
  submitEvidenceForReview,
  approveEvidence,
  rejectEvidence,
  archiveEvidence,
  type Evidence,
  type EvidenceStatus,
} from "@/lib/evidence-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EvidenceLinkDialog } from "@/components/evidence/EvidenceLinkDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EvidenceOverviewTab } from "@/components/evidence/tabs/EvidenceOverviewTab";
import { EvidenceLinksTab } from "@/components/evidence/tabs/EvidenceLinksTab";
import { EvidenceHistoryTab } from "@/components/evidence/tabs/EvidenceHistoryTab";
import { EvidenceIntegrityTab } from "@/components/evidence/tabs/EvidenceIntegrityTab";

const statusColors: Record<EvidenceStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusIcons: Record<EvidenceStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  UNDER_REVIEW: <RefreshCw className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  EXPIRED: <AlertCircle className="h-4 w-4" />,
  ARCHIVED: <Archive className="h-4 w-4" />,
};

const classificationColors: Record<string, string> = {
  PUBLIC: "bg-green-500/10 text-green-500",
  INTERNAL: "bg-blue-500/10 text-blue-500",
  CONFIDENTIAL: "bg-amber-500/10 text-amber-500",
  RESTRICTED: "bg-red-500/10 text-red-500",
};

export default function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvidence();
    }
  }, [id]);

  const loadEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvidence(id!);
      setEvidence(data);
    } catch (err) {
      console.error("Error loading evidence:", err);
      setError("Failed to load evidence");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!evidence) return;
    try {
      setActionLoading(true);
      await submitEvidenceForReview(evidence.id, userId ?? "");
      await loadEvidence();
    } catch (err) {
      console.error("Error submitting for review:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!evidence) return;
    try {
      setActionLoading(true);
      await approveEvidence(evidence.id, userId ?? "", approveNotes || undefined);
      setApproveDialogOpen(false);
      setApproveNotes("");
      await loadEvidence();
    } catch (err) {
      console.error("Error approving evidence:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!evidence || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await rejectEvidence(evidence.id, userId ?? "", rejectReason);
      setRejectDialogOpen(false);
      setRejectReason("");
      await loadEvidence();
    } catch (err) {
      console.error("Error rejecting evidence:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!evidence) return;
    try {
      setActionLoading(true);
      await archiveEvidence(evidence.id, userId ?? "");
      await loadEvidence();
    } catch (err) {
      console.error("Error archiving evidence:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "\u2014";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Evidence Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || "The requested evidence could not be found."}</p>
        <Button onClick={() => navigate("/evidence/repository")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Repository
        </Button>
      </div>
    );
  }

  const totalLinks =
    (evidence.controlLinks?.length || 0) +
    (evidence.capabilityLinks?.length || 0) +
    (evidence.testLinks?.length || 0) +
    (evidence.nonconformityLinks?.length || 0) +
    (evidence.incidentLinks?.length || 0) +
    (evidence.riskLinks?.length || 0) +
    (evidence.vendorLinks?.length || 0) +
    (evidence.assetLinks?.length || 0) +
    (evidence.applicationLinks?.length || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 mt-1"
            onClick={() => navigate("/evidence/repository")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">{evidence.title}</h1>
              <Badge
                variant="outline"
                className={`gap-1 ${statusColors[evidence.status]}`}
              >
                {statusIcons[evidence.status]}
                {evidence.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{evidence.evidenceRef}</span>
              <span>&#8226;</span>
              <span>{evidence.evidenceType.replace(/_/g, " ")}</span>
              <span>&#8226;</span>
              <Badge
                variant="outline"
                className={classificationColors[evidence.classification]}
              >
                {evidence.classification}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          {evidence.status === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmitForReview}
              disabled={actionLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          )}
          {evidence.status === "UNDER_REVIEW" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
                className="text-red-600 hover:text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => setApproveDialogOpen(true)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          {evidence.status === "APPROVED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={actionLoading}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
          {evidence.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {evidence.description && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {evidence.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="links">
                Links ({totalLinks})
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="integrity">Integrity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <EvidenceOverviewTab
                evidence={evidence}
                formatFileSize={formatFileSize}
              />
            </TabsContent>

            <TabsContent value="links" className="mt-4">
              <EvidenceLinksTab
                evidence={evidence}
                totalLinks={totalLinks}
                onOpenLinkDialog={() => setLinkDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <EvidenceHistoryTab evidence={evidence} />
            </TabsContent>

            <TabsContent value="integrity" className="mt-4">
              <EvidenceIntegrityTab evidence={evidence} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">{evidence.category || "\u2014"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="outline">{evidence.version}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Linked Entities</span>
                <span className="text-sm font-medium">{totalLinks}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">File Size</span>
                <span className="text-sm font-medium">{formatFileSize(evidence.fileSizeBytes)}</span>
              </div>
              {evidence.validUntil && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm font-medium">
                      {new Date(evidence.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Owner</CardTitle>
            </CardHeader>
            <CardContent>
              {evidence.collectedBy ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {evidence.collectedBy.firstName} {evidence.collectedBy.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evidence.collectedBy.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unknown</p>
              )}
            </CardContent>
          </Card>

          {/* Request Fulfillments */}
          {evidence.requestFulfillments && evidence.requestFulfillments.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Fulfills Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {evidence.requestFulfillments.map((fulfillment) => (
                  <Link
                    key={fulfillment.id}
                    to={`/evidence/requests/${fulfillment.request.id}`}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{fulfillment.request.requestRef}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {fulfillment.request.title}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Evidence</DialogTitle>
            <DialogDescription>
              Confirm approval of this evidence. You can optionally add notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approveNotes">Approval Notes (optional)</Label>
              <Textarea
                id="approveNotes"
                placeholder="Add any notes about this approval..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Approving..." : "Approve Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Evidence</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this evidence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Explain why this evidence is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              variant="destructive"
            >
              {actionLoading ? "Rejecting..." : "Reject Evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      {evidence && (
        <EvidenceLinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          evidenceId={evidence.id}
          evidenceTitle={evidence.title}
          onSuccess={() => {
            loadEvidence();
          }}
        />
      )}
    </div>
  );
}
