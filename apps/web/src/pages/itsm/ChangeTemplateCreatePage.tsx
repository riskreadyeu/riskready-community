import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  createChangeTemplate,
  generateTemplateCode,
  type ChangeCategory,
  type ChangeTemplate,
  type SecurityImpact,
} from '@/lib/itsm-api';

const CATEGORIES: { value: ChangeCategory; label: string }[] = [
  { value: 'ACCESS_CONTROL', label: 'Access Control' },
  { value: 'CONFIGURATION', label: 'Configuration' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'APPLICATION', label: 'Application' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'BACKUP_DR', label: 'Backup/DR' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];

const SECURITY_IMPACTS: { value: SecurityImpact; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'NONE', label: 'None' },
];

const RISK_LEVELS = ['critical', 'high', 'medium', 'low'];

export default function ChangeTemplateCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '' as ChangeCategory | '',
    securityImpact: 'LOW' as SecurityImpact,
    riskLevel: 'medium',
    instructions: '',
    backoutPlan: '',
    testPlan: '',
    autoApprove: true,
    maxDuration: '',
  });

  function updateField(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.description || !form.category || !form.instructions || !form.backoutPlan) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Auto-generate template code
      const { templateCode } = await generateTemplateCode(form.category);

      const data: Partial<ChangeTemplate> = {
        templateCode,
        name: form.name,
        description: form.description,
        category: form.category as ChangeCategory,
        securityImpact: form.securityImpact,
        riskLevel: form.riskLevel,
        instructions: form.instructions,
        backoutPlan: form.backoutPlan,
        autoApprove: form.autoApprove,
      };

      if (form.testPlan) data.testPlan = form.testPlan;
      if (form.maxDuration) data.maxDuration = parseInt(form.maxDuration, 10);

      const created = await createChangeTemplate(data);
      toast.success('Change template created');
      navigate(`/itsm/change-templates/${created.id}`);
    } catch (err) {
      console.error('Failed to create change template:', err);
      toast.error('Failed to create change template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => navigate('/itsm/change-templates')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Change Templates
          </Button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          New Change Template
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="e.g. Standard Firewall Rule Change"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe when this template should be used..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => updateField('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Security Impact</Label>
                <Select value={form.securityImpact} onValueChange={v => updateField('securityImpact', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_IMPACTS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select value={form.riskLevel} onValueChange={v => updateField('riskLevel', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(r => (
                      <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Duration (minutes)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  min="1"
                  value={form.maxDuration}
                  onChange={e => updateField('maxDuration', e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <Switch
                  id="autoApprove"
                  checked={form.autoApprove}
                  onCheckedChange={v => updateField('autoApprove', v)}
                />
                <Label htmlFor="autoApprove">Auto-approve changes created from this template</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions & Plans */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Instructions & Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Implementation Instructions *</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={e => updateField('instructions', e.target.value)}
                placeholder="Step-by-step implementation instructions..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backoutPlan">Backout Plan *</Label>
              <Textarea
                id="backoutPlan"
                value={form.backoutPlan}
                onChange={e => updateField('backoutPlan', e.target.value)}
                placeholder="Steps to reverse the change if issues arise..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testPlan">Test Plan</Label>
              <Textarea
                id="testPlan"
                value={form.testPlan}
                onChange={e => updateField('testPlan', e.target.value)}
                placeholder="How to verify the change was successful..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Create Template
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/itsm/change-templates')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
