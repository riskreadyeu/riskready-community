import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Asset } from '@/lib/itsm-api';

interface AssetCapacityTabProps {
  asset: Asset;
  DetailRow: React.ComponentType<any>;
}

export function AssetCapacityTab({ asset, DetailRow }: AssetCapacityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle>Capacity Usage</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: 'CPU Usage', val: asset.cpuUsagePercent, thresh: asset.cpuThresholdPercent },
              { label: 'Memory Usage', val: asset.memoryUsagePercent, thresh: asset.memoryThresholdPercent },
              { label: 'Storage Usage', val: asset.storageUsagePercent, thresh: asset.storageThresholdPercent },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.val ?? 0}%</span>
                </div>
                <Progress value={item.val ?? 0} className={`h-2 ${item.val && item.thresh && item.val > item.thresh ? 'bg-red-200' : ''}`} />
              </div>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <DetailRow label="Capacity Status" value={<Badge variant="outline">{asset.capacityStatus}</Badge>} />
              <DetailRow label="Trend" value={asset.capacityTrend} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Resilience (NIS2)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 border rounded-lg">
                <span className="block text-xs text-muted-foreground">RTO</span>
                <span className="text-2xl font-bold">{asset.rtoMinutes || '-'} <span className="text-xs font-normal text-muted-foreground">min</span></span>
              </div>
              <div className="p-3 border rounded-lg">
                <span className="block text-xs text-muted-foreground">RPO</span>
                <span className="text-2xl font-bold">{asset.rpoMinutes || '-'} <span className="text-xs font-normal text-muted-foreground">min</span></span>
              </div>
              <div className="p-3 border rounded-lg">
                <span className="block text-xs text-muted-foreground">Target Avail.</span>
                <span className="text-2xl font-bold">{asset.targetAvailability || '-'}%</span>
              </div>
              <div className="p-3 border rounded-lg">
                <span className="block text-xs text-muted-foreground">Actual Avail.</span>
                <span className="text-2xl font-bold">{asset.actualAvailability || '-'}%</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Redundancy</span>
                {asset.hasRedundancy ? <Badge className="bg-green-600">Yes</Badge> : <Badge variant="secondary">No</Badge>}
              </div>
              {asset.hasRedundancy && <DetailRow label="Type" value={asset.redundancyType} />}
              <div className="flex justify-between items-center text-sm">
                <span>Last Outage</span>
                <span className="font-mono">{asset.lastOutageDate ? new Date(asset.lastOutageDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
