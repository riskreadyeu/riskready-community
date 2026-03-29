import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Link2,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";
import {
  type Evidence,
  type EvidenceStats,
  type EvidenceType,
  type EvidenceStatus,
  type EvidenceClassification,
} from "@/lib/evidence-api";
import { useEvidenceList, useEvidenceStats, evidenceKeys } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { EvidenceUploadDialog } from "@/components/evidence/EvidenceUploadDialog";
import { EvidenceLinkDialog } from "@/components/evidence/EvidenceLinkDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const statusLabels: Record<EvidenceStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
};

const statusColors: Record<EvidenceStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  EXPIRED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const classificationColors: Record<EvidenceClassification, string> = {
  PUBLIC: "bg-green-500/10 text-green-500 border-green-500/20",
  INTERNAL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  CONFIDENTIAL: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  RESTRICTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const typeLabels: Record<EvidenceType, string> = {
  DOCUMENT: "Document",
  CERTIFICATE: "Certificate",
  REPORT: "Report",
  POLICY: "Policy",
  PROCEDURE: "Procedure",
  SCREENSHOT: "Screenshot",
  LOG: "Log",
  CONFIGURATION: "Configuration",
  NETWORK_CAPTURE: "Network Capture",
  MEMORY_DUMP: "Memory Dump",
  DISK_IMAGE: "Disk Image",
  MALWARE_SAMPLE: "Malware Sample",
  EMAIL: "Email",
  MEETING_NOTES: "Meeting Notes",
  APPROVAL_RECORD: "Approval Record",
  AUDIT_REPORT: "Audit Report",
  ASSESSMENT_RESULT: "Assessment Result",
  TEST_RESULT: "Test Result",
  SCAN_RESULT: "Scan Result",
  VIDEO: "Video",
  AUDIO: "Audio",
  OTHER: "Other",
};

export default function EvidenceRepositoryPage() {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedEvidenceForLink, setSelectedEvidenceForLink] = useState<Evidence | null>(null);

  const queryClient = useQueryClient();
  const { data: evidenceData, isLoading: evidenceLoading } = useEvidenceList({ take: 500 });
  const { data: stats = null, isLoading: statsLoading } = useEvidenceStats();
  const evidence = evidenceData?.results ?? [];
  const loading = evidenceLoading || statsLoading;
  const refreshEvidence = () => queryClient.invalidateQueries({ queryKey: evidenceKeys.all });

  const filteredEvidence = evidence.filter((e) => {
    if (typeFilter !== "all" && e.evidenceType !== typeFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (classificationFilter !== "all" && e.classification !== classificationFilter) return false;
    return true;
  });

  const columns: Column<Evidence>[] = [
    {
      key: "evidenceRef",
      header: "Reference",
      sortable: true,
      render: (item) => (
        <Link
          to={`/evidence/${item.id}`}
          className="font-mono text-xs text-primary hover:underline"
        >
          {item.evidenceRef}
        </Link>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (item) => (
        <div className="max-w-[300px]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="truncate font-medium">{item.title}</p>
          </div>
          {item.category && (
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {item.category}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "evidenceType",
      header: "Type",
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="text-[10px]">
          {typeLabels[item.evidenceType] || item.evidenceType}
        </Badge>
      ),
    },
    {
      key: "classification",
      header: "Classification",
      render: (item) => (
        <Badge
          variant="outline"
          className={classificationColors[item.classification] || ""}
        >
          {item.classification}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => (
        <Badge
          variant="outline"
          className={statusColors[item.status] || ""}
        >
          {statusLabels[item.status] || item.status}
        </Badge>
      ),
    },
    {
      key: "links",
      header: "Links",
      render: (item) => {
        const totalLinks = 
          (item._count?.controlLinks || 0) +
          (item._count?.capabilityLinks || 0) +
          (item._count?.incidentLinks || 0) +
          (item._count?.riskLinks || 0) +
          (item._count?.vendorLinks || 0) +
          (item._count?.assetLinks || 0);
        
        return (
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{totalLinks}</span>
          </div>
        );
      },
    },
    {
      key: "validUntil",
      header: "Valid Until",
      sortable: true,
      render: (item) => {
        if (!item.validUntil) return <span className="text-muted-foreground">—</span>;
        
        const date = new Date(item.validUntil);
        const isExpired = date < new Date();
        const isExpiringSoon = !isExpired && date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        return (
          <span className={`text-sm ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-muted-foreground"}`}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Uploaded",
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rowActions = (item: Evidence): RowAction<Evidence>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => navigate(`/evidence/${item.id}`),
    },
    {
      label: "Link to Entity",
      icon: <Link2 className="w-4 h-4" />,
      onClick: () => {
        setSelectedEvidenceForLink(item);
        setLinkDialogOpen(true);
      },
    },
    {
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: () => {
        if (item.fileUrl) {
          window.open(item.fileUrl, "_blank");
        }
      },
      hidden: () => !item.fileUrl,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Search filter for DataTable
  const searchFilter = (item: Evidence, query: string): boolean => {
    const q = query.toLowerCase();
    return (
      item.evidenceRef.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q))
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Evidence Repository"
        description="Browse and manage all evidence in the repository"
        icon={<FolderOpen className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Evidence"
          value={stats?.total || 0}
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Approved"
          value={stats?.byStatus?.APPROVED || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          variant="success"
        />
        <StatCard
          title="Pending Review"
          value={(stats?.byStatus?.PENDING || 0) + (stats?.byStatus?.UNDER_REVIEW || 0)}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          variant="warning"
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiringSoon || 0}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          variant="destructive"
        />
      </StatCardGrid>

      {/* Data Table with integrated filters */}
      <DataTable
        title="Evidence Items"
        description={`${filteredEvidence.length} items`}
        data={filteredEvidence}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search by title, reference, category, or tags..."
        searchFilter={searchFilter}
        rowActions={rowActions}
        onRowClick={(item) => navigate(`/evidence/${item.id}`)}
        emptyMessage={
          typeFilter !== "all" || statusFilter !== "all" || classificationFilter !== "all"
            ? "No evidence matches your filters"
            : "No evidence uploaded yet"
        }
        filterSlot={
          <>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[150px] bg-secondary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[150px] bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classificationFilter} onValueChange={setClassificationFilter}>
              <SelectTrigger className="h-9 w-[150px] bg-secondary/50">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                <SelectItem value="RESTRICTED">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        pagination={{
          page: currentPage,
          pageSize,
          total: filteredEvidence.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Upload Dialog */}
      <EvidenceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={refreshEvidence}
        userId={userId ?? ""}
      />

      {/* Link Dialog */}
      {selectedEvidenceForLink && (
        <EvidenceLinkDialog
          open={linkDialogOpen}
          onOpenChange={(open) => {
            setLinkDialogOpen(open);
            if (!open) {
              setSelectedEvidenceForLink(null);
            }
          }}
          evidenceId={selectedEvidenceForLink.id}
          evidenceTitle={selectedEvidenceForLink.title}
          onSuccess={() => {
            refreshEvidence();
          }}
        />
      )}
    </div>
  );
}

