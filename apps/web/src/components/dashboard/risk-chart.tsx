"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getRiskTrends, type RiskTrendData } from "@/lib/dashboard-api";

const config = {
  critical: { label: "Critical", color: "hsl(var(--destructive))" },
  high: { label: "High", color: "hsl(var(--warning))" },
} satisfies ChartConfig;

export function RiskChart() {
  const [data, setData] = useState<RiskTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiskTrends(6)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="glass-card border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Risk Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[260px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Risk Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="high"
              stackId="a"
              stroke="var(--color-high)"
              fill="var(--color-high)"
              fillOpacity={0.18}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="a"
              stroke="var(--color-critical)"
              fill="var(--color-critical)"
              fillOpacity={0.22}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
