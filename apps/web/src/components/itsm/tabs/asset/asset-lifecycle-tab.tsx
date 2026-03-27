import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Shield,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building,
  ExternalLink,
} from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';

interface AssetLifecycleTabProps {
  asset: Asset;
  DetailRow: React.ComponentType<any>;
}

export function AssetLifecycleTab({ asset, DetailRow }: AssetLifecycleTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="glass-card">
        <CardHeader><CardTitle>Asset Lifecycle</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="relative pl-6 border-l-2 border-muted space-y-8">
            <div className="relative">
              <div className="absolute -left-[29px] bg-background p-1 text-primary"><Calendar className="h-4 w-4" /></div>
              <div className="text-sm font-semibold">Purchased</div>
              <div className="text-sm text-muted-foreground">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'Date not set'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[29px] bg-background p-1 text-primary"><CheckCircle className="h-4 w-4" /></div>
              <div className="text-sm font-semibold">Deployed</div>
              <div className="text-sm text-muted-foreground">{asset.deploymentDate ? new Date(asset.deploymentDate).toLocaleDateString() : 'Date not set'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[29px] bg-background p-1 text-primary"><Shield className="h-4 w-4" /></div>
              <div className="text-sm font-semibold">Warranty Expiry</div>
              <div className="text-sm text-muted-foreground">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'Date not set'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[29px] bg-background p-1 text-orange-500"><AlertTriangle className="h-4 w-4" /></div>
              <div className="text-sm font-semibold">End of Support</div>
              <div className="text-sm text-muted-foreground">{asset.endOfSupport ? new Date(asset.endOfSupport).toLocaleDateString() : 'Date not set'}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[29px] bg-background p-1 text-red-500"><Trash2 className="h-4 w-4" /></div>
              <div className="text-sm font-semibold">End of Life</div>
              <div className="text-sm text-muted-foreground">{asset.endOfLife ? new Date(asset.endOfLife).toLocaleDateString() : 'Date not set'}</div>
              {asset.disposalDate && (
                <div className="text-xs text-red-500 mt-1">Disposed: {new Date(asset.disposalDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
          {asset.lifecycleNotes && (
            <div className="bg-muted/20 p-4 rounded-lg text-sm italic">
              {asset.lifecycleNotes}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Vendor & Support</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {asset.vendor && (
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
              <Building className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-semibold">{asset.vendor.name}</div>
                <div className="text-xs text-muted-foreground">Vendor ID: {asset.vendor.id}</div>
              </div>
            </div>
          )}

          <DetailRow label="Support Contract" value={asset.supportContract} />
          <DetailRow label="Support Tier" value={asset.supportTier} />
          <DetailRow label="Contract Expiry" value={asset.supportExpiry ? new Date(asset.supportExpiry).toLocaleDateString() : ''} />

          <Separator className="my-4" />

          <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
            <div className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-2">
              <ExternalLink className="h-4 w-4" /> Support Status
            </div>
            <div className="text-sm">
              {asset.supportExpiry && new Date(asset.supportExpiry) < new Date() ? (
                <span className="text-red-600 font-medium">Support Expired</span>
              ) : asset.supportContract ? (
                <span className="text-green-600 font-medium">Active Support</span>
              ) : (
                <span className="text-muted-foreground">No active support details</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
