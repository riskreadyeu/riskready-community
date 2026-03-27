import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import { TAB_CLASSES } from "@/lib/archer/constants";
import type { ArcherTabSetProps } from "@/lib/archer/types";

/**
 * ArcherTabSet - Archer-styled tab component with optional URL sync.
 *
 * Wraps Radix Tabs primitive with Archer design patterns including ALL CAPS labels,
 * badge support, keyboard navigation, and optional URL synchronization.
 */
export function ArcherTabSet({
  tabs,
  defaultValue,
  value,
  onValueChange,
  syncWithUrl = false,
  className,
}: ArcherTabSetProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract visible tabs (filter out hidden)
  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  // Determine initial value
  const getInitialValue = () => {
    if (value) return value;
    if (syncWithUrl) {
      const params = new URLSearchParams(location.search);
      const urlTab = params.get("tab");
      if (urlTab && visibleTabs.some((t) => t.value === urlTab)) {
        return urlTab;
      }
    }
    return defaultValue || visibleTabs[0]?.value;
  };

  const currentValue = value || getInitialValue();

  // Handle tab change
  const handleValueChange = (newValue: string) => {
    if (syncWithUrl) {
      const params = new URLSearchParams(location.search);
      params.set("tab", newValue);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
    onValueChange?.(newValue);
  };

  // Sync URL on mount if syncWithUrl is enabled
  useEffect(() => {
    if (syncWithUrl && !value) {
      const params = new URLSearchParams(location.search);
      const urlTab = params.get("tab");
      if (!urlTab && currentValue) {
        params.set("tab", currentValue);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TabsPrimitive.Root
      value={currentValue}
      onValueChange={handleValueChange}
      className={className}
    >
      <TabsPrimitive.List
        className={TAB_CLASSES.list}
        aria-label="Tab navigation"
      >
        {visibleTabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={TAB_CLASSES.trigger}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-5 px-1.5"
              >
                {tab.badge}
              </Badge>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {visibleTabs.map((tab) => (
        <TabsPrimitive.Content
          key={tab.value}
          value={tab.value}
          className={TAB_CLASSES.content}
          tabIndex={-1}
        >
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
