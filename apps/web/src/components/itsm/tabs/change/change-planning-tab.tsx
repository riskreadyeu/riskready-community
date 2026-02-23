import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Change } from '@/lib/itsm-api';

interface ChangePlanningTabProps {
  change: Change;
}

export function ChangePlanningTab({ change }: ChangePlanningTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          {change.impactAssessment ? (
            <p className="text-sm whitespace-pre-wrap">{change.impactAssessment}</p>
          ) : (
            <p className="text-muted-foreground">No impact assessment provided</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Badge variant={change.riskLevel === 'high' ? 'destructive' : 'secondary'}>
              {change.riskLevel} risk
            </Badge>
          </div>
          {change.riskAssessment ? (
            <p className="text-sm whitespace-pre-wrap">{change.riskAssessment}</p>
          ) : (
            <p className="text-muted-foreground">No risk assessment provided</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Test Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {change.testPlan ? (
            <p className="text-sm whitespace-pre-wrap">{change.testPlan}</p>
          ) : (
            <p className="text-muted-foreground">No test plan provided</p>
          )}
          {change.testResults && (
            <div className="mt-3 border-t pt-3">
              <h4 className="text-sm font-medium mb-2">Test Results</h4>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{change.testResults}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Backout Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {change.backoutPlan ? (
            <p className="text-sm whitespace-pre-wrap">{change.backoutPlan}</p>
          ) : (
            <p className="text-muted-foreground">No backout plan provided</p>
          )}
          {change.rollbackTime != null && (
            <div className="flex items-center gap-2 text-sm mt-2 border-t pt-3">
              <span className="text-muted-foreground">Estimated Rollback Time:</span>
              <Badge variant="outline">{change.rollbackTime} min</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affected Services */}
      {change.affectedServices && change.affectedServices.length > 0 && (
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle>Affected Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {change.affectedServices.map((service, i) => (
                <Badge key={i} variant="secondary">{service}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
