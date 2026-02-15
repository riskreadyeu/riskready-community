import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/lib/archer/types";

/**
 * EmptyState - Centered placeholder for empty content areas.
 *
 * Displays an icon, title, description, and optional action button
 * when there is no content to show.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
