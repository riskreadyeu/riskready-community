import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY_PREFIX = "archer-section-collapsed";

/**
 * Generate a storage key for a section's collapsed state.
 */
function getStorageKey(sectionId: string): string {
  return `${STORAGE_KEY_PREFIX}:${sectionId}`;
}

/**
 * Hook for managing collapsible section state with localStorage persistence.
 *
 * @param sectionId - Unique identifier for the section
 * @param defaultCollapsed - Initial collapsed state if not persisted
 */
export function useCollapsedState(
  sectionId: string,
  defaultCollapsed: boolean = false
): [boolean, (collapsed: boolean) => void] {
  // Initialize from localStorage or use default
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultCollapsed;

    try {
      const stored = localStorage.getItem(getStorageKey(sectionId));
      if (stored !== null) {
        return stored === "true";
      }
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
    }
    return defaultCollapsed;
  });

  // Persist to localStorage when state changes
  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      setIsCollapsed(collapsed);
      try {
        localStorage.setItem(getStorageKey(sectionId), String(collapsed));
      } catch (error) {
        console.error("Failed to write to localStorage:", error);
      }
    },
    [sectionId]
  );

  return [isCollapsed, setCollapsed];
}

/**
 * Breakpoint configuration for responsive layouts.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook for responsive layout logic based on viewport width.
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint | null;
  isAbove: (bp: Breakpoint) => boolean;
  isBelow: (bp: Breakpoint) => boolean;
  width: number;
} {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 1024;
    return window.innerWidth;
  });

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint = useMemo<Breakpoint | null>(() => {
    if (width >= BREAKPOINTS["2xl"]) return "2xl";
    if (width >= BREAKPOINTS.xl) return "xl";
    if (width >= BREAKPOINTS.lg) return "lg";
    if (width >= BREAKPOINTS.md) return "md";
    if (width >= BREAKPOINTS.sm) return "sm";
    return null;
  }, [width]);

  const isAbove = useCallback(
    (bp: Breakpoint): boolean => width >= BREAKPOINTS[bp],
    [width]
  );

  const isBelow = useCallback(
    (bp: Breakpoint): boolean => width < BREAKPOINTS[bp],
    [width]
  );

  return { breakpoint, isAbove, isBelow, width };
}

/**
 * Hook for conditional sidebar visibility based on viewport.
 * Shows sidebar only on larger screens by default.
 */
export function useConditionalSidebar(minBreakpoint: Breakpoint = "lg"): {
  showSidebar: boolean;
  toggleSidebar: () => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
} {
  const { isAbove } = useBreakpoint();
  const [manualVisible, setManualVisible] = useState<boolean | null>(null);

  const autoShow = isAbove(minBreakpoint);
  const sidebarVisible = manualVisible !== null ? manualVisible : autoShow;

  const toggleSidebar = useCallback(() => {
    setManualVisible((prev) => (prev !== null ? !prev : !autoShow));
  }, [autoShow]);

  const setSidebarVisible = useCallback((visible: boolean) => {
    setManualVisible(visible);
  }, []);

  // Reset manual override when crossing breakpoint
  useEffect(() => {
    if (autoShow) {
      setManualVisible(null);
    }
  }, [autoShow]);

  return {
    showSidebar: autoShow,
    toggleSidebar,
    sidebarVisible,
    setSidebarVisible,
  };
}

/**
 * Layout configuration type.
 */
export interface LayoutConfig {
  sidebarWidth: number;
  headerHeight: number;
  contentPadding: number;
  showSidebar: boolean;
}

/**
 * Default layout configuration for Archer-style pages.
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebarWidth: 280,
  headerHeight: 64,
  contentPadding: 24,
  showSidebar: true,
};

/**
 * Hook for managing layout configuration with responsive adjustments.
 */
export function useLayoutConfig(
  overrides?: Partial<LayoutConfig>
): LayoutConfig {
  const { isAbove } = useBreakpoint();

  return useMemo(() => {
    const base = { ...DEFAULT_LAYOUT_CONFIG, ...overrides };

    // Hide sidebar on smaller screens
    if (!isAbove("lg")) {
      base.showSidebar = false;
    }

    // Reduce padding on smaller screens
    if (!isAbove("md")) {
      base.contentPadding = 16;
    }

    return base;
  }, [isAbove, overrides]);
}
