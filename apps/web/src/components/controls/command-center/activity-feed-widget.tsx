"use client";

import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  TestTube,
  Target,
  FileText,
  Upload,
  ChevronRight,
  User,
} from "lucide-react";
import { ArcherWidget } from "@/components/archer/widget";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'assessment' | 'test' | 'approval' | 'import' | 'update';
  title: string;
  description: string;
  user: {
    name: string;
    initials: string;
  };
  timestamp: string;
  relativeTime: string;
  link?: string;
}

interface ActivityFeedWidgetProps {
  activities?: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onExpand?: () => void;
  className?: string;
}

const defaultActivities: ActivityItem[] = [];

const typeIcons: Record<string, typeof Activity> = {
  assessment: Target,
  test: TestTube,
  approval: CheckCircle2,
  import: Upload,
  update: FileText,
};

const typeColors: Record<string, string> = {
  assessment: 'text-chart-2 bg-chart-2/10',
  test: 'text-chart-1 bg-chart-1/10',
  approval: 'text-success bg-success/10',
  import: 'text-primary bg-primary/10',
  update: 'text-muted-foreground bg-muted',
};

export function ActivityFeedWidget({
  activities = defaultActivities,
  loading = false,
  onRefresh,
  onExpand,
  className,
}: ActivityFeedWidgetProps) {
  return (
    <ArcherWidget
      title="Recent Activity"
      subtitle={`${activities.length} events`}
      onRefresh={onRefresh}
      onExpand={onExpand}
      loading={loading}
      className={className}
    >
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">
            Control updates will appear here
          </p>
        </div>
      ) : (
      <div className="space-y-1">
        {activities.map((activity, index) => {
          const Icon = typeIcons[activity.type] || Activity;
          const colors = typeColors[activity.type] || typeColors['update'];

          const content = (
            <div className={cn(
              "flex items-start gap-3 p-2 -mx-2 rounded-lg transition-colors",
              activity.link && "hover:bg-secondary/50 cursor-pointer"
            )}>
              {/* Icon */}
              <div className={cn("p-1.5 rounded-lg shrink-0", colors)}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>

              {/* User & Time */}
              <div className="flex items-center gap-2 shrink-0 text-right">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    {activity.relativeTime}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {activity.user.name}
                  </p>
                </div>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-secondary">
                    {activity.user.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          );

          return activity.link ? (
            <Link key={activity.id} to={activity.link}>
              {content}
            </Link>
          ) : (
            <div key={activity.id}>{content}</div>
          );
        })}
      </div>
      )}
    </ArcherWidget>
  );
}
