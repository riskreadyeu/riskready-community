import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  Plus,
  Shield,
  FileWarning,
  Eye,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
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
  getIncidents,
  getIncidentStats,
  type Incident,
  type IncidentStats,
  type IncidentSeverity,
  type IncidentStatus,
  severityLabels,
  statusLabels,
  categoryLabels,
} from "@/lib/incidents-api";

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const colors: Record<IncidentSeverity, string> = {
    CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
    HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    LOW: "bg-green-500/10 text-green-500 border-green-500/20",
  };
  return (
    <Badge variant="outline" className={colors[severity]}>
      {severityLabels[severity]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const colors: Record<IncidentStatus, string> = {
    DETECTED: "bg-red-500/10 text-red-500 border-red-500/20",
    TRIAGED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    INVESTIGATING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    CONTAINING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    ERADICATING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    RECOVERING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    POST_INCIDENT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    CLOSED: "bg-green-500/10 text-green-500 border-green-500/20",
  };
  return (
    <Badge variant="outline" className={colors[status]}>
      {statusLabels[status]}
    </Badge>
  );
}

export default function IncidentRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [severityFilter, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentsData, statsData] = await Promise.all([
        getIncidents({ take: 500 }),
        getIncidentStats(),
      ]);
      setIncidents(incidentsData.results);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
    return true;
  });

  // Search filter for DataTable
  const searchFilter = (incident: Incident, query: string): boolean => {
    const q = query.toLowerCase();
    return (
      incident.referenceNumber.toLowerCase().includes(q) ||
      incident.title.toLowerCase().includes(q) ||
      (incident.description || "").toLowerCase().includes(q)
    );
  };

  const columns: Column<Incident>[] = [
    {
      key: "referenceNumber",
      header: "Reference",
      sortable: true,
      render: (incident) => (
        <span className="font-mono text-xs">{incident.referenceNumber}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (incident) => (
        <div className="max-w-[300px]">
          <p className="truncate font-medium">{incident.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {categoryLabels[incident.category]}
          </p>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      render: (incident) => <SeverityBadge severity={incident.severity} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (incident) => <StatusBadge status={incident.status} />,
    },
    {
      key: "detectedAt",
      header: "Detected",
      sortable: true,
      render: (incident) => (
        <span className="text-sm text-muted-foreground">
          {new Date(incident.detectedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "regulatory",
      header: "Regulatory",
      render: (incident) => (
        <div className="flex gap-1">
          {incident.nis2Assessment?.isSignificantIncident && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Shield className="h-3 w-3" />
              NIS2
            </Badge>
          )}
          {incident.doraAssessment?.isMajorIncident && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <FileWarning className="h-3 w-3" />
              DORA
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "handler",
      header: "Handler",
      render: (incident) => (
        <span className="text-sm text-muted-foreground">
          {incident.handler
            ? `${incident.handler.firstName || ""} ${incident.handler.lastName || ""}`.trim() ||
              incident.handler.email
            : "Unassigned"}
        </span>
      ),
    },
  ];

  const rowActions = (incident: Incident): RowAction<Incident>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: () => `/incidents/${incident.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => navigate(`/incidents/${incident.id}/edit`),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Incident Register"
        description="All security incidents and their current status"
        icon={<AlertTriangle className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("This action is available via Claude Code or Claude Desktop using MCP tools")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link to="/incidents/new">
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Incidents"
          value={stats?.total || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Open"
          value={stats?.open || 0}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          variant="warning"
        />
        <StatCard
          title="Critical"
          value={stats?.bySeverity?.CRITICAL || 0}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          variant="destructive"
        />
        <StatCard
          title="Closed"
          value={stats?.closed || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          variant="success"
        />
      </StatCardGrid>

      {/* Data Table with integrated filters */}
      <DataTable
        title="Incidents"
        description={`${filteredIncidents.length} incidents`}
        data={filteredIncidents}
        columns={columns}
        keyExtractor={(incident) => incident.id}
        searchPlaceholder="Search incidents..."
        searchFilter={searchFilter}
        rowActions={rowActions}
        onRowClick={(incident) => navigate(`/incidents/${incident.id}`)}
        emptyMessage={
          severityFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all"
            ? "No incidents match your filters"
            : "No incidents have been reported yet"
        }
        filterSlot={
          <>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 w-[140px] bg-secondary/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[160px] bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DETECTED">Detected</SelectItem>
                <SelectItem value="TRIAGED">Triaged</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="CONTAINING">Containing</SelectItem>
                <SelectItem value="ERADICATING">Eradicating</SelectItem>
                <SelectItem value="RECOVERING">Recovering</SelectItem>
                <SelectItem value="POST_INCIDENT">Post-Incident</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[180px] bg-secondary/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        pagination={{
          page: currentPage,
          pageSize,
          total: filteredIncidents.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />
    </div>
  );
}
