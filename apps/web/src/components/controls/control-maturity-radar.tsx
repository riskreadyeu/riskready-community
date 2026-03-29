
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2 } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { getMaturityHeatmap, type MaturityHeatmapItem } from "@/lib/controls-api";

interface RadarDataPoint {
  capability: string;
  current: number;
  target: number;
  fullMark: number;
}

function buildRadarData(items: MaturityHeatmapItem[]): RadarDataPoint[] {
  // Group by capability type (PROCESS, TECHNOLOGY, PEOPLE, PHYSICAL)
  const byType: Record<string, { currentSum: number; targetSum: number; count: number }> = {};

  for (const item of items) {
    if (!byType[item.type]) {
      byType[item.type] = { currentSum: 0, targetSum: 0, count: 0 };
    }
    const entry = byType[item.type]!;
    entry.currentSum += item.currentMaturity ?? 0;
    entry.targetSum += item.targetMaturity ?? 5;
    entry.count++;
  }

  const typeLabels: Record<string, string> = {
    PROCESS: "Process",
    TECHNOLOGY: "Technology",
    PEOPLE: "People",
    PHYSICAL: "Physical",
  };

  return Object.entries(byType).map(([type, data]) => ({
    capability: typeLabels[type] || type,
    current: data.count > 0 ? Math.round((data.currentSum / data.count) * 10) / 10 : 0,
    target: data.count > 0 ? Math.round((data.targetSum / data.count) * 10) / 10 : 5,
    fullMark: 5,
  }));
}

export function ControlMaturityRadar() {
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [avgMaturity, setAvgMaturity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const items = await getMaturityHeatmap();
        const data = buildRadarData(items);
        setRadarData(data);

        // Calculate overall average maturity
        const total = items.reduce((sum, i) => sum + (i.currentMaturity ?? 0), 0);
        const assessed = items.filter(i => i.currentMaturity !== null).length;
        setAvgMaturity(assessed > 0 ? Math.round((total / assessed) * 100) / 100 : 0);
      } catch (err) {
        console.error("Failed to load maturity data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Capability Maturity</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    Maturity assessment across control capabilities. Scale: 1 (Initial) to 5 (Optimized).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {radarData.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/30" />
                <span className="text-muted-foreground">Target</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-[220px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : radarData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No maturity assessments available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create capability assessments to see maturity data
            </p>
          </div>
        ) : (
          <>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="capability" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-border mt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{avgMaturity.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Maturity</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
