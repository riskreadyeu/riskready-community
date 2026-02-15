import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Paintbrush,
  Settings,
  Zap,
  Play,
} from "lucide-react";
import type { TestResult } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface TestResultData {
  id: string;
  testResult: TestResult | null;
  testDate: string | null;
  testedBy?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface EffectivenessTestLayersProps {
  tests: {
    DESIGN: TestResultData | null;
    IMPLEMENTATION: TestResultData | null;
    OPERATING: TestResultData | null;
  };
  capabilityId: string;
  controlId: string;
  onRunTest?: (type: "DESIGN" | "IMPLEMENTATION" | "OPERATING") => void;
  compact?: boolean;
  className?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const TEST_TYPE_CONFIG = {
  DESIGN: { label: "Design", icon: Paintbrush, layer: 1, color: "text-chart-1", bgColor: "bg-chart-1/10" },
  IMPLEMENTATION: { label: "Implementation", icon: Settings, layer: 2, color: "text-chart-2", bgColor: "bg-chart-2/10" },
  OPERATING: { label: "Operating", icon: Zap, layer: 3, color: "text-chart-3", bgColor: "bg-chart-3/10" },
} as const;

const STATUS_CONFIG = {
  PASS: { label: "Pass", icon: CheckCircle2, variant: "success" as const, borderColor: "border-l-success" },
  PARTIAL: { label: "Partial", icon: AlertTriangle, variant: "warning" as const, borderColor: "border-l-warning" },
  FAIL: { label: "Fail", icon: XCircle, variant: "destructive" as const, borderColor: "border-l-destructive" },
  NOT_TESTED: { label: "Pending", icon: Clock, variant: "muted" as const, borderColor: "" },
  NOT_APPLICABLE: { label: "N/A", icon: Clock, variant: "muted" as const, borderColor: "" },
} as const;

// =============================================================================
// Component
// =============================================================================

/**
 * EffectivenessTestLayers - Displays 3-layer (Design/Implementation/Operating) test visualization.
 *
 * Shows test status for each layer with visual indicators, links to test details,
 * and optional run test actions. Follows Archer design patterns.
 */
export function EffectivenessTestLayers({
  tests,
  capabilityId,
  controlId,
  onRunTest,
  compact = false,
  className,
}: EffectivenessTestLayersProps) {
  return (
    <div role="list" aria-label="Effectiveness test layers" className={cn("space-y-3", className)}>
      {(["DESIGN", "IMPLEMENTATION", "OPERATING"] as const).map((testType) => {
        const config = TEST_TYPE_CONFIG[testType];
        const test = tests[testType];
        const Icon = config.icon;
        const result = test?.testResult;
        const statusConfig = result ? STATUS_CONFIG[result] : STATUS_CONFIG.NOT_TESTED;
        const StatusIcon = statusConfig.icon;
        const hasValidTest = test && test.id;
        const testUrl = hasValidTest
          ? `/controls/${controlId}/capabilities/${capabilityId}/tests/${test.id}`
          : `/controls/${controlId}/capabilities/${capabilityId}`;

        const content = (
          <div
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border transition-all",
              hasValidTest && "hover:border-primary/30 hover:bg-secondary/30 cursor-pointer",
              !hasValidTest && "opacity-60",
              result === "PASS" && "border-l-4 border-l-success",
              result === "PARTIAL" && "border-l-4 border-l-warning",
              result === "FAIL" && "border-l-4 border-l-destructive",
              compact && "p-3 gap-3"
            )}
          >
            {/* Icon */}
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor, compact && "w-8 h-8")}>
              <Icon className={cn("w-5 h-5", config.color, compact && "w-4 h-4")} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Layer {config.layer}
                </Badge>
                <span className={cn("font-medium", compact && "text-sm")}>{config.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {test?.testDate
                  ? `Tested ${new Date(test.testDate).toLocaleDateString()}`
                  : "Not tested"}
                {test?.testedBy && ` by ${test.testedBy.firstName || ""} ${test.testedBy.lastName || ""}`.trim()}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  statusConfig.variant === "success" && "bg-success/10 text-success border-success/20",
                  statusConfig.variant === "warning" && "bg-warning/10 text-warning border-warning/20",
                  statusConfig.variant === "destructive" && "bg-destructive/10 text-destructive border-destructive/20",
                  statusConfig.variant === "muted" && "text-muted-foreground"
                )}
              >
                <StatusIcon className="w-3 h-3" /> {statusConfig.label}
              </Badge>
              {hasValidTest && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              {!hasValidTest && onRunTest && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRunTest(testType);
                  }}
                  className={cn("gap-1", compact && "h-7 text-xs")}
                >
                  <Play className="w-3 h-3" /> Run
                </Button>
              )}
            </div>
          </div>
        );

        if (hasValidTest) {
          return (
            <Link
              key={testType}
              to={testUrl}
              role="listitem"
              aria-label={`${config.label} test - ${statusConfig.label}`}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={testType} role="listitem" aria-label={`${config.label} test - ${statusConfig.label}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
