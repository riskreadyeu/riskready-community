import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Server,
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Database,
  MapPin,
  Activity,
  GitBranch,
  ShieldAlert,
  ExternalLink,
  Lock,
  DollarSign,
  BarChart,
  Calendar,
  RefreshCw,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAsset,
  getAssetRelationships,
  getAssetImpact,
  getAssetVulnerabilities,
  deleteAsset,
  type Asset,
  type AssetRelationship,
  type AssetVulnerability,
} from '@/lib/itsm-api';
import {
  getAssetUIVisibility,
  getAssetProfileDescription,
} from '@/lib/asset-type-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { AssetOverviewTab } from '@/components/itsm/tabs/asset/asset-overview-tab';
import { AssetIdentityTab } from '@/components/itsm/tabs/asset/asset-identity-tab';
import { AssetTechnicalTab } from '@/components/itsm/tabs/asset/asset-technical-tab';
import { AssetSecurityTab } from '@/components/itsm/tabs/asset/asset-security-tab';
import { AssetLifecycleTab } from '@/components/itsm/tabs/asset/asset-lifecycle-tab';
import { AssetFinancialTab } from '@/components/itsm/tabs/asset/asset-financial-tab';
import { AssetCapacityTab } from '@/components/itsm/tabs/asset/asset-capacity-tab';
import { AssetRelationshipsTab } from '@/components/itsm/tabs/asset/asset-relationships-tab';
import { AssetSoftwareTab } from '@/components/itsm/tabs/asset/asset-software-tab';

const getUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
  if (!user) return undefined;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email;
};

const DetailRow = ({ label, value, icon: Icon, className = '' }: any) => (
  <div className={`flex items-start justify-between py-2 border-b border-border/50 last:border-0 ${className}`}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </div>
    <div className="text-sm font-medium text-right max-w-[60%] truncate">
      {value || <span className="text-muted-foreground/50">—</span>}
    </div>
  </div>
);

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [relationships, setRelationships] = useState<AssetRelationship[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<AssetVulnerability[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [assetData, relsData, impactData, vulnsData] = await Promise.all([
        getAsset(id!),
        getAssetRelationships(id!),
        getAssetImpact(id!),
        getAssetVulnerabilities(id!),
      ]);
      setAsset(assetData);
      setRelationships(relsData);
      setImpactAnalysis(impactData);
      setVulnerabilities(vulnsData);
    } catch (err) {
      console.error('Failed to load asset:', err);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.'))
      return;
    try {
      await deleteAsset(id!);
      toast.success('Asset deleted successfully');
      navigate('/itsm/assets');
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading asset details...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">Asset not found</div>
        <Button variant="link" onClick={() => navigate('/itsm/assets')}>
          Return to Assets
        </Button>
      </div>
    );
  }

  const uiVisibility = getAssetUIVisibility(asset.assetType);
  const profileDescription = getAssetProfileDescription(asset.assetType);

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      MAINTENANCE: 'secondary',
      RETIRED: 'destructive',
      PLANNED: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header / Hero Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => navigate('/itsm/assets')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Assets
            </Button>
            <span>/</span>
            <span>{asset.assetType}</span>
            <span>/</span>
            <span className="font-mono">{asset.assetTag}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {asset.assetType === 'SERVER' ? <Server className="h-8 w-8 text-primary" /> : <Database className="h-8 w-8 text-primary" />}
            {asset.name}
            <StatusBadge status={asset.status} />
          </h1>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {asset.businessCriticality} Criticality
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              {asset.dataClassification} Data
            </Badge>
            {uiVisibility.showWazuhStatus && asset.wazuhAgentStatus === 'active' && (
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Wazuh Agent Active
              </Badge>
            )}
            {!uiVisibility.showWazuhStatus && (
              <Badge variant="outline" className="text-xs">
                {profileDescription}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {uiVisibility.showOpenWazuhButton && asset.wazuhDashboardUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(asset.wazuhDashboardUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Wazuh
            </Button>
          )}
          {uiVisibility.showSyncWazuhButton && (
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Wazuh
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/itsm/assets/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content with Vertical Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-col h-auto w-full items-stretch justify-start bg-muted/30 p-1 space-y-1">
              <TabsTrigger value="overview" className="justify-start px-3 py-2">
                <Activity className="h-4 w-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="identity" className="justify-start px-3 py-2">
                <MapPin className="h-4 w-4 mr-2" /> Identity & Location
              </TabsTrigger>
              <TabsTrigger value="technical" className="justify-start px-3 py-2">
                <Server className="h-4 w-4 mr-2" /> Technical Details
              </TabsTrigger>
              <TabsTrigger value="security" className="justify-start px-3 py-2">
                <ShieldAlert className="h-4 w-4 mr-2" /> Security & Risk
              </TabsTrigger>
              <TabsTrigger value="lifecycle" className="justify-start px-3 py-2">
                <Calendar className="h-4 w-4 mr-2" /> Lifecycle & Support
              </TabsTrigger>
              <TabsTrigger value="financial" className="justify-start px-3 py-2">
                <DollarSign className="h-4 w-4 mr-2" /> Financial
              </TabsTrigger>
              <TabsTrigger value="capacity" className="justify-start px-3 py-2">
                <BarChart className="h-4 w-4 mr-2" /> Capacity & Resilience
              </TabsTrigger>
              <TabsTrigger value="software" className="justify-start px-3 py-2">
                <Package className="h-4 w-4 mr-2" /> Software
              </TabsTrigger>
              <TabsTrigger value="relationships" className="justify-start px-3 py-2">
                <GitBranch className="h-4 w-4 mr-2" /> Relationships
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="mt-4 glass-card bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-2">
                <div className={`text-4xl font-bold ${(asset.riskScore ?? 0) >= 70 ? 'text-red-500' : (asset.riskScore ?? 0) >= 40 ? 'text-orange-500' : 'text-green-500'}`}>
                  {asset.riskScore ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  Calculated on {asset.riskScoreCalculatedAt ? new Date(asset.riskScoreCalculatedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'overview' && (
            <AssetOverviewTab
              asset={asset}
              uiVisibility={uiVisibility}
              profileDescription={profileDescription}
              DetailRow={DetailRow}
              getUserName={getUserName}
            />
          )}
          {activeTab === 'identity' && (
            <AssetIdentityTab asset={asset} DetailRow={DetailRow} getUserName={getUserName} />
          )}
          {activeTab === 'technical' && (
            <AssetTechnicalTab asset={asset} DetailRow={DetailRow} />
          )}
          {activeTab === 'security' && (
            <AssetSecurityTab asset={asset} vulnerabilities={vulnerabilities} />
          )}
          {activeTab === 'lifecycle' && (
            <AssetLifecycleTab asset={asset} DetailRow={DetailRow} />
          )}
          {activeTab === 'financial' && (
            <AssetFinancialTab asset={asset} DetailRow={DetailRow} />
          )}
          {activeTab === 'capacity' && (
            <AssetCapacityTab asset={asset} DetailRow={DetailRow} />
          )}
          {activeTab === 'software' && (
            <AssetSoftwareTab asset={asset} />
          )}
          {activeTab === 'relationships' && (
            <AssetRelationshipsTab asset={asset} relationships={relationships} impactAnalysis={impactAnalysis} />
          )}
        </div>
      </div>
    </div>
  );
}
