import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScenarioStatus } from "./workflow-types";
import { STATUS_CONFIG } from "./workflow-config";

// ============================================
// STATUS BADGE COMPONENT (for use elsewhere)
// ============================================

interface ScenarioStatusBadgeProps {
  status: ScenarioStatus;
  showIcon?: boolean;
  size?: "sm" | "default";
}

export function ScenarioStatusBadge({
  status,
  showIcon = true,
  size = "default",
}: ScenarioStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      className={cn(
        "font-medium",
        config.bgColor,
        config.color,
        size === "sm" && "text-xs px-1.5 py-0.5"
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
