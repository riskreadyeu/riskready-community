import { Badge } from '@/components/ui/badge';
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
import { Shield, Check } from 'lucide-react';
import type { AssetFormState } from './useAssetForm';

interface AssetOwnershipSectionProps {
  form: AssetFormState;
  users: { id: string; email: string; firstName?: string; lastName?: string }[];
  departments: { id: string; name: string }[];
  sectionCompletion: Record<string, { complete: boolean; filled: number; total: number }>;
  handleChange: (field: string, value: string | boolean) => void;
}

export function AssetOwnershipSection({
  form,
  users,
  departments,
  sectionCompletion,
  handleChange,
}: AssetOwnershipSectionProps) {
  return (
    <AccordionItem value="ownership" className="glass-card rounded-lg border px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1">
          <Shield className="h-5 w-5 text-purple-500" />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Ownership & Classification</span>
              <Badge variant={sectionCompletion['ownership']?.complete ? 'default' : 'secondary'} className="text-xs">
                {sectionCompletion['ownership']?.complete ? (
                  <><Check className="h-3 w-3 mr-1" /> Complete</>
                ) : (
                  'Required'
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-normal">Who owns this asset and how critical is it</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Ownership */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ownerId">Asset Owner</Label>
              <Select
                value={form.ownerId || '__none__'}
                onValueChange={(v) => handleChange('ownerId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                value={form.departmentId || '__none__'}
                onValueChange={(v) => handleChange('departmentId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custodianId">Custodian</Label>
              <Select
                value={form.custodianId || '__none__'}
                onValueChange={(v) => handleChange('custodianId', v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select custodian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Classification */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessCriticality">Business Criticality *</Label>
              <Select value={form.businessCriticality} onValueChange={(v) => handleChange('businessCriticality', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataClassification">Data Classification *</Label>
              <Select value={form.dataClassification} onValueChange={(v) => handleChange('dataClassification', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTRICTED">Restricted</SelectItem>
                  <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Handling Flags */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="text-sm font-medium">Data Handling</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="handlesPersonalData" className="font-normal">Personal Data (PII)</Label>
                <Switch id="handlesPersonalData" checked={form.handlesPersonalData} onCheckedChange={(v) => handleChange('handlesPersonalData', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="handlesFinancialData" className="font-normal">Financial Data</Label>
                <Switch id="handlesFinancialData" checked={form.handlesFinancialData} onCheckedChange={(v) => handleChange('handlesFinancialData', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="handlesHealthData" className="font-normal">Health Data (PHI)</Label>
                <Switch id="handlesHealthData" checked={form.handlesHealthData} onCheckedChange={(v) => handleChange('handlesHealthData', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="handlesConfidentialData" className="font-normal">Confidential Data</Label>
                <Switch id="handlesConfidentialData" checked={form.handlesConfidentialData} onCheckedChange={(v) => handleChange('handlesConfidentialData', v)} />
              </div>
            </div>
          </div>

          {/* Compliance Scope */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="text-sm font-medium">Compliance Scope</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch id="inIsmsScope" checked={form.inIsmsScope} onCheckedChange={(v) => handleChange('inIsmsScope', v)} />
                <Label htmlFor="inIsmsScope" className="font-normal">ISMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inGdprScope" checked={form.inGdprScope} onCheckedChange={(v) => handleChange('inGdprScope', v)} />
                <Label htmlFor="inGdprScope" className="font-normal">GDPR</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inNis2Scope" checked={form.inNis2Scope} onCheckedChange={(v) => handleChange('inNis2Scope', v)} />
                <Label htmlFor="inNis2Scope" className="font-normal">NIS2</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inDoraScope" checked={form.inDoraScope} onCheckedChange={(v) => handleChange('inDoraScope', v)} />
                <Label htmlFor="inDoraScope" className="font-normal">DORA</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inPciScope" checked={form.inPciScope} onCheckedChange={(v) => handleChange('inPciScope', v)} />
                <Label htmlFor="inPciScope" className="font-normal">PCI-DSS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inSoc2Scope" checked={form.inSoc2Scope} onCheckedChange={(v) => handleChange('inSoc2Scope', v)} />
                <Label htmlFor="inSoc2Scope" className="font-normal">SOC 2</Label>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
