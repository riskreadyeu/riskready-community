import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Hash,
  Lock,
  Shield,
} from "lucide-react";
import type { Evidence } from "@/lib/evidence-api";

interface EvidenceIntegrityTabProps {
  evidence: Evidence;
}

export function EvidenceIntegrityTab({ evidence }: EvidenceIntegrityTabProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6 space-y-6">
        {/* Hash values */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            File Hashes
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-1">SHA-256</p>
              <p className="text-xs font-mono break-all">
                {evidence.hashSha256 || "Not computed"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-1">MD5</p>
              <p className="text-xs font-mono break-all">
                {evidence.hashMd5 || "Not computed"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Forensic status */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Forensic Status
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            {evidence.isForensicallySound ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-600">Forensically Sound</p>
                  <p className="text-xs text-muted-foreground">
                    Evidence has been collected and stored following forensic best practices
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Not Verified</p>
                  <p className="text-xs text-muted-foreground">
                    Forensic integrity has not been verified
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chain of custody */}
        {evidence.chainOfCustodyNotes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Chain of Custody
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {evidence.chainOfCustodyNotes}
              </p>
            </div>
          </>
        )}

        {/* Encryption */}
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Encryption Status
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            {evidence.isEncrypted ? (
              <>
                <Lock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-600">Encrypted</p>
                  <p className="text-xs text-muted-foreground">
                    File is encrypted at rest
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Not Encrypted</p>
                  <p className="text-xs text-muted-foreground">
                    File is stored without encryption
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
