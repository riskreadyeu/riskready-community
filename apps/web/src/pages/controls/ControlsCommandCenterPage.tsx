"use client";

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Calendar,
  Download,
  List,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ClipboardCheck,
  Upload,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NeedsAttentionWidget,
  FrameworkHealthWidget,
  EffectivenessSummaryWidget,
  ActivityFeedWidget,
  QuickStatsGrid,
} from "@/components/controls/command-center";
import {
  getControlStats,
  getEffectivenessReport,
  getGapAnalysis,
  getSOAStats,
  type ControlStats,
  type EffectivenessReport,
  type GapAnalysis,
  type SOAStats,
} from "@/lib/controls-api";

export default function ControlsCommandCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [effectiveness, setEffectiveness] = useState<EffectivenessReport | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [soaStats, setSoaStats] = useState<SOAStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, effectivenessData, gapData, soaData] = await Promise.all([
        getControlStats(),
        getEffectivenessReport().catch(() => null),
        getGapAnalysis().catch(() => null),
        getSOAStats().catch(() => null),
      ]);
      setStats(statsData);
      setEffectiveness(effectivenessData);
      setGapAnalysis(gapData);
      setSoaStats(soaData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetRefresh = useCallback(async () => {
    await loadData();
  }, []);

  // Build framework health data from real control stats by theme
  // The backend provides byTheme (ORGANISATIONAL, PEOPLE, PHYSICAL, TECHNOLOGICAL)
  // We map these to the FrameworkHealthWidget format
  const frameworkHealthData = stats && stats.total > 0 ? (() => {
    const themes = Object.entries(stats.byTheme || {});
    if (themes.length === 0) return undefined;

    // Calculate proportions from totals
    const implRate = stats.total > 0 ? stats.implemented / stats.total : 0;
    const partialRate = stats.total > 0 ? stats.partial / stats.total : 0;
    const notStartedRate = stats.total > 0 ? stats.notStarted / stats.total : 0;

    // Get avg effectiveness
    const avgEff = effectiveness?.controls?.length
      ? Math.round(
          effectiveness.controls.reduce((s: number, c: { score?: number }) => s + (c.score || 0), 0) /
          effectiveness.controls.length
        )
      : 0;

    // Map theme data as "framework" entries for the widget
    const themeToFw: Record<string, 'ISO' | 'SOC2' | 'NIS2' | 'DORA'> = {
      ORGANISATIONAL: 'ISO',
      PEOPLE: 'SOC2',
      PHYSICAL: 'NIS2',
      TECHNOLOGICAL: 'DORA',
    };

    return themes
      .filter(([, count]) => count > 0)
      .map(([theme, count]) => ({
        framework: themeToFw[theme] || ('ISO' as const),
        total: count,
        implemented: Math.round(count * implRate),
        partial: Math.round(count * partialRate),
        notStarted: Math.round(count * notStartedRate),
        effectiveness: avgEff,
      }));
  })() : undefined;

  // Build effectiveness summary from real data
  const effectivenessSummary = effectiveness ? (() => {
    let effective = 0, partiallyEffective = 0, notEffective = 0, notTested = 0;
    let totalScore = 0;

    for (const c of effectiveness.controls || []) {
      if (c.rating === 'EFFECTIVE' || c.passCount > 0) effective++;
      else if (c.rating === 'PARTIALLY_EFFECTIVE' || c.partialCount > 0) partiallyEffective++;
      else if (c.rating === 'NOT_EFFECTIVE' || c.failCount > 0) notEffective++;
      else notTested++;
      totalScore += c.score || 0;
    }

    const controlCount = (effectiveness.controls || []).length;
    const avgScore = controlCount > 0 ? Math.round(totalScore / controlCount) : 0;

    return { effective, partiallyEffective, notEffective, notTested, avgScore };
  })() : undefined;

  // Build needs-attention items from real data
  const attentionItems = (() => {
    const items: Array<{ id: string; type: 'test' | 'gap' | 'metric' | 'soa' | 'review'; title: string; description: string; count: number; priority: 'critical' | 'high' | 'medium'; link: string }> = [];

    if (gapAnalysis?.summary?.criticalGaps) {
      items.push({
        id: 'gaps',
        type: 'gap',
        title: 'Critical Gaps',
        description: 'Controls with critical gaps identified',
        count: gapAnalysis.summary.criticalGaps,
        priority: 'critical',
        link: '/controls/gaps?priority=critical',
      });
    }

    if (gapAnalysis?.summary?.highGaps) {
      items.push({
        id: 'high-gaps',
        type: 'gap',
        title: 'High Gaps',
        description: 'Controls with high priority gaps',
        count: gapAnalysis.summary.highGaps,
        priority: 'high',
        link: '/controls/gaps?priority=high',
      });
    }

    if (soaStats && soaStats.latestStatus === 'PENDING_REVIEW') {
      items.push({
        id: 'soa-pending',
        type: 'soa',
        title: 'SOA Pending Review',
        description: 'Statement of Applicability awaiting review',
        count: 1,
        priority: 'medium',
        link: '/controls/soa',
      });
    }

    if (stats && stats.notStarted > 0) {
      items.push({
        id: 'not-started',
        type: 'review',
        title: 'Not Started',
        description: 'Controls not yet implemented',
        count: stats.notStarted,
        priority: stats.notStarted > 10 ? 'high' : 'medium',
        link: '/controls/library?status=NOT_STARTED',
      });
    }

    return items;
  })();

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Control Command Center
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your unified view of control health, effectiveness, and required actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                View
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/controls/command-center')} className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Command Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/controls/dashboard')} className="gap-2">
                <List className="w-4 h-4" />
                Management Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/controls/library">
            <Button variant="outline" size="sm" className="gap-2">
              <List className="w-4 h-4" />
              Browse All
            </Button>
          </Link>

          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FileText className="w-4 h-4" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Control Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Plus className="w-4 h-4" />
                Create Control
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Upload className="w-4 h-4" />
                Import Controls
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                New SOA Version
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsGrid loading={loading} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column - Needs Attention + Framework Health */}
        <div className="xl:col-span-4 space-y-6">
          <NeedsAttentionWidget
            items={attentionItems.length > 0 ? attentionItems : []}
            loading={loading}
            onRefresh={handleWidgetRefresh}
            onExpand={() => navigate('/controls/attention')}
          />
          <FrameworkHealthWidget
            frameworks={frameworkHealthData}
            loading={loading}
            onRefresh={handleWidgetRefresh}
            onExpand={() => navigate('/controls/library')}
          />
        </div>

        {/* Right Column - Effectiveness + Activity */}
        <div className="xl:col-span-8 space-y-6">
          <EffectivenessSummaryWidget
            summary={effectivenessSummary}
            loading={loading}
            onRefresh={handleWidgetRefresh}
            onExpand={() => navigate('/controls/effectiveness')}
          />
          <ActivityFeedWidget
            activities={[]}
            loading={loading}
            onRefresh={handleWidgetRefresh}
            onExpand={() => navigate('/controls/activity')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <span>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
