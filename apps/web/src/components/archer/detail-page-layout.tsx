import { cn } from "@/lib/utils";
import { RecordHeader } from "./record-header";
import type { DetailPageLayoutProps } from "@/lib/archer/types";

/**
 * DetailPageLayout - Detail page with optional sidebar.
 *
 * Provides a consistent layout for detail pages with a compact header,
 * optional sidebar, tabs, content area, and footer.
 */
export function DetailPageLayout({
  header,
  sidebar,
  tabs,
  children,
  footer,
  className,
}: DetailPageLayoutProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <RecordHeader {...header} />

      {/* Main content area with optional sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs navigation */}
          {tabs && (
            <div className="shrink-0 border-b bg-background px-6">{tabs}</div>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>

          {/* Footer */}
          {footer && <div className="shrink-0">{footer}</div>}
        </div>

        {/* Sidebar */}
        {sidebar}
      </div>
    </div>
  );
}
