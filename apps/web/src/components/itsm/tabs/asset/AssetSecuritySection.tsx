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
import { Shield } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';

interface AssetSecuritySectionProps {
  form: AssetFormState;
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetSecuritySection({
  form,
  handleChange,
}: AssetSecuritySectionProps) {
  return (
    <AccordionItem value="security" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Shield className="h-5 w-5 text-red-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Security & Backup</span>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">Encryption, backup, and monitoring settings</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="encryptionAtRest" className="font-normal">Encryption at Rest</Label>
              <Switch id="encryptionAtRest" checked={form.encryptionAtRest} onCheckedChange={(v) => handleChange('encryptionAtRest', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="encryptionInTransit" className="font-normal">Encryption in Transit</Label>
              <Switch id="encryptionInTransit" checked={form.encryptionInTransit} onCheckedChange={(v) => handleChange('encryptionInTransit', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="backupEnabled" className="font-normal">Backup Enabled</Label>
              <Switch id="backupEnabled" checked={form.backupEnabled} onCheckedChange={(v) => handleChange('backupEnabled', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="monitoringEnabled" className="font-normal">Monitoring</Label>
              <Switch id="monitoringEnabled" checked={form.monitoringEnabled} onCheckedChange={(v) => handleChange('monitoringEnabled', v)} />
            </div>
          </div>

          {form.backupEnabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select value={form.backupFrequency || '__none__'} onValueChange={(v) => handleChange('backupFrequency', v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not set</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupRetention">Backup Retention</Label>
                <Input id="backupRetention" value={form.backupRetention} onChange={(e) => handleChange('backupRetention', e.target.value)} placeholder="e.g., 30 days" />
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
