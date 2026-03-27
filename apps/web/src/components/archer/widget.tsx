import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Maximize2, Settings, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArcherWidgetProps } from "@/lib/archer/types";

/**
 * ArcherWidget - Dashboard widget wrapper component.
 *
 * Provides a consistent widget layout with header, actions, loading/error states,
 * and optional footer. Built on Card component with Archer styling.
 */
export function ArcherWidget({
  title,
  subtitle,
  onRefresh,
  onExpand,
  onConfigure,
  loading = false,
  error,
  footer,
  children,
  className,
}: ArcherWidgetProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex flex-col space-y-1">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              className="h-7 w-7"
              aria-label="Refresh widget"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          )}
          {onExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="h-7 w-7"
              aria-label="Expand widget"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onConfigure && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onConfigure}
              className="h-7 w-7"
              aria-label="Configure widget"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          children
        )}
      </CardContent>

      {footer && <CardFooter className="pt-0">{footer}</CardFooter>}
    </Card>
  );
}
