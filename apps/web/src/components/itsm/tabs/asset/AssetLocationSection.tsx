import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Globe } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';
import { CLOUD_PROVIDERS } from './asset-form-constants';

interface AssetLocationSectionProps {
  form: AssetFormState;
  selectedCategory: string;
  locations: { id: string; name: string }[];
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetLocationSection({
  form,
  selectedCategory,
  locations,
  handleChange,
}: AssetLocationSectionProps) {
  return (
    <AccordionItem value="location" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Globe className="h-5 w-5 text-cyan-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Location & Environment</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              {selectedCategory === 'cloud' ? 'Cloud provider and region details' : 'Physical location and datacenter details'}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Physical Location - Only for Hardware */}
          {selectedCategory === 'hardware' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Physical Location</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select
                    value={form.locationId || '__none__'}
                    onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datacenter">Datacenter</Label>
                  <Input id="datacenter" value={form.datacenter} onChange={(e) => handleChange('datacenter', e.target.value)} placeholder="e.g., DC-EAST-01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rack">Rack</Label>
                  <Input id="rack" value={form.rack} onChange={(e) => handleChange('rack', e.target.value)} placeholder="e.g., R-15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rackPosition">Rack Position (U)</Label>
                  <Input id="rackPosition" type="number" value={form.rackPosition} onChange={(e) => handleChange('rackPosition', e.target.value)} placeholder="e.g., 10" />
                </div>
              </div>
            </div>
          )}

          {/* Cloud Configuration - Only for Cloud assets */}
          {selectedCategory === 'cloud' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Cloud Configuration</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cloudProvider">Cloud Provider</Label>
                  <Select
                    value={form.cloudProvider || '__none__'}
                    onValueChange={(v) => handleChange('cloudProvider', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {CLOUD_PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudRegion">Cloud Region</Label>
                  <Input id="cloudRegion" value={form.cloudRegion} onChange={(e) => handleChange('cloudRegion', e.target.value)} placeholder="e.g., us-east-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudAccountId">Account ID</Label>
                  <Input id="cloudAccountId" value={form.cloudAccountId} onChange={(e) => handleChange('cloudAccountId', e.target.value)} placeholder="e.g., 123456789012" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudResourceId">Resource ID</Label>
                  <Input id="cloudResourceId" value={form.cloudResourceId} onChange={(e) => handleChange('cloudResourceId', e.target.value)} placeholder="ARN or Resource ID" />
                </div>
              </div>
            </div>
          )}

          {/* Deployment Location - For Software */}
          {selectedCategory === 'software' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Deployment</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Primary Location</Label>
                  <Select
                    value={form.locationId || '__none__'}
                    onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datacenter">Deployment Environment</Label>
                  <Input id="datacenter" value={form.datacenter} onChange={(e) => handleChange('datacenter', e.target.value)} placeholder="e.g., Production, Staging" />
                </div>
              </div>
            </div>
          )}

          {/* Service Location - For SaaS/Services */}
          {selectedCategory === 'services' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Service Provider</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cloudProvider">Provider</Label>
                  <Select
                    value={form.cloudProvider || '__none__'}
                    onValueChange={(v) => handleChange('cloudProvider', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None / Self-hosted</SelectItem>
                      {CLOUD_PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloudRegion">Region / Data Residency</Label>
                  <Input id="cloudRegion" value={form.cloudRegion} onChange={(e) => handleChange('cloudRegion', e.target.value)} placeholder="e.g., EU, US, APAC" />
                </div>
              </div>
            </div>
          )}

          {/* Fallback for Other */}
          {selectedCategory === 'other' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select
                    value={form.locationId || '__none__'}
                    onValueChange={(v) => handleChange('locationId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
