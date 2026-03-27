// =============================================================================
// Archer Component Library Constants
// =============================================================================
// Shared constants for consistent Archer design system implementation
// =============================================================================

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  default: 200,
  slow: 300,
} as const;

/**
 * Layout constants for consistent spacing and sizing
 */
export const LAYOUT = {
  maxContentWidth: 1600,
  fieldIndent: 5,
  minRowHeight: 60,
  sidebarWidth: 320,
  headerHeight: 64,
} as const;

/**
 * Progress tracker status-specific styling
 */
export const PROGRESS_STATUS_CLASSES = {
  completed: "bg-emerald-500 text-white border-emerald-500",
  current: "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20",
  pending: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive text-destructive-foreground border-destructive",
} as const;

/**
 * Tab styling classes for ArcherTabSet
 */
export const TAB_CLASSES = {
  list: "inline-flex h-10 items-center justify-start gap-1 border-b border-border bg-transparent p-0",
  trigger: "relative px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-primary data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary disabled:pointer-events-none disabled:opacity-50",
  content: "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
} as const;

/**
 * Responsive breakpoint for field groups and other components
 */
export const BREAKPOINT_MD = 768;
