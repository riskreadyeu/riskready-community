import * as React from "react";
import { useSearchParams } from "react-router-dom";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * ArcherTabSet - Archer GRC style tabs with ALL CAPS headers and URL sync
 *
 * Per Archer GRC Design Reference:
 * - Tab headers should be ALL CAPS
 * - Active tab highlighted (blue in Archer, primary in our theme)
 * - Tabs without accessible content should be hidden
 */

interface ArcherTabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /** Sync active tab with URL query parameter */
  syncWithUrl?: boolean;
  /** URL parameter name for tab sync (default: "tab") */
  urlParam?: string;
}

const ArcherTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  ArcherTabsProps
>(({ syncWithUrl, urlParam = "tab", defaultValue, value, onValueChange, ...props }, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial value from URL if syncing
  const urlValue = syncWithUrl ? searchParams.get(urlParam) : null;
  const initialValue = urlValue || value || defaultValue;

  const handleValueChange = (newValue: string) => {
    if (syncWithUrl) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set(urlParam, newValue);
        return newParams;
      }, { replace: true });
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsPrimitive.Root
      ref={ref}
      value={syncWithUrl ? (urlValue || defaultValue) : value}
      defaultValue={!syncWithUrl ? defaultValue : undefined}
      onValueChange={handleValueChange}
      {...props}
    />
  );
});
ArcherTabs.displayName = "ArcherTabs";

const ArcherTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
ArcherTabsList.displayName = "ArcherTabsList";

interface ArcherTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** Count badge to show next to tab label */
  count?: number;
}

const ArcherTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  ArcherTabsTriggerProps
>(({ className, children, count, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide ring-offset-background transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow",
      "uppercase", // Archer GRC: ALL CAPS tab headers
      className,
    )}
    {...props}
  >
    {children}
    {count !== undefined && count > 0 && (
      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
));
ArcherTabsTrigger.displayName = "ArcherTabsTrigger";

const ArcherTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
ArcherTabsContent.displayName = "ArcherTabsContent";

export { ArcherTabs, ArcherTabsList, ArcherTabsTrigger, ArcherTabsContent };
