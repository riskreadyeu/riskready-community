import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type KRIHistory, type RAGStatus } from "@/lib/risks-api";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface KRITrendChartProps {
  history: KRIHistory[];
  thresholdGreen?: string | null;
  thresholdAmber?: string | null;
  thresholdRed?: string | null;
  unit?: string;
  title?: string;
  compact?: boolean;
}

const STATUS_COLORS: Record<RAGStatus, string> = {
  GREEN: "#22c55e",
  AMBER: "#f59e0b",
  RED: "#ef4444",
  NOT_MEASURED: "#9ca3af",
};

export function KRITrendChart({
  history,
  thresholdGreen,
  thresholdAmber,
  thresholdRed,
  unit = "",
  title = "Value Trend",
  compact = false,
}: KRITrendChartProps) {
  // Parse numeric values from history
  const chartData = useMemo(() => {
    return history
      .map((h) => ({
        ...h,
        numValue: parseFloat(h.value.replace(/[^0-9.-]/g, "")),
        date: new Date(h.measuredAt),
      }))
      .filter((h) => !isNaN(h.numValue))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-20); // Last 20 data points
  }, [history]);

  // Calculate chart dimensions
  const chartHeight = compact ? 100 : 150;
  const chartWidth = 100; // percentage

  // Calculate min/max for scaling
  const values = chartData.map((d) => d.numValue);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  // Parse threshold values
  const parseThreshold = (t: string | null | undefined): number | null => {
    if (!t) return null;
    const match = t.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const greenVal = parseThreshold(thresholdGreen);
  const amberVal = parseThreshold(thresholdAmber);
  const redVal = parseThreshold(thresholdRed);

  // Calculate Y position (0-100%)
  const getY = (value: number) => {
    return ((max - value) / range) * 100;
  };

  // Generate SVG path
  const linePath = useMemo(() => {
    if (chartData.length < 2) return "";
    
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = getY(d.numValue);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [chartData, min, max]);

  // Area path for gradient fill
  const areaPath = useMemo(() => {
    if (chartData.length < 2) return "";
    
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = getY(d.numValue);
      return `${x},${y}`;
    });

    return `M 0,100 L ${points.join(" L ")} L 100,100 Z`;
  }, [chartData, min, max]);

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (chartData.length < 2) return "stable";
    const first = chartData[0]!.numValue;
    const last = chartData[chartData.length - 1]!.numValue;
    const change = last - first;
    const threshold = Math.abs(first) * 0.05; // 5% change
    
    if (change > threshold) return "up";
    if (change < -threshold) return "down";
    return "stable";
  }, [chartData]);

  const TrendIcon = overallTrend === "up" ? TrendingUp : overallTrend === "down" ? TrendingDown : Minus;
  const trendColor = overallTrend === "up" ? "text-green-600" : overallTrend === "down" ? "text-red-600" : "text-muted-foreground";

  if (chartData.length === 0) {
    return (
      <Card className={cn("bg-card border-border", compact && "border-0 bg-transparent")}>
        {!compact && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "p-0" : undefined}>
          <div className="flex items-center justify-center h-[100px] text-muted-foreground">
            <Activity className="w-8 h-8 opacity-30 mr-2" />
            <span className="text-sm">No historical data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestValue = chartData[chartData.length - 1];
  const latestStatus = latestValue?.status || "NOT_MEASURED";

  return (
    <Card className={cn("bg-card border-border", compact && "border-0 bg-transparent")}>
      {!compact && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <TrendIcon className={cn("w-4 h-4", trendColor)} />
              <Badge
                variant="outline"
                className="text-xs"
                style={{ 
                  backgroundColor: `${STATUS_COLORS[latestStatus]}15`,
                  color: STATUS_COLORS[latestStatus],
                  borderColor: `${STATUS_COLORS[latestStatus]}30`
                }}
              >
                {latestValue?.value} {unit}
              </Badge>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0" : undefined}>
        {/* SVG Chart */}
        <div className="relative" style={{ height: chartHeight }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STATUS_COLORS[latestStatus]} stopOpacity="0.3" />
                <stop offset="100%" stopColor={STATUS_COLORS[latestStatus]} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Threshold Lines */}
            {greenVal !== null && (
              <line
                x1="0"
                y1={getY(greenVal)}
                x2="100"
                y2={getY(greenVal)}
                stroke="#22c55e"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            )}
            {amberVal !== null && (
              <line
                x1="0"
                y1={getY(amberVal)}
                x2="100"
                y2={getY(amberVal)}
                stroke="#f59e0b"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            )}
            {redVal !== null && (
              <line
                x1="0"
                y1={getY(redVal)}
                x2="100"
                y2={getY(redVal)}
                stroke="#ef4444"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            )}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={STATUS_COLORS[latestStatus]}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={(i / (chartData.length - 1)) * 100}
                cy={getY(d.numValue)}
                r="1.5"
                fill={STATUS_COLORS[d.status]}
                stroke="white"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground -ml-1">
            <span>{max.toFixed(1)}</span>
            <span>{((max + min) / 2).toFixed(1)}</span>
            <span>{min.toFixed(1)}</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {chartData.length > 0 && (
            <>
              <span>{format(chartData[0]!.date, "MMM d")}</span>
              {chartData.length > 2 && (
                <span>{format(chartData[Math.floor(chartData.length / 2)]!.date, "MMM d")}</span>
              )}
              <span>{format(chartData[chartData.length - 1]!.date, "MMM d")}</span>
            </>
          )}
        </div>

        {/* Legend */}
        {!compact && (greenVal !== null || amberVal !== null || redVal !== null) && (
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
            {greenVal !== null && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: "dashed" }} />
                <span>Green: {thresholdGreen}</span>
              </div>
            )}
            {amberVal !== null && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-amber-500" style={{ borderStyle: "dashed" }} />
                <span>Amber: {thresholdAmber}</span>
              </div>
            )}
            {redVal !== null && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: "dashed" }} />
                <span>Red: {thresholdRed}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
