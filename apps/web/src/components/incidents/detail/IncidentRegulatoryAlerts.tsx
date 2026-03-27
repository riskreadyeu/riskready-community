import { FileWarning, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type Incident } from "@/lib/incidents-api";

type IncidentRegulatoryAlertsProps = {
  incident: Incident;
};

export function IncidentRegulatoryAlerts({
  incident,
}: IncidentRegulatoryAlertsProps) {
  if (
    !incident.nis2Assessment?.isSignificantIncident &&
    !incident.doraAssessment?.isMajorIncident
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {incident.nis2Assessment?.isSignificantIncident && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">NIS2 Significant Incident</p>
              <p className="text-xs text-muted-foreground">
                Regulatory reporting required
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {incident.doraAssessment?.isMajorIncident && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <FileWarning className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">DORA Major ICT Incident</p>
              <p className="text-xs text-muted-foreground">
                Score: {incident.doraAssessment.majorClassificationScore}/7 criteria
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
