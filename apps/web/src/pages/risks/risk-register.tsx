// =============================================================================
// Risk Register V2 Page
// =============================================================================
// Risk register list page with bulk selection and filtering capabilities
// Updated to use DataTable component per design system

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  Edit3,
  Plus,
  RefreshCw,
  Settings,
  Shield,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Common Components (Design System)
import { DataTable, type Column, type RowAction } from "@/components/common";

// Archer Components
import {
  BulkActionBar,
  EmptyState,
  ListPageLayout,
  useBulkSelection,
} from "@/components/archer";

// API
import { getRisks, type Risk } from "@/lib/risks-api";
import { toast } from "sonner";


// Shared constants
import { tierColors, tierLabels, statusColors, statusLabels, getRiskLevel } from "./_shared";

export function RiskRegisterV2Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);


  // Filter risks based on current filters
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (frameworkFilter !== "all" && r.framework !== frameworkFilter) return false;
      return true;
    });
  }, [risks, tierFilter, statusFilter, frameworkFilter]);

  const bulkSelection = useBulkSelection(filteredRisks, (r) => r.id);

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    bulkSelection.clearSelection();
  }, [tierFilter, statusFilter, frameworkFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getRisks({ take: 500 });
      setRisks(data.results);
    } catch (err) {
      console.error("Error loading risks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    toast.info(`Exporting ${bulkSelection.selectedIds.length} risks - feature coming soon`);
  };

  const handleBulkStatusChange = () => {
    toast.info(`Bulk status change for ${bulkSelection.selectedIds.length} risks - feature coming soon`);
  };

  // DataTable columns definition
  const columns: Column<Risk>[] = [
    {
      key: "riskId",
      header: "Risk ID",
      render: (risk) => (
        <span className="font-mono text-xs">{risk.riskId}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (risk) => (
        <span className="font-medium">{risk.title}</span>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (risk) => (
        <Badge variant="outline" className={tierColors[risk.tier]}>
          {tierLabels[risk.tier]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (risk) => (
        <Badge variant="outline" className={statusColors[risk.status]}>
          {statusLabels[risk.status]}
        </Badge>
      ),
    },
    {
      key: "framework",
      header: "Framework",
      render: (risk) => (
        <Badge variant="outline">{risk.framework}</Badge>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (risk) =>
        risk.residualScore ? (
          <Badge variant="outline" className={getRiskLevel(risk.residualScore).color}>
            {risk.residualScore}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "scenarios",
      header: "Scenarios",
      render: (risk) => (
        <span className="text-muted-foreground">{risk._count?.scenarios || 0}</span>
      ),
    },
  ];

  // Row actions for each risk
  const rowActions = (risk: Risk): RowAction<Risk>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: () => `/risks/${risk.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => navigate(`/risks/${risk.id}?edit=true`),
    },
  ];

  // Search filter function for DataTable
  const searchFilter = (risk: Risk, query: string): boolean => {
    const q = query.toLowerCase();
    return (
      risk.title.toLowerCase().includes(q) ||
      risk.riskId.toLowerCase().includes(q) ||
      (risk.description || "").toLowerCase().includes(q)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
    <ListPageLayout
      title="Risk Register"
      description="View and manage all identified information security risks"
      breadcrumbs={[
        { label: "Risks", href: "/risks" },
        { label: "Register" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate("/risks/register/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      }
    >
      {filteredRisks.length === 0 && (tierFilter !== "all" || statusFilter !== "all" || frameworkFilter !== "all") ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="No Risks Found"
          description="No risks match your current filters. Try adjusting your search criteria."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setTierFilter("all");
              setStatusFilter("all");
              setFrameworkFilter("all");
            },
          }}
        />
      ) : risks.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="No Risks Found"
          description="Get started by adding your first risk to the register."
          action={{
            label: "Add Risk",
            onClick: () => navigate("/risks/register/new"),
          }}
        />
      ) : (
        <DataTable
          data={filteredRisks}
          columns={columns}
          keyExtractor={(risk) => risk.id}
          searchPlaceholder="Search risks..."
          searchFilter={searchFilter}
          rowActions={rowActions}
          onRowClick={(risk) => navigate(`/risks/${risk.id}`)}
          emptyMessage="No risks found"
          loading={loading}
          selectable={true}
          selectedIds={bulkSelection.selectedIds}
          onSelectionChange={bulkSelection.setSelectedIds}
          filterSlot={
            <>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="h-9 w-[140px] bg-secondary/50">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="EXTENDED">Extended</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] bg-secondary/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="IDENTIFIED">Identified</SelectItem>
                  <SelectItem value="ASSESSED">Assessed</SelectItem>
                  <SelectItem value="TREATING">Treating</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="h-9 w-[140px] bg-secondary/50">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="ISO">ISO 27001</SelectItem>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="NIS2">NIS2</SelectItem>
                  <SelectItem value="DORA">DORA</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          pagination={{
            page: currentPage,
            pageSize: pageSize,
            total: filteredRisks.length,
            onPageChange: setCurrentPage,
            onPageSizeChange: setPageSize,
            pageSizeOptions: [10, 25, 50, 100],
          }}
          aggregationRow={{
            columns: {
              __selection: "",
              riskId: <span className="font-semibold">Totals</span>,
              title: <span className="text-sm">{filteredRisks.length} risks</span>,
              tier: "",
              status: "",
              framework: "",
              score: "",
              scenarios: (
                <span className="text-sm text-muted-foreground">
                  {filteredRisks.reduce((sum, r) => sum + (r._count?.scenarios || 0), 0)} total
                </span>
              ),
            },
          }}
        />
      )}

      <BulkActionBar
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={bulkSelection.clearSelection}
        actions={[
          {
            label: "Export",
            onClick: handleBulkExport,
            icon: Download,
          },
          {
            label: "Change Status",
            onClick: handleBulkStatusChange,
            icon: Settings,
          },
        ]}
      />
    </ListPageLayout>

    </>
  );
}
