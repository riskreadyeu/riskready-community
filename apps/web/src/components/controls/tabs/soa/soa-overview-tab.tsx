import { Section } from "@/components/archer/section";
import { ArcherFieldGroup } from "@/components/archer/field-group";
import { ArcherWidget } from "@/components/archer/widget";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import type { StatementOfApplicability } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface SOAStats {
  total: number;
  applicable: number;
  notApplicable: number;
  implemented: number;
  partial: number;
  notStarted: number;
}

export interface SOAOverviewTabProps {
  soa: StatementOfApplicability;
  stats: SOAStats;
}

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
  if (!user) return "—";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email;
};

// =============================================================================
// Component
// =============================================================================

/**
 * SOAOverviewTab - Overview information for SOA detail page.
 *
 * Displays version metadata, approval info, and summary statistics
 * using Archer Section, FieldGroup, and Widget components.
 */
export function SOAOverviewTab({ soa, stats }: SOAOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Version Information */}
      <Section title="Version Information" icon={FileText}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            {
              label: "Version",
              value: <Badge variant="outline">v{soa.version}</Badge>,
            },
            {
              label: "Name",
              value: soa.name || "—",
            },
            {
              label: "Created",
              value: formatDate(soa.createdAt),
            },
            {
              label: "Created By",
              value: formatUserName(soa.createdBy),
            },
            {
              label: "Last Updated",
              value: formatDate(soa.updatedAt),
            },
            {
              label: "Updated By",
              value: formatUserName(soa.updatedBy),
            },
            {
              label: "Notes",
              value: soa.notes || "—",
              span: 2,
            },
          ]}
        />
      </Section>

      {/* Approval Information */}
      {soa.approvedAt && (
        <Section title="Approval Information" icon={CheckCircle}>
          <ArcherFieldGroup
            columns={2}
            fields={[
              {
                label: "Approved On",
                value: formatDate(soa.approvedAt),
              },
              {
                label: "Approved By",
                value: formatUserName(soa.approvedBy),
              },
            ]}
          />
        </Section>
      )}

      {/* Statistics */}
      <Section title="Summary Statistics" icon={Clock}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ArcherWidget title="Total Controls">
            <div className="text-3xl font-bold">{stats.total}</div>
          </ArcherWidget>

          <ArcherWidget title="Applicable">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-3xl font-bold text-green-600">{stats.applicable}</div>
            </div>
          </ArcherWidget>

          <ArcherWidget title="Not Applicable">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div className="text-3xl font-bold text-gray-500">{stats.notApplicable}</div>
            </div>
          </ArcherWidget>

          <ArcherWidget title="Implemented">
            <div className="text-3xl font-bold text-blue-600">{stats.implemented}</div>
          </ArcherWidget>

          <ArcherWidget title="Partial">
            <div className="text-3xl font-bold text-amber-600">{stats.partial}</div>
          </ArcherWidget>

          <ArcherWidget title="Not Started">
            <div className="text-3xl font-bold text-red-600">{stats.notStarted}</div>
          </ArcherWidget>
        </div>
      </Section>
    </div>
  );
}
