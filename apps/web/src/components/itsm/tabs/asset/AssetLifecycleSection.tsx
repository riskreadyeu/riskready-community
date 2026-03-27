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
import { HardDrive } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';

interface AssetLifecycleSectionProps {
  form: AssetFormState;
  selectedCategory: string;
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetLifecycleSection({
  form,
  selectedCategory,
  handleChange,
}: AssetLifecycleSectionProps) {
  return (
    <AccordionItem value="lifecycle" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <HardDrive className="h-5 w-5 text-amber-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Lifecycle & Financial</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              {selectedCategory === 'services' ? 'Contract dates and subscription costs' :
               selectedCategory === 'software' ? 'License dates and maintenance costs' :
               'Purchase dates, warranty, and costs'}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Dates */}
          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-medium">Key Dates</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">
                  {selectedCategory === 'services' ? 'Contract Start' : selectedCategory === 'software' ? 'License Start' : 'Purchase Date'}
                </Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deploymentDate">
                  {selectedCategory === 'services' ? 'Go-Live Date' : 'Deployment Date'}
                </Label>
                <Input id="deploymentDate" type="date" value={form.deploymentDate} onChange={(e) => handleChange('deploymentDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endOfLife">
                  {selectedCategory === 'services' ? 'Contract End' : selectedCategory === 'software' ? 'License Expiry' : 'End of Life'}
                </Label>
                <Input id="endOfLife" type="date" value={form.endOfLife} onChange={(e) => handleChange('endOfLife', e.target.value)} />
              </div>
            </div>
            {selectedCategory === 'hardware' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input id="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={(e) => handleChange('warrantyExpiry', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endOfSupport">End of Support</Label>
                  <Input id="endOfSupport" type="date" value={form.endOfSupport} onChange={(e) => handleChange('endOfSupport', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Costs */}
          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-medium">Costs</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseCost">
                  {selectedCategory === 'services' || selectedCategory === 'cloud'
                    ? 'Monthly Cost'
                    : selectedCategory === 'software'
                      ? 'License Cost'
                      : 'Purchase Cost'}
                </Label>
                <div className="flex gap-2">
                  <Input id="purchaseCost" type="number" step="0.01" value={form.purchaseCost} onChange={(e) => handleChange('purchaseCost', e.target.value)} placeholder="0.00" className="flex-1" />
                  <Select value={form.costCurrency} onValueChange={(v) => handleChange('costCurrency', v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualCost">
                  {selectedCategory === 'services' ? 'Annual Subscription' : 'Annual Cost'}
                </Label>
                <Input id="annualCost" type="number" step="0.01" value={form.annualCost} onChange={(e) => handleChange('annualCost', e.target.value)} placeholder="Recurring annual cost" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter">Cost Center</Label>
              <Input id="costCenter" value={form.costCenter} onChange={(e) => handleChange('costCenter', e.target.value)} placeholder="e.g., IT-INFRA-001" />
            </div>
          </div>

          {/* Support Contract */}
          {(selectedCategory === 'hardware' || selectedCategory === 'software') && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Support Contract</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="supportContract">Contract ID</Label>
                  <Input id="supportContract" value={form.supportContract} onChange={(e) => handleChange('supportContract', e.target.value)} placeholder="e.g., SUP-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportExpiry">Support Expiry</Label>
                  <Input id="supportExpiry" type="date" value={form.supportExpiry} onChange={(e) => handleChange('supportExpiry', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportTier">Support Tier</Label>
                  <Select value={form.supportTier || '__none__'} onValueChange={(v) => handleChange('supportTier', v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="24x7">24x7</SelectItem>
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
