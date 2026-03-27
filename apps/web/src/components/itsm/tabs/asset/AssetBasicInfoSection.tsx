import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Server, Check } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';

interface AssetBasicInfoSectionProps {
  form: AssetFormState;
  isEdit: boolean;
  sectionCompletion: Record<string, { complete: boolean; filled: number; total: number }>;
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetBasicInfoSection({
  form,
  isEdit,
  sectionCompletion,
  handleChange,
}: AssetBasicInfoSectionProps) {
  return (
    <AccordionItem value="identification" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Server className="h-5 w-5 text-blue-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Identification</span>
              <Badge variant={sectionCompletion['identification']?.complete ? 'default' : 'secondary'} className="text-xs">
                {sectionCompletion['identification']?.complete ? (
                  <><Check className="h-3 w-3 mr-1" /> Complete</>
                ) : (
                  'Required'
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">Basic asset information and naming</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label htmlFor="assetTag">Asset Tag *</Label>
            <Input
              id="assetTag"
              value={form.assetTag}
              onChange={(e) => handleChange('assetTag', e.target.value)}
              required
              disabled={isEdit}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Auto-generated based on asset type</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="STAGING">Staging</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RETIRING">Retiring</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="e.g., Production Database Server, HR SaaS Platform"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              placeholder="Describe the purpose and function of this asset..."
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
