"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2 } from "lucide-react";
import { getControlStats, type ControlStats } from "@/lib/controls-api";

export function ControlEffectivenessGauge() {
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getControlStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load control stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const circumference = 2 * Math.PI * 85;
  
  // Calculate effectiveness score from stats
  const effectivenessScore = stats && stats.total > 0 
    ? Math.round((stats.implemented / stats.applicable) * 100) 
    : 0;
  const strokeDashoffset = circumference - (effectivenessScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: "stroke-success", text: "text-success", label: "Strong" };
    if (score >= 60) return { stroke: "stroke-warning", text: "text-warning", label: "Moderate" };
    return { stroke: "stroke-destructive", text: "text-destructive", label: "Needs Improvement" };
  };

  const scoreStyle = getScoreColor(effectivenessScore);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Control Effectiveness</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    Aggregate effectiveness score based on implementation status of applicable controls.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" strokeWidth="12" fill="none" className="stroke-secondary" />
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  className={`${scoreStyle.stroke} transition-all duration-1000 ease-out`}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreStyle.text}`}>{effectivenessScore}%</span>
                <span className="text-xs text-muted-foreground mt-1">{scoreStyle.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold text-success">{stats?.implemented ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Implemented</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-warning">{stats?.partial ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Partial</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{stats?.notStarted ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Not Started</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
