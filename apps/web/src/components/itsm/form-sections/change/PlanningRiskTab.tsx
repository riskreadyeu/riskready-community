import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChangeFormState } from './types';

interface PlanningRiskTabProps {
  form: ChangeFormState;
  onChange: (field: string, value: string | boolean) => void;
}

export function PlanningRiskTab({ form, onChange }: PlanningRiskTabProps) {
  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="impactAssessment">Impact Assessment</Label>
            <Textarea
              id="impactAssessment"
              value={form.impactAssessment}
              onChange={(e) => onChange('impactAssessment', e.target.value)}
              rows={3}
              placeholder="What systems, services, or users will be affected?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userImpact">User Impact</Label>
            <Textarea
              id="userImpact"
              value={form.userImpact}
              onChange={(e) => onChange('userImpact', e.target.value)}
              rows={2}
              placeholder="How will end users be affected during the change?"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select
              value={form.riskLevel}
              onValueChange={(v) => onChange('riskLevel', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="riskAssessment">Risk Assessment Details</Label>
            <Textarea
              id="riskAssessment"
              value={form.riskAssessment}
              onChange={(e) => onChange('riskAssessment', e.target.value)}
              rows={3}
              placeholder="What risks are associated with this change? How will they be mitigated?"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testPlan">Test Plan</Label>
            <Textarea
              id="testPlan"
              value={form.testPlan}
              onChange={(e) => onChange('testPlan', e.target.value)}
              rows={3}
              placeholder="How will the change be tested before and after implementation?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoutPlan">Backout Plan</Label>
            <Textarea
              id="backoutPlan"
              value={form.backoutPlan}
              onChange={(e) => onChange('backoutPlan', e.target.value)}
              rows={3}
              placeholder="How will the change be rolled back if it fails?"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rollbackTime">Rollback Time (minutes)</Label>
              <Input
                id="rollbackTime"
                type="number"
                value={form.rollbackTime}
                onChange={(e) => onChange('rollbackTime', e.target.value)}
                placeholder="Estimated time to rollback"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="successCriteria">Success Criteria</Label>
            <Textarea
              id="successCriteria"
              value={form.successCriteria}
              onChange={(e) => onChange('successCriteria', e.target.value)}
              rows={2}
              placeholder="How will success be measured?"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
