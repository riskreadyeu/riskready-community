import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  ExternalLink,
  History,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import type { Evidence } from "@/lib/evidence-api";

interface EvidenceHistoryTabProps {
  evidence: Evidence;
}

export function EvidenceHistoryTab({ evidence }: EvidenceHistoryTabProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Version info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <History className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Version {evidence.version}</p>
              <p className="text-xs text-muted-foreground">Current version</p>
            </div>
          </div>

          {/* Previous versions */}
          {evidence.previousVersion && (
            <div>
              <h3 className="text-sm font-medium mb-3">Previous Version</h3>
              <Link
                to={`/evidence/${evidence.previousVersion.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
              >
                <div>
                  <p className="font-medium">{evidence.previousVersion.evidenceRef}</p>
                  <p className="text-sm text-muted-foreground">
                    Version {evidence.previousVersion.version}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          )}

          {/* Newer versions */}
          {evidence.newerVersions && evidence.newerVersions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Newer Versions</h3>
              <div className="space-y-2">
                {evidence.newerVersions.map((version) => (
                  <Link
                    key={version.id}
                    to={`/evidence/${version.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{version.evidenceRef}</p>
                      <p className="text-sm text-muted-foreground">
                        Version {version.version}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Audit trail */}
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3">Audit Trail</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(evidence.createdAt).toLocaleString()}
                    {evidence.createdBy && ` by ${evidence.createdBy.firstName} ${evidence.createdBy.lastName}`}
                  </p>
                </div>
              </div>

              {evidence.reviewedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reviewed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evidence.reviewedAt).toLocaleString()}
                      {evidence.reviewedBy && ` by ${evidence.reviewedBy.firstName} ${evidence.reviewedBy.lastName}`}
                    </p>
                    {evidence.reviewNotes && (
                      <p className="text-sm text-muted-foreground mt-1">{evidence.reviewNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {evidence.approvedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evidence.approvedAt).toLocaleString()}
                      {evidence.approvedBy && ` by ${evidence.approvedBy.firstName} ${evidence.approvedBy.lastName}`}
                    </p>
                    {evidence.approvalNotes && (
                      <p className="text-sm text-muted-foreground mt-1">{evidence.approvalNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {evidence.rejectedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evidence.rejectedAt).toLocaleString()}
                      {evidence.rejectedBy && ` by ${evidence.rejectedBy.firstName} ${evidence.rejectedBy.lastName}`}
                    </p>
                    {evidence.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">{evidence.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
