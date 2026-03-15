import { Link } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  severityLabels,
  statusLabels,
  type Incident,
} from "@/lib/incidents-api";

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<
    string,
    "destructive" | "warning" | "secondary" | "outline"
  > = {
    CRITICAL: "destructive",
    HIGH: "warning",
    MEDIUM: "secondary",
    LOW: "outline",
  };

  return (
    <Badge variant={variants[severity] || "secondary"}>
      {severityLabels[severity as keyof typeof severityLabels] || severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "destructive" | "warning" | "secondary" | "success" | "outline"
  > = {
    DETECTED: "destructive",
    TRIAGED: "warning",
    INVESTIGATING: "warning",
    CONTAINING: "warning",
    ERADICATING: "secondary",
    RECOVERING: "secondary",
    POST_INCIDENT: "outline",
    CLOSED: "success",
  };

  return (
    <Badge variant={variants[status] || "secondary"}>
      {statusLabels[status as keyof typeof statusLabels] || status}
    </Badge>
  );
}

type IncidentDetailHeaderProps = {
  incident: Incident;
  onBack: () => void;
};

export function IncidentDetailHeader({
  incident,
  onBack,
}: IncidentDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/incidents" className="hover:text-foreground">
          Incidents
        </Link>
        <span>/</span>
        <Link to="/incidents/register" className="hover:text-foreground">
          Register
        </Link>
        <span>/</span>
        <span className="text-foreground">{incident.referenceNumber}</span>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {incident.referenceNumber}
              </h1>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-1 text-lg text-muted-foreground">{incident.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/incidents/${incident.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
