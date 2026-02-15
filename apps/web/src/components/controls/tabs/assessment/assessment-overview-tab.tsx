import { Section } from "@/components/archer/section";
import { ArcherFieldGroup } from "@/components/archer/field-group";
import { ArcherWidget } from "@/components/archer/widget";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar, Users, BarChart3, CheckCircle, XCircle, AlertTriangle, Target } from "lucide-react";
import type { Assessment } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface AssessmentOverviewTabProps {
  assessment: Assessment;
}

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (dateString?: string) => {
  if (!dateString) return "\u2014";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
  if (!user) return "\u2014";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email;
};

// =============================================================================
// Component
// =============================================================================

export function AssessmentOverviewTab({ assessment }: AssessmentOverviewTabProps) {
  const totalTests = assessment.totalTests || 0;
  const completedTests = assessment.completedTests || 0;
  const passedTests = assessment.passedTests || 0;
  const failedTests = assessment.failedTests || 0;
  const progressPercent = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
  const passRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Description */}
      {assessment.description && (
        <Section title="Description" icon={FileText}>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {assessment.description}
          </p>
        </Section>
      )}

      {/* Schedule */}
      <Section title="Schedule" icon={Calendar}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            { label: "Planned Start", value: formatDate(assessment.plannedStartDate) },
            { label: "Planned End", value: formatDate(assessment.plannedEndDate) },
            { label: "Actual Start", value: formatDate(assessment.actualStartDate) },
            { label: "Actual End", value: formatDate(assessment.actualEndDate) },
            { label: "Due Date", value: assessment.dueDate ? (
              <span className={new Date(assessment.dueDate) < new Date() && assessment.status !== "COMPLETED" ? "text-destructive font-medium" : ""}>
                {formatDate(assessment.dueDate)}
              </span>
            ) : "\u2014" },
            { label: "Period", value: assessment.periodStart
              ? `${formatDate(assessment.periodStart)} \u2013 ${formatDate(assessment.periodEnd)}`
              : "\u2014"
            },
          ]}
        />
      </Section>

      {/* Team */}
      <Section title="Team" icon={Users}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            { label: "Lead Tester", value: formatUserName(assessment.leadTester) },
            { label: "Reviewer", value: formatUserName(assessment.reviewer) },
            { label: "Created By", value: formatUserName(assessment.createdBy) },
            { label: "Created", value: formatDate(assessment.createdAt) },
            ...(assessment.reviewedAt
              ? [{ label: "Reviewed", value: formatDate(assessment.reviewedAt) }]
              : []),
          ]}
        />
      </Section>

      {/* Progress */}
      <Section title="Test Progress" icon={BarChart3}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{completedTests} / {totalTests} tests ({progressPercent}%)</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ArcherWidget title="Total Tests">
              <div className="text-3xl font-bold">{totalTests}</div>
            </ArcherWidget>
            <ArcherWidget title="Passed">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{passedTests}</div>
              </div>
            </ArcherWidget>
            <ArcherWidget title="Failed">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{failedTests}</div>
              </div>
            </ArcherWidget>
            <ArcherWidget title="Pass Rate">
              <div className="flex items-center gap-2">
                {passRate >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : passRate >= 50 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="text-3xl font-bold">{passRate}%</div>
              </div>
            </ArcherWidget>
          </div>
        </div>
      </Section>

      {/* Scope Summary */}
      <Section title="Scope Summary" icon={Target}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            {
              label: "Controls in Scope",
              value: (
                <Badge variant="outline">
                  {assessment.controls?.length || 0} controls
                </Badge>
              ),
            },
            {
              label: "Scope Items",
              value: (
                <Badge variant="outline">
                  {assessment.scopeItems?.length || 0} items
                </Badge>
              ),
            },
          ]}
        />
      </Section>

      {/* Review Notes (if completed) */}
      {assessment.reviewNotes && (
        <Section title="Review Notes" icon={FileText}>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {assessment.reviewNotes}
          </p>
        </Section>
      )}
    </div>
  );
}
