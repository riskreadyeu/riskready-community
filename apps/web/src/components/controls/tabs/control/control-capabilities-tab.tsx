import { Section } from "@/components/archer/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers, Plus, ExternalLink, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { Capability } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface ControlCapabilitiesTabProps {
  capabilities: Capability[];
  controlId: string;
  onAdd?: () => void;
  onRemove?: (capabilityId: string) => void;
}

// Type configuration
const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  TECHNOLOGY: { label: "Technology", color: "text-chart-1", bgColor: "bg-chart-1/10" },
  PROCESS: { label: "Process", color: "text-chart-2", bgColor: "bg-chart-2/10" },
  PEOPLE: { label: "People", color: "text-chart-3", bgColor: "bg-chart-3/10" },
  PHYSICAL: { label: "Physical", color: "text-chart-4", bgColor: "bg-chart-4/10" },
};

// =============================================================================
// Component
// =============================================================================

/**
 * ControlCapabilitiesTab - Capabilities list tab for Control detail page.
 *
 * Displays linked capabilities with type, maturity, and navigation.
 * Uses simple list pattern for capability cross-references.
 */
export function ControlCapabilitiesTab({
  capabilities,
  controlId,
  onAdd,
  onRemove,
}: ControlCapabilitiesTabProps) {
  return (
    <div className="space-y-6">
      <Section
        title="Capabilities"
        icon={Layers}
        badge={<Badge variant="secondary">{capabilities.length}</Badge>}
        actions={
          onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="w-3 h-3 mr-2" />
              Add Capability
            </Button>
          )
        }
      >
        {capabilities.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No capabilities linked</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add capabilities to define how this control is implemented
            </p>
            {onAdd && (
              <Button variant="outline" size="sm" onClick={onAdd}>
                <Plus className="w-3 h-3 mr-2" />
                Add Capability
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {capabilities.map((capability) => {
              const typeConfig = (TYPE_CONFIG[capability.type] ?? TYPE_CONFIG['TECHNOLOGY'])!;
              const latestAssessment = capability.assessments?.[0];
              const currentMaturity = latestAssessment?.currentMaturity ?? 0;
              const targetMaturity = latestAssessment?.targetMaturity ?? capability.maxMaturityLevel;

              return (
                <Link
                  key={capability.id}
                  to={`/controls/${controlId}/capabilities/${capability.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/30 hover:bg-secondary/30 transition-all group"
                >
                  {/* Icon */}
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig.bgColor)}>
                    <Layers className={cn("w-5 h-5", typeConfig.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{capability.name}</span>
                      <Badge variant="outline" className={cn("text-[10px]", typeConfig.bgColor, typeConfig.color)}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{capability.capabilityId}</p>
                    {capability.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{capability.description}</p>
                    )}
                  </div>

                  {/* Maturity Indicator */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Target className="w-3 h-3" />
                        <span>Maturity</span>
                      </div>
                      <div className="text-sm font-bold">
                        L{currentMaturity}
                        <span className="text-muted-foreground font-normal"> / L{targetMaturity}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
