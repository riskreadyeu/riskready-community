import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Network } from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';

interface AssetTechnicalTabProps {
  asset: Asset;
  DetailRow: React.ComponentType<any>;
}

export function AssetTechnicalTab({ asset, DetailRow }: AssetTechnicalTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="glass-card">
        <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Operating System</h4>
            <DetailRow label="OS Name" value={asset.operatingSystem} />
            <DetailRow label="OS Version" value={asset.osVersion} />
            <DetailRow label="Kernel/Build" value={asset.version} />
            <DetailRow label="Patch Level" value={asset.patchLevel} />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Network Identity</h4>
            <DetailRow label="FQDN" value={asset.fqdn} icon={Network} />
            <div className="pt-2">
              <div className="text-sm text-muted-foreground mb-2">IP Addresses</div>
              <div className="flex flex-wrap gap-2">
                {asset.ipAddresses?.map((ip: string, i: number) => (
                  <Badge key={i} variant="outline" className="font-mono">{ip}</Badge>
                )) || <span className="text-muted-foreground/50">—</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {asset.wazuhDashboardUrl && (
        <Card className="glass-card border-dashed">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <div className="font-medium">Need more technical details?</div>
              <div className="text-sm text-muted-foreground">
                View network interfaces, open ports, installed packages, and hardware specs in Wazuh.
              </div>
            </div>
            <Button variant="outline" onClick={() => window.open(asset.wazuhDashboardUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Wazuh Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
