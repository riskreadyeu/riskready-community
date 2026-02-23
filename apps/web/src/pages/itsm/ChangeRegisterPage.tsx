import { useEffect, useState } from 'react';
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
  GitBranch,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
} from 'lucide-react';
import { PageHeader, StatCard, StatCardGrid } from '@/components/common';
import {
  getChanges,
  getChangeSummary,
  type Change,
  type ChangeSummary,
  type ChangeStatus,
  type ITSMChangeType,
  type ChangePriority,
} from '@/lib/itsm-api';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFTED: <Clock className="h-4 w-4 text-muted-foreground" />,
  SUBMITTED: <Clock className="h-4 w-4 text-blue-500" />,
  PENDING_APPROVAL: <Clock className="h-4 w-4 text-amber-500" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const PRIORITY_COLORS: Record<ChangePriority, BadgeVariant> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

const TYPE_COLORS: Record<ITSMChangeType, BadgeVariant> = {
  EMERGENCY: 'destructive',
  NORMAL: 'default',
  STANDARD: 'secondary',
};

export default function ChangeRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [changes, setChanges] = useState<Change[]>([]);
  const [summary, setSummary] = useState<ChangeSummary | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 20;

  const filters = {
    status: searchParams.get('status') as ChangeStatus | null,
    changeType: searchParams.get('changeType') as ITSMChangeType | null,
    priority: searchParams.get('priority') as ChangePriority | null,
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      const [changesData, summaryData] = await Promise.all([
        getChanges({
          skip: (page - 1) * pageSize,
          take: pageSize,
          search: searchParams.get('search') || undefined,
          status: filters.status || undefined,
          changeType: filters.changeType || undefined,
          priority: filters.priority || undefined,
        }),
        getChangeSummary(),
      ]);
      setChanges(changesData.results);
      setCount(changesData.count);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load changes:', err);
    } finally {
      setLoading(false);
    }
  }

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
        title="Change Register"
        description="Track and manage change requests"
        actions={
          <div className="flex gap-2">
            <Link to="/itsm/changes/calendar">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link to="/itsm/changes/cab">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                CAB
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/itsm/changes/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Change
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      {summary && (
        <StatCardGrid columns={4}>
          <StatCard
            title="Total Changes"
            value={summary.total}
            icon={<GitBranch className="h-4 w-4" />}
            iconClassName="text-blue-500"
          />
          <StatCard
            title="Pending Approval"
            value={summary.pendingApproval}
            icon={<Clock className="h-4 w-4" />}
            iconClassName="text-amber-500"
          />
          <StatCard
            title="This Month"
            value={summary.thisMonth}
            icon={<Calendar className="h-4 w-4" />}
            iconClassName="text-green-500"
          />
          <StatCard
            title="Emergency Changes"
            value={summary.byType?.['EMERGENCY'] || 0}
            icon={<AlertTriangle className="h-4 w-4" />}
            iconClassName="text-red-500"
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
                placeholder="Search changes..."
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
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFTED">Drafted</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.changeType || 'all'}
              onValueChange={(v) => updateFilter('changeType', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority || 'all'}
              onValueChange={(v) => updateFilter('priority', v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Changes Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Change</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Security Impact</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Planned Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : changes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No changes found
                  </TableCell>
                </TableRow>
              ) : (
                changes.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      <Link
                        to={`/itsm/changes/${change.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <div className="rounded bg-muted p-1.5">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{change.title}</div>
                          <div className="text-xs text-muted-foreground">{change.changeRef}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_COLORS[change.changeType]}>
                        {change.changeType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {STATUS_ICONS[change.status] || <Clock className="h-4 w-4" />}
                        <span className="text-sm">{change.status.replace(/_/g, ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_COLORS[change.priority]}>
                        {change.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          change.securityImpact === 'CRITICAL' || change.securityImpact === 'HIGH'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {change.securityImpact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {change.requester ? (
                        <span className="text-sm">
                          {change.requester.firstName} {change.requester.lastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.plannedStart ? (
                        <span className="text-sm">
                          {new Date(change.plannedStart).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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

