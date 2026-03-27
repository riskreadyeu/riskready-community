import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Cpu } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';
import { ASSET_CATEGORIES, type TypeFieldGroup } from './asset-form-constants';

interface AssetTechnicalSectionProps {
  form: AssetFormState;
  selectedCategory: string;
  typeFields: TypeFieldGroup[];
  handleChange: (field: string, value: string | boolean) => void;
  handleTypeAttrChange: (key: string, value: string | boolean | number) => void;
}

export function AssetTechnicalSection({
  form,
  selectedCategory,
  typeFields,
  handleChange,
  handleTypeAttrChange,
}: AssetTechnicalSectionProps) {
  return (
    <AccordionItem value="technical" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Cpu className="h-5 w-5 text-orange-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Technical Details</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
              {typeFields.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {ASSET_CATEGORIES.find(c => c.types.some(t => t.value === form.assetType))?.types.find(t => t.value === form.assetType)?.label} Fields
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              {selectedCategory === 'hardware' ? 'Network, hardware specs, and manufacturer details' :
               selectedCategory === 'cloud' ? 'Cloud instance and resource configuration' :
               selectedCategory === 'software' ? 'Software version and patch information' :
               selectedCategory === 'services' ? 'Service endpoint and authentication details' :
               'Technical configuration'}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Network - Only for Hardware and Cloud VMs */}
          {(selectedCategory === 'hardware' || form.assetType === 'CLOUD_VM') && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fqdn">FQDN / Hostname</Label>
                <Input id="fqdn" value={form.fqdn} onChange={(e) => handleChange('fqdn', e.target.value)} placeholder="server.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAddresses">IP Addresses</Label>
                <Input id="ipAddresses" value={form.ipAddresses} onChange={(e) => handleChange('ipAddresses', e.target.value)} placeholder="Comma-separated" />
              </div>
            </div>
          )}

          {/* Hardware Details - Only for Hardware */}
          {selectedCategory === 'hardware' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Hardware Details</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input id="manufacturer" value={form.manufacturer} onChange={(e) => handleChange('manufacturer', e.target.value)} placeholder="e.g., Dell, HP, Cisco" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={form.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="e.g., PowerEdge R640" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" value={form.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} />
                </div>
              </div>
              {/* OS only for servers/workstations/laptops */}
              {['SERVER', 'WORKSTATION', 'LAPTOP'].includes(form.assetType) && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="operatingSystem">Operating System</Label>
                    <Input id="operatingSystem" value={form.operatingSystem} onChange={(e) => handleChange('operatingSystem', e.target.value)} placeholder="e.g., Ubuntu, Windows Server" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osVersion">OS Version</Label>
                    <Input id="osVersion" value={form.osVersion} onChange={(e) => handleChange('osVersion', e.target.value)} placeholder="e.g., 22.04 LTS" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Software Details - Only for Software category */}
          {selectedCategory === 'software' && (
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="text-sm font-medium">Software Details</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input id="version" value={form.version} onChange={(e) => handleChange('version', e.target.value)} placeholder="e.g., 15.4, 2.1.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patchLevel">Patch Level</Label>
                  <Input id="patchLevel" value={form.patchLevel} onChange={(e) => handleChange('patchLevel', e.target.value)} placeholder="e.g., SP1, Patch 5" />
                </div>
              </div>
            </div>
          )}

          {/* Cloud Details - For Cloud VMs */}
          {selectedCategory === 'cloud' && form.assetType === 'CLOUD_VM' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="operatingSystem">Operating System</Label>
                <Input id="operatingSystem" value={form.operatingSystem} onChange={(e) => handleChange('operatingSystem', e.target.value)} placeholder="e.g., Amazon Linux 2, Ubuntu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="osVersion">OS Version</Label>
                <Input id="osVersion" value={form.osVersion} onChange={(e) => handleChange('osVersion', e.target.value)} placeholder="e.g., 22.04 LTS" />
              </div>
            </div>
          )}

          {/* Type-Specific Fields */}
          {typeFields.length > 0 && (
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge>{ASSET_CATEGORIES.find(c => c.types.some(t => t.value === form.assetType))?.types.find(t => t.value === form.assetType)?.label}</Badge>
                <span className="text-sm font-medium">Specific Configuration</span>
              </div>
              {typeFields.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  <Label className="text-sm text-muted-foreground">{group.title}</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label htmlFor={field.key} className="text-xs">{field.label}</Label>
                        {field.type === 'text' && (
                          <Input
                            id={field.key}
                            value={form.typeAttributes[field.key] || ''}
                            onChange={(e) => handleTypeAttrChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-8"
                          />
                        )}
                        {field.type === 'number' && (
                          <Input
                            id={field.key}
                            type="number"
                            value={form.typeAttributes[field.key] || ''}
                            onChange={(e) => handleTypeAttrChange(field.key, e.target.value ? Number(e.target.value) : '')}
                            placeholder={field.placeholder}
                            className="h-8"
                          />
                        )}
                        {field.type === 'boolean' && (
                          <div className="flex items-center h-8">
                            <Switch
                              id={field.key}
                              checked={form.typeAttributes[field.key] || false}
                              onCheckedChange={(v) => handleTypeAttrChange(field.key, v)}
                            />
                          </div>
                        )}
                        {field.type === 'select' && field.options && (
                          <Select
                            value={form.typeAttributes[field.key] || '__none__'}
                            onValueChange={(v) => handleTypeAttrChange(field.key, v === '__none__' ? '' : v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Select...</SelectItem>
                              {field.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
