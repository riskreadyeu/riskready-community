"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Calendar,
  CheckSquare,
  AlertCircle,
  Circle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUpcomingTasks, type UpcomingTask } from "@/lib/dashboard-api";

const statusConfig = {
  urgent: {
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: AlertCircle,
  },
  in_progress: {
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    icon: Clock,
  },
  not_started: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    icon: Circle,
  },
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (isPast(date)) {
    return `Overdue by ${formatDistanceToNow(date)}`;
  }

  const days = differenceInDays(date, now);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingTasks(5)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="glass-card border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getStatusLabel = (task: UpcomingTask): string => {
    if (task.status === 'urgent') return 'High Priority';
    if (task.status === 'in_progress') return 'In Progress';
    return 'Scheduled';
  };

  return (
    <Card className="glass-card border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            Upcoming Tasks
          </CardTitle>
          <span className="text-xs text-muted-foreground">{tasks.length} pending</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No upcoming tasks
          </div>
        ) : (
          tasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.not_started;
            const StatusIcon = config.icon;

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg border bg-secondary/20 p-3 transition-colors hover:bg-secondary/40",
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-md p-1.5 shrink-0", config.bgColor)}>
                    <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] shrink-0", config.bgColor, config.color)}
                      >
                        {getStatusLabel(task)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(task.dueDate)}
                      </span>
                      {task.assignee && (
                        <span className="text-xs text-muted-foreground">
                          {task.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
