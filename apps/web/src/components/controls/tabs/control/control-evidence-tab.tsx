import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvidenceForEntity, type Evidence, type EvidenceStatus } from "@/lib/evidence-api";
import { Link2, ExternalLink } from "lucide-react";

export function ControlEvidenceTab({ controlId }: { controlId: string }) {
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  useEffect(() => {
    setLoading(true);
    getEvidenceForEntity("control", controlId)
      .then((items) => setEvidence(items as Evidence[]))
      .finally(() => setLoading(false));
  }, [controlId]);

  const statusSummary = useMemo(() => {
    return evidence.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [evidence]);

  const statusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "REJECTED":
      case "EXPIRED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Evidence Coverage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(statusSummary).length === 0 ? (
            <div className="text-sm text-muted-foreground">No evidence linked yet.</div>
          ) : (
            Object.entries(statusSummary).map(([status, count]) => (
              <Badge key={status} variant="outline">
                {status}: {count}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Linked Evidence</CardTitle>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Link Evidence
          </Button>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <div className="text-sm text-muted-foreground">No evidence linked yet.</div>
          ) : (
            <div className="space-y-2">
              {evidence.map((item) => (
                <Link
                  key={item.id}
                  to={`/evidence/${item.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.evidenceRef}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadge(item.status)}>{item.status}</Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
