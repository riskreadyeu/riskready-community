import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Change, ChangeApproval } from '@/lib/itsm-api';

interface ChangeApprovalsTabProps {
  change: Change;
  approvals: ChangeApproval[];
}

export function ChangeApprovalsTab({ change, approvals }: ChangeApprovalsTabProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Approval Status</CardTitle>
        {change.status === 'PENDING_APPROVAL' && (
          <Button variant="outline" size="sm">
            Add Approver
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No approvals requested yet
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  {approval.status === 'APPROVED' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : approval.status === 'REJECTED' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {approval.approver
                        ? `${approval.approver.firstName} ${approval.approver.lastName}`
                        : 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">{approval.approverRole}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      approval.status === 'APPROVED'
                        ? 'default'
                        : approval.status === 'REJECTED'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {approval.status}
                  </Badge>
                  {approval.decidedAt && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(approval.decidedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
