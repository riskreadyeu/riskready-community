import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Server, X, Plus, Workflow } from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';
import { IMPACT_TYPES, type ImpactedAsset, type ImpactedProcess } from './types';

interface ImpactTabProps {
  assets: Asset[];
  processes: { id: string; name: string }[];
  impactedAssets: ImpactedAsset[];
  impactedProcesses: ImpactedProcess[];
  selectedAssetId: string;
  selectedImpactType: string;
  selectedProcessId: string;
  onSelectedAssetIdChange: (id: string) => void;
  onSelectedImpactTypeChange: (type: string) => void;
  onSelectedProcessIdChange: (id: string) => void;
  onAddAsset: () => void;
  onRemoveAsset: (assetId: string) => void;
  onAddProcess: () => void;
  onRemoveProcess: (processId: string) => void;
}

export function ImpactTab({
  assets,
  processes,
  impactedAssets,
  impactedProcesses,
  selectedAssetId,
  selectedImpactType,
  selectedProcessId,
  onSelectedAssetIdChange,
  onSelectedImpactTypeChange,
  onSelectedProcessIdChange,
  onAddAsset,
  onRemoveAsset,
  onAddProcess,
  onRemoveProcess,
}: ImpactTabProps) {
  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Impacted Assets
          </CardTitle>
          <CardDescription>
            Select assets that will be affected by this change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset selector */}
          <div className="flex gap-2">
            <Select
              value={selectedAssetId || '__none__'}
              onValueChange={(v) => onSelectedAssetIdChange(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select an asset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select an asset...</SelectItem>
                {assets
                  .filter(a => !impactedAssets.some(ia => ia.assetId === a.id))
                  .map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{asset.assetTag}</span>
                      {asset.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedImpactType}
              onValueChange={onSelectedImpactTypeChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={onAddAsset} disabled={!selectedAssetId}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* List of impacted assets */}
          {impactedAssets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No assets added yet</p>
              <p className="text-sm">Select assets that will be impacted by this change</p>
            </div>
          ) : (
            <div className="space-y-2">
              {impactedAssets.map((asset) => (
                <div
                  key={asset.assetId}
                  className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.assetName}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {asset.assetTag}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {asset.assetType.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {IMPACT_TYPES.find(t => t.value === asset.impactType)?.label.split(' - ')[0]}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveAsset(asset.assetId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Impacted Business Processes
          </CardTitle>
          <CardDescription>
            Select business processes that may be affected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Process selector */}
          <div className="flex gap-2">
            <Select
              value={selectedProcessId || '__none__'}
              onValueChange={(v) => onSelectedProcessIdChange(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a business process..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select a business process...</SelectItem>
                {processes
                  .filter(p => !impactedProcesses.some(ip => ip.processId === p.id))
                  .map((process) => (
                    <SelectItem key={process.id} value={process.id}>
                      {process.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={onAddProcess} disabled={!selectedProcessId}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* List of impacted processes */}
          {impactedProcesses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No processes added yet</p>
              <p className="text-sm">Select business processes that may be affected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {impactedProcesses.map((process) => (
                <div
                  key={process.processId}
                  className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{process.processName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveProcess(process.processId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
