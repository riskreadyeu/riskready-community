import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, Target, CheckCircle2, History, Edit3, MoreHorizontal, Check, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getControl, type Control } from "@/lib/controls-api";
import { ArcherTabSet } from "@/components/archer/tab-set";
import {
  ControlGeneralTab,
  ControlAssessmentTab,
  ControlComplianceTab,
  ControlHistoryTab,
  ControlEvidenceTab,
} from "@/components/controls/tabs/control";
import { RecordHeader } from "@/components/archer/record-header";
import { DetailStatCard } from "@/components/controls/detail-components";
import { ControlEnableDisable } from "@/components/controls/ControlEnableDisable";
import type { AuditLogEntry } from "@/lib/archer/types";
import type { FrameworkMapping, SoaEntry } from "@/components/controls/tabs/control/control-compliance-tab";

// =============================================================================
// Helper Functions (Community Edition - simplified without layers)
// =============================================================================

function getStatusLabel(status: string) {
  switch (status) {
    case "IMPLEMENTED": return "Implemented";
    case "PARTIAL": return "Partial";
    case "NOT_STARTED": return "Not Started";
    default: return status;
  }
}

// =============================================================================
// Constants
// =============================================================================

const THEME_LABELS: Record<string, string> = {
  ORGANISATIONAL: "Organisational",
  PEOPLE: "People",
  PHYSICAL: "Physical",
  TECHNOLOGICAL: "Technological",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  IMPLEMENTED: { label: "Implemented", color: "success" },
  PARTIAL: { label: "Partial", color: "warning" },
  NOT_STARTED: { label: "Not Started", color: "muted" },
};

// =============================================================================
// Component
// =============================================================================

export default function ControlDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchControl() {
      if (!params['controlId']) {
        setError("No control ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getControl(params['controlId']);
        setControl(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load control");
      } finally {
        setLoading(false);
      }
    }
    fetchControl();
  }, [params['controlId']]);

  // Computed values
  const statusConfig = STATUS_CONFIG[control?.implementationStatus || "NOT_STARTED"]!;

  // Mock data for compliance and history tabs (replace with real API calls)
  const frameworkMappings: FrameworkMapping[] = useMemo(() => {
    if (!control) return [];
    return [
      {
        id: "1",
        framework: control.framework || "ISO",
        controlId: control.controlId,
        clause: "A.5.1",
        requirement: "Information security policy",
      },
    ];
  }, [control]);

  const soaEntry: SoaEntry | undefined = useMemo(() => {
    if (!control) return undefined;
    return {
      id: "soa-1",
      controlId: control.controlId,
      applicable: control.applicable,
      implementationStatus: control.implementationStatus,
      justification: control.justificationIfNa,
    };
  }, [control]);

  const auditEntries: AuditLogEntry[] = useMemo(() => {
    if (!control) return [];
    const entries: AuditLogEntry[] = [];
    if (control.createdAt && control.createdBy) {
      entries.push({
        id: "audit-1",
        user: {
          name: `${control.createdBy.firstName || ""} ${control.createdBy.lastName || ""}`.trim() || control.createdBy.email,
          avatar: undefined,
        },
        action: "Created control",
        timestamp: control.createdAt,
        details: `Initial control creation with status ${control.implementationStatus}`,
      });
    }
    if (control.updatedAt && control.updatedBy && control.updatedAt !== control.createdAt) {
      entries.push({
        id: "audit-2",
        user: {
          name: `${control.updatedBy.firstName || ""} ${control.updatedBy.lastName || ""}`.trim() || control.updatedBy.email,
          avatar: undefined,
        },
        action: "Updated control",
        timestamp: control.updatedAt,
        details: "Control properties updated",
      });
    }
    return entries.reverse();
  }, [control]);

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !control) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Control Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The control you're looking for doesn't exist."}</p>
        <Button onClick={() => navigate("/controls/library")}>Back to Controls</Button>
      </div>
    );
  }

  const statusIconMap: Record<string, typeof Check> = {
    IMPLEMENTED: Check,
    PARTIAL: Clock,
    NOT_STARTED: AlertTriangle,
    NOT_APPLICABLE: AlertTriangle,
  };
  const StatusIcon = statusIconMap[control.implementationStatus || "NOT_STARTED"] || AlertTriangle;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Archer RecordHeader */}
      <RecordHeader
        breadcrumbs={[
          { label: "Controls", href: "/controls" },
          { label: "Library", href: "/controls/library" },
          { label: control.name },
        ]}
        identifier={control.controlId}
        title={control.name}
        status={{
          label: statusConfig.label,
          variant: statusConfig.color === "emerald" ? "default" : statusConfig.color === "amber" ? "secondary" : "outline",
          icon: StatusIcon,
        }}
        badges={[
          { label: THEME_LABELS[control.theme] || control.theme, variant: "outline" as const },
          ...(control.framework ? [{ label: control.framework, variant: "secondary" as const }] : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ControlEnableDisable control={control} onStateChange={(updated) => setControl(updated)} />
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Copy ID</DropdownMenuItem>
                <DropdownMenuItem>Bookmark</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <DetailStatCard
          icon={<Shield className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/10"
          label="Implementation Status"
          value={getStatusLabel(control.implementationStatus || "NOT_STARTED")}
        />
        <DetailStatCard
          icon={<Target className="w-5 h-5 text-chart-1" />}
          iconBg="bg-chart-1/10"
          label="Framework"
          value={control.framework || "—"}
        />
        <DetailStatCard
          icon={<CheckCircle2 className="w-5 h-5 text-chart-3" />}
          iconBg="bg-chart-3/10"
          label="Theme"
          value={THEME_LABELS[control.theme] || control.theme}
        />
      </div>

      {/* Tabs */}
      <ArcherTabSet
        syncWithUrl={true}
        defaultValue="general"
        tabs={[
          {
            value: "general",
            label: "GENERAL",
            content: <ControlGeneralTab control={control} onEdit={() => console.log("Edit control")} />,
          },
          {
            value: "assessment",
            label: "ASSESSMENT",
            content: <ControlAssessmentTab effectiveness={{ score: 0, rating: "NOT_MEASURED", passCount: 0, partialCount: 0, failCount: 0, notTestedCount: 0, totalLayers: 0 }} protectionScore={{ current: 0, target: 100 }} />,
          },
          {
            value: "evidence",
            label: "EVIDENCE",
            content: <ControlEvidenceTab controlId={control.id} />,
          },
          {
            value: "compliance",
            label: "COMPLIANCE",
            badge: frameworkMappings.length,
            content: (
              <ControlComplianceTab
                soaEntry={soaEntry}
                frameworkMappings={frameworkMappings}
                controlId={control.controlId}
              />
            ),
          },
          {
            value: "history",
            label: "HISTORY",
            content: <ControlHistoryTab auditEntries={auditEntries} />,
          },
        ]}
      />
    </div>
  );
}
