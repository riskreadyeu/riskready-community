import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  Paperclip,
  Server,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  categoryLabels,
  sourceLabels,
  type Incident,
} from "@/lib/incidents-api";

function formatDate(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleString();
}

function getUserName(user?: { firstName?: string; lastName?: string; email: string }) {
  if (!user) return null;
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email;
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

type IncidentSidebarPanelsProps = {
  incident: Incident;
};

export function IncidentSidebarPanels({
  incident,
}: IncidentSidebarPanelsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow
            label="Category"
            value={categoryLabels[incident.category]}
            icon={AlertTriangle}
          />
          <InfoRow
            label="Source"
            value={sourceLabels[incident.source]}
            icon={Activity}
          />
          {incident.sourceRef && (
            <InfoRow label="Source Reference" value={incident.sourceRef} />
          )}
          <Separator className="my-3" />
          <InfoRow
            label="Incident Type"
            value={incident.incidentType?.name}
          />
          <InfoRow
            label="Attack Vector"
            value={incident.attackVector?.name}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow
            label="Detected"
            value={formatDate(incident.detectedAt)}
            icon={Clock}
          />
          <InfoRow
            label="Occurred"
            value={formatDate(incident.occurredAt)}
            icon={Calendar}
          />
          <InfoRow label="Reported" value={formatDate(incident.reportedAt)} />
          <InfoRow
            label="Classified"
            value={formatDate(incident.classifiedAt)}
          />
          <Separator className="my-3" />
          <InfoRow
            label="Contained"
            value={formatDate(incident.containedAt)}
          />
          <InfoRow
            label="Eradicated"
            value={formatDate(incident.eradicatedAt)}
          />
          <InfoRow
            label="Recovered"
            value={formatDate(incident.recoveredAt)}
          />
          <InfoRow label="Closed" value={formatDate(incident.closedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow
            label="Reporter"
            value={getUserName(incident.reporter)}
            icon={User}
          />
          <InfoRow
            label="Handler"
            value={getUserName(incident.handler)}
            icon={User}
          />
          <InfoRow
            label="Incident Manager"
            value={getUserName(incident.incidentManager)}
            icon={User}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Related Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Affected Assets</span>
            </div>
            <Badge variant="secondary">{incident._count?.affectedAssets || 0}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Evidence</span>
            </div>
            <Badge variant="secondary">{incident._count?.evidence || 0}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Notifications</span>
            </div>
            <Badge variant="secondary">{incident._count?.notifications || 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
