import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { Asset, AssetVulnerability } from '@/lib/itsm-api';

interface AssetSecurityTabProps {
  asset: Asset;
  vulnerabilities: AssetVulnerability[];
}

export function AssetSecurityTab({ asset, vulnerabilities }: AssetSecurityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Risk Score Breakdown */}
        <Card className="glass-card col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Risk Assessment Model
            </CardTitle>
            <CardDescription>
              Residual Risk = Inherent Risk x (1 - Control Effectiveness x 0.8)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inherent Risk Categories */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Inherent Risk Categories</h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Weight</TableHead>
                      <TableHead>Factors</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Vulnerability Risk</TableCell>
                      <TableCell className="text-center text-muted-foreground">35%</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {(asset.openVulnsCritical ?? 0) > 0 && <Badge variant="destructive">{asset.openVulnsCritical} Critical</Badge>}
                          {(asset.openVulnsHigh ?? 0) > 0 && <Badge className="bg-orange-500">{asset.openVulnsHigh} High</Badge>}
                          {(asset.openVulnsMedium ?? 0) > 0 && <Badge className="bg-yellow-500 text-black">{asset.openVulnsMedium} Medium</Badge>}
                          {((asset.openVulnsCritical ?? 0) + (asset.openVulnsHigh ?? 0) + (asset.openVulnsMedium ?? 0)) === 0 && <span className="text-muted-foreground">No vulnerabilities</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(() => {
                          const c = asset.openVulnsCritical || 0;
                          const h = asset.openVulnsHigh || 0;
                          const m = asset.openVulnsMedium || 0;
                          const total = c + h + m;
                          if (total === 0) return '0';
                          const weighted = (c * 10 + h * 7 + m * 4) / (total * 10) * 60;
                          const volume = Math.min(25, Math.log10(total + 1) * 15);
                          return Math.min(100, Math.round(weighted + volume)).toString();
                        })()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Business Impact</TableCell>
                      <TableCell className="text-center text-muted-foreground">25%</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="mr-1">{asset.businessCriticality}</Badge>
                        <Badge variant="outline">{asset.dataClassification}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(asset.businessCriticality === 'CRITICAL' ? 50 : asset.businessCriticality === 'HIGH' ? 35 : asset.businessCriticality === 'MEDIUM' ? 20 : 5) +
                         (asset.dataClassification === 'RESTRICTED' ? 50 : asset.dataClassification === 'CONFIDENTIAL' ? 35 : asset.dataClassification === 'INTERNAL' ? 15 : 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Access Control Risk</TableCell>
                      <TableCell className="text-center text-muted-foreground">20%</TableCell>
                      <TableCell className="text-sm">
                        {asset.privilegedUserCount !== null && asset.privilegedUserCount !== undefined ? (
                          <span>{asset.privilegedUserCount} privileged / {(asset.humanUserCount ?? 0) + (asset.serviceAccountCount ?? 0)} total users</span>
                        ) : (
                          <span className="text-muted-foreground">No user data</span>
                        )}
                        {(asset.lastAuthFailureCount ?? 0) > 0 && (
                          <Badge variant="destructive" className="ml-2">{asset.lastAuthFailureCount} auth failures</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(() => {
                          const priv = asset.privilegedUserCount || 0;
                          const total = (asset.humanUserCount || 0) + (asset.serviceAccountCount || 0);
                          const auth = asset.lastAuthFailureCount || 0;
                          let score = 0;
                          if (total > 0 && priv > 0) {
                            const ratio = priv / total;
                            if (ratio > 0.5) score += 40;
                            else if (ratio > 0.3) score += 30;
                            else if (ratio > 0.2) score += 20;
                            else if (ratio > 0.1) score += 10;
                          }
                          if (priv > 10) score += 20;
                          else if (priv > 5) score += 10;
                          if (auth > 0) score += Math.min(40, Math.log10(auth + 1) * 20);
                          return Math.min(100, Math.round(score)).toString();
                        })()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lifecycle Risk</TableCell>
                      <TableCell className="text-center text-muted-foreground">20%</TableCell>
                      <TableCell className="text-sm">
                        {asset.endOfLife && new Date(asset.endOfLife) < new Date() ? (
                          <Badge variant="destructive">End of Life</Badge>
                        ) : asset.endOfSupport && new Date(asset.endOfSupport) < new Date() ? (
                          <Badge className="bg-orange-500">End of Support</Badge>
                        ) : (
                          <span className="text-green-600">Supported</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {asset.endOfLife && new Date(asset.endOfLife) < new Date() ? '100' :
                         asset.endOfSupport && new Date(asset.endOfSupport) < new Date() ? '70' : '0'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Network Exposure */}
            {(asset.openPortsCount !== null && asset.openPortsCount !== undefined) && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Network Exposure</h4>
                <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{asset.openPortsCount}</div>
                    <div className="text-xs text-muted-foreground">Open Ports</div>
                  </div>
                  {(asset.criticalPortsOpen as number[] | undefined)?.length ? (
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Critical Ports Open</div>
                      <div className="flex flex-wrap gap-1">
                        {(asset.criticalPortsOpen as number[]).map((port, i) => (
                          <Badge key={i} variant="destructive" className="font-mono text-xs">{port}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Control Effectiveness */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Control Effectiveness (CIS Benchmark)</h4>
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">SCA Compliance Score</span>
                  <span className="font-mono font-bold text-lg">
                    {asset.scaScore !== null && asset.scaScore !== undefined ? `${asset.scaScore}%` : 'N/A'}
                  </span>
                </div>
                {asset.scaScore !== null && asset.scaScore !== undefined && (
                  <>
                    <Progress value={asset.scaScore} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{asset.scaPassCount ?? 0} checks passed</span>
                      <span>{asset.scaFailCount ?? 0} checks failed</span>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Risk reduction factor: </span>
                      <span className="font-mono font-medium">{Math.round((1 - (asset.scaScore / 100) * 0.8) * 100)}%</span>
                      <span className="text-muted-foreground"> of inherent risk</span>
                    </div>
                  </>
                )}
                {(asset.scaScore === null || asset.scaScore === undefined) && (
                  <p className="text-sm text-muted-foreground">
                    No SCA data available. Sync with Wazuh to get control effectiveness metrics.
                  </p>
                )}
              </div>
            </div>

            {/* Final Calculation */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Inherent Risk</div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {(() => {
                    const c = asset.openVulnsCritical || 0;
                    const h = asset.openVulnsHigh || 0;
                    const m = asset.openVulnsMedium || 0;
                    const total = c + h + m;
                    let vulnScore = 0;
                    if (total > 0) {
                      vulnScore = Math.min(100, (c * 10 + h * 7 + m * 4) / (total * 10) * 60 + Math.min(25, Math.log10(total + 1) * 15));
                    }
                    const bizScore = (asset.businessCriticality === 'CRITICAL' ? 50 : asset.businessCriticality === 'HIGH' ? 35 : asset.businessCriticality === 'MEDIUM' ? 20 : 5) +
                                   (asset.dataClassification === 'RESTRICTED' ? 50 : asset.dataClassification === 'CONFIDENTIAL' ? 35 : asset.dataClassification === 'INTERNAL' ? 15 : 0);
                    const priv = asset.privilegedUserCount || 0;
                    const totalUsers = (asset.humanUserCount || 0) + (asset.serviceAccountCount || 0);
                    const auth = asset.lastAuthFailureCount || 0;
                    let accessScore = 0;
                    if (totalUsers > 0 && priv > 0) {
                      const ratio = priv / totalUsers;
                      if (ratio > 0.5) accessScore += 40;
                      else if (ratio > 0.3) accessScore += 30;
                      else if (ratio > 0.2) accessScore += 20;
                      else if (ratio > 0.1) accessScore += 10;
                    }
                    if (priv > 10) accessScore += 20;
                    else if (priv > 5) accessScore += 10;
                    if (auth > 0) accessScore += Math.min(40, Math.log10(auth + 1) * 20);
                    accessScore = Math.min(100, accessScore);
                    const lifecycleScore = asset.endOfLife && new Date(asset.endOfLife) < new Date() ? 100 :
                                          asset.endOfSupport && new Date(asset.endOfSupport) < new Date() ? 70 : 0;
                    return Math.round(vulnScore * 0.35 + bizScore * 0.25 + accessScore * 0.20 + lifecycleScore * 0.20);
                  })()}
                </div>
              </div>
              <div className="p-4 border rounded-lg text-center flex flex-col justify-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">x Risk Factor</div>
                <div className="text-2xl font-bold text-blue-500">
                  {asset.scaScore !== null && asset.scaScore !== undefined
                    ? `${Math.round((1 - (asset.scaScore / 100) * 0.8) * 100)}%`
                    : '100%'}
                </div>
              </div>
              <div className={`p-4 border-2 rounded-lg text-center ${(asset.riskScore ?? 0) >= 70 ? 'border-red-500 bg-red-500/10' : (asset.riskScore ?? 0) >= 40 ? 'border-orange-500 bg-orange-500/10' : 'border-green-500 bg-green-500/10'}`}>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Residual Risk</div>
                <div className={`text-3xl font-bold ${(asset.riskScore ?? 0) >= 70 ? 'text-red-500' : (asset.riskScore ?? 0) >= 40 ? 'text-orange-500' : 'text-green-500'}`}>
                  {asset.riskScore ?? 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Controls */}
        <Card className="glass-card">
          <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Encryption At Rest</span>
              {asset.encryptionAtRest ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Encryption In Transit</span>
              {asset.encryptionInTransit ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Monitoring</span>
              {asset.monitoringEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Backups</span>
              {asset.backupEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
            {asset.backupEnabled && (
              <div className="bg-muted p-2 rounded text-xs space-y-1">
                <div>Freq: {asset.backupFrequency}</div>
                <div>Ret: {asset.backupRetention}</div>
                <div>Last: {asset.lastBackupDate ? new Date(asset.lastBackupDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Top Vulnerabilities</CardTitle></CardHeader>
        <CardContent>
          {vulnerabilities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin / CVE</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vulnerabilities.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.vulnerability.referenceNumber}</TableCell>
                    <TableCell>
                      <Badge variant={v.vulnerability.severity === 'CRITICAL' ? 'destructive' : v.vulnerability.severity === 'HIGH' ? 'default' : 'secondary'}>
                        {v.vulnerability.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={v.vulnerability.title}>
                      {v.vulnerability.title}
                    </TableCell>
                    <TableCell>{v.discoveredAt ? new Date(v.discoveredAt).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No vulnerabilities detected.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
