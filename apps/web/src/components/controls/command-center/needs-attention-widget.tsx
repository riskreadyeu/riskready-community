
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  TestTube,
  Target,
  Activity,
  ClipboardCheck,
  ChevronRight,
  Clock,
} from "lucide-react";
import { ArcherWidget } from "@/components/archer/widget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  type: 'test' | 'gap' | 'metric' | 'soa' | 'review';
  title: string;
  description: string;
  count: number;
  priority: 'critical' | 'high' | 'medium';
  link: string;
}

interface NeedsAttentionWidgetProps {
  items?: AttentionItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onExpand?: () => void;
  className?: string;
}

const defaultItems: AttentionItem[] = [];

const typeIcons: Record<string, typeof AlertTriangle> = {
  test: TestTube,
  gap: Target,
  metric: Activity,
  soa: ClipboardCheck,
  review: Clock,
};

const priorityStyles: Record<string, { bg: string; border: string; text: string }> = {
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
  },
  high: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
  },
  medium: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
};

export function NeedsAttentionWidget({
  items = defaultItems,
  loading = false,
  onRefresh,
  onExpand,
  className,
}: NeedsAttentionWidgetProps) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const criticalCount = items
    .filter(i => i.priority === 'critical')
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <ArcherWidget
      title="Needs Attention"
      subtitle={criticalCount > 0 ? `${criticalCount} Critical` : undefined}
      onRefresh={onRefresh}
      onExpand={onExpand}
      loading={loading}
      className={className}
    >
      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No items need your attention right now
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const Icon = typeIcons[item.type] || AlertTriangle;
            const styles = priorityStyles[item.priority];

            return (
              <Link
                key={item.id}
                to={item.link}
                className="block"
              >
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  "hover:border-primary/30 hover:shadow-sm",
                  styles?.bg,
                  styles?.border
                )}>
                  <div className={cn(
                    "shrink-0 p-2 rounded-lg",
                    item.priority === 'critical' ? 'bg-destructive/10' :
                    item.priority === 'high' ? 'bg-warning/10' :
                    'bg-secondary'
                  )}>
                    <Icon className={cn("h-4 w-4", styles?.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.title}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5",
                          item.priority === 'critical' && "bg-destructive/20 text-destructive",
                          item.priority === 'high' && "bg-warning/20 text-warning"
                        )}
                      >
                        {item.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </ArcherWidget>
  );
}
