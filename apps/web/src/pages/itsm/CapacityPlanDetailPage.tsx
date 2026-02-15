import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BarChart,
  Server,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCapacityPlan, type CapacityPlan } from '@/lib/itsm-api';

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  PENDING_REVIEW: 'secondary',
  APPROVED: 'default',
  IN_PROGRESS: 'default',
  IMPLEMENTED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'destructive',
};

export default function CapacityPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<CapacityPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadPlan();
  }, [id]);

  async function loadPlan() {
    setLoading(true);
    try {
      const data = await getCapacityPlan(id!);
      setPlan(data);
    } catch (err) {
      console.error('Failed to load capacity plan:', err);
      toast.error('Failed to load capacity plan');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading capacity plan...</div>;
  }

  if (!plan) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Capacity plan not found</div>
        <Button variant="link" onClick={() => navigate('/itsm/capacity-plans')}>
          Return to Capacity Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => navigate('/itsm/capacity-plans')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Capacity Plans
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            <BarChart className="h-6 w-6 text-primary" />
            {plan.title}
            <Badge variant={statusVariants[plan.status] || 'secondary'}>
              {plan.status.replace(/_/g, ' ')}
            </Badge>
          </h1>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Plan Info */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.description && (
              <p className="text-sm whitespace-pre-wrap">{plan.description}</p>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Capacity</div>
                <p className="text-sm">{plan.currentCapacity}</p>
              </div>
              {plan.currentUtilizationPercent != null && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Utilization</div>
                  <span className={`text-2xl font-bold ${plan.currentUtilizationPercent >= 90 ? 'text-red-500' : plan.currentUtilizationPercent >= 75 ? 'text-orange-500' : 'text-green-500'}`}>
                    {plan.currentUtilizationPercent}%
                  </span>
                </div>
              )}
            </div>
            {plan.recommendedAction && (
              <>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</div>
                  <p className="text-sm whitespace-pre-wrap">{plan.recommendedAction}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Asset Link */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" /> Linked Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plan.asset ? (
              <Link
                to={`/itsm/assets/${plan.asset.id}`}
                className="block p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">{plan.asset.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {plan.asset.assetTag} — {plan.asset.assetType}
                </div>
                {plan.asset.status && (
                  <Badge variant="outline" className="mt-2 text-xs">{plan.asset.status}</Badge>
                )}
              </Link>
            ) : plan.assetGroup ? (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Asset Group</div>
                <div className="font-medium">{plan.assetGroup}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No asset linked</div>
            )}
          </CardContent>
        </Card>

        {/* Growth Projections */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.projectedGrowthPercent != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected Growth</span>
                <span className="font-mono font-bold">+{plan.projectedGrowthPercent}%</span>
              </div>
            )}
            {plan.projectionPeriodMonths != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projection Period</span>
                <span className="font-mono">{plan.projectionPeriodMonths} months</span>
              </div>
            )}
            {plan.projectedExhaustionDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Exhaustion</span>
                <span className="text-sm font-medium text-red-500">
                  {new Date(plan.projectedExhaustionDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {!plan.projectedGrowthPercent && !plan.projectionPeriodMonths && !plan.projectedExhaustionDate && (
              <div className="text-sm text-muted-foreground">No projections available</div>
            )}
          </CardContent>
        </Card>

        {/* Cost & Schedule */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Cost & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.estimatedCost != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="font-mono font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.costCurrency }).format(plan.estimatedCost)}
                </span>
              </div>
            )}
            {plan.recommendedDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Target Date</span>
                <span className="text-sm">{new Date(plan.recommendedDate).toLocaleDateString()}</span>
              </div>
            )}
            {plan.implementedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Implemented</span>
                <span className="text-sm text-green-600">{new Date(plan.implementedAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval & Audit */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.createdBy && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created by:</span>
                <span className="text-sm">{plan.createdBy.firstName} {plan.createdBy.lastName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(plan.createdAt).toLocaleDateString()}</span>
            </div>
            {plan.approvedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="text-sm text-green-600">{new Date(plan.approvedAt).toLocaleDateString()}</span>
              </div>
            )}
            {plan.reviewDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Review</span>
                <span className="text-sm">{new Date(plan.reviewDate).toLocaleDateString()}</span>
              </div>
            )}
            {plan.nextReviewDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Review</span>
                <span className="text-sm">{new Date(plan.nextReviewDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
