
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getControls, type Control, type ControlTheme, type ImplementationStatus, type ControlFramework } from "@/lib/controls-api";
import { DataTable, Column, RowAction } from "@/components/common/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveStatusBadge } from "@/components/shared/ActiveStatusBadge";
import {
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Power,
  PowerOff,
} from "lucide-react";

function getEffectivenessBadge(rating: string) {
  switch (rating) {
    case "Effective":
      return { label: "Effective", className: "bg-success/10 text-success border-success/20" };
    case "Partially Effective":
      return { label: "Partial", className: "bg-warning/10 text-warning border-warning/20" };
    case "Not Effective":
      return { label: "Ineffective", className: "bg-destructive/10 text-destructive border-destructive/20" };
    default:
      return { label: "Not Assessed", className: "bg-muted text-muted-foreground" };
  }
}

function getThemeLabel(theme: ControlTheme): string {
  switch (theme) {
    case "ORGANISATIONAL": return "Organisational";
    case "PEOPLE": return "People";
    case "PHYSICAL": return "Physical";
    case "TECHNOLOGICAL": return "Technological";
    default: return theme;
  }
}

function getStatusLabel(status: ImplementationStatus): string {
  switch (status) {
    case "NOT_STARTED": return "Not Started";
    case "PARTIAL": return "Partial";
    case "IMPLEMENTED": return "Implemented";
    default: return status;
  }
}

const frameworkLabels: Record<string, string> = {
  ISO: "ISO 27001",
  SOC2: "SOC2",
  NIS2: "NIS2",
  DORA: "DORA",
};

export function ControlLibrary() {
  const navigate = useNavigate();
  const [controls, setControls] = useState<Control[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState<ControlTheme | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ImplementationStatus | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    async function fetchControls() {
      setLoading(true);
      setError(null);
      try {
        const params: Parameters<typeof getControls>[0] = {
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        };
        if (searchQuery) params.search = searchQuery;
        if (themeFilter !== "all") params.theme = themeFilter;
        if (statusFilter !== "all") params.implementationStatus = statusFilter;
        if (activeOnly) params.activeOnly = true;

        const response = await getControls(params);
        setControls(response.results);
        setTotalCount(response.count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load controls");
      } finally {
        setLoading(false);
      }
    }
    fetchControls();
  }, [currentPage, pageSize, searchQuery, themeFilter, statusFilter, activeOnly]);

  // Define columns for DataTable
  const columns: Column<Control>[] = [
    {
      key: "controlId",
      header: "ID",
      sortable: true,
      className: "w-[90px]",
      render: (control) => (
        <span className="font-mono text-xs text-muted-foreground">{control.controlId}</span>
      ),
    },
    {
      key: "name",
      header: "Control",
      sortable: true,
      render: (control) => (
        <div className="flex flex-col">
          <Link
            to={`/controls/${control.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
          >
            {control.name}
          </Link>
          <span className="text-xs text-muted-foreground">{getThemeLabel(control.theme)}</span>
        </div>
      ),
    },
    {
      key: "layers",
      header: "Layers",
      render: (control) => (
        <span className="text-sm text-muted-foreground">
          {control._count?.['layers'] || 0} layers
        </span>
      ),
    },
    {
      key: "framework",
      header: "Framework",
      render: (control) => (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-secondary/50">
          {frameworkLabels[control.framework || 'ISO'] || control.framework || 'ISO 27001'}
        </Badge>
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
      key: "status",
      header: "Impl. Status",
      sortable: true,
      render: (control) => (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            control.implementationStatus === "IMPLEMENTED" &&
              "bg-success/10 text-success border-success/20",
            control.implementationStatus === "PARTIAL" && "bg-warning/10 text-warning border-warning/20",
            control.implementationStatus === "NOT_STARTED" && "bg-muted text-muted-foreground"
          )}
        >
          {getStatusLabel(control.implementationStatus)}
        </Badge>
      ),
    },
    {
      key: "effectiveness",
      header: "Effectiveness",
      headerClassName: "text-center",
      className: "text-center",
      render: (control) => {
        const effectivenessBadge = getEffectivenessBadge(control.effectiveness?.rating || "");
        return (
          <Badge variant="outline" className={cn("text-[10px]", effectivenessBadge.className)}>
            {effectivenessBadge.label}
          </Badge>
        );
      },
    },
    {
      key: "score",
      header: "Score",
      headerClassName: "text-center",
      render: (control) =>
        control.effectiveness?.score !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  control.effectiveness.score >= 90
                    ? "bg-success"
                    : control.effectiveness.score >= 70
                    ? "bg-warning"
                    : "bg-destructive"
                )}
                style={{ width: `${control.effectiveness.score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{control.effectiveness.score}%</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];

  // Define row actions for DataTable
  const getRowActions = (control: Control): RowAction<Control>[] => {
    const isActive = control.applicable && control.enabled;
    const actions: RowAction<Control>[] = [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        href: () => `/controls/${control.id}`,
      },
      {
        label: "Edit Control",
        icon: <Edit3 className="w-4 h-4" />,
        href: () => `/controls/${control.id}?edit=true`,
      },
      {
        label: "View Evidence",
        icon: <FileText className="w-4 h-4" />,
        onClick: () => navigate(`/controls/${control.id}?tab=evidence`),
      },
      {
        label: "Open in New Tab",
        icon: <ExternalLink className="w-4 h-4" />,
        onClick: () => window.open(`/controls/${control.id}`, "_blank"),
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

  // Filter slot for theme and status dropdowns
  const filterSlot = (
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

      <Select
        value={themeFilter}
        onValueChange={(v) => {
          setThemeFilter(v as ControlTheme | "all");
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="h-9 w-40 bg-secondary/50">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Themes</SelectItem>
          <SelectItem value="ORGANISATIONAL">Organisational</SelectItem>
          <SelectItem value="PEOPLE">People</SelectItem>
          <SelectItem value="PHYSICAL">Physical</SelectItem>
          <SelectItem value="TECHNOLOGICAL">Technological</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v as ImplementationStatus | "all");
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="h-9 w-40 bg-secondary/50">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
          <SelectItem value="PARTIAL">Partial</SelectItem>
          <SelectItem value="NOT_STARTED">Not Started</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <DataTable
      title="Control Library"
      description="Comprehensive control management across all frameworks"
      data={controls}
      columns={columns}
      keyExtractor={(control) => control.id}
      searchPlaceholder="Search controls..."
      searchFilter={(control, query) => {
        const search = query.toLowerCase();
        return (
          control.controlId.toLowerCase().includes(search) ||
          control.name.toLowerCase().includes(search) ||
          getThemeLabel(control.theme).toLowerCase().includes(search)
        );
      }}
      rowActions={getRowActions}
      filterSlot={filterSlot}
      pagination={{
        page: currentPage,
        pageSize: pageSize,
        total: totalCount,
        onPageChange: setCurrentPage,
        onPageSizeChange: setPageSize,
        pageSizeOptions: [10, 20, 50, 100],
      }}
      loading={loading}
      emptyMessage={error || "No controls found"}
    />
  );
}
