import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ChangeFormState } from './types';

interface ScheduleTabProps {
  form: ChangeFormState;
  onChange: (field: string, value: string | boolean) => void;
}

export function ScheduleTab({ form, onChange }: ScheduleTabProps) {
  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Implementation Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plannedStart">Planned Start</Label>
            <Input
              id="plannedStart"
              type="datetime-local"
              value={form.plannedStart}
              onChange={(e) => onChange('plannedStart', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannedEnd">Planned End</Label>
            <Input
              id="plannedEnd"
              type="datetime-local"
              value={form.plannedEnd}
              onChange={(e) => onChange('plannedEnd', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDowntime">Estimated Downtime (minutes)</Label>
            <Input
              id="estimatedDowntime"
              type="number"
              value={form.estimatedDowntime}
              onChange={(e) => onChange('estimatedDowntime', e.target.value)}
              placeholder="0 if no downtime expected"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Scheduling Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceWindow">Maintenance Window</Label>
              <p className="text-sm text-muted-foreground">
                Will this change be implemented during a scheduled maintenance window?
              </p>
            </div>
            <Switch
              id="maintenanceWindow"
              checked={form.maintenanceWindow}
              onCheckedChange={(v) => onChange('maintenanceWindow', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="outageRequired">Outage Required</Label>
              <p className="text-sm text-muted-foreground">
                Will this change require a service outage?
              </p>
            </div>
            <Switch
              id="outageRequired"
              checked={form.outageRequired}
              onCheckedChange={(v) => onChange('outageRequired', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
