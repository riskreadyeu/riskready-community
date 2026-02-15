import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, AlertCircle, Archive, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PageHeader,
  DataTable,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from '@/components/common';
import {
  getSOAs,
  getSOAStats,
  StatementOfApplicability,
  SOAStats,
  SOAStatus,
} from '@/lib/controls-api';
import { useBulkSelection } from '@/components/archer/hooks/use-bulk-selection';
import { BulkActionBar } from '@/components/archer/bulk-action-bar';
import { ExportDropdown } from '@/components/common/export-dropdown';

const statusConfig: Record<SOAStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: 'Approved', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  SUPERSEDED: { label: 'Superseded', variant: 'destructive', icon: <Archive className="h-3 w-3" /> },
};

export default function SOAListPage() {
  const navigate = useNavigate();
  const [soas, setSOAs] = useState<StatementOfApplicability[]>([]);
  const [stats, setStats] = useState<SOAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection
  const bulkSelection = useBulkSelection(soas, (soa) => soa.id);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all SOAs (backend handles auth/filtering)
        const [soaResponse, statsResponse] = await Promise.all([
          getSOAs(),
          getSOAStats().catch(() => null),
        ]);
        setSOAs(soaResponse.data);
        setStats(statsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SOA data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
    if (!user) return '-';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.email;
  };

  // Export handlers
  const exportColumns = soas.length > 0 ? [
    { key: "version", label: "Version" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "_count", label: "Controls", format: (v: any) => v?.entries || 0 },
    { key: "createdAt", label: "Created", format: (v: any) => formatDate(v) },
    { key: "approvedAt", label: "Approved", format: (v: any) => formatDate(v) },
  ] : [];

  const handleExport = (format: "excel" | "csv" | "pdf") => {
    console.log(`Exporting ${soas.length} SOA versions to ${format}`);
  };

  const handleBulkApprove = () => {
    console.log(`Approve SOA versions:`, bulkSelection.selectedIds);
    // TODO: Call API to bulk approve
    bulkSelection.clearSelection();
  };

  const handleBulkArchive = () => {
    console.log(`Archive SOA versions:`, bulkSelection.selectedIds);
    // TODO: Call API to bulk archive
    bulkSelection.clearSelection();
  };

  // DataTable columns
  const columns: Column<StatementOfApplicability>[] = [
    {
      key: "version",
      header: "Version",
      render: (soa) => <span className="font-medium">v{soa.version}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (soa) => <span>{soa.name || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (soa) => {
        const config = statusConfig[soa.status];
        return (
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "controls",
      header: "Controls",
      render: (soa) => <span>{soa._count?.entries || 0}</span>,
    },
    {
      key: "created",
      header: "Created",
      render: (soa) => (
        <div>
          <div className="text-sm">{formatDate(soa.createdAt)}</div>
          <div className="text-xs text-muted-foreground">
            {formatUserName(soa.createdBy)}
          </div>
        </div>
      ),
    },
    {
      key: "approved",
      header: "Approved",
      render: (soa) =>
        soa.approvedAt ? (
          <div>
            <div className="text-sm">{formatDate(soa.approvedAt)}</div>
            <div className="text-xs text-muted-foreground">
              {formatUserName(soa.approvedBy)}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  const rowActions = (soa: StatementOfApplicability): RowAction<StatementOfApplicability>[] => [
    {
      label: "View",
      onClick: () => navigate(`/controls/soa/${soa.id}`),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
        title="Statement of Applicability"
        description="Manage ISO 27001 control applicability decisions"
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              data={soas}
              columns={exportColumns}
              filename={`SOA_Versions_${new Date().toISOString().split('T')[0]}`}
              onExport={handleExport}
            />
            <Button onClick={() => navigate('/controls/soa/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <StatCardGrid columns={4}>
          <StatCard
            title="Total Versions"
            value={stats.totalVersions}
            icon={<FileText className="h-4 w-4" />}
            subtitle={stats.latestVersion ? `Latest: v${stats.latestVersion}` : undefined}
          />
          <StatCard
            title="Applicable Controls"
            value={stats.applicableCount}
            icon={<CheckCircle className="h-4 w-4" />}
            iconClassName="text-success"
            subtitle={`${stats.notApplicableCount} not applicable`}
          />
          <StatCard
            title="Implemented"
            value={stats.implementedCount}
            icon={<CheckCircle className="h-4 w-4" />}
            iconClassName="text-primary"
            subtitle={`${stats.partialCount} partial, ${stats.notStartedCount} not started`}
          />
          <StatCard
            title="Implementation Rate"
            value={stats.applicableCount > 0
              ? `${Math.round((stats.implementedCount / stats.applicableCount) * 100)}%`
              : "0%"}
            icon={<FileText className="h-4 w-4" />}
            subtitle="of applicable controls"
          />
        </StatCardGrid>
      )}

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
            label: "Approve",
            icon: CheckCircle,
            onClick: handleBulkApprove,
          },
          {
            label: "Archive",
            icon: Archive,
            variant: "secondary",
            onClick: handleBulkArchive,
          },
        ]}
      />

      {/* SOA List */}
      <DataTable
        columns={columns}
        data={soas}
        keyExtractor={(soa) => soa.id}
        rowActions={rowActions}
        onRowClick={(soa) => navigate(`/controls/soa/${soa.id}`)}
        emptyMessage="No SOA versions yet. Create your first Statement of Applicability to document control decisions."
        loading={loading}
        selectable={true}
        selectedIds={bulkSelection.selectedIds}
        onSelectionChange={bulkSelection.setSelectedIds}
        aggregationRow={{
          columns: {
            __selection: "",
            version: <span className="font-semibold">Totals</span>,
            name: <span className="text-sm">{stats?.totalVersions || 0} versions</span>,
            status: "",
            controls: <span className="text-sm">{stats?.applicableCount || 0} applicable</span>,
            created: "",
            approved: (
              <span className="text-xs">
                {stats && `${Math.round((stats.implementedCount / (stats.applicableCount || 1)) * 100)}% impl`}
              </span>
            ),
          },
        }}
      />
    </div>
  );
}
