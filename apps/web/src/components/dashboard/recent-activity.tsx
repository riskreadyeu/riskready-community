"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  FileUp,
  TestTube,
  CheckCircle2,
  FileText,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRecentActivity, type RecentActivityItem } from "@/lib/dashboard-api";

const typeConfig = {
  risk: {
    icon: ShieldAlert,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  control: {
    icon: TestTube,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  policy: {
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  incident: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  evidence: {
    icon: FileUp,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  audit: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
};

export function RecentActivity() {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity(5)
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="glass-card border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          activities.map((item) => {
            const config = typeConfig[item.type] || typeConfig.audit;
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: false });

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
              >
                <div className={cn("rounded-md p-1.5 shrink-0", config.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo} ago</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{item.detail}</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
