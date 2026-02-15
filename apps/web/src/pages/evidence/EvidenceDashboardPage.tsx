import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Archive,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  Send,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  getEvidenceList,
  getEvidenceStats,
  getEvidenceRequests,
  getEvidenceRequestStats,
  getExpiringEvidence,
  type Evidence,
  type EvidenceStats,
  type EvidenceRequest,
  type EvidenceRequestStats,
} from "@/lib/evidence-api";
import { EvidenceUploadDialog } from "@/components/evidence/EvidenceUploadDialog";
import { EvidenceRequestDialog } from "@/components/evidence/EvidenceRequestDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const requestStatusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  SUBMITTED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ACCEPTED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function EvidenceDashboardPage() {
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [requestStats, setRequestStats] = useState<EvidenceRequestStats | null>(null);
  const [recentEvidence, setRecentEvidence] = useState<Evidence[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EvidenceRequest[]>([]);
  const [expiringEvidence, setExpiringEvidence] = useState<Evidence[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evidenceStats, reqStats, recent, requests, expiring] = await Promise.all([
        getEvidenceStats(),
        getEvidenceRequestStats(),
        getEvidenceList({ take: 5 }),
        getEvidenceRequests({ status: "OPEN", take: 5 }),
        getExpiringEvidence(30),
      ]);
      setStats(evidenceStats);
      setRequestStats(reqStats);
      setRecentEvidence(recent.results);
      setPendingRequests(requests.results);
      setExpiringEvidence(expiring);
    } catch (err) {
      console.error("Error loading evidence dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const approvalRate = stats && stats.total > 0
    ? Math.round((stats.byStatus.APPROVED / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Evidence Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Central repository for all compliance evidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRequestDialogOpen(true)}
          >
            <Send className="h-4 w-4" />
            Request Evidence
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Evidence</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.byStatus?.APPROVED || 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(stats?.byStatus?.PENDING || 0) + (stats?.byStatus?.UNDER_REVIEW || 0)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.expiringSoon || expiringEvidence.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link
          to="/evidence/repository"
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Repository</p>
            <p className="text-xs text-muted-foreground">Browse all evidence</p>
          </div>
        </Link>

        <Link
          to="/evidence/requests"
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20">
            <Send className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">Requests</p>
            <p className="text-xs text-muted-foreground">
              {requestStats?.byStatus?.OPEN || 0} open
            </p>
          </div>
        </Link>

        <Link
          to="/evidence/pending"
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium">Pending Review</p>
            <p className="text-xs text-muted-foreground">
              {(stats?.byStatus?.PENDING || 0) + (stats?.byStatus?.UNDER_REVIEW || 0)} items
            </p>
          </div>
        </Link>

        <Link
          to="/evidence/links"
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20">
            <Link2 className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="font-medium">Linked Entities</p>
            <p className="text-xs text-muted-foreground">View connections</p>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Evidence */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Evidence</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/evidence/repository">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No evidence uploaded yet</p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Evidence
                </Button>
              </div>
            ) : (
              recentEvidence.map((evidence) => (
                <Link
                  key={evidence.id}
                  to={`/evidence/${evidence.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="truncate text-sm font-medium">{evidence.title}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{evidence.evidenceRef}</span>
                      <span>•</span>
                      <span>{evidence.evidenceType.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusColors[evidence.status] || ""}
                  >
                    {evidence.status.replace(/_/g, " ")}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Open Requests */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Open Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/evidence/requests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Send className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No open requests</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setRequestDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/evidence/requests/${request.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{request.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{request.requestRef}</span>
                      <span>•</span>
                      <span>Due: {new Date(request.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={requestStatusColors[request.status] || ""}
                  >
                    {request.status.replace(/_/g, " ")}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Approval Rate */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{approvalRate}%</span>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
              <Progress value={approvalRate} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-medium text-green-600">{stats?.byStatus?.APPROVED || 0}</p>
                  <p className="text-muted-foreground">Approved</p>
                </div>
                <div>
                  <p className="font-medium text-amber-600">{stats?.byStatus?.PENDING || 0}</p>
                  <p className="text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="font-medium text-red-600">{stats?.byStatus?.REJECTED || 0}</p>
                  <p className="text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Evidence by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.byType && Object.entries(stats.byType)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {type.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              {(!stats?.byType || Object.values(stats.byType).every(v => v === 0)) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No evidence data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2">
                <span className="text-sm">Open</span>
                <span className="font-medium">{requestStats?.byStatus?.OPEN || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
                <span className="text-sm">In Progress</span>
                <span className="font-medium">{requestStats?.byStatus?.IN_PROGRESS || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2">
                <span className="text-sm">Overdue</span>
                <span className="font-medium text-red-600">{requestStats?.overdue || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-3 py-2">
                <span className="text-sm">Completed</span>
                <span className="font-medium">{requestStats?.byStatus?.ACCEPTED || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Evidence */}
      {expiringEvidence.length > 0 && (
        <Card className="glass-card border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Expiring Soon</CardTitle>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              {expiringEvidence.length} items
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {expiringEvidence.slice(0, 6).map((evidence) => (
                <Link
                  key={evidence.id}
                  to={`/evidence/${evidence.id}`}
                  className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 transition-colors hover:bg-amber-500/10"
                >
                  <FileCheck className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{evidence.title}</p>
                    <p className="text-xs text-amber-600">
                      Expires: {evidence.validUntil ? new Date(evidence.validUntil).toLocaleDateString() : "Soon"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <EvidenceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={loadData}
        userId={userId ?? ""}
      />
      <EvidenceRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={loadData}
        userId={userId ?? ""}
      />
    </div>
  );
}

