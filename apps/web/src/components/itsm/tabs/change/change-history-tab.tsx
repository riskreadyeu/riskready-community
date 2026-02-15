import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import type { Change } from '@/lib/itsm-api';

interface ChangeHistoryTabProps {
  change: Change;
}

export function ChangeHistoryTab({ change }: ChangeHistoryTabProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Change History</CardTitle>
      </CardHeader>
      <CardContent>
        {(change as any).history?.length > 0 ? (
          <div className="space-y-3">
            {(change as any).history.map((entry: any) => (
              <div key={entry.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <div className="mt-0.5 rounded-full bg-muted p-1.5">
                  <GitBranch className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{entry.field}</span> changed from{' '}
                    <span className="text-muted-foreground">{entry.oldValue || 'empty'}</span> to{' '}
                    <span className="font-medium">{entry.newValue}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.changedBy &&
                      `${entry.changedBy.firstName} ${entry.changedBy.lastName} • `}
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No history available</div>
        )}
      </CardContent>
    </Card>
  );
}
