import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Network } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';

interface AssetResilienceSectionProps {
  form: AssetFormState;
  selectedCategory: string;
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetResilienceSection({
  form,
  selectedCategory,
  handleChange,
}: AssetResilienceSectionProps) {
  return (
    <AccordionItem value="resilience" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Network className="h-5 w-5 text-green-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Resilience & Capacity</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              {selectedCategory === 'services' ? 'SLA requirements and availability targets' :
               'RTO/RPO, redundancy, and resource capacity'}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Recovery Objectives */}
          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-medium">Recovery Objectives</Label>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="rtoMinutes">RTO (minutes)</Label>
                <Input id="rtoMinutes" type="number" value={form.rtoMinutes} onChange={(e) => handleChange('rtoMinutes', e.target.value)} placeholder="Recovery Time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpoMinutes">RPO (minutes)</Label>
                <Input id="rpoMinutes" type="number" value={form.rpoMinutes} onChange={(e) => handleChange('rpoMinutes', e.target.value)} placeholder="Recovery Point" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAvailability">Availability (%)</Label>
                <Input id="targetAvailability" type="number" step="0.01" value={form.targetAvailability} onChange={(e) => handleChange('targetAvailability', e.target.value)} placeholder="e.g., 99.9" />
              </div>
              <div className="space-y-2">
                <Label>Redundancy</Label>
                <div className="flex items-center h-10">
                  <Switch id="hasRedundancy" checked={form.hasRedundancy} onCheckedChange={(v) => handleChange('hasRedundancy', v)} />
                  <Label htmlFor="hasRedundancy" className="ml-2 font-normal">Enabled</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity - Only for Hardware and Cloud */}
          {(selectedCategory === 'hardware' || selectedCategory === 'cloud') && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Capacity</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="cpuCapacity">CPU Cores</Label>
                  <Input id="cpuCapacity" type="number" value={form.cpuCapacity} onChange={(e) => handleChange('cpuCapacity', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memoryCapacityGB">Memory (GB)</Label>
                  <Input id="memoryCapacityGB" type="number" value={form.memoryCapacityGB} onChange={(e) => handleChange('memoryCapacityGB', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storageCapacityGB">Storage (GB)</Label>
                  <Input id="storageCapacityGB" type="number" value={form.storageCapacityGB} onChange={(e) => handleChange('storageCapacityGB', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="networkBandwidthMbps">Network (Mbps)</Label>
                  <Input id="networkBandwidthMbps" type="number" value={form.networkBandwidthMbps} onChange={(e) => handleChange('networkBandwidthMbps', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* SaaS/Service capacity info */}
          {selectedCategory === 'services' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Service Capacity</Label>
              <p className="text-sm text-muted-foreground">
                Capacity for SaaS/external services is managed by the provider. Use the Type-Specific Fields to record license limits.
              </p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
