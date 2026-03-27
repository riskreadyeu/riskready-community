import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Loader2, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCapacityPlan,
  getAssets,
  type Asset,
  type CapacityPlan,
} from '@/lib/itsm-api';

export default function CapacityPlanCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assetId: '',
    assetGroup: '',
    currentCapacity: '',
    currentUtilizationPercent: '',
    projectedGrowthPercent: '',
    projectionPeriodMonths: '',
    projectedExhaustionDate: '',
    recommendedAction: '',
    recommendedDate: '',
    estimatedCost: '',
    costCurrency: 'USD',
  });

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      const data = await getAssets({ take: 200, status: 'ACTIVE' });
      setAssets(data.results);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  }

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title || !form.currentCapacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data: Partial<CapacityPlan> = {
        title: form.title,
        currentCapacity: form.currentCapacity,
      };

      if (form.description) data.description = form.description;
      if (form.assetId) data.assetId = form.assetId;
      if (form.assetGroup) data.assetGroup = form.assetGroup;
      if (form.currentUtilizationPercent) data.currentUtilizationPercent = parseInt(form.currentUtilizationPercent, 10);
      if (form.projectedGrowthPercent) data.projectedGrowthPercent = parseFloat(form.projectedGrowthPercent);
      if (form.projectionPeriodMonths) data.projectionPeriodMonths = parseInt(form.projectionPeriodMonths, 10);
      if (form.projectedExhaustionDate) data.projectedExhaustionDate = form.projectedExhaustionDate;
      if (form.recommendedAction) data.recommendedAction = form.recommendedAction;
      if (form.recommendedDate) data.recommendedDate = form.recommendedDate;
      if (form.estimatedCost) data.estimatedCost = parseFloat(form.estimatedCost);
      if (form.costCurrency) data.costCurrency = form.costCurrency;

      const created = await createCapacityPlan(data);
      toast.success('Capacity plan created');
      navigate(`/itsm/capacity-plans/${created.id}`);
    } catch (err) {
      console.error('Failed to create capacity plan:', err);
      toast.error('Failed to create capacity plan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => navigate('/itsm/capacity-plans')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Capacity Plans
          </Button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart className="h-6 w-6 text-primary" />
          New Capacity Plan
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Plan Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder="e.g. Database Server Expansion Q2 2026"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe the capacity planning objective..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Linked Asset</Label>
                <Select value={form.assetId} onValueChange={v => updateField('assetId', v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific asset</SelectItem>
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.assetTag} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetGroup">Asset Group</Label>
                <Input
                  id="assetGroup"
                  value={form.assetGroup}
                  onChange={e => updateField('assetGroup', e.target.value)}
                  placeholder="e.g. Production Database Cluster"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current State */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Current Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentCapacity">Current Capacity Description *</Label>
                <Textarea
                  id="currentCapacity"
                  value={form.currentCapacity}
                  onChange={e => updateField('currentCapacity', e.target.value)}
                  placeholder="e.g. 16 vCPU, 64GB RAM, 2TB SSD storage"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentUtilizationPercent">Current Utilization %</Label>
                <Input
                  id="currentUtilizationPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={form.currentUtilizationPercent}
                  onChange={e => updateField('currentUtilizationPercent', e.target.value)}
                  placeholder="e.g. 72"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projections */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Growth Projections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectedGrowthPercent">Projected Growth %</Label>
                <Input
                  id="projectedGrowthPercent"
                  type="number"
                  step="0.01"
                  value={form.projectedGrowthPercent}
                  onChange={e => updateField('projectedGrowthPercent', e.target.value)}
                  placeholder="e.g. 15.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectionPeriodMonths">Projection Period (months)</Label>
                <Input
                  id="projectionPeriodMonths"
                  type="number"
                  min="1"
                  value={form.projectionPeriodMonths}
                  onChange={e => updateField('projectionPeriodMonths', e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectedExhaustionDate">Projected Exhaustion Date</Label>
                <Input
                  id="projectedExhaustionDate"
                  type="date"
                  value={form.projectedExhaustionDate}
                  onChange={e => updateField('projectedExhaustionDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommendedAction">Recommended Action</Label>
              <Textarea
                id="recommendedAction"
                value={form.recommendedAction}
                onChange={e => updateField('recommendedAction', e.target.value)}
                placeholder="e.g. Upgrade to 32 vCPU and 128GB RAM by Q3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recommendedDate">Target Date</Label>
                <Input
                  id="recommendedDate"
                  type="date"
                  value={form.recommendedDate}
                  onChange={e => updateField('recommendedDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimatedCost}
                  onChange={e => updateField('estimatedCost', e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.costCurrency} onValueChange={v => updateField('costCurrency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Create Capacity Plan
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/itsm/capacity-plans')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
