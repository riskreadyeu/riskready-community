import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import type { Change } from '@/lib/itsm-api';

interface ChangeAssetsTabProps {
  change: Change;
}

export function ChangeAssetsTab({ change }: ChangeAssetsTabProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Affected Assets</CardTitle>
        <Button variant="outline" size="sm">
          <Server className="mr-2 h-4 w-4" />
          Link Assets
        </Button>
      </CardHeader>
      <CardContent>
        {(change as any).assetLinks?.length > 0 ? (
          <div className="space-y-2">
            {(change as any).assetLinks.map((link: any) => (
              <Link
                key={link.id}
                to={`/itsm/assets/${link.asset.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{link.asset.name}</div>
                    <div className="text-xs text-muted-foreground">{link.asset.assetTag}</div>
                  </div>
                </div>
                <Badge variant="outline">{link.impactType}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No assets linked to this change
          </div>
        )}
      </CardContent>
    </Card>
  );
}
