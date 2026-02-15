import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Bug,
  Activity,
  User,
  Building,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';
import type { AssetUIVisibility } from '@/lib/asset-type-utils';

interface AssetOverviewTabProps {
  asset: Asset;
  uiVisibility: AssetUIVisibility;
  profileDescription: string;
  DetailRow: React.ComponentType<any>;
  getUserName: (user?: { firstName?: string; lastName?: string; email: string }) => string | undefined;
}

export function AssetOverviewTab({ asset, uiVisibility, profileDescription, DetailRow, getUserName }: AssetOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Quick Details Card */}
      <Card className="glass-card col-span-2">
        <CardHeader>
          <CardTitle>Asset Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <DetailRow label="Type" value={asset.assetType} />
            <DetailRow label="Subtype" value={asset.assetSubtype} />
            <DetailRow label="Owner" value={getUserName(asset.owner)} icon={User} />
            <DetailRow label="Department" value={asset.department?.name} icon={Building} />
            {asset.discoverySource && (
              <DetailRow label="Discovery Source" value={asset.discoverySource} />
            )}
          </div>
          <div className="space-y-4">
            <DetailRow label="Location" value={asset.location?.name} icon={MapPin} />
            <DetailRow label="Manufacturer" value={asset.manufacturer} />
            <DetailRow label="Model" value={asset.model} />
            <DetailRow label="Serial" value={asset.serialNumber} />
            {asset.lastVerified && (
              <DetailRow label="Last Verified" value={new Date(asset.lastVerified).toLocaleDateString()} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags & Attributes */}
      {((asset.tags as string[] | undefined)?.length || (asset.typeAttributes && Object.keys(asset.typeAttributes as Record<string, unknown>).length > 0)) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags & Attributes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(asset.tags as string[] | undefined)?.length ? (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {(asset.tags as string[]).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {asset.typeAttributes && Object.keys(asset.typeAttributes as Record<string, unknown>).length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Type Attributes</div>
                <div className="space-y-1">
                  {Object.entries(asset.typeAttributes as Record<string, unknown>).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vulnerability Summary Card */}
      {uiVisibility.showVulnerabilities && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Vulnerabilities</span>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-red-500">Critical</span>
                <Badge variant="destructive" className="rounded-full px-2">{asset.openVulnsCritical || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-500">High</span>
                <Badge className="bg-orange-500 hover:bg-orange-600 rounded-full px-2">{asset.openVulnsHigh || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-500">Medium</span>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-full px-2 text-black">{asset.openVulnsMedium || 0}</Badge>
              </div>
              <Separator className="my-2" />
              <div className="text-xs text-center text-muted-foreground">
                {asset.slaBreachedVulns || 0} SLAs Breached
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wazuh Status Card */}
      {uiVisibility.showWazuhStatus && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Wazuh Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Agent Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${asset.wazuhAgentStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium capitalize">{asset.wazuhAgentStatus || 'Not Connected'}</span>
              </div>
            </div>
            {asset.wazuhLastCheckIn && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Last Check-in</span>
                <span className="text-sm">{new Date(asset.wazuhLastCheckIn).toLocaleString()}</span>
              </div>
            )}
            {asset.wazuhDashboardUrl && (
              <Button variant="outline" size="sm" className="w-full mt-2"
                onClick={() => window.open(asset.wazuhDashboardUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Wazuh
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance Posture Card */}
      {uiVisibility.showScaCompliance && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Compliance Posture
            </CardTitle>
            <CardDescription>SCA Policy Assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className={`text-5xl font-bold ${(asset.scaScore ?? 0) >= 80 ? 'text-green-500' : (asset.scaScore ?? 0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {asset.scaScore ?? '—'}
              </div>
              <span className="text-sm text-muted-foreground ml-2">/ 100</span>
            </div>
            {asset.scaPolicyName && (
              <div className="text-center text-sm text-muted-foreground">
                {asset.scaPolicyName}
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-green-500/10 rounded">
                <div className="text-lg font-bold text-green-600">{asset.scaPassCount ?? 0}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="text-center p-2 bg-red-500/10 rounded">
                <div className="text-lg font-bold text-red-600">{asset.scaFailCount ?? 0}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
            {asset.scaLastAssessment && (
              <div className="text-xs text-center text-muted-foreground">
                Last assessed: {new Date(asset.scaLastAssessment).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Access Control Card */}
      {uiVisibility.showUserAccounts && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> Access Control
            </CardTitle>
            <CardDescription>User Account Summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Human Users</span>
                <Badge variant="outline" className="font-mono">{asset.humanUserCount ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Privileged Users</span>
                <Badge className="bg-orange-500 hover:bg-orange-600 font-mono">{asset.privilegedUserCount ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Accounts</span>
                <Badge variant="secondary" className="font-mono">{asset.serviceAccountCount ?? 0}</Badge>
              </div>
            </div>
            <Separator />
            <div className={`flex items-center justify-between p-2 rounded ${(asset.lastAuthFailureCount ?? 0) > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/30'}`}>
              <span className="text-sm">Auth Failures (24h)</span>
              <Badge variant={(asset.lastAuthFailureCount ?? 0) > 0 ? 'destructive' : 'secondary'} className="font-mono">
                {asset.lastAuthFailureCount ?? 0}
              </Badge>
            </div>
            {(asset.lastAuthFailureCount ?? 0) > 5 && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                High number of authentication failures detected
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monitoring Not Applicable Card */}
      {!uiVisibility.showWazuhStatus && !uiVisibility.showScaCompliance && (
        <Card className="glass-card bg-muted/20 border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Agent-based monitoring not applicable</p>
            <p className="text-sm mt-1">{profileDescription}</p>
            {uiVisibility.showCloudConfig && (
              <p className="text-xs mt-2">Use cloud-native security tools for this asset type.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
