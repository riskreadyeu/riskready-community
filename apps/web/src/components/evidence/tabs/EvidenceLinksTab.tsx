import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Link2,
} from "lucide-react";
import type { Evidence } from "@/lib/evidence-api";

interface EvidenceLinksTabProps {
  evidence: Evidence;
  totalLinks: number;
  onOpenLinkDialog: () => void;
}

export function EvidenceLinksTab({
  evidence,
  totalLinks,
  onOpenLinkDialog,
}: EvidenceLinksTabProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Linked Entities</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLinkDialog}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Link to Entity
          </Button>
        </div>
        {totalLinks === 0 ? (
          <div className="text-center py-8">
            <Link2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No linked entities</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            {evidence.controlLinks && evidence.controlLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Controls</h3>
                <div className="space-y-2">
                  {evidence.controlLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={`/controls/${link.control.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{link.control.controlId}</p>
                        <p className="text-sm text-muted-foreground">{link.control.name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            {evidence.incidentLinks && evidence.incidentLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Incidents</h3>
                <div className="space-y-2">
                  {evidence.incidentLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={`/incidents/${link.incident.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{link.incident.referenceNumber}</p>
                        <p className="text-sm text-muted-foreground">{link.incident.title}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {evidence.riskLinks && evidence.riskLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Risks</h3>
                <div className="space-y-2">
                  {evidence.riskLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={`/risks/${link.risk.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{link.risk.riskId}</p>
                        <p className="text-sm text-muted-foreground">{link.risk.title}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Vendors */}
            {evidence.vendorLinks && evidence.vendorLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Vendors</h3>
                <div className="space-y-2">
                  {evidence.vendorLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={`/supply-chain/vendors/${link.vendor.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{link.vendor.vendorCode}</p>
                        <p className="text-sm text-muted-foreground">{link.vendor.name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Assets */}
            {evidence.assetLinks && evidence.assetLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Assets</h3>
                <div className="space-y-2">
                  {evidence.assetLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={`/itsm/assets/${link.asset.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{link.asset.assetTag}</p>
                        <p className="text-sm text-muted-foreground">{link.asset.name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
