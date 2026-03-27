import { Section } from "@/components/archer/section";
import { ArcherFieldGroup } from "@/components/archer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

// =============================================================================
// Types
// =============================================================================

export interface FrameworkMapping {
  id: string;
  framework: string;
  controlId: string;
  clause: string;
  requirement: string;
}

export interface SoaEntry {
  id: string;
  controlId: string;
  applicable: boolean;
  implementationStatus: string;
  justification?: string;
}

export interface ControlComplianceTabProps {
  soaEntry?: SoaEntry;
  frameworkMappings: FrameworkMapping[];
  controlId: string;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  ISO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  SOC2: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  NIS2: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  DORA: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

// =============================================================================
// Component
// =============================================================================

/**
 * ControlComplianceTab - Compliance mappings tab for Control detail page.
 *
 * Displays SOA entry reference and framework mappings list.
 * Uses Section, ArcherFieldGroup, and links to SOA detail.
 */
export function ControlComplianceTab({
  soaEntry,
  frameworkMappings,
  controlId,
}: ControlComplianceTabProps) {
  return (
    <div className="space-y-6">
      {/* SOA Entry Reference */}
      <Section title="Statement of Applicability" icon={FileText}>
        {soaEntry ? (
          <div>
            <ArcherFieldGroup
              columns={2}
              fields={[
                {
                  label: "Applicable",
                  value: (
                    <Badge variant={soaEntry.applicable ? "success" : "secondary"}>
                      {soaEntry.applicable ? "Yes" : "No"}
                    </Badge>
                  ),
                },
                {
                  label: "Implementation Status",
                  value: (
                    <Badge variant="outline">
                      {soaEntry.implementationStatus.replace(/_/g, " ")}
                    </Badge>
                  ),
                },
                {
                  label: "Justification",
                  value: soaEntry.justification || "—",
                  span: 2,
                },
              ]}
            />
            <div className="mt-4 pt-4 border-t">
              <Link to={`/compliance/soa/${soaEntry.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="w-3 h-3" />
                  View Full SOA Entry
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No SOA entry found for this control
            </p>
            <Button variant="outline" size="sm">
              Create SOA Entry
            </Button>
          </div>
        )}
      </Section>

      {/* Framework Mappings */}
      <Section
        title="Framework Mappings"
        icon={CheckCircle2}
        badge={<Badge variant="secondary">{frameworkMappings.length}</Badge>}
      >
        {frameworkMappings.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No framework mappings configured
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {frameworkMappings.map((mapping) => {
              const frameworkColor = FRAMEWORK_COLORS[mapping.framework] || FRAMEWORK_COLORS['ISO'];
              return (
                <div
                  key={mapping.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                >
                  <Badge variant="outline" className={frameworkColor}>
                    {mapping.framework}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-semibold">
                        {mapping.controlId}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {mapping.clause}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {mapping.requirement}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
