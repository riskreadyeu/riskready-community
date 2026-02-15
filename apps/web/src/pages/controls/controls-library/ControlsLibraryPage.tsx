import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, CheckCircle2, AlertTriangle, Clock, Eye, Edit3, LayoutDashboard, Power, PowerOff, Download, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";
import { ActiveStatusBadge } from "@/components/shared/ActiveStatusBadge";
import { getControls, getControlStats, type Control, type ControlStats } from "@/lib/controls-api";
import { useBulkSelection } from "@/components/archer/hooks/use-bulk-selection";
import { BulkActionBar } from "@/components/archer/bulk-action-bar";
import { ExportDropdown } from "@/components/common/export-dropdown";

const themeLabels: Record<string, string> = {
  ORGANISATIONAL: "Organisational",
  PEOPLE: "People",
  PHYSICAL: "Physical",
  TECHNOLOGICAL: "Technological",
};

const statusLabels: Record<string, string> = {
  IMPLEMENTED: "Implemented",
  PARTIAL: "Partial",
  NOT_STARTED: "Not Started",
};

const frameworkLabels: Record<string, string> = {
  ISO: "ISO 27001",
  SOC2: "SOC2",
  NIS2: "NIS2",
  DORA: "DORA",
};

export default function ControlsLibraryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<Control[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk selection
  const bulkSelection = useBulkSelection(controls, (control) => control.id);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, themeFilter, statusFilter, frameworkFilter, activeOnly]);

  // Clear selection on filter/page change
  useEffect(() => {
    bulkSelection.clearSelection();
  }, [currentPage, pageSize, themeFilter, statusFilter, frameworkFilter, activeOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [controlsData, statsData] = await Promise.all([
        getControls({
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          ...(themeFilter !== "all" && { theme: themeFilter as any }),
          ...(statusFilter !== "all" && { implementationStatus: statusFilter as any }),
          ...(frameworkFilter !== "all" && { framework: frameworkFilter as any }),
          ...(activeOnly && { activeOnly: true }),
        }),
        getControlStats(),
      ]);
      setControls(controlsData.results);
      setTotalCount(controlsData.count);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading controls:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filters are now handled server-side via API params
  const filteredControls = controls;

  const columns: Column<Control>[] = [
    {
      key: "controlId",
      header: "Control ID",
      render: (control) => (
        <span className="font-mono text-xs text-muted-foreground">{control.controlId}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (control) => (
        <Link
          to={`/controls/${control.id}`}
          className="font-medium hover:underline hover:text-primary"
        >
          {control.name}
        </Link>
      ),
    },
    {
      key: "framework",
      header: "Framework",
      render: (control) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {frameworkLabels[control.framework || 'ISO'] || control.framework || 'ISO'}
        </span>
      ),
    },
    {
      key: "theme",
      header: "Theme",
      render: (control) => (
        <span className="text-sm">
          {themeLabels[control.theme] || control.theme}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (control) => (
        <StatusBadge
          status={statusLabels[control.implementationStatus] || control.implementationStatus}
          variant={
            control.implementationStatus === "IMPLEMENTED" ? "success" :
            control.implementationStatus === "PARTIAL" ? "warning" : "secondary"
          }
        />
      ),
    },
    {
      key: "activeStatus",
      header: "Active Status",
      render: (control) => (
        <ActiveStatusBadge
          applicable={control.applicable}
          enabled={control.enabled}
          justificationIfNa={control.justificationIfNa}
          disabledReason={control.disabledReason}
          disabledAt={control.disabledAt}
          disabledBy={control.disabledBy}
          size="sm"
        />
      ),
    },
    {
      key: "capabilities",
      header: "Capabilities",
      render: (control) => (
        <span className="text-sm text-muted-foreground">
          {control._count?.['capabilities'] ?? 0}
        </span>
      ),
    },
  ];

  // Export handlers
  const exportColumns = controls.length > 0 ? [
    { key: "controlId", label: "Control ID" },
    { key: "name", label: "Name" },
    { key: "framework", label: "Framework" },
    { key: "theme", label: "Theme" },
    { key: "implementationStatus", label: "Status" },
    { key: "applicable", label: "Applicable", format: (v: unknown) => v ? "Yes" : "No" },
    { key: "enabled", label: "Enabled", format: (v: unknown) => v ? "Yes" : "No" },
  ] : [];

  const handleExport = (format: "excel" | "csv" | "pdf") => {
    console.log(`Exporting ${controls.length} controls to ${format}`);
  };

  const handleBulkEnable = () => {
    console.log(`Enabling controls:`, bulkSelection.selectedIds);
    // TODO: Call API to bulk enable
    bulkSelection.clearSelection();
  };

  const handleBulkDisable = () => {
    console.log(`Disabling controls:`, bulkSelection.selectedIds);
    // TODO: Call API to bulk disable
    bulkSelection.clearSelection();
  };

  const rowActions = (control: Control): RowAction<Control>[] => {
    const isActive = control.applicable && control.enabled;
    const actions: RowAction<Control>[] = [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        href: () => `/controls/${control.id}`,
      },
      {
        label: "Edit",
        icon: <Edit3 className="w-4 h-4" />,
        href: () => `/controls/${control.id}?edit=true`,
      },
      {
        label: "Add to Assessment",
        icon: <ClipboardList className="w-4 h-4" />,
        onClick: () => navigate(`/controls/assessments?addControl=${control.id}`),
        separator: true,
      },
    ];

    // Add enable/disable action based on current status
    if (control.applicable) {
      if (isActive) {
        actions.push({
          label: "Disable",
          icon: <PowerOff className="w-4 h-4" />,
          onClick: () => navigate(`/controls/${control.id}?action=disable`),
          separator: true,
        });
      } else {
        actions.push({
          label: "Enable",
          icon: <Power className="w-4 h-4" />,
          onClick: () => navigate(`/controls/${control.id}?action=enable`),
          separator: true,
        });
      }
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Controls Library"
        description="Multi-framework control management: ISO 27001, SOC2, NIS2, DORA"
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              data={controls}
              columns={exportColumns}
              filename={`Controls_Library_${new Date().toISOString().split('T')[0]}`}
              onExport={handleExport}
            />
            <Link to="/controls">
              <Button variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button onClick={() => navigate("/controls/library/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Control
            </Button>
          </div>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Controls"
          value={stats?.total ?? 0}
          icon={<Shield className="h-4 w-4" />}
          subtitle="ISO 27001:2022"
        />
        <StatCard
          title="Implemented"
          value={stats?.implemented ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClassName="text-success"
          subtitle={`${stats && stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0}% complete`}
        />
        <StatCard
          title="Partial"
          value={stats?.partial ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-warning"
          subtitle="In progress"
        />
        <StatCard
          title="Not Started"
          value={stats?.notStarted ?? 0}
          icon={<Clock className="h-4 w-4" />}
          subtitle="Pending"
        />
      </StatCardGrid>

      <BulkActionBar
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={bulkSelection.clearSelection}
        actions={[
          {
            label: "Export Selected",
            icon: Download,
            onClick: () => handleExport("excel"),
          },
          {
            label: "Enable",
            icon: Power,
            onClick: handleBulkEnable,
          },
          {
            label: "Disable",
            icon: PowerOff,
            variant: "secondary",
            onClick: handleBulkDisable,
          },
          {
            label: "Add to Assessment",
            icon: ClipboardList,
            onClick: () => {
              const ids = Array.from(bulkSelection.selectedIds).join(",");
              navigate(`/controls/assessments?addControls=${ids}`);
              bulkSelection.clearSelection();
            },
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredControls}
        keyExtractor={(control) => control.id}
        rowActions={rowActions}
        emptyMessage="No controls found"
        loading={loading}
        selectable={true}
        selectedIds={bulkSelection.selectedIds}
        onSelectionChange={bulkSelection.setSelectedIds}
        aggregationRow={{
          columns: {
            __selection: "",
            controlId: <span className="font-semibold">Totals</span>,
            name: <span className="text-sm">{totalCount} controls</span>,
            framework: "",
            theme: "",
            status: (
              <span className="text-xs">
                {stats && `${Math.round((stats.implemented / stats.total) * 100)}% impl`}
              </span>
            ),
            activeStatus: "",
            capabilities: <span className="text-sm text-muted-foreground">-</span>,
          },
        }}
        filterSlot={
          <>
            <div className="flex items-center gap-2 px-2">
              <Switch
                id="activeOnly"
                checked={activeOnly}
                onCheckedChange={(checked) => { setActiveOnly(checked); setCurrentPage(1); }}
              />
              <Label htmlFor="activeOnly" className="text-sm cursor-pointer">
                Active Only
              </Label>
            </div>

            <Select value={frameworkFilter} onValueChange={(v) => { setFrameworkFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-40 bg-secondary/50">
                <SelectValue placeholder="Filter by framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="ISO">ISO 27001</SelectItem>
                <SelectItem value="SOC2">SOC2</SelectItem>
                <SelectItem value="NIS2">NIS2</SelectItem>
                <SelectItem value="DORA">DORA</SelectItem>
              </SelectContent>
            </Select>

            <Select value={themeFilter} onValueChange={(v) => { setThemeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-44 bg-secondary/50">
                <SelectValue placeholder="Filter by theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                <SelectItem value="ORGANISATIONAL">Organisational</SelectItem>
                <SelectItem value="PEOPLE">People</SelectItem>
                <SelectItem value="PHYSICAL">Physical</SelectItem>
                <SelectItem value="TECHNOLOGICAL">Technological</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-40 bg-secondary/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
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
    </div>
  );
}
