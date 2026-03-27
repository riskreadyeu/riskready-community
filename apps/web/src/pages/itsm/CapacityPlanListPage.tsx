import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BarChart, Plus, Server, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getCapacityPlans, type CapacityPlan } from '@/lib/itsm-api';

const PAGE_SIZE = 20;

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  PENDING_REVIEW: 'secondary',
  APPROVED: 'default',
  IN_PROGRESS: 'default',
  IMPLEMENTED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'destructive',
};

export default function CapacityPlanListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CapacityPlan[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPlans();
  }, [page, statusFilter]);

  async function loadPlans() {
    setLoading(true);
    try {
      const params: { skip: number; take: number; status?: string } = { skip: page * PAGE_SIZE, take: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getCapacityPlans(params);
      setPlans(data.results);
      setCount(data.count);
    } catch (err) {
      console.error('Failed to load capacity plans:', err);
      toast.error('Failed to load capacity plans');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart className="h-6 w-6 text-primary" />
            Capacity Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage capacity planning for NIS2 compliance
          </p>
        </div>
        <Button onClick={() => navigate('/itsm/capacity-plans/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-sm font-medium">
            {count} plan{count !== 1 ? 's' : ''}
          </CardTitle>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No capacity plans found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/itsm/capacity-plans/${plan.id}`)}
                    >
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>
                        {plan.asset ? (
                          <div className="flex items-center gap-2">
                            <Server className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{plan.asset.name}</span>
                          </div>
                        ) : plan.assetGroup ? (
                          <span className="text-sm text-muted-foreground">{plan.assetGroup}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.currentUtilizationPercent != null ? (
                          <span className={`font-mono text-sm ${plan.currentUtilizationPercent >= 90 ? 'text-red-500' : plan.currentUtilizationPercent >= 75 ? 'text-orange-500' : ''}`}>
                            {plan.currentUtilizationPercent}%
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {plan.projectedGrowthPercent != null ? (
                          <span className="font-mono text-sm">+{plan.projectedGrowthPercent}%</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[plan.status] || 'secondary'}>
                          {plan.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
