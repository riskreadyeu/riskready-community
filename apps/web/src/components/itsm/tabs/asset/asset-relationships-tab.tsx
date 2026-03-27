import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetRelationshipDiagram } from '@/components/itsm/AssetRelationshipDiagram';
import type { Asset, AssetImpactAnalysis, AssetRelationship } from '@/lib/itsm-api';

interface AssetRelationshipsTabProps {
  asset: Asset;
  relationships: AssetRelationship[];
  impactAnalysis: AssetImpactAnalysis | null;
}

export function AssetRelationshipsTab({ asset, relationships, impactAnalysis }: AssetRelationshipsTabProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="glass-card h-[600px] flex flex-col">
        <CardHeader className="flex-none"><CardTitle>Impact & Relationships</CardTitle></CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <AssetRelationshipDiagram
            currentAsset={asset}
            relationships={relationships}
          />
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur p-4 rounded-lg border shadow-sm max-w-[250px]">
            <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider">Impact Analysis</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Directly Impacted:</span>
                <span className="font-bold">{impactAnalysis?.summary?.totalDirectlyImpacted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Processes:</span>
                <span className="font-bold">{impactAnalysis?.summary?.impactedProcessCount || 0}</span>
              </div>
              <div className="mt-2 text-xs text-red-500 font-medium">
                {impactAnalysis?.summary?.impactedByBusinessCriticality?.['CRITICAL'] || 0} Critical Assets Affected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
