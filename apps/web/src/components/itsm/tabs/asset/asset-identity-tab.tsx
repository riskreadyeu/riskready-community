import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Building, MapPin, Cloud } from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';

interface AssetIdentityTabProps {
  asset: Asset;
  DetailRow: React.ComponentType<any>;
  getUserName: (user?: { firstName?: string; lastName?: string; email: string }) => string | undefined;
}

export function AssetIdentityTab({ asset, DetailRow, getUserName }: AssetIdentityTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="glass-card">
        <CardHeader><CardTitle>Classification & Scope</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Business Criticality" value={<Badge>{asset.businessCriticality}</Badge>} />
          <DetailRow label="Data Classification" value={<Badge variant="outline">{asset.dataClassification}</Badge>} />
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Data Handled</div>
            <div className="flex flex-wrap gap-2">
              {asset.handlesPersonalData && <Badge variant="secondary">Personal Data (PII)</Badge>}
              {asset.handlesFinancialData && <Badge variant="secondary">Financial</Badge>}
              {asset.handlesHealthData && <Badge variant="secondary">Health (PHI)</Badge>}
              {asset.handlesConfidentialData && <Badge variant="secondary">Confidential</Badge>}
              {!asset.handlesPersonalData && !asset.handlesFinancialData && !asset.handlesHealthData && !asset.handlesConfidentialData && (
                <span className="text-sm text-muted-foreground">No sensitive data flags set</span>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Compliance Scope</div>
            <div className="flex flex-wrap gap-2">
              {asset.inIsmsScope && <Badge variant="outline">ISMS</Badge>}
              {asset.inGdprScope && <Badge variant="outline">GDPR</Badge>}
              {asset.inPciScope && <Badge variant="outline">PCI-DSS</Badge>}
              {asset.inDoraScope && <Badge variant="outline">DORA</Badge>}
              {asset.inNis2Scope && <Badge variant="outline">NIS2</Badge>}
              {asset.inSoc2Scope && <Badge variant="outline">SOC 2</Badge>}
            </div>
            {asset.scopeNotes && (
              <p className="text-xs text-muted-foreground mt-2 italic">{asset.scopeNotes}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Ownership & Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ownership</h4>
          <DetailRow label="Owner" value={getUserName(asset.owner) || 'Unassigned'} icon={User} />
          <DetailRow label="Custodian" value={getUserName(asset.custodian)} icon={User} />
          <DetailRow label="Department" value={asset.department?.name} icon={Building} />

          <Separator className="my-4" />

          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h4>
          <DetailRow label="Location Name" value={asset.location?.name} icon={MapPin} />
          {asset.cloudProvider ? (
            <>
              <DetailRow label="Cloud Provider" value={asset.cloudProvider} icon={Cloud} />
              <DetailRow label="Region" value={asset.cloudRegion} />
              <DetailRow label="Account ID" value={asset.cloudAccountId} />
              <DetailRow label="Resource ID" value={asset.cloudResourceId} />
            </>
          ) : (
            <>
              <DetailRow label="Datacenter" value={asset.datacenter} />
              <DetailRow label="Rack" value={asset.rack} />
              <DetailRow label="Rack Position" value={asset.rackPosition} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
