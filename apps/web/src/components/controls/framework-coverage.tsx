"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getControlStats, type ControlStats } from "@/lib/controls-api";

function getCoverageColor(coverage: number) {
  if (coverage >= 85) return "bg-success";
  if (coverage >= 70) return "bg-warning";
  return "bg-destructive";
}

function getThemeLabel(theme: string): string {
  switch (theme) {
    case "ORGANISATIONAL": return "Organisational";
    case "PEOPLE": return "People";
    case "PHYSICAL": return "Physical";
    case "TECHNOLOGICAL": return "Technological";
    default: return theme;
  }
}

export function FrameworkCoverage() {
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

  // Build theme coverage from byTheme stats
  const themes = stats?.byTheme 
    ? Object.entries(stats.byTheme).map(([theme, count]) => ({
        name: getThemeLabel(theme),
        total: count,
        theme,
      }))
    : [];

  const totalControls = stats?.total ?? 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">ISO 27001 Coverage by Theme</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {totalControls} Controls
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : themes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No theme data available</p>
        ) : (
          themes.map((theme, index) => {
            const coverage = totalControls > 0 ? Math.round((theme.total / totalControls) * 100) : 0;
            return (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{theme.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {theme.total} controls
                  </span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getCoverageColor(coverage)} rounded-full transition-all duration-500 group-hover:opacity-90`}
                    style={{ width: `${coverage}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{coverage}% of total</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
