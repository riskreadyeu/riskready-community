import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Plus,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type Column,
  type RowAction,
} from "@/components/common";
import {
  getEvidenceRequests,
  getEvidenceRequestStats,
  type EvidenceRequest,
  type EvidenceRequestStats,
  type EvidenceRequestStatus,
  type EvidenceRequestPriority,
} from "@/lib/evidence-api";
import { EvidenceRequestDialog } from "@/components/evidence/EvidenceRequestDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const statusLabels: Record<EvidenceRequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  OVERDUE: "Overdue",
};

const statusColors: Record<EvidenceRequestStatus, string> = {
  OPEN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  SUBMITTED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ACCEPTED: "bg-green-500/10 text-green-500 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels: Record<EvidenceRequestPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const priorityColors: Record<EvidenceRequestPriority, string> = {
  LOW: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  HIGH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function EvidenceRequestsPage() {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<EvidenceRequest[]>([]);
  const [stats, setStats] = useState<EvidenceRequestStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        getEvidenceRequests({ take: 500 }),
        getEvidenceRequestStats(),
      ]);
      setRequests(requestsData.results);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.requestRef.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const columns: Column<EvidenceRequest>[] = [
    {
      key: "requestRef",
      header: "Reference",
      sortable: true,
      render: (item) => (
        <Link
          to={`/evidence/requests/${item.id}`}
          className="font-mono text-xs text-primary hover:underline"
        >
          {item.requestRef}
        </Link>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (item) => (
        <div className="max-w-[300px]">
          <p className="truncate font-medium">{item.title}</p>
          {item.contextRef && (
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              For: {item.contextRef}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (item) => (
        <Badge
          variant="outline"
          className={priorityColors[item.priority] || ""}
        >
          {priorityLabels[item.priority] || item.priority}
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
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (item) => {
        const daysUntil = getDaysUntilDue(item.dueDate);
        const isOverdue = daysUntil < 0;
        const isDueSoon = !isOverdue && daysUntil <= 3;
        
        return (
          <div className="flex items-center gap-2">
            <Calendar className={`h-3.5 w-3.5 ${isOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className={`text-sm ${isOverdue ? "text-red-500 font-medium" : isDueSoon ? "text-amber-500" : "text-muted-foreground"}`}>
              {new Date(item.dueDate).toLocaleDateString()}
              {isOverdue && ` (${Math.abs(daysUntil)}d overdue)`}
              {isDueSoon && !isOverdue && ` (${daysUntil}d)`}
            </span>
          </div>
        );
      },
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.assignedTo
            ? `${item.assignedTo.firstName || ""} ${item.assignedTo.lastName || ""}`.trim() || item.assignedTo.email
            : item.assignedDepartment?.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "fulfillments",
      header: "Fulfillments",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.fulfillments?.length || 0}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rowActions = (item: EvidenceRequest): RowAction<EvidenceRequest>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => navigate(`/evidence/requests/${item.id}`),
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Evidence Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage evidence requests from stakeholders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setRequestDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.byStatus?.OPEN || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.overdue || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.byStatus?.ACCEPTED || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
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
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <DataTable
            data={filteredRequests}
            columns={columns}
            keyExtractor={(item) => item.id}
            rowActions={rowActions}
            onRowClick={(item) => navigate(`/evidence/requests/${item.id}`)}
            emptyMessage={
              searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "No requests match your filters"
                : "No evidence requests yet"
            }
            pagination={{
              page: currentPage,
              pageSize,
              total: filteredRequests.length,
              onPageChange: setCurrentPage,
              onPageSizeChange: setPageSize,
              pageSizeOptions: [10, 25, 50, 100],
            }}
          />
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <EvidenceRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={loadData}
        userId={userId ?? ""}
      />
    </div>
  );
}

