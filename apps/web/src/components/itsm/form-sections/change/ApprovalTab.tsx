import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ChangeFormState } from './types';

interface ApprovalTabProps {
  form: ChangeFormState;
  onChange: (field: string, value: string | boolean) => void;
}

export function ApprovalTab({ form, onChange }: ApprovalTabProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Approval Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="cabRequired">CAB Required</Label>
            <p className="text-sm text-muted-foreground">
              Does this change require Change Advisory Board approval?
            </p>
          </div>
          <Switch
            id="cabRequired"
            checked={form.cabRequired}
            onCheckedChange={(v) => onChange('cabRequired', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pirRequired">PIR Required</Label>
            <p className="text-sm text-muted-foreground">
              Is a Post-Implementation Review required?
            </p>
          </div>
          <Switch
            id="pirRequired"
            checked={form.pirRequired}
            onCheckedChange={(v) => onChange('pirRequired', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
