import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { ListPageLayoutProps } from "@/lib/archer/types";

/**
 * ListPageLayout - Standard list page structure.
 *
 * Provides a consistent layout for list pages with breadcrumbs,
 * title, description, actions, filters, and content area.
 * 
 * Note: This component is designed to work within AppShell which already
 * provides outer padding. The layout uses space-y-6 for consistent spacing.
 */
export function ListPageLayout({
  title,
  description,
  breadcrumbs,
  actions,
  filters,
  children,
  className,
}: ListPageLayoutProps) {
  return (
    <div className={cn("space-y-6 animate-slide-up", className)}>
      {/* Header */}
      <div>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center text-sm text-muted-foreground">
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
        )}

        {/* Title row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Filters */}
        {filters && <div className="mt-4">{filters}</div>}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
