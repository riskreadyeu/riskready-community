import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Server,
  Database,
  Cloud,
  Monitor,
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard, StatCardGrid } from '@/components/common';
import {
  type Asset,
  type AssetSummary,
  type AssetType,
  type AssetStatus,
  type BusinessCriticality,
  type CapacityStatus,
} from '@/lib/itsm-api';
import { useAssets, useAssetSummary } from '@/hooks/queries';

const ASSET_TYPE_ICONS: Record<string, React.ReactNode> = {
  SERVER: <Server className="h-4 w-4" />,
  DATABASE: <Database className="h-4 w-4" />,
  CLOUD_VM: <Cloud className="h-4 w-4" />,
  CLOUD_DATABASE: <Cloud className="h-4 w-4" />,
  WORKSTATION: <Monitor className="h-4 w-4" />,
  LAPTOP: <Monitor className="h-4 w-4" />,
  APPLICATION: <Shield className="h-4 w-4" />,
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const CRITICALITY_COLORS: Record<BusinessCriticality, BadgeVariant> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

const STATUS_COLORS: Record<AssetStatus, BadgeVariant> = {
  ACTIVE: 'default',
  PLANNED: 'secondary',
  PROCUREMENT: 'secondary',
  DEVELOPMENT: 'secondary',
  STAGING: 'secondary',
  MAINTENANCE: 'outline',
  RETIRING: 'outline',
  DISPOSED: 'outline',
};

export default function AssetRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 20;

  const filters = {
    assetType: searchParams.get('assetType') as AssetType | null,
    status: searchParams.get('status') as AssetStatus | null,
    businessCriticality: searchParams.get('businessCriticality') as BusinessCriticality | null,
    capacityStatus: searchParams.get('capacityStatus') || undefined,
  };

  const { data: assetsData, isLoading: assetsLoading } = useAssets({
    skip: (page - 1) * pageSize,
    take: pageSize,
    search: searchParams.get('search') || undefined,
    assetType: filters.assetType || undefined,
    status: filters.status || undefined,
    businessCriticality: filters.businessCriticality || undefined,
    capacityStatus: filters.capacityStatus as CapacityStatus | undefined,
  });
  const { data: summary = null, isLoading: summaryLoading } = useAssetSummary();

  const assets = assetsData?.results ?? [];
  const count = assetsData?.count ?? 0;
  const loading = assetsLoading || summaryLoading;

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function handleSearch() {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  }


  const totalPages = Math.ceil(count / pageSize);

  if (loading && !summary) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Asset Register"
        description="Configuration Management Database (CMDB)"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("Import coming soon")}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/itsm/assets/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Asset
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      {summary && (
        <StatCardGrid columns={4}>
          <StatCard
            title="Total Assets"
            value={summary.total}
            icon={<Server className="h-4 w-4" />}
            iconClassName="text-blue-500"
          />
          <StatCard
            title="Active"
            value={summary.active}
            icon={<Monitor className="h-4 w-4" />}
            iconClassName="text-green-500"
          />
          <StatCard
            title="Critical"
            value={summary.critical}
            icon={<Shield className="h-4 w-4" />}
            iconClassName="text-red-500"
          />
          <StatCard
            title="Capacity Warnings"
            value={summary.capacityWarning}
            icon={<Cloud className="h-4 w-4" />}
            iconClassName="text-amber-500"
          />
        </StatCardGrid>
      )}

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-xs"
              />
              <Button variant="secondary" size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>

            <Select
              value={filters.assetType || 'all'}
              onValueChange={(v) => updateFilter('assetType', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SERVER">Server</SelectItem>
                <SelectItem value="DATABASE">Database</SelectItem>
                <SelectItem value="APPLICATION">Application</SelectItem>
                <SelectItem value="CLOUD_VM">Cloud VM</SelectItem>
                <SelectItem value="WORKSTATION">Workstation</SelectItem>
                <SelectItem value="LAPTOP">Laptop</SelectItem>
                <SelectItem value="NETWORK_DEVICE">Network Device</SelectItem>
                <SelectItem value="SAAS_APPLICATION">SaaS</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="STAGING">Staging</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RETIRING">Retiring</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.businessCriticality || 'all'}
              onValueChange={(v) => updateFilter('businessCriticality', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Relations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link
                        to={`/itsm/assets/${asset.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <div className="rounded bg-muted p-1.5">
                          {ASSET_TYPE_ICONS[asset.assetType] || <Server className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.assetTag}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{asset.assetType.replace(/_/g, ' ')}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[asset.status]}>{asset.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={CRITICALITY_COLORS[asset.businessCriticality]}>
                        {asset.businessCriticality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.owner ? (
                        <span className="text-sm">
                          {asset.owner.firstName} {asset.owner.lastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {asset.department ? (
                        <span className="text-sm">{asset.department.name}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {asset._count && (
                        <span className="text-sm text-muted-foreground">
                          {(asset._count.outgoingRelationships || 0) +
                            (asset._count.incomingRelationships || 0)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, count)} of {count}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page - 1));
                  setSearchParams(params);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page + 1));
                  setSearchParams(params);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

