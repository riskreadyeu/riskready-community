import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Asset } from '@/lib/itsm-api';

interface AssetSoftwareTabProps {
  asset: Asset;
}

export function AssetSoftwareTab({ asset }: AssetSoftwareTabProps) {
  const software = asset.installedSoftware ?? [];

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Installed Software
            <Badge variant="secondary" className="ml-2">{software.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {software.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No software records found for this asset
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Install Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {software.map((sw) => (
                  <TableRow key={sw.id}>
                    <TableCell className="font-medium">{sw.softwareName}</TableCell>
                    <TableCell className="font-mono text-xs">{sw.softwareVersion || '—'}</TableCell>
                    <TableCell>{sw.vendor || '—'}</TableCell>
                    <TableCell>
                      {sw.licenseType ? (
                        <Badge variant="outline" className="text-xs">{sw.licenseType}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {sw.isApproved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sw.installDate ? new Date(sw.installDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
