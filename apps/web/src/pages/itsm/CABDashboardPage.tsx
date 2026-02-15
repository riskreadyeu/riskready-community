import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard, StatCardGrid } from '@/components/common';
import { getCabDashboard, type Change, type ChangeApproval } from '@/lib/itsm-api';
import { format, parseISO } from 'date-fns';

interface CABData {
  pendingApproval: (Change & {
    approvals?: ChangeApproval[];
    assetLinks?: Array<{ asset: { businessCriticality: string } }>;
  })[];
  awaitingCab: number;
  upcomingChanges: Change[];
  stats: {
    recentApproved: number;
    recentRejected: number;
    emergencyThisMonth: number;
    successRate: number;
  };
}

export default function CABDashboardPage() {
  const [data, setData] = useState<CABData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const result = await getCabDashboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load CAB dashboard:', err);
      toast.error('Failed to load CAB dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">Failed to load data</div>;
  }

  const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    CRITICAL: 'destructive',
    HIGH: 'default',
    MEDIUM: 'secondary',
    LOW: 'outline',
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="CAB Dashboard"
        description="Change Advisory Board - Review and approve change requests"
        actions={
          <div className="flex gap-2">
            <Link to="/itsm/changes/calendar">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={loadDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Pending Approval"
          value={data.pendingApproval.length}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
        <StatCard
          title="Awaiting CAB"
          value={data.awaitingCab}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-blue-500"
        />
        <StatCard
          title="Success Rate"
          value={`${data.stats.successRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          iconClassName="text-green-500"
        />
        <StatCard
          title="Emergency Changes"
          value={data.stats.emergencyThisMonth}
          subtitle="This month"
          icon={<Zap className="h-4 w-4" />}
          iconClassName="text-red-500"
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approval */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approval
            </CardTitle>
            <Badge variant="secondary">{data.pendingApproval.length}</Badge>
          </CardHeader>
          <CardContent>
            {data.pendingApproval.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                <p>No changes pending approval</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingApproval.map((change) => {
                  const hasCriticalAsset = change.assetLinks?.some(
                    (l) => l.asset?.businessCriticality === 'CRITICAL'
                  );
                  const pendingApprovals = change.approvals?.filter(
                    (a) => a.status === 'PENDING'
                  ).length || 0;

                  return (
                    <Link
                      key={change.id}
                      to={`/itsm/changes/${change.id}`}
                      className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{change.changeRef}</span>
                            <Badge variant={priorityColors[change.priority]}>
                              {change.priority}
                            </Badge>
                            {hasCriticalAsset && (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Critical Asset
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {change.title}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <Badge variant="outline">{change.changeType}</Badge>
                        <Badge variant="outline">{change.category}</Badge>
                        <span className="text-muted-foreground">
                          {pendingApprovals} approval{pendingApprovals !== 1 ? 's' : ''} pending
                        </span>
                      </div>

                      {change.requester && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Requested by: {change.requester.firstName} {change.requester.lastName}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Changes */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Changes (7 days)
            </CardTitle>
            <Badge variant="secondary">{data.upcomingChanges.length}</Badge>
          </CardHeader>
          <CardContent>
            {data.upcomingChanges.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-2 h-8 w-8" />
                <p>No changes scheduled for the next 7 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingChanges.map((change) => (
                  <Link
                    key={change.id}
                    to={`/itsm/changes/${change.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{change.changeRef}</span>
                          <Badge variant={priorityColors[change.priority]}>
                            {change.priority}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {change.title}
                        </div>
                      </div>
                      <Badge variant="secondary">{change.status}</Badge>
                    </div>

                    {change.plannedStart && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(change.plannedStart), 'EEE, MMM d @ HH:mm')}
                      </div>
                    )}

                    {change.implementer && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Implementer: {change.implementer.firstName} {change.implementer.lastName}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{data.stats.recentApproved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{data.stats.recentRejected}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
