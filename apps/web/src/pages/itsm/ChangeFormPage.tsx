import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2, Server, X, Plus, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import {
  getChange,
  createChange,
  updateChange,
  getAssets,
  type Change,
  type ITSMChangeType,
  type ChangeCategory,
  type ChangePriority,
  type SecurityImpact,
  type Asset,
} from '@/lib/itsm-api';
import { getDepartments, getBusinessProcesses } from '@/lib/organisation-api';

// Impact types for assets
const IMPACT_TYPES = [
  { value: 'DIRECT', label: 'Direct - Will be modified' },
  { value: 'INDIRECT', label: 'Indirect - May be affected' },
  { value: 'DEPENDENCY', label: 'Dependency - Relies on changed component' },
  { value: 'TESTING', label: 'Testing - Used for validation' },
];

interface ImpactedAsset {
  assetId: string;
  assetName: string;
  assetTag: string;
  assetType: string;
  impactType: string;
  notes?: string;
}

interface ImpactedProcess {
  processId: string;
  processName: string;
  notes?: string;
}

const CHANGE_CATEGORIES: { value: ChangeCategory; label: string }[] = [
  { value: 'ACCESS_CONTROL', label: 'Access Control' },
  { value: 'CONFIGURATION', label: 'Configuration' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'APPLICATION', label: 'Application' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'BACKUP_DR', label: 'Backup & DR' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];

export default function ChangeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [processes, setProcesses] = useState<{ id: string; name: string }[]>([]);
  const [impactedAssets, setImpactedAssets] = useState<ImpactedAsset[]>([]);
  const [impactedProcesses, setImpactedProcesses] = useState<ImpactedProcess[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedImpactType, setSelectedImpactType] = useState('DIRECT');
  const [selectedProcessId, setSelectedProcessId] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    changeType: 'NORMAL' as ITSMChangeType,
    category: 'CONFIGURATION' as ChangeCategory,
    priority: 'MEDIUM' as ChangePriority,
    securityImpact: 'LOW' as SecurityImpact,
    departmentId: '',
    businessJustification: '',
    impactAssessment: '',
    userImpact: '',
    riskLevel: 'medium',
    riskAssessment: '',
    backoutPlan: '',
    rollbackTime: '',
    testPlan: '',
    plannedStart: '',
    plannedEnd: '',
    maintenanceWindow: false,
    outageRequired: false,
    estimatedDowntime: '',
    cabRequired: false,
    pirRequired: false,
    successCriteria: '',
  });

  useEffect(() => {
    loadReferenceData();
    if (isEdit) {
      loadChange();
    }
  }, [id]);

  async function loadReferenceData() {
    try {
      const [deptData, assetData, processData] = await Promise.all([
        getDepartments(),
        getAssets({ take: 500 }), // Load all assets for selection
        getBusinessProcesses(),
      ]);
      setDepartments(deptData.results);
      setAssets(assetData.results);
      setProcesses(processData.results);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  }

  function addImpactedAsset() {
    if (!selectedAssetId) return;
    
    // Check if already added
    if (impactedAssets.some(a => a.assetId === selectedAssetId)) {
      toast.error('Asset already added');
      return;
    }
    
    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;
    
    setImpactedAssets(prev => [...prev, {
      assetId: asset.id,
      assetName: asset.name,
      assetTag: asset.assetTag,
      assetType: asset.assetType,
      impactType: selectedImpactType,
    }]);
    
    setSelectedAssetId('');
  }

  function removeImpactedAsset(assetId: string) {
    setImpactedAssets(prev => prev.filter(a => a.assetId !== assetId));
  }

  function addImpactedProcess() {
    if (!selectedProcessId) return;
    
    // Check if already added
    if (impactedProcesses.some(p => p.processId === selectedProcessId)) {
      toast.error('Process already added');
      return;
    }
    
    const process = processes.find(p => p.id === selectedProcessId);
    if (!process) return;
    
    setImpactedProcesses(prev => [...prev, {
      processId: process.id,
      processName: process.name,
    }]);
    
    setSelectedProcessId('');
  }

  function removeImpactedProcess(processId: string) {
    setImpactedProcesses(prev => prev.filter(p => p.processId !== processId));
  }

  async function loadChange() {
    setLoading(true);
    try {
      const change = await getChange(id!) as any;
      setForm({
        title: change.title,
        description: change.description,
        changeType: change.changeType,
        category: change.category,
        priority: change.priority,
        securityImpact: change.securityImpact,
        departmentId: change.departmentId || '',
        businessJustification: change.businessJustification || '',
        impactAssessment: change.impactAssessment || '',
        userImpact: change.userImpact || '',
        riskLevel: change.riskLevel,
        riskAssessment: change.riskAssessment || '',
        backoutPlan: change.backoutPlan || '',
        rollbackTime: change.rollbackTime?.toString() || '',
        testPlan: change.testPlan || '',
        plannedStart: change.plannedStart ? new Date(change.plannedStart).toISOString().slice(0, 16) : '',
        plannedEnd: change.plannedEnd ? new Date(change.plannedEnd).toISOString().slice(0, 16) : '',
        maintenanceWindow: change.maintenanceWindow || false,
        outageRequired: change.outageRequired || false,
        estimatedDowntime: change.estimatedDowntime?.toString() || '',
        cabRequired: change.cabRequired,
        pirRequired: change.pirRequired,
        successCriteria: change.successCriteria || '',
      });
      
      // Load impacted assets from assetLinks
      if (change.assetLinks?.length > 0) {
        setImpactedAssets(change.assetLinks.map((link: any) => ({
          assetId: link.asset.id,
          assetName: link.asset.name,
          assetTag: link.asset.assetTag,
          assetType: link.asset.assetType,
          impactType: link.impactType,
          notes: link.notes,
        })));
      }
      
      // Load impacted processes from affectedServices (those with type: 'process')
      const affectedServices = change.affectedServices || [];
      const processLinks = affectedServices.filter((s: any) => s.type === 'process');
      if (processLinks.length > 0) {
        setImpactedProcesses(processLinks.map((p: any) => ({
          processId: p.processId,
          processName: p.processName,
        })));
      }
    } catch (err) {
      toast.error('Failed to load change');
      navigate('/itsm/changes');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data: any = {
        title: form.title,
        description: form.description,
        changeType: form.changeType,
        category: form.category,
        priority: form.priority,
        securityImpact: form.securityImpact,
        departmentId: form.departmentId || undefined,
        businessJustification: form.businessJustification || undefined,
        impactAssessment: form.impactAssessment || undefined,
        riskLevel: form.riskLevel,
        riskAssessment: form.riskAssessment || undefined,
        backoutPlan: form.backoutPlan || undefined,
        testPlan: form.testPlan || undefined,
        plannedStart: form.plannedStart || undefined,
        plannedEnd: form.plannedEnd || undefined,
        cabRequired: form.cabRequired,
        pirRequired: form.pirRequired,
        // Include impacted assets and processes
        impactedAssets: impactedAssets.map(a => ({
          assetId: a.assetId,
          impactType: a.impactType,
          notes: a.notes,
        })),
        impactedProcesses: impactedProcesses.map(p => ({
          processId: p.processId,
          processName: p.processName,
        })),
      };

      if (isEdit) {
        await updateChange(id!, data);
        toast.success('Change updated');
        navigate(`/itsm/changes/${id}`);
      } else {
        const newChange = await createChange(data);
        toast.success('Change created');
        navigate(`/itsm/changes/${newChange.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save change');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild type="button">
            <Link to={isEdit ? `/itsm/changes/${id}` : '/itsm/changes'}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? 'Edit Change Request' : 'New Change Request'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit ? 'Update change details' : 'Submit a new change request'}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Change
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="impact">
            Impact
            {impactedAssets.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {impactedAssets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="planning">Planning & Risk</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Change Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  placeholder="Brief description of the change"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed description of what will be changed and why..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeType">Change Type *</Label>
                <Select
                  value={form.changeType}
                  onValueChange={(v) => handleChange('changeType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard (Pre-approved)</SelectItem>
                    <SelectItem value="NORMAL">Normal (Requires approval)</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => handleChange('priority', v)}
                >
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
                <Label htmlFor="securityImpact">Security Impact</Label>
                <Select
                  value={form.securityImpact}
                  onValueChange={(v) => handleChange('securityImpact', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
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
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="businessJustification">Business Justification</Label>
                <Textarea
                  id="businessJustification"
                  value={form.businessJustification}
                  onChange={(e) => handleChange('businessJustification', e.target.value)}
                  rows={3}
                  placeholder="Why is this change needed? What business value does it provide?"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact - Assets & Processes */}
        <TabsContent value="impact" className="space-y-4">
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
                  onValueChange={(v) => setSelectedAssetId(v === '__none__' ? '' : v)}
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
                  onValueChange={setSelectedImpactType}
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
                <Button type="button" onClick={addImpactedAsset} disabled={!selectedAssetId}>
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
                          onClick={() => removeImpactedAsset(asset.assetId)}
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
                  onValueChange={(v) => setSelectedProcessId(v === '__none__' ? '' : v)}
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
                <Button type="button" onClick={addImpactedProcess} disabled={!selectedProcessId}>
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
                        onClick={() => removeImpactedProcess(process.processId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planning & Risk */}
        <TabsContent value="planning" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="impactAssessment">Impact Assessment</Label>
                <Textarea
                  id="impactAssessment"
                  value={form.impactAssessment}
                  onChange={(e) => handleChange('impactAssessment', e.target.value)}
                  rows={3}
                  placeholder="What systems, services, or users will be affected?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userImpact">User Impact</Label>
                <Textarea
                  id="userImpact"
                  value={form.userImpact}
                  onChange={(e) => handleChange('userImpact', e.target.value)}
                  rows={2}
                  placeholder="How will end users be affected during the change?"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select
                  value={form.riskLevel}
                  onValueChange={(v) => handleChange('riskLevel', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="riskAssessment">Risk Assessment Details</Label>
                <Textarea
                  id="riskAssessment"
                  value={form.riskAssessment}
                  onChange={(e) => handleChange('riskAssessment', e.target.value)}
                  rows={3}
                  placeholder="What risks are associated with this change? How will they be mitigated?"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPlan">Test Plan</Label>
                <Textarea
                  id="testPlan"
                  value={form.testPlan}
                  onChange={(e) => handleChange('testPlan', e.target.value)}
                  rows={3}
                  placeholder="How will the change be tested before and after implementation?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backoutPlan">Backout Plan</Label>
                <Textarea
                  id="backoutPlan"
                  value={form.backoutPlan}
                  onChange={(e) => handleChange('backoutPlan', e.target.value)}
                  rows={3}
                  placeholder="How will the change be rolled back if it fails?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rollbackTime">Rollback Time (minutes)</Label>
                  <Input
                    id="rollbackTime"
                    type="number"
                    value={form.rollbackTime}
                    onChange={(e) => handleChange('rollbackTime', e.target.value)}
                    placeholder="Estimated time to rollback"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="successCriteria">Success Criteria</Label>
                <Textarea
                  id="successCriteria"
                  value={form.successCriteria}
                  onChange={(e) => handleChange('successCriteria', e.target.value)}
                  rows={2}
                  placeholder="How will success be measured?"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Implementation Schedule</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plannedStart">Planned Start</Label>
                <Input
                  id="plannedStart"
                  type="datetime-local"
                  value={form.plannedStart}
                  onChange={(e) => handleChange('plannedStart', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEnd">Planned End</Label>
                <Input
                  id="plannedEnd"
                  type="datetime-local"
                  value={form.plannedEnd}
                  onChange={(e) => handleChange('plannedEnd', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDowntime">Estimated Downtime (minutes)</Label>
                <Input
                  id="estimatedDowntime"
                  type="number"
                  value={form.estimatedDowntime}
                  onChange={(e) => handleChange('estimatedDowntime', e.target.value)}
                  placeholder="0 if no downtime expected"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Scheduling Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceWindow">Maintenance Window</Label>
                  <p className="text-sm text-muted-foreground">
                    Will this change be implemented during a scheduled maintenance window?
                  </p>
                </div>
                <Switch
                  id="maintenanceWindow"
                  checked={form.maintenanceWindow}
                  onCheckedChange={(v) => handleChange('maintenanceWindow', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="outageRequired">Outage Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Will this change require a service outage?
                  </p>
                </div>
                <Switch
                  id="outageRequired"
                  checked={form.outageRequired}
                  onCheckedChange={(v) => handleChange('outageRequired', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval */}
        <TabsContent value="approval" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Approval Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cabRequired">CAB Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Does this change require Change Advisory Board approval?
                  </p>
                </div>
                <Switch
                  id="cabRequired"
                  checked={form.cabRequired}
                  onCheckedChange={(v) => handleChange('cabRequired', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pirRequired">PIR Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Is a Post-Implementation Review required?
                  </p>
                </div>
                <Switch
                  id="pirRequired"
                  checked={form.pirRequired}
                  onCheckedChange={(v) => handleChange('pirRequired', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
