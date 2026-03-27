import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Asset } from '@/lib/itsm-api';

interface AssetFinancialTabProps {
  asset: Asset;
  DetailRow: React.ComponentType<any>;
}

export function AssetFinancialTab({ asset, DetailRow }: AssetFinancialTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="glass-card">
        <CardHeader><CardTitle>Cost Tracking</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/20 p-4 rounded-lg text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purchase Cost</div>
              <div className="text-2xl font-bold">
                {asset.purchaseCost !== undefined ? new Intl.NumberFormat('en-US', { style: 'currency', currency: asset.costCurrency }).format(asset.purchaseCost) : '—'}
              </div>
            </div>
            <div className="bg-muted/20 p-4 rounded-lg text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Cost</div>
              <div className="text-2xl font-bold">
                {asset.annualCost !== undefined ? new Intl.NumberFormat('en-US', { style: 'currency', currency: asset.costCurrency }).format(asset.annualCost) : '—'}
              </div>
            </div>
          </div>
          <Separator />
          <DetailRow label="Cost Center" value={asset.costCenter} />
          <DetailRow label="Currency" value={asset.costCurrency} />
        </CardContent>
      </Card>
    </div>
  );
}
