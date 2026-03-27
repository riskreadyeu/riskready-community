import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getChange,
  createChange,
  updateChange,
  getAssets,
  type Asset,
} from '@/lib/itsm-api';
import { getDepartments, getBusinessProcesses } from '@/lib/organisation-api';
import {
  BasicInfoTab,
  ImpactTab,
  PlanningRiskTab,
  ScheduleTab,
  ApprovalTab,
  type ChangeFormState,
  type ImpactedAsset,
  type ImpactedProcess,
} from '@/components/itsm/form-sections/change';

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

  const [form, setForm] = useState<ChangeFormState>({
    title: '',
    description: '',
    changeType: 'NORMAL',
    category: 'CONFIGURATION',
    priority: 'MEDIUM',
    securityImpact: 'LOW',
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
        getAssets({ take: 500 }),
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
      const change = await getChange(id!);
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
      if (change.assetLinks && change.assetLinks.length > 0) {
        setImpactedAssets(change.assetLinks.map((link) => ({
          assetId: link.asset.id,
          assetName: link.asset.name,
          assetTag: link.asset.assetTag,
          assetType: link.asset.assetType,
          impactType: link.impactType,
          notes: link.notes,
        })));
      }

      // Load impacted processes from affectedServices
      const affectedServices = (change.affectedServices || []) as unknown as Array<{ type?: string; processId?: string; processName?: string }>;
      const processLinks = affectedServices.filter((s) => s.type === 'process');
      if (processLinks.length > 0) {
        setImpactedProcesses(processLinks.map((p) => ({
          processId: p.processId || '',
          processName: p.processName || '',
        })));
      }
    } catch (err) {
      toast.error('Failed to load change');
      navigate('/itsm/changes');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save change');
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

        <TabsContent value="basic" className="space-y-4">
          <BasicInfoTab form={form} departments={departments} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <ImpactTab
            assets={assets}
            processes={processes}
            impactedAssets={impactedAssets}
            impactedProcesses={impactedProcesses}
            selectedAssetId={selectedAssetId}
            selectedImpactType={selectedImpactType}
            selectedProcessId={selectedProcessId}
            onSelectedAssetIdChange={setSelectedAssetId}
            onSelectedImpactTypeChange={setSelectedImpactType}
            onSelectedProcessIdChange={setSelectedProcessId}
            onAddAsset={addImpactedAsset}
            onRemoveAsset={removeImpactedAsset}
            onAddProcess={addImpactedProcess}
            onRemoveProcess={removeImpactedProcess}
          />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <PlanningRiskTab form={form} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab form={form} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          <ApprovalTab form={form} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </form>
  );
}
