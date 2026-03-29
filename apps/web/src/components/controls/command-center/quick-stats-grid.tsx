
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Layers,
  TestTube,
  Target,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getControlStats,
  getSOAStats,
  getEffectivenessReport,
  getGapAnalysis,
} from "@/lib/controls-api";

interface QuickStat {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: typeof Shield;
  color: string;
  link: string;
}

interface QuickStatsGridProps {
  loading?: boolean;
  className?: string;
}

export function QuickStatsGrid({
  loading: externalLoading = false,
  className,
}: QuickStatsGridProps) {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setInternalLoading(true);

      // Fetch all stats in parallel (only available endpoints)
      const [
        controlStats,
        soaStats,
        effectivenessReport,
        gapAnalysis,
      ] = await Promise.all([
        getControlStats().catch(() => ({ total: 0, implemented: 0, applicable: 0, byTheme: {} })),
        getSOAStats().catch(() => ({ latestVersion: null, latestStatus: null })),
        getEffectivenessReport().catch(() => ({ controls: [], summary: { totalTests: 0, totalPassed: 0 } })),
        getGapAnalysis().catch(() => ({ summary: { totalGaps: 0 } })),
      ]);

      // Calculate average effectiveness
      const avgEffectiveness = effectivenessReport.controls?.length > 0
        ? Math.round(
            effectivenessReport.controls.reduce((sum, c) => sum + (c.score || 0), 0) /
            effectivenessReport.controls.length
          )
        : 0;

      // Calculate tests passed from effectiveness report
      const totalTests = (effectivenessReport as { summary?: { totalTests?: number } }).summary?.totalTests || 0;
      const totalPassed = (effectivenessReport as { summary?: { totalPassed?: number } }).summary?.totalPassed || 0;

      const computedStats: QuickStat[] = [
        {
          id: 'controls',
          label: 'Total Controls',
          value: controlStats.total || 0,
          changeLabel: `${controlStats.implemented || 0} implemented`,
          icon: Shield,
          color: 'text-primary',
          link: '/controls/library',
        },
        {
          id: 'layers',
          label: 'Control Layers',
          value: (controlStats.total || 0) * 4,
          changeLabel: 'Four-layer framework',
          icon: Layers,
          color: 'text-chart-1',
          link: '/controls/testing/owner',
        },
        {
          id: 'tests',
          label: 'Tests Passed',
          value: totalPassed || '-',
          changeLabel: totalTests > 0 ? `of ${totalTests} tests` : undefined,
          icon: TestTube,
          color: 'text-chart-2',
          link: '/controls/testing/owner',
        },
        {
          id: 'applicable',
          label: 'Applicable',
          value: controlStats.applicable || 0,
          changeLabel: `of ${controlStats.total || 0} total`,
          icon: Target,
          color: 'text-chart-3',
          link: '/controls/library',
        },
        {
          id: 'soa',
          label: 'SOA Version',
          value: soaStats.latestVersion || '-',
          changeLabel: soaStats.latestStatus || undefined,
          icon: ClipboardCheck,
          color: 'text-success',
          link: '/controls/soa',
        },
        {
          id: 'effectiveness',
          label: 'Effectiveness',
          value: avgEffectiveness > 0 ? `${avgEffectiveness}%` : '-',
          icon: TrendingUp,
          color: avgEffectiveness >= 70 ? 'text-success' : avgEffectiveness >= 40 ? 'text-warning' : 'text-destructive',
          link: '/controls/effectiveness',
        },
        {
          id: 'gaps',
          label: 'Open Gaps',
          value: gapAnalysis.summary?.totalGaps || 0,
          icon: AlertTriangle,
          color: (gapAnalysis.summary?.totalGaps || 0) > 10 ? 'text-warning' : 'text-muted-foreground',
          link: '/controls/gaps',
        },
      ];

      setStats(computedStats);
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  const loading = externalLoading || internalLoading;
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 bg-secondary/30 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {stats.map(stat => {
        const Icon = stat.icon;
        
        return (
          <Link key={stat.id} to={stat.link}>
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                    {(stat.change !== undefined || stat.changeLabel) && (
                      <p className="text-[10px] text-muted-foreground">
                        {stat.change !== undefined && (
                          <span className={cn(
                            "font-medium",
                            stat.change > 0 ? "text-success" : stat.change < 0 ? "text-destructive" : ""
                          )}>
                            {stat.change > 0 ? '+' : ''}{stat.change}
                          </span>
                        )}
                        {stat.change !== undefined && stat.changeLabel && ' '}
                        {stat.changeLabel}
                      </p>
                    )}
                  </div>
                  <div className={cn("p-2 rounded-lg bg-secondary/50", stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
