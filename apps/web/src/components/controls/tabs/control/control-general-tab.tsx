import { Section } from "@/components/archer/section";
import { ArcherFieldGroup } from "@/components/archer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Settings, ShieldCheck, Edit3 } from "lucide-react";
import type { Control } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface ControlGeneralTabProps {
  control: Control;
  onEdit?: () => void;
}

// Type configuration for visual consistency
const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ORGANISATIONAL: { label: "Organisational", color: "text-chart-1", bgColor: "bg-chart-1/10" },
  PEOPLE: { label: "People", color: "text-chart-2", bgColor: "bg-chart-2/10" },
  PHYSICAL: { label: "Physical", color: "text-chart-3", bgColor: "bg-chart-3/10" },
  TECHNOLOGICAL: { label: "Technological", color: "text-chart-4", bgColor: "bg-chart-4/10" },
};

const FRAMEWORK_LABELS: Record<string, string> = {
  ISO: "ISO 27001",
  SOC2: "SOC 2",
  NIS2: "NIS2",
  DORA: "DORA",
};

const STATUS_CONFIG = {
  NOT_STARTED: { label: "Not Started", variant: "secondary" as const },
  PARTIAL: { label: "Partially Implemented", variant: "warning" as const },
  IMPLEMENTED: { label: "Fully Implemented", variant: "success" as const },
};

// =============================================================================
// Component
// =============================================================================

/**
 * ControlGeneralTab - General information tab for Control detail page.
 *
 * Displays basic control information, classification, implementation details,
 * and framework mappings using Archer components.
 */
export function ControlGeneralTab({ control, onEdit }: ControlGeneralTabProps) {
  const typeConfig = (TYPE_CONFIG[control.theme] ?? TYPE_CONFIG['ORGANISATIONAL'])!;
  const statusConfig = STATUS_CONFIG[control.implementationStatus] || STATUS_CONFIG.NOT_STARTED;
  const frameworkLabel = control.framework ? FRAMEWORK_LABELS[control.framework] : "N/A";

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Section
        title="Basic Information"
        icon={FileText}
        actions={
          onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="w-3 h-3 mr-2" />
              Edit
            </Button>
          )
        }
      >
        <ArcherFieldGroup
          columns={2}
          fields={[
            {
              label: "Control ID",
              value: <span className="font-mono font-semibold">{control.controlId}</span>,
            },
            {
              label: "Name",
              value: control.name,
            },
            {
              label: "Description",
              value: control.description || "No description provided",
              span: 2,
            },
          ]}
        />
      </Section>

      {/* Classification */}
      <Section title="Classification" icon={ShieldCheck}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            {
              label: "Theme",
              value: (
                <Badge variant="outline" className={cn(typeConfig.bgColor, typeConfig.color)}>
                  {typeConfig.label}
                </Badge>
              ),
            },
            {
              label: "Framework",
              value: <Badge variant="outline">{frameworkLabel}</Badge>,
            },
            {
              label: "Source Standard",
              value: control.sourceStandard || "N/A",
            },
            {
              label: "TSC Category",
              value: control.tscCategory || "N/A",
            },
            {
              label: "SOC2 Criteria",
              value: control.soc2Criteria || "N/A",
              span: 2,
            },
          ]}
        />
      </Section>

      {/* Implementation */}
      <Section title="Implementation" icon={Settings}>
        <ArcherFieldGroup
          columns={2}
          fields={[
            {
              label: "Status",
              value: (
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              ),
            },
            {
              label: "Applicable",
              value: (
                <Badge variant={control.applicable ? "success" : "secondary"}>
                  {control.applicable ? "Yes" : "No"}
                </Badge>
              ),
            },
            {
              label: "Enabled",
              value: (
                <Badge variant={control.enabled ? "success" : "destructive"}>
                  {control.enabled ? "Enabled" : "Disabled"}
                </Badge>
              ),
            },
            {
              label: "Layers",
              value: control._count?.['layers'] || 0,
            },
            {
              label: "Implementation Description",
              value: control.implementationDesc || "No implementation description",
              span: 2,
            },
            {
              label: "Justification (if N/A)",
              value: control.justificationIfNa || "—",
              span: 2,
            },
            {
              label: "Disabled Reason",
              value: control.disabledReason || "—",
              span: 2,
            },
          ]}
        />
      </Section>
    </div>
  );
}
