"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getComplianceData, type ComplianceData } from "@/lib/dashboard-api";

const config = {
  score: { label: "Coverage", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function ComplianceChart() {
  const [data, setData] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="glass-card border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Compliance Coverage</CardTitle>
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
        <CardTitle className="text-base font-semibold">Compliance Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="framework" tickLine={false} axisLine={false} interval={0} height={60} angle={-20} textAnchor="end" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" fill="var(--color-score)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
