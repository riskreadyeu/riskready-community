import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Network, Plus, Shield, Eye, Edit3, Trash2, ClipboardCheck } from "lucide-react";
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
  CriticalityBadge,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";
import { getBusinessProcesses, getProcessMetrics, type BusinessProcess } from "@/lib/organisation-api";

const processTypeLabels: Record<string, string> = {
  core: "Core",
  support: "Support",
  management: "Management",
};

export default function BusinessProcessesPage() {
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState<BusinessProcess[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [biaFilter, setBiaFilter] = useState<string>("all");
  const [metrics, setMetrics] = useState<{ total: number; active: number; bcpEnabled: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [processData, metricsData] = await Promise.all([
        getBusinessProcesses(),
        getProcessMetrics(),
      ]);
      setProcesses(processData.results);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Error loading processes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processes.filter((p) => {
    if (typeFilter !== "all" && p.processType !== typeFilter) return false;
    if (biaFilter !== "all" && p.biaStatus !== biaFilter) return false;
    return true;
  });

  // Calculate BIA stats
  const biaStats = {
    pending: processes.filter((p) => p.biaStatus === "pending" || !p.biaStatus).length,
    inProgress: processes.filter((p) => p.biaStatus === "in_progress").length,
    completed: processes.filter((p) => p.biaStatus === "completed").length,
  };

  const columns: Column<BusinessProcess>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      className: "font-mono text-xs text-muted-foreground",
      render: (process) => process.processCode,
    },
    {
      key: "name",
      header: "Process",
      render: (process) => (
        <Link
          to={`/organisation/processes/${process.id}`}
          className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
        >
          {process.name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (process) => (
        <Badge variant="outline">{processTypeLabels[process.processType] || process.processType}</Badge>
      ),
    },
    {
      key: "criticality",
      header: "Criticality",
      className: "text-center",
      render: (process) => <CriticalityBadge level={process.criticalityLevel} />,
    },
    {
      key: "owner",
      header: "Owner",
      render: (process) =>
        process.processOwner ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {process.processOwner.firstName?.[0]}{process.processOwner.lastName?.[0]}
            </div>
            <span className="text-sm">{process.processOwner.firstName} {process.processOwner.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "bcp",
      header: "BCP",
      className: "text-center",
      render: (process) => (
        <StatusBadge
          status={process.bcpEnabled ? "Enabled" : "Disabled"}
          variant={process.bcpEnabled ? "success" : "secondary"}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (process) => (
        <StatusBadge
          status={process.isActive ? "Active" : "Inactive"}
          variant={process.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<BusinessProcess>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (process) => `/organisation/processes/${process.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => toast.info("Edit functionality not yet available"),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => toast.info("Delete functionality not yet available"),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Business Processes"
        description="Manage critical business processes and BCP"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={() => toast.info("Create records via Claude Code or Claude Desktop using MCP tools")}>
            <Plus className="h-4 w-4" />
            Add Process
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Processes"
          value={metrics?.total ?? 0}
          subtitle={`${metrics?.active ?? 0} active`}
          icon={<Network className="h-4 w-4" />}
        />
        <StatCard
          title="BIA Complete"
          value={biaStats.completed}
          subtitle={`${biaStats.pending} pending`}
          icon={<ClipboardCheck className="h-4 w-4" />}
          iconClassName="text-emerald-500"
        />
        <StatCard
          title="BCP Enabled"
          value={metrics?.bcpEnabled ?? 0}
          subtitle="with continuity plans"
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Critical"
          value={processes.filter((p) => p.criticalityLevel === "critical").length}
          subtitle="critical processes"
          icon={<Network className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
      </StatCardGrid>

      <DataTable
        title="Process Library"
        data={filteredProcesses}
        columns={columns}
        keyExtractor={(process) => process.id}
        searchPlaceholder="Search processes..."
        searchFilter={(process, query) =>
          process.name.toLowerCase().includes(query.toLowerCase()) ||
          process.processCode.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No processes found"
        filterSlot={
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-9 bg-transparent">
                <SelectValue placeholder="Process Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
            <Select value={biaFilter} onValueChange={setBiaFilter}>
              <SelectTrigger className="w-[160px] h-9 bg-transparent">
                <SelectValue placeholder="BIA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All BIA Status</SelectItem>
                <SelectItem value="pending">Pending BIA</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
