import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useCollapsedState } from "./hooks/use-conditional-layout";
import type { SectionProps } from "@/lib/archer/types";

/**
 * Generate a section ID for localStorage persistence.
 */
function generateSectionId(title: string, providedId?: string): string {
  if (providedId) return providedId;
  // Create a simple slug from the title
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Section - Collapsible section with localStorage persistence.
 *
 * Provides a consistent section layout with header, optional icon,
 * description, badges, actions, and collapsible content.
 */
export function Section({
  id,
  title,
  icon: Icon,
  description,
  collapsible = false,
  defaultCollapsed = false,
  badge,
  actions,
  children,
  className,
}: SectionProps) {
  const sectionId = generateSectionId(title, id);
  const [isCollapsed, setCollapsed] = useCollapsedState(
    sectionId,
    defaultCollapsed
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      <div className="flex flex-col">
        <span className="font-semibold">{title}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-2">
      {badge}
      {actions}
      {collapsible && (
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            !isCollapsed && "rotate-180"
          )}
        />
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          {headerContent}
          {(badge || actions) && (
            <div className="flex items-center gap-2">
              {badge}
              {actions}
            </div>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  }

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className={cn("rounded-lg border bg-card", className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          {headerContent}
          {rightContent}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
