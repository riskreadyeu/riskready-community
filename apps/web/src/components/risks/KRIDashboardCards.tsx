import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// ============================================
// KRI DASHBOARD CARDS
// Visual cards for Key Risk Indicators
// Shows status, trends, and threshold alerts
// ============================================

export type KRIStatus = 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

export interface KRIValue {
  value: number;
  recordedAt: string;
  status: KRIStatus;
}

export interface KRI {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  currentValue?: number;
  currentStatus: KRIStatus;
  thresholdGreen?: number;
  thresholdAmber?: number;
  thresholdRed?: number;
  isHigherBetter?: boolean;
  trend?: TrendDirection;
  trendPercent?: number;
  values: KRIValue[];
  lastUpdated?: string;
  frequency?: string;
  riskId: string;
  riskTitle?: string;
}

interface KRIDashboardCardsProps {
  kris: KRI[];
  onViewDetails?: (kriId: string) => void;
  onRecordValue?: (kriId: string) => void;
  layout?: 'grid' | 'list';
  showRiskLink?: boolean;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<KRIStatus, { color: string; bgColor: string; borderColor: string; label: string }> = {
  GREEN: { color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950', borderColor: 'border-green-500', label: 'Green' },
  AMBER: { color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950', borderColor: 'border-amber-500', label: 'Amber' },
  RED: { color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950', borderColor: 'border-red-500', label: 'Red' },
  NOT_MEASURED: { color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900', borderColor: 'border-gray-300', label: 'Not Measured' },
};

const TREND_CONFIG: Record<TrendDirection, { icon: typeof ArrowUp; color: string; label: string }> = {
  UP: { icon: ArrowUp, color: 'text-blue-500', label: 'Increasing' },
  DOWN: { icon: ArrowDown, color: 'text-blue-500', label: 'Decreasing' },
  STABLE: { icon: ArrowRight, color: 'text-gray-500', label: 'Stable' },
};

export function KRIDashboardCards({
  kris,
  onViewDetails,
  onRecordValue,
  layout = 'grid',
  showRiskLink = false,
  compact = false,
  className,
}: KRIDashboardCardsProps) {
  // Summary statistics
  const stats = useMemo(() => {
    const total = kris.length;
    const green = kris.filter((k) => k.currentStatus === 'GREEN').length;
    const amber = kris.filter((k) => k.currentStatus === 'AMBER').length;
    const red = kris.filter((k) => k.currentStatus === 'RED').length;
    const notMeasured = kris.filter((k) => k.currentStatus === 'NOT_MEASURED').length;
    return { total, green, amber, red, notMeasured };
  }, [kris]);

  // Sort KRIs: RED first, then AMBER, then GREEN, then NOT_MEASURED
  const sortedKRIs = useMemo(() => {
    const statusOrder: Record<KRIStatus, number> = { RED: 0, AMBER: 1, GREEN: 2, NOT_MEASURED: 3 };
    return [...kris].sort((a, b) => statusOrder[a.currentStatus] - statusOrder[b.currentStatus]);
  }, [kris]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Bar */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{stats.total} KRIs</span>
        </div>
        <div className="flex-1 flex items-center gap-4">
          {stats.red > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.red} Red
            </Badge>
          )}
          {stats.amber > 0 && (
            <Badge className="bg-amber-500 text-white">
              {stats.amber} Amber
            </Badge>
          )}
          {stats.green > 0 && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {stats.green} Green
            </Badge>
          )}
          {stats.notMeasured > 0 && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {stats.notMeasured} Not Measured
            </Badge>
          )}
        </div>
      </div>

      {/* KRI Cards */}
      <div className={cn(
        layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4',
      )}>
        {sortedKRIs.map((kri) => (
          <KRICard
            key={kri.id}
            kri={kri}
            onViewDetails={onViewDetails}
            onRecordValue={onRecordValue}
            showRiskLink={showRiskLink}
            compact={compact}
          />
        ))}
      </div>

      {kris.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No Key Risk Indicators configured.
        </div>
      )}
    </div>
  );
}

function KRICard({
  kri,
  onViewDetails,
  onRecordValue,
  showRiskLink,
  compact,
}: {
  kri: KRI;
  onViewDetails?: (kriId: string) => void;
  onRecordValue?: (kriId: string) => void;
  showRiskLink?: boolean;
  compact?: boolean;
}) {
  const statusConfig = STATUS_CONFIG[kri.currentStatus];
  const trendConfig = kri.trend ? TREND_CONFIG[kri.trend] : null;
  const TrendIcon = trendConfig?.icon;

  // Determine if trend is good or bad based on isHigherBetter
  const isTrendPositive = useMemo(() => {
    if (!kri.trend || kri.trend === 'STABLE') return null;
    if (kri.isHigherBetter) {
      return kri.trend === 'UP';
    } else {
      return kri.trend === 'DOWN';
    }
  }, [kri.trend, kri.isHigherBetter]);

  // Calculate threshold gauge position
  const gaugePosition = useMemo(() => {
    if (kri.currentValue === undefined || !kri.thresholdRed) return null;
    const max = kri.thresholdRed * 1.2; // Show some headroom
    return Math.min((kri.currentValue / max) * 100, 100);
  }, [kri.currentValue, kri.thresholdRed]);

  // Mini sparkline data
  const sparklineData = useMemo(() => {
    if (!kri.values || kri.values.length < 2) return null;
    const recent = kri.values.slice(0, 7).reverse();
    const max = Math.max(...recent.map((v) => v.value));
    const min = Math.min(...recent.map((v) => v.value));
    const range = max - min || 1;
    return recent.map((v) => ({
      value: v.value,
      normalized: ((v.value - min) / range) * 100,
      status: v.status,
    }));
  }, [kri.values]);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors',
          statusConfig.bgColor,
          statusConfig.borderColor,
        )}
        onClick={() => onViewDetails?.(kri.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{kri.name}</div>
          <div className="text-xs text-muted-foreground">
            {kri.currentValue !== undefined ? `${kri.currentValue}${kri.unit ? ` ${kri.unit}` : ''}` : 'No data'}
          </div>
        </div>
        <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border', statusConfig.borderColor)}>
          {statusConfig.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn('border-l-4', statusConfig.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium">{kri.name}</CardTitle>
            {kri.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {kri.description}
              </p>
            )}
          </div>
          <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border', statusConfig.borderColor)}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Value */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">
              {kri.currentValue !== undefined ? kri.currentValue : '—'}
            </div>
            {kri.unit && <div className="text-xs text-muted-foreground">{kri.unit}</div>}
          </div>
          {TrendIcon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    'flex items-center gap-1 text-sm',
                    isTrendPositive === true && 'text-green-500',
                    isTrendPositive === false && 'text-red-500',
                    isTrendPositive === null && 'text-gray-500',
                  )}>
                    <TrendIcon className="h-4 w-4" />
                    {kri.trendPercent !== undefined && (
                      <span>{kri.trendPercent > 0 ? '+' : ''}{kri.trendPercent}%</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{trendConfig?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {kri.isHigherBetter ? 'Higher is better' : 'Lower is better'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Threshold Gauge */}
        {kri.thresholdGreen !== undefined && kri.thresholdAmber !== undefined && kri.thresholdRed !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Threshold Status</div>
            <div className="relative h-3 rounded-full overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-green-500" />
                <div className="flex-1 bg-amber-500" />
                <div className="flex-1 bg-red-500" />
              </div>
              {/* Current value indicator */}
              {gaugePosition !== null && (
                <div
                  className="absolute top-0 w-1 h-3 bg-white border border-gray-800 rounded-sm shadow"
                  style={{ left: `${gaugePosition}%`, transform: 'translateX(-50%)' }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Green: ≤{kri.thresholdGreen}</span>
              <span>Amber: ≤{kri.thresholdAmber}</span>
              <span>Red: &gt;{kri.thresholdAmber}</span>
            </div>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Recent Trend</div>
            <div className="flex items-end gap-1 h-8">
              {sparklineData.map((point, i) => (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex-1 rounded-t',
                          STATUS_CONFIG[point.status].bgColor,
                          STATUS_CONFIG[point.status].borderColor,
                          'border-t border-l border-r',
                        )}
                        style={{ height: `${Math.max(point.normalized, 10)}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{point.value}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {/* Meta & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {kri.lastUpdated ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(kri.lastUpdated), { addSuffix: true })}
              </span>
            ) : (
              <span>Never updated</span>
            )}
          </div>
          <div className="flex gap-2">
            {onRecordValue && (
              <Button variant="outline" size="sm" onClick={() => onRecordValue(kri.id)}>
                Record
              </Button>
            )}
            {onViewDetails && (
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(kri.id)}>
                Details
              </Button>
            )}
          </div>
        </div>

        {/* Risk Link */}
        {showRiskLink && kri.riskTitle && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <span>Linked to: </span>
            <span className="font-medium">{kri.riskTitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// KRI STATUS SUMMARY (for dashboards)
// ============================================

export function KRIStatusSummary({
  kris,
  className,
}: {
  kris: KRI[];
  className?: string;
}) {
  const stats = useMemo(() => {
    const total = kris.length;
    const green = kris.filter((k) => k.currentStatus === 'GREEN').length;
    const amber = kris.filter((k) => k.currentStatus === 'AMBER').length;
    const red = kris.filter((k) => k.currentStatus === 'RED').length;
    return { total, green, amber, red };
  }, [kris]);

  if (stats.total === 0) return null;

  const greenPercent = (stats.green / stats.total) * 100;
  const amberPercent = (stats.amber / stats.total) * 100;
  const redPercent = (stats.red / stats.total) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span>{stats.total} KRIs</span>
        <span className={stats.red > 0 ? 'text-red-500 font-medium' : 'text-green-500'}>
          {stats.red > 0 ? `${stats.red} in breach` : 'All healthy'}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-green-500" style={{ width: `${greenPercent}%` }} />
        <div className="bg-amber-500" style={{ width: `${amberPercent}%` }} />
        <div className="bg-red-500" style={{ width: `${redPercent}%` }} />
      </div>
    </div>
  );
}

export default KRIDashboardCards;
