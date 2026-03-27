import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAsset,
  createAsset,
  updateAsset,
  generateAssetTag,
  type Asset,
  type AssetType,
  type AssetStatus,
  type BusinessCriticality,
  type DataClassification,
  type CloudProvider,
} from '@/lib/itsm-api';
import { getDepartments, getLocations } from '@/lib/organisation-api';
import { getUsers } from '@/lib/audits-api';
import {
  ASSET_CATEGORIES,
  FORM_SECTIONS,
  TYPE_SPECIFIC_FIELDS,
  TYPE_FIELD_MAP,
} from './asset-form-constants';

export interface AssetFormState {
  // Identification
  assetTag: string;
  name: string;
  displayName: string;
  description: string;
  assetType: AssetType;
  assetSubtype: string;
  status: AssetStatus;

  // Classification
  businessCriticality: BusinessCriticality;
  dataClassification: DataClassification;
  handlesPersonalData: boolean;
  handlesFinancialData: boolean;
  handlesHealthData: boolean;
  handlesConfidentialData: boolean;

  // Compliance
  inIsmsScope: boolean;
  inPciScope: boolean;
  inDoraScope: boolean;
  inGdprScope: boolean;
  inNis2Scope: boolean;
  inSoc2Scope: boolean;
  scopeNotes: string;

  // Ownership
  ownerId: string;
  custodianId: string;
  departmentId: string;

  // Location
  locationId: string;
  cloudProvider: CloudProvider | '';
  cloudRegion: string;
  cloudAccountId: string;
  cloudResourceId: string;
  datacenter: string;
  rack: string;
  rackPosition: string;

  // Lifecycle
  purchaseDate: string;
  deploymentDate: string;
  warrantyExpiry: string;
  endOfLife: string;
  endOfSupport: string;
  lifecycleNotes: string;

  // Technical
  fqdn: string;
  ipAddresses: string;
  macAddresses: string;
  operatingSystem: string;
  osVersion: string;
  version: string;
  patchLevel: string;
  manufacturer: string;
  model: string;
  serialNumber: string;

  // Vendor & Support
  supportContract: string;
  supportExpiry: string;
  supportTier: string;

  // Financial
  purchaseCost: string;
  costCurrency: string;
  annualCost: string;
  costCenter: string;

  // Security
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  encryptionMethod: string;
  backupEnabled: boolean;
  backupFrequency: string;
  backupRetention: string;
  monitoringEnabled: boolean;
  loggingEnabled: boolean;

  // Capacity
  cpuCapacity: string;
  memoryCapacityGB: string;
  storageCapacityGB: string;
  networkBandwidthMbps: string;
  cpuThresholdPercent: string;
  memoryThresholdPercent: string;
  storageThresholdPercent: string;

  // Resilience
  rtoMinutes: string;
  rpoMinutes: string;
  mtpdMinutes: string;
  targetAvailability: string;
  hasRedundancy: boolean;
  redundancyType: string;

  // Type-specific
  typeAttributes: Record<string, any>;
}

const INITIAL_FORM_STATE: AssetFormState = {
  assetTag: '',
  name: '',
  displayName: '',
  description: '',
  assetType: 'SERVER' as AssetType,
  assetSubtype: '',
  status: 'ACTIVE' as AssetStatus,
  businessCriticality: 'MEDIUM' as BusinessCriticality,
  dataClassification: 'INTERNAL' as DataClassification,
  handlesPersonalData: false,
  handlesFinancialData: false,
  handlesHealthData: false,
  handlesConfidentialData: false,
  inIsmsScope: true,
  inPciScope: false,
  inDoraScope: false,
  inGdprScope: false,
  inNis2Scope: false,
  inSoc2Scope: false,
  scopeNotes: '',
  ownerId: '',
  custodianId: '',
  departmentId: '',
  locationId: '',
  cloudProvider: '' as CloudProvider | '',
  cloudRegion: '',
  cloudAccountId: '',
  cloudResourceId: '',
  datacenter: '',
  rack: '',
  rackPosition: '',
  purchaseDate: '',
  deploymentDate: '',
  warrantyExpiry: '',
  endOfLife: '',
  endOfSupport: '',
  lifecycleNotes: '',
  fqdn: '',
  ipAddresses: '',
  macAddresses: '',
  operatingSystem: '',
  osVersion: '',
  version: '',
  patchLevel: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  supportContract: '',
  supportExpiry: '',
  supportTier: '',
  purchaseCost: '',
  costCurrency: 'USD',
  annualCost: '',
  costCenter: '',
  encryptionAtRest: false,
  encryptionInTransit: false,
  encryptionMethod: '',
  backupEnabled: false,
  backupFrequency: '',
  backupRetention: '',
  monitoringEnabled: false,
  loggingEnabled: false,
  cpuCapacity: '',
  memoryCapacityGB: '',
  storageCapacityGB: '',
  networkBandwidthMbps: '',
  cpuThresholdPercent: '80',
  memoryThresholdPercent: '80',
  storageThresholdPercent: '80',
  rtoMinutes: '',
  rpoMinutes: '',
  mtpdMinutes: '',
  targetAvailability: '',
  hasRedundancy: false,
  redundancyType: '',
  typeAttributes: {},
};

export function useAssetForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string; firstName?: string; lastName?: string }[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(['identification']);
  const [selectedCategory, setSelectedCategory] = useState<string>('hardware');
  const [form, setForm] = useState<AssetFormState>(INITIAL_FORM_STATE);

  const sectionCompletion = useMemo(() => {
    const completion: Record<string, { complete: boolean; filled: number; total: number }> = {};

    FORM_SECTIONS.forEach(section => {
      if (section.fields.length === 0) {
        completion[section.id] = { complete: true, filled: 0, total: 0 };
      } else {
        const filled = section.fields.filter(f => {
          const value = form[f as keyof typeof form];
          return value !== '' && value !== null && value !== undefined;
        }).length;
        completion[section.id] = {
          complete: filled === section.fields.length,
          filled,
          total: section.fields.length,
        };
      }
    });

    return completion;
  }, [form]);

  const overallProgress = useMemo(() => {
    const requiredSections = FORM_SECTIONS.filter(s => s.required);
    const completed = requiredSections.filter(s => sectionCompletion[s.id]?.complete).length;
    return Math.round((completed / requiredSections.length) * 100);
  }, [sectionCompletion]);

  useEffect(() => {
    loadReferenceData();
    if (isEdit) {
      loadAsset();
    } else {
      generateTag('SERVER');
    }
  }, [id]);

  async function loadReferenceData() {
    try {
      const [deptData, locData, userData] = await Promise.all([
        getDepartments(),
        getLocations(),
        getUsers(),
      ]);
      setDepartments(deptData.results);
      setLocations(locData.results);
      setUsers(userData || []);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  }

  async function loadAsset() {
    setLoading(true);
    try {
      const asset = await getAsset(id!);
      setForm({
        assetTag: asset.assetTag,
        name: asset.name,
        displayName: asset.displayName || '',
        description: asset.description || '',
        assetType: asset.assetType,
        assetSubtype: asset.assetSubtype || '',
        status: asset.status,
        businessCriticality: asset.businessCriticality,
        dataClassification: asset.dataClassification,
        handlesPersonalData: asset.handlesPersonalData,
        handlesFinancialData: asset.handlesFinancialData,
        handlesHealthData: asset.handlesHealthData,
        handlesConfidentialData: asset.handlesConfidentialData,
        inIsmsScope: asset.inIsmsScope,
        inPciScope: asset.inPciScope,
        inDoraScope: asset.inDoraScope,
        inGdprScope: asset.inGdprScope,
        inNis2Scope: asset.inNis2Scope,
        inSoc2Scope: asset.inSoc2Scope,
        scopeNotes: asset.scopeNotes || '',
        ownerId: asset.ownerId || '',
        custodianId: asset.custodianId || '',
        departmentId: asset.departmentId || '',
        locationId: asset.locationId || '',
        cloudProvider: asset.cloudProvider || '',
        cloudRegion: asset.cloudRegion || '',
        cloudAccountId: asset.cloudAccountId || '',
        cloudResourceId: asset.cloudResourceId || '',
        datacenter: asset.datacenter || '',
        rack: asset.rack || '',
        rackPosition: asset.rackPosition?.toString() || '',
        purchaseDate: asset.purchaseDate ? (asset.purchaseDate.split('T')[0] ?? '') : '',
        deploymentDate: asset.deploymentDate ? (asset.deploymentDate.split('T')[0] ?? '') : '',
        warrantyExpiry: asset.warrantyExpiry ? (asset.warrantyExpiry.split('T')[0] ?? '') : '',
        endOfLife: asset.endOfLife ? (asset.endOfLife.split('T')[0] ?? '') : '',
        endOfSupport: asset.endOfSupport ? (asset.endOfSupport.split('T')[0] ?? '') : '',
        lifecycleNotes: asset.lifecycleNotes || '',
        fqdn: asset.fqdn || '',
        ipAddresses: Array.isArray(asset.ipAddresses) ? asset.ipAddresses.join(', ') : '',
        macAddresses: Array.isArray(asset.macAddresses) ? asset.macAddresses.join(', ') : '',
        operatingSystem: asset.operatingSystem || '',
        osVersion: asset.osVersion || '',
        version: asset.version || '',
        patchLevel: asset.patchLevel || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        supportContract: asset.supportContract || '',
        supportExpiry: asset.supportExpiry ? (asset.supportExpiry.split('T')[0] ?? '') : '',
        supportTier: asset.supportTier || '',
        purchaseCost: asset.purchaseCost?.toString() || '',
        costCurrency: asset.costCurrency || 'USD',
        annualCost: asset.annualCost?.toString() || '',
        costCenter: asset.costCenter || '',
        encryptionAtRest: asset.encryptionAtRest || false,
        encryptionInTransit: asset.encryptionInTransit || false,
        encryptionMethod: asset.encryptionMethod || '',
        backupEnabled: asset.backupEnabled || false,
        backupFrequency: asset.backupFrequency || '',
        backupRetention: asset.backupRetention || '',
        monitoringEnabled: asset.monitoringEnabled || false,
        loggingEnabled: asset.loggingEnabled || false,
        cpuCapacity: asset.cpuCapacity?.toString() || '',
        memoryCapacityGB: asset.memoryCapacityGB?.toString() || '',
        storageCapacityGB: asset.storageCapacityGB?.toString() || '',
        networkBandwidthMbps: asset.networkBandwidthMbps?.toString() || '',
        cpuThresholdPercent: asset.cpuThresholdPercent?.toString() || '80',
        memoryThresholdPercent: asset.memoryThresholdPercent?.toString() || '80',
        storageThresholdPercent: asset.storageThresholdPercent?.toString() || '80',
        rtoMinutes: asset.rtoMinutes?.toString() || '',
        rpoMinutes: asset.rpoMinutes?.toString() || '',
        mtpdMinutes: asset.mtpdMinutes?.toString() || '',
        targetAvailability: asset.targetAvailability?.toString() || '',
        hasRedundancy: asset.hasRedundancy || false,
        redundancyType: asset.redundancyType || '',
        typeAttributes: typeof asset.typeAttributes === 'object' && asset.typeAttributes !== null
          ? asset.typeAttributes
          : {},
      });
      const cat = ASSET_CATEGORIES.find(c => c.types.some(t => t.value === asset.assetType));
      if (cat) setSelectedCategory(cat.id);
    } catch (err) {
      toast.error('Failed to load asset');
      navigate('/itsm/assets');
    } finally {
      setLoading(false);
    }
  }

  async function generateTag(assetType: string) {
    try {
      const result = await generateAssetTag(assetType);
      setForm((prev) => ({ ...prev, assetTag: result.assetTag }));
    } catch (err) {
      console.error('Failed to generate asset tag:', err);
    }
  }

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'assetType' && !isEdit && typeof value === 'string') {
      generateTag(value);
      setForm((prev) => ({ ...prev, typeAttributes: {} }));
    }
  }

  function handleTypeAttrChange(key: string, value: string | boolean | number) {
    setForm((prev) => ({
      ...prev,
      typeAttributes: { ...prev.typeAttributes, [key]: value },
    }));
  }

  function selectAssetType(type: AssetType) {
    handleChange('assetType', type);
    if (!openSections.includes('technical')) {
      setOpenSections([...openSections, 'technical']);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data: Partial<Asset> = {
        assetTag: form.assetTag,
        name: form.name,
        displayName: form.displayName || undefined,
        description: form.description || undefined,
        assetType: form.assetType,
        assetSubtype: form.assetSubtype || undefined,
        status: form.status,
        businessCriticality: form.businessCriticality,
        dataClassification: form.dataClassification,
        handlesPersonalData: form.handlesPersonalData,
        handlesFinancialData: form.handlesFinancialData,
        handlesHealthData: form.handlesHealthData,
        handlesConfidentialData: form.handlesConfidentialData,
        inIsmsScope: form.inIsmsScope,
        inPciScope: form.inPciScope,
        inDoraScope: form.inDoraScope,
        inGdprScope: form.inGdprScope,
        inNis2Scope: form.inNis2Scope,
        inSoc2Scope: form.inSoc2Scope,
        scopeNotes: form.scopeNotes || undefined,
        ownerId: form.ownerId || undefined,
        custodianId: form.custodianId || undefined,
        departmentId: form.departmentId || undefined,
        locationId: form.locationId || undefined,
        cloudProvider: form.cloudProvider || undefined,
        cloudRegion: form.cloudRegion || undefined,
        cloudAccountId: form.cloudAccountId || undefined,
        cloudResourceId: form.cloudResourceId || undefined,
        datacenter: form.datacenter || undefined,
        rack: form.rack || undefined,
        rackPosition: form.rackPosition ? parseInt(form.rackPosition) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        deploymentDate: form.deploymentDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        endOfLife: form.endOfLife || undefined,
        endOfSupport: form.endOfSupport || undefined,
        lifecycleNotes: form.lifecycleNotes || undefined,
        fqdn: form.fqdn || undefined,
        ipAddresses: form.ipAddresses ? form.ipAddresses.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        macAddresses: form.macAddresses ? form.macAddresses.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        operatingSystem: form.operatingSystem || undefined,
        osVersion: form.osVersion || undefined,
        version: form.version || undefined,
        patchLevel: form.patchLevel || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        supportContract: form.supportContract || undefined,
        supportExpiry: form.supportExpiry || undefined,
        supportTier: form.supportTier || undefined,
        purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : undefined,
        costCurrency: form.costCurrency || 'USD',
        annualCost: form.annualCost ? parseFloat(form.annualCost) : undefined,
        costCenter: form.costCenter || undefined,
        encryptionAtRest: form.encryptionAtRest,
        encryptionInTransit: form.encryptionInTransit,
        encryptionMethod: form.encryptionMethod || undefined,
        backupEnabled: form.backupEnabled,
        backupFrequency: form.backupFrequency || undefined,
        backupRetention: form.backupRetention || undefined,
        monitoringEnabled: form.monitoringEnabled,
        loggingEnabled: form.loggingEnabled,
        cpuCapacity: form.cpuCapacity ? parseInt(form.cpuCapacity) : undefined,
        memoryCapacityGB: form.memoryCapacityGB ? parseFloat(form.memoryCapacityGB) : undefined,
        storageCapacityGB: form.storageCapacityGB ? parseFloat(form.storageCapacityGB) : undefined,
        networkBandwidthMbps: form.networkBandwidthMbps ? parseInt(form.networkBandwidthMbps) : undefined,
        cpuThresholdPercent: form.cpuThresholdPercent ? parseInt(form.cpuThresholdPercent) : 80,
        memoryThresholdPercent: form.memoryThresholdPercent ? parseInt(form.memoryThresholdPercent) : 80,
        storageThresholdPercent: form.storageThresholdPercent ? parseInt(form.storageThresholdPercent) : 80,
        rtoMinutes: form.rtoMinutes ? parseInt(form.rtoMinutes) : undefined,
        rpoMinutes: form.rpoMinutes ? parseInt(form.rpoMinutes) : undefined,
        mtpdMinutes: form.mtpdMinutes ? parseInt(form.mtpdMinutes) : undefined,
        targetAvailability: form.targetAvailability ? parseFloat(form.targetAvailability) : undefined,
        hasRedundancy: form.hasRedundancy,
        redundancyType: form.redundancyType || undefined,
        typeAttributes: Object.keys(form.typeAttributes).length > 0 ? form.typeAttributes : undefined,
      };

      if (isEdit) {
        await updateAsset(id!, data);
        toast.success('Asset updated');
        navigate(`/itsm/assets/${id}`);
      } else {
        const newAsset = await createAsset(data);
        toast.success('Asset created');
        navigate(`/itsm/assets/${newAsset.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  }

  const currentCategory = ASSET_CATEGORIES.find(c => c.id === selectedCategory);
  const typeFields = TYPE_SPECIFIC_FIELDS[TYPE_FIELD_MAP[form.assetType]] || [];

  return {
    id,
    isEdit,
    loading,
    saving,
    form,
    departments,
    locations,
    users,
    openSections,
    setOpenSections,
    selectedCategory,
    setSelectedCategory,
    sectionCompletion,
    overallProgress,
    currentCategory,
    typeFields,
    handleChange,
    handleTypeAttrChange,
    selectAssetType,
    handleSubmit,
  };
}
