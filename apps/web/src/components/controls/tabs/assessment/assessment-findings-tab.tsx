import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Section } from "@/components/archer/section";
import { ArcherFieldGroup } from "@/components/archer/field-group";
import type { AssessmentTest, RootCauseCategory, RemediationEffort } from "@/lib/controls-api";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Users, Cog, Monitor, DollarSign, Link, Paintbrush, HelpCircle } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface AssessmentFindingsTabProps {
  tests: AssessmentTest[];
}

// =============================================================================
// Configuration
// =============================================================================

const rootCauseIcons: Record<RootCauseCategory, LucideIcon> = {
  PEOPLE: Users,
  PROCESS: Cog,
  TECHNOLOGY: Monitor,
  BUDGET: DollarSign,
  THIRD_PARTY: Link,
  DESIGN: Paintbrush,
  UNKNOWN: HelpCircle,
};

const effortConfig: Record<RemediationEffort, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  TRIVIAL: { label: "Trivial", variant: "secondary" },
  MINOR: { label: "Minor", variant: "secondary" },
  MODERATE: { label: "Moderate", variant: "outline" },
  MAJOR: { label: "Major", variant: "destructive" },
  STRATEGIC: { label: "Strategic", variant: "destructive" },
};

// =============================================================================
// Component
// =============================================================================

export function AssessmentFindingsTab({ tests }: AssessmentFindingsTabProps) {
  const findingsTests = useMemo(() =>
    tests.filter(t => t.result === "FAIL" || t.result === "PARTIAL"),
    [tests]
  );

  const groupedByRootCause = useMemo(() => {
    const groups: Record<string, AssessmentTest[]> = {};
    for (const test of findingsTests) {
      const cause = test.rootCause || "UNKNOWN";
      if (!groups[cause]) groups[cause] = [];
      groups[cause].push(test);
    }
    return groups;
  }, [findingsTests]);

  if (findingsTests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No findings</p>
            <p className="text-sm mt-1">All completed tests have passed or no tests have been completed yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        <Badge variant="destructive" className="text-sm px-3 py-1">
          {findingsTests.filter(t => t.result === "FAIL").length} Failed
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {findingsTests.filter(t => t.result === "PARTIAL").length} Partial
        </Badge>
      </div>

      {/* Grouped by Root Cause */}
      {Object.entries(groupedByRootCause).map(([cause, causeTests]) => (
        <Section
          key={cause}
          title={`${cause.replace("_", " ")} (${causeTests.length})`}
          icon={rootCauseIcons[cause as RootCauseCategory]}
        >
          <div className="space-y-4">
            {causeTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {test.layerTest?.testCode || "\u2014"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {test.layerTest?.name || "\u2014"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.result === "FAIL" ? "destructive" : "outline"}>
                      {test.result}
                    </Badge>
                    {test.remediationEffort && (
                      <Badge variant={effortConfig[test.remediationEffort].variant}>
                        {effortConfig[test.remediationEffort].label} effort
                      </Badge>
                    )}
                  </div>
                </div>

                <ArcherFieldGroup
                  columns={1}
                  fields={[
                    ...(test.findings ? [{ label: "Findings", value: test.findings }] : []),
                    ...(test.recommendations ? [{ label: "Recommendations", value: test.recommendations }] : []),
                    ...(test.rootCauseNotes ? [{ label: "Root Cause Notes", value: test.rootCauseNotes }] : []),
                    ...(test.estimatedHours ? [{ label: "Estimated Hours", value: `${test.estimatedHours}h` }] : []),
                  ]}
                />

                {test.scopeItem && (
                  <div className="text-xs text-muted-foreground">
                    Scope: {test.scopeItem.name} ({test.scopeItem.code})
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
