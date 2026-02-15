import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Target } from "lucide-react";
import type { ControlMapping, RiskMapping } from "@/lib/policies-api";

interface PolicyMappingsTabProps {
  controlMappings: ControlMapping[];
  riskMappings: RiskMapping[];
}

export function PolicyMappingsTab({
  controlMappings,
  riskMappings,
}: PolicyMappingsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Control Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {controlMappings.length > 0 ? (
            <div className="space-y-2">
              {controlMappings.map((mapping) => (
                <Link
                  key={mapping.id}
                  to={`/controls/${mapping.controlId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {mapping.control?.controlId}
                    </span>
                    <span className="text-sm">{mapping.control?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{mapping.mappingType}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        mapping.coverage === "FULL"
                          ? "bg-green-500/10 text-green-500"
                          : mapping.coverage === "PARTIAL"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-gray-500/10 text-gray-500"
                      }
                    >
                      {mapping.coverage}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No control mappings</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Risk Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riskMappings.length > 0 ? (
            <div className="space-y-2">
              {riskMappings.map((mapping) => (
                <Link
                  key={mapping.id}
                  to={`/risks/${mapping.riskId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {mapping.risk?.riskId}
                    </span>
                    <span className="text-sm">{mapping.risk?.title}</span>
                  </div>
                  <Badge variant="outline">{mapping.relationshipType}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No risk mappings</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
