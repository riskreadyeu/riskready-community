import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import type { DocumentVersion } from "@/lib/policies-api";

interface PolicyVersionsTabProps {
  versions: DocumentVersion[];
}

export function PolicyVersionsTab({ versions }: PolicyVersionsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version History</CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length > 0 ? (
          <div className="space-y-4">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                    v{version.version}
                  </div>
                  {idx < versions.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{version.changeType.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{version.changeDescription}</p>
                  {version.createdBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {version.createdBy.firstName} {version.createdBy.lastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No version history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
