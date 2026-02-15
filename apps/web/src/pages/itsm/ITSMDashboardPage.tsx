import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Server,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Database,
  Activity,
  Plus,
  ArrowRight,
  Calendar,
  Users,
  Cloud,
  Gauge,
} from 'lucide-react';
import { PageHeader, StatCard, StatCardGrid } from '@/components/common';
import { getITSMDashboard, type ITSMDashboard, type Asset } from '@/lib/itsm-api';

export default function ITSMDashboardPage() {
  const [dashboard, setDashboard] = useState<ITSMDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getITSMDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6">Failed to load dashboard</div>;
  }

  const { assets, changes, capacity, assetsAtRisk } = dashboard;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="ITSM Dashboard"
        description="Configuration Management Database & Change Management Overview"
        actions={
          <div className="flex gap-2">
            <Link to="/itsm/data-quality">
              <Button variant="outline" size="sm">
                <Gauge className="h-4 w-4 mr-2" />
                Data Quality
              </Button>
            </Link>
            <Link to="/itsm/assets">
              <Button variant="outline" size="sm">
                <Server className="h-4 w-4 mr-2" />
                Assets
              </Button>
            </Link>
            <Link to="/itsm/changes">
              <Button size="sm">
                <GitBranch className="h-4 w-4 mr-2" />
                Changes
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Assets"
          value={assets.total}
          subtitle={`${assets.active} active • ${assets.inScope} in scope`}
          icon={<Server className="h-4 w-4" />}
          iconClassName="text-blue-500"
        />
        <StatCard
          title="Critical Assets"
          value={assets.critical}
          subtitle={`${assets.total > 0 ? Math.round((assets.critical / assets.total) * 100) : 0}% of total`}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-red-500"
        />
        <StatCard
          title="Pending Changes"
          value={changes.pendingApproval}
          subtitle={`${changes.thisMonth} this month`}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
        <StatCard
          title="Capacity Warnings"
          value={assets.capacityWarning}
          subtitle={`${capacity.criticalAtRisk} critical at risk`}
          icon={<Activity className="h-4 w-4" />}
          iconClassName="text-orange-500"
        />
      </StatCardGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Assets at Risk */}
        <Card className="glass-card lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Assets at Capacity Risk
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/itsm/assets?capacityStatus=WARNING">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {assetsAtRisk.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground">All assets are operating within capacity limits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assetsAtRisk.map((asset: Asset) => (
                  <Link
                    key={asset.id}
                    to={`/itsm/assets/${asset.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        {asset.assetType.includes('DATABASE') ? (
                          <Database className="h-4 w-4" />
                        ) : (
                          <Server className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {asset.assetTag} • {asset.department?.name || 'No department'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">
                          CPU: {asset.cpuUsagePercent ?? '-'}% | Mem: {asset.memoryUsagePercent ?? '-'}% | Disk: {asset.storageUsagePercent ?? '-'}%
                        </div>
                      </div>
                      <Badge
                        variant={
                          asset.capacityStatus === 'EXHAUSTED'
                            ? 'destructive'
                            : asset.capacityStatus === 'CRITICAL'
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {asset.capacityStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Assets by Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(assets.byType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{type.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Changes by Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(changes.byStatus)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/assets/new">
                <Plus className="h-5 w-5 text-blue-500" />
                <span className="text-xs">New Asset</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/changes/new">
                <GitBranch className="h-5 w-5 text-green-500" />
                <span className="text-xs">New Change</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/changes/calendar">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-xs">Calendar</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/changes/cab">
                <Users className="h-5 w-5 text-amber-500" />
                <span className="text-xs">CAB Board</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/cloud">
                <Cloud className="h-5 w-5 text-cyan-500" />
                <span className="text-xs">Cloud View</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
              <Link to="/itsm/dora-report">
                <Shield className="h-5 w-5 text-red-500" />
                <span className="text-xs">DORA Report</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

