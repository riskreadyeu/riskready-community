// =============================================================================
// RTSListV2Page - Risk Tolerance Statements List
// =============================================================================
// Updated to use DataTable component per design system

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Edit3,
  Plus,
  RefreshCw,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

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
  EmptyState,
  ListPageLayout,
} from "@/components/archer";

// API
import {
  getRTSList,
  type RiskToleranceStatement,
} from "@/lib/risks-api";

// Shared Constants
import {
  rtsStatusColors,
  rtsStatusLabels,
  toleranceLevelColors,
  toleranceLevelLabels,
} from "./_shared";

export function RTSListV2Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<RiskToleranceStatement[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, domainFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getRTSList({ take: 200 });
      setStatements(data.results);
    } catch (err) {
      console.error("Error loading RTS:", err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique domains
  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    statements.forEach((s) => {
      if (s.domain) domainSet.add(s.domain);
    });
    return Array.from(domainSet).sort();
  }, [statements]);

  const filteredStatements = useMemo(() => {
    return statements.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (domainFilter !== "all" && s.domain !== domainFilter) return false;
      return true;
    });
  }, [statements, statusFilter, domainFilter]);

  // Search filter for DataTable
  const searchFilter = (rts: RiskToleranceStatement, query: string): boolean => {
    const q = query.toLowerCase();
    return (
      rts.title.toLowerCase().includes(q) ||
      rts.rtsId.toLowerCase().includes(q) ||
      (rts.domain || "").toLowerCase().includes(q) ||
      (rts.proposedRTS || "").toLowerCase().includes(q)
    );
  };

  // DataTable columns definition
  const columns: Column<RiskToleranceStatement>[] = [
    {
      key: "rtsId",
      header: "RTS ID",
      render: (rts) => (
        <span className="font-mono text-xs">{rts.rtsId}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (rts) => (
        <span className="font-medium">{rts.title}</span>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      render: (rts) =>
        rts.domain ? (
          <Badge variant="outline">{rts.domain}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "toleranceLevel",
      header: "Tolerance Level",
      render: (rts) => (
        <Badge
          variant="outline"
          className={toleranceLevelColors[rts.proposedToleranceLevel]}
        >
          {toleranceLevelLabels[rts.proposedToleranceLevel]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (rts) => (
        <Badge variant="outline" className={rtsStatusColors[rts.status]}>
          {rtsStatusLabels[rts.status]}
        </Badge>
      ),
    },
    {
      key: "linkedRisks",
      header: "Linked Risks",
      render: (rts) => (
        <span className="text-muted-foreground">{rts._count?.risks || 0}</span>
      ),
    },
  ];

  // Row actions
  const rowActions = (rts: RiskToleranceStatement): RowAction<RiskToleranceStatement>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: () => `/risks/tolerance/${rts.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => navigate(`/risks/tolerance/${rts.id}?edit=true`),
    },
  ];

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
    <ListPageLayout
      title="Risk Tolerance Statements"
      description="Define and manage your organization's risk tolerance thresholds"
      breadcrumbs={[
        { label: "Risks", href: "/risks" },
        { label: "Tolerance Statements" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Statement
          </Button>
        </div>
      }
    >
      {statements.length === 0 ? (
        <EmptyState
          icon={<Scale className="h-12 w-12" />}
          title="No Tolerance Statements Found"
          description="Get started by defining your first risk tolerance statement."
          action={{
            label: "Add Statement",
            onClick: () => toast.info("Create RTS feature coming soon"),
          }}
        />
      ) : (
        <DataTable
          data={filteredStatements}
          columns={columns}
          keyExtractor={(rts) => rts.id}
          searchPlaceholder="Search statements..."
          searchFilter={searchFilter}
          rowActions={rowActions}
          onRowClick={(rts) => navigate(`/risks/tolerance/${rts.id}`)}
          emptyMessage="No tolerance statements found"
          loading={loading}
          filterSlot={
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[180px] bg-secondary/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
              {domains.length > 0 && (
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="h-9 w-[180px] bg-secondary/50">
                    <SelectValue placeholder="Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          }
          pagination={{
            page: currentPage,
            pageSize: pageSize,
            total: filteredStatements.length,
            onPageChange: setCurrentPage,
            onPageSizeChange: setPageSize,
            pageSizeOptions: [10, 25, 50, 100],
          }}
          aggregationRow={{
            columns: {
              rtsId: <span className="font-semibold">Totals</span>,
              title: <span className="text-sm">{filteredStatements.length} statements</span>,
              domain: "",
              toleranceLevel: "",
              status: "",
              linkedRisks: (
                <span className="text-sm text-muted-foreground">
                  {filteredStatements.reduce((sum, r) => sum + (r._count?.risks || 0), 0)} risks
                </span>
              ),
            },
          }}
        />
      )}
    </ListPageLayout>
  );
}
