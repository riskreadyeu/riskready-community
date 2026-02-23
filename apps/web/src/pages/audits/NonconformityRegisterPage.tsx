import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatCard,
  StatCardGrid,
} from "@/components/common";
import {
  getNonconformities,
  getNonconformityStats,
  updateNonconformity,
  getUsers,
  type Nonconformity,
  type NonconformityStats,
  type NCStatus,
  type NCSeverity,
  type NonconformitySource,
  type CAPStatus,
  type UserBasic,
} from "@/lib/audits-api";
import {
  Plus,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileWarning,
  FileText,
  Send,
  SkipForward,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { CompleteNCDialog } from "@/components/audits/CompleteNCDialog";

export default function NonconformityRegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [nonconformities, setNonconformities] = useState<Nonconformity[]>([]);
  const [stats, setStats] = useState<NonconformityStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog state
  const [selectedNC, setSelectedNC] = useState<Nonconformity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserBasic[]>([]);

  // Filters - Initialize from URL params
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [severityFilter, setSeverityFilter] = useState<string>(searchParams.get("severity") || "all");
  const [sourceFilter, setSourceFilter] = useState<string>(searchParams.get("source") || "all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (severityFilter !== "all") params.set("severity", severityFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    setSearchParams(params, { replace: true });
  }, [statusFilter, severityFilter, sourceFilter, setSearchParams]);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, statusFilter, severityFilter, sourceFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ncsData, statsData, usersData] = await Promise.all([
        getNonconformities({
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          ...(statusFilter !== "all" && { status: statusFilter as NCStatus }),
          ...(severityFilter !== "all" && { severity: severityFilter as NCSeverity }),
          ...(sourceFilter !== "all" && { source: sourceFilter as NonconformitySource }),
        }),
        getNonconformityStats(),
        getUsers(),
      ]);
      setNonconformities(ncsData.results);
      setTotalCount(ncsData.count);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading nonconformities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: NCSeverity) => {
    const variants = {
      MAJOR: { variant: "destructive" as const, icon: XCircle },
      MINOR: { variant: "secondary" as const, icon: AlertCircle },
      OBSERVATION: { variant: "outline" as const, icon: FileWarning },
    };
    const config = variants[severity];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: NCStatus) => {
    const variants: Record<NCStatus, { variant: "default" | "secondary" | "destructive" | "outline", icon: LucideIcon }> = {
      DRAFT: { variant: "secondary", icon: AlertCircle },
      OPEN: { variant: "destructive", icon: AlertCircle },
      IN_PROGRESS: { variant: "default", icon: Clock },
      AWAITING_VERIFICATION: { variant: "secondary", icon: Clock },
      VERIFIED_EFFECTIVE: { variant: "outline", icon: CheckCircle2 },
      VERIFIED_INEFFECTIVE: { variant: "destructive", icon: XCircle },
      CLOSED: { variant: "outline", icon: CheckCircle2 },
      REJECTED: { variant: "secondary", icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getCapStatusBadge = (capStatus: CAPStatus) => {
    const variants: Record<CAPStatus, { label: string; className: string; icon: LucideIcon }> = {
      NOT_REQUIRED: { label: "N/A", className: "bg-muted text-muted-foreground", icon: SkipForward },
      NOT_DEFINED: { label: "Not Defined", className: "bg-amber-100 text-amber-700", icon: AlertCircle },
      DRAFT: { label: "Draft", className: "bg-blue-100 text-blue-700", icon: FileText },
      PENDING_APPROVAL: { label: "Pending", className: "bg-purple-100 text-purple-700", icon: Send },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
      REJECTED: { label: "Rejected", className: "bg-destructive/10 text-destructive", icon: XCircle },
    };
    const config = variants[capStatus];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 border-transparent ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleCompleteNC = async (ncId: string, data: {
    responsibleUserId: string;
    targetClosureDate: Date;
    additionalContext?: string;
  }) => {
    try {
      await updateNonconformity(ncId, {
        status: "OPEN",
        responsibleUserId: data.responsibleUserId,
        targetClosureDate: data.targetClosureDate.toISOString(),
        rootCause: data.additionalContext,
      });
      await loadData(); // Refresh list
    } catch (err) {
      console.error("Error completing NC:", err);
      throw err;
    }
  };

  const handleRejectNC = async (ncId: string, reason: string) => {
    try {
      await updateNonconformity(ncId, {
        status: "REJECTED",
        verificationNotes: `Rejected: ${reason}`,
      });
      await loadData(); // Refresh list
    } catch (err) {
      console.error("Error rejecting NC:", err);
      throw err;
    }
  };

  const getSourceLabel = (source: NonconformitySource) => {
    return source.replace(/_/g, " ");
  };

  const isOverdue = (nc: Nonconformity) => {
    if (!nc.targetClosureDate) return false;
    if (nc.status === "CLOSED") return false;
    return new Date(nc.targetClosureDate) < new Date();
  };

  const columns = [
    {
      key: "ncId",
      header: "NC ID",
      render: (nc: Nonconformity) => (
        <div className="font-mono text-sm font-medium">{nc.ncId}</div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (nc: Nonconformity) => getSeverityBadge(nc.severity),
    },
    {
      key: "title",
      header: "Title",
      render: (nc: Nonconformity) => (
        <div className="space-y-1">
          <div className="font-medium">{nc.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {nc.capability && (
              <span className="font-mono">{nc.capability.capabilityId}</span>
            )}
            {nc.control && (
              <span className="font-mono">{nc.control.controlId}</span>
            )}
            {nc.isoClause && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {nc.isoClause}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (nc: Nonconformity) => (
        <Badge variant="secondary" className="text-[10px]">
          {getSourceLabel(nc.source)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (nc: Nonconformity) => (
        <div className="space-y-1">
          {getStatusBadge(nc.status)}
          {/* Show CAP status for OPEN NCs */}
          {nc.status === "OPEN" && nc.capStatus && nc.capStatus !== "APPROVED" && (
            <div className="text-xs">
              {getCapStatusBadge(nc.capStatus)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "responsible",
      header: "Responsible",
      render: (nc: Nonconformity) => (
        <div className="text-sm">
          {nc.responsibleUser ? (
            <div>
              {nc.responsibleUser.firstName} {nc.responsibleUser.lastName}
            </div>
          ) : (
            <span className="text-muted-foreground italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (nc: Nonconformity) => (
        <div className="space-y-1 text-xs">
          <div className="text-muted-foreground">
            Raised: {format(new Date(nc.dateRaised), "dd MMM yyyy")}
          </div>
          {nc.targetClosureDate && (
            <div className={isOverdue(nc) ? "text-destructive font-medium" : ""}>
              Target: {format(new Date(nc.targetClosureDate), "dd MMM yyyy")}
              {isOverdue(nc) && (
                <AlertTriangle className="w-3 h-3 inline ml-1" />
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const rowActions = (nc: Nonconformity) => {
    const actions = [
      {
        label: "View Details",
        onClick: () => navigate(`/audits/nonconformities/${nc.id}`),
      },
    ];

    // Add "Complete Review" action for DRAFT NCs
    if (nc.status === "DRAFT") {
      actions.unshift({
        label: "Complete Review",
        onClick: () => {
          setSelectedNC(nc);
          setDialogOpen(true);
        },
      });
    }

    return actions;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Nonconformity Register"
        description="ISO 27001 Clause 10.1 - Track and manage nonconformities and corrective actions"
        icon={<FileWarning className="h-6 w-6" />}
        actions={
          <Button onClick={() => navigate("/audits/nonconformities/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Raise Nonconformity
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <StatCardGrid columns={6}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={<FileWarning className="h-5 w-5" />}
          />
          <StatCard
            title="Open"
            value={(stats.byStatus['OPEN'] || 0) + (stats.byStatus['IN_PROGRESS'] || 0)}
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            variant="destructive"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            variant="destructive"
          />
          <StatCard
            title="Major"
            value={stats.bySeverity['MAJOR'] || 0}
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            variant="destructive"
          />
          <StatCard
            title="CAP Pending"
            value={stats.pendingCapApproval || 0}
            icon={<Send className="h-5 w-5 text-purple-500" />}
            variant="warning"
          />
          <StatCard
            title="Closed"
            value={stats.byStatus['CLOSED'] || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            variant="success"
          />
        </StatCardGrid>
      )}

      {/* Data Table */}
      <DataTable
        title="Nonconformities"
        description={`${totalCount} nonconformities`}
            columns={columns}
            data={nonconformities}
            keyExtractor={(nc) => nc.id}
            rowActions={rowActions}
            emptyMessage="No nonconformities found"
            loading={loading}
            searchPlaceholder="Search nonconformities..."
            searchFilter={(nc, query) => {
              const q = query.toLowerCase();
              return (
                nc.ncId.toLowerCase().includes(q) ||
                nc.title.toLowerCase().includes(q) ||
                nc.description.toLowerCase().includes(q) ||
                nc.capability?.capabilityId?.toLowerCase().includes(q) ||
                nc.control?.controlId?.toLowerCase().includes(q) ||
                false
              );
            }}
            filterSlot={
              <>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-48 bg-secondary/50">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">⚠️ Pending Review (Draft)</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="AWAITING_VERIFICATION">Awaiting Verification</SelectItem>
                    <SelectItem value="VERIFIED_EFFECTIVE">Verified Effective</SelectItem>
                    <SelectItem value="VERIFIED_INEFFECTIVE">Verified Ineffective</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={severityFilter}
                  onValueChange={(v) => {
                    setSeverityFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-48 bg-secondary/50">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="OBSERVATION">Observation</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sourceFilter}
                  onValueChange={(v) => {
                    setSourceFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-48 bg-secondary/50">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="TEST">Test</SelectItem>
                    <SelectItem value="INTERNAL_AUDIT">Internal Audit</SelectItem>
                    <SelectItem value="EXTERNAL_AUDIT">External Audit</SelectItem>
                    <SelectItem value="CERTIFICATION_AUDIT">Certification Audit</SelectItem>
                    <SelectItem value="INCIDENT">Incident</SelectItem>
                    <SelectItem value="SELF_ASSESSMENT">Self Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
        pagination={{
          page: currentPage,
          pageSize: pageSize,
          total: totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Complete NC Dialog */}
      {selectedNC && (
        <CompleteNCDialog
          nc={selectedNC}
          users={users}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onComplete={(data) => handleCompleteNC(selectedNC.id, data)}
          onReject={(reason) => handleRejectNC(selectedNC.id, reason)}
        />
      )}
    </div>
  );
}
