import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Eye,
  XCircle,
  Download,
  Archive,
  FileText,
  Search as SearchIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  fetchAssessments,
  startAssessment,
  cancelAssessment,
  type Assessment,
  type ControlAssessmentStatus,
} from "@/lib/controls-api";
import { useBulkSelection } from "@/components/archer/hooks/use-bulk-selection";
import { BulkActionBar } from "@/components/archer/bulk-action-bar";
import { ExportDropdown } from "@/components/common/export-dropdown";

// =============================================================================
// Configuration
// =============================================================================

const statusConfig: Record<
  ControlAssessmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: <FileText className="h-3 w-3" /> },
  IN_PROGRESS: { label: "In Progress", variant: "default", icon: <Play className="h-3 w-3" /> },
  UNDER_REVIEW: { label: "Under Review", variant: "outline", icon: <Eye className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

// =============================================================================
// Component
// =============================================================================

export default function AssessmentListPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const bulkSelection = useBulkSelection(assessments, (a) => a.id);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const orgId = "cmj7b9wys0000eocjc9zm0j9m";
        const status = statusFilter !== "all" ? (statusFilter as ControlAssessmentStatus) : undefined;
        const data = await fetchAssessments(orgId, status);
        setAssessments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [statusFilter]);

  // Compute stats from loaded data
  const stats = useMemo(() => {
    const total = assessments.length;
    const inProgress = assessments.filter((a) => a.status === "IN_PROGRESS").length;
    const completed = assessments.filter((a) => a.status === "COMPLETED").length;
    const totalCompleted = assessments.reduce((sum, a) => sum + (a.completedTests || 0), 0);
    const totalPassed = assessments.reduce((sum, a) => sum + (a.passedTests || 0), 0);
    const passRate = totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) : 0;
    return { total, inProgress, completed, passRate };
  }, [assessments]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "\u2014";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
    if (!user) return "\u2014";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.email;
  };

  const isOverdue = (assessment: Assessment) => {
    if (!assessment.dueDate || assessment.status === "COMPLETED" || assessment.status === "CANCELLED") return false;
    return new Date(assessment.dueDate) < new Date();
  };

  const handleStartAssessment = async (assessment: Assessment) => {
    try {
      const updated = await startAssessment(assessment.id);
      setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start assessment");
    }
  };

  const handleCancelAssessment = async (assessment: Assessment) => {
    try {
      const updated = await cancelAssessment(assessment.id, "Cancelled from list page");
      setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel assessment");
    }
  };

  // Export config
  const exportColumns = assessments.length > 0 ? [
    { key: "assessmentRef", label: "Reference" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "totalTests", label: "Total Tests" },
    { key: "completedTests", label: "Completed" },
    { key: "passedTests", label: "Passed" },
    { key: "dueDate", label: "Due Date", format: (v: any) => formatDate(v) },
    { key: "createdAt", label: "Created", format: (v: any) => formatDate(v) },
  ] : [];

  const handleExport = (format: "excel" | "csv" | "pdf") => {
    console.log(`Exporting ${assessments.length} assessments to ${format}`);
  };

  // DataTable columns
  const columns: Column<Assessment>[] = [
    {
      key: "assessmentRef",
      header: "Reference",
      render: (a) => <span className="font-mono font-medium">{a.assessmentRef}</span>,
    },
    {
      key: "title",
      header: "Title",
      render: (a) => <span className="text-sm truncate max-w-[250px] block">{a.title}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const config = statusConfig[a.status];
        return (
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "progress",
      header: "Progress",
      render: (a) => {
        const total = a.totalTests || 0;
        const completed = a.completedTests || 0;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completed}/{total}
            </span>
          </div>
        );
      },
    },
    {
      key: "leadTester",
      header: "Lead Tester",
      render: (a) => (
        <span className="text-sm text-muted-foreground">{formatUserName(a.leadTester)}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (a) => (
        <span className={isOverdue(a) ? "text-destructive font-medium text-sm" : "text-sm"}>
          {formatDate(a.dueDate)}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (a) => (
        <div>
          <div className="text-sm">{formatDate(a.createdAt)}</div>
          <div className="text-xs text-muted-foreground">{formatUserName(a.createdBy)}</div>
        </div>
      ),
    },
  ];

  const rowActions = (assessment: Assessment): RowAction<Assessment>[] => {
    const actions: RowAction<Assessment>[] = [
      { label: "View", onClick: () => navigate(`/controls/assessments/${assessment.id}`) },
    ];
    if (assessment.status === "DRAFT") {
      actions.push({ label: "Start", onClick: () => handleStartAssessment(assessment) });
    }
    if (assessment.status !== "COMPLETED" && assessment.status !== "CANCELLED") {
      actions.push({ label: "Cancel", onClick: () => handleCancelAssessment(assessment) });
    }
    return actions;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Assessments"
        description="Manage control assessments and testing cycles"
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              data={assessments}
              columns={exportColumns}
              filename={`Assessments_${new Date().toISOString().split("T")[0]}`}
              onExport={handleExport}
            />
            <Button onClick={() => navigate("/controls/assessments/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Assessments"
          value={stats.total}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Pass Rate"
          value={`${stats.passRate}%`}
          icon={<CheckCircle className="h-4 w-4" />}
          iconClassName="text-primary"
          subtitle="across all assessments"
        />
      </StatCardGrid>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={bulkSelection.clearSelection}
        actions={[
          {
            label: "Export Selected",
            icon: Download,
            onClick: () => handleExport("excel"),
          },
        ]}
      />

      {/* Assessment List */}
      <DataTable
        columns={columns}
        data={assessments}
        keyExtractor={(a) => a.id}
        rowActions={rowActions}
        onRowClick={(a) => navigate(`/controls/assessments/${a.id}`)}
        emptyMessage="No assessments yet. Create your first assessment to begin testing controls."
        loading={loading}
        selectable={true}
        selectedIds={bulkSelection.selectedIds}
        onSelectionChange={bulkSelection.setSelectedIds}
      />
    </div>
  );
}
