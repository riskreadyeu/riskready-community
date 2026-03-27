import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  File,
  Shield,
  Tag,
  Upload,
} from "lucide-react";
import type { Evidence } from "@/lib/evidence-api";

interface EvidenceOverviewTabProps {
  evidence: Evidence;
  formatFileSize: (bytes?: number) => string;
}

export function EvidenceOverviewTab({
  evidence,
  formatFileSize,
}: EvidenceOverviewTabProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6 space-y-6">
        {/* File Info */}
        {evidence.fileName && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <File className="h-4 w-4" />
              File Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Name</p>
                <p className="text-sm font-medium">{evidence.originalFileName || evidence.fileName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Size</p>
                <p className="text-sm font-medium">{formatFileSize(evidence.fileSizeBytes)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">MIME Type</p>
                <p className="text-sm font-medium">{evidence.mimeType || "\u2014"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-sm font-medium">{evidence.storageProvider || "Local"}</p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Source Info */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Source Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Source Type</p>
              <p className="text-sm font-medium">{evidence.sourceType.replace(/_/g, " ")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Collected At</p>
              <p className="text-sm font-medium">
                {new Date(evidence.collectedAt).toLocaleString()}
              </p>
            </div>
            {evidence.collectedBy && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Collected By</p>
                <p className="text-sm font-medium">
                  {evidence.collectedBy.firstName} {evidence.collectedBy.lastName}
                </p>
              </div>
            )}
            {evidence.collectionMethod && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Collection Method</p>
                <p className="text-sm font-medium">{evidence.collectionMethod}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Validity */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Validity Period
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valid From</p>
              <p className="text-sm font-medium">
                {evidence.validFrom ? new Date(evidence.validFrom).toLocaleDateString() : "\u2014"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valid Until</p>
              <p className="text-sm font-medium">
                {evidence.validUntil ? new Date(evidence.validUntil).toLocaleDateString() : "\u2014"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Retain Until</p>
              <p className="text-sm font-medium">
                {evidence.retainUntil ? new Date(evidence.retainUntil).toLocaleDateString() : "\u2014"}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {evidence.tags && evidence.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {evidence.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {evidence.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {evidence.notes}
              </p>
            </div>
          </>
        )}

        {/* Chain of Custody & Forensics */}
        {(evidence.chainOfCustodyNotes || evidence.isForensicallySound != null || evidence.hashSha256 || evidence.hashMd5 || evidence.collectionMethod || evidence.sourceSystem || evidence.sourceReference) && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Chain of Custody & Forensics
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {evidence.isForensicallySound != null && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Forensically Sound</p>
                    <Badge variant={evidence.isForensicallySound ? "default" : "secondary"}>
                      {evidence.isForensicallySound ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}
                {evidence.collectionMethod && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Collection Method</p>
                    <p className="text-sm font-medium">{evidence.collectionMethod}</p>
                  </div>
                )}
                {evidence.sourceSystem && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Source System</p>
                    <p className="text-sm font-medium">{evidence.sourceSystem}</p>
                  </div>
                )}
                {evidence.sourceReference && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Source Reference</p>
                    <p className="text-sm font-medium">{evidence.sourceReference}</p>
                  </div>
                )}
                {evidence.hashSha256 && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
                    <p className="text-sm font-mono break-all">{evidence.hashSha256}</p>
                  </div>
                )}
                {evidence.hashMd5 && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">MD5 Hash</p>
                    <p className="text-sm font-mono break-all">{evidence.hashMd5}</p>
                  </div>
                )}
              </div>
              {evidence.chainOfCustodyNotes && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Chain of Custody Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {evidence.chainOfCustodyNotes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
