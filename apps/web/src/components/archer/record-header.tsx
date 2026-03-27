import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { RecordHeaderProps } from "@/lib/archer/types";

/**
 * RecordHeader - Compact 64px header for record detail pages.
 *
 * Displays breadcrumbs, record identifier, title, status badge,
 * optional additional badges, and action buttons.
 */
export function RecordHeader({
  breadcrumbs,
  identifier,
  title,
  status,
  badges,
  actions,
}: RecordHeaderProps) {
  const StatusIcon = status.icon;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Identifier badge */}
        <Badge variant="outline" className="shrink-0 font-mono text-xs">
          {identifier}
        </Badge>

        {/* Title */}
        <h1 className="truncate text-lg font-semibold">{title}</h1>

        {/* Status badge */}
        <Badge
          variant={status.variant}
          className={cn("shrink-0", StatusIcon && "flex items-center gap-1")}
        >
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {status.label}
        </Badge>

        {/* Additional badges */}
        {badges?.map((badge, index) => (
          <Badge
            key={index}
            variant={badge.variant || "secondary"}
            className="shrink-0"
          >
            {badge.label}
          </Badge>
        ))}
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2 pl-4">{actions}</div>}
    </header>
  );
}
