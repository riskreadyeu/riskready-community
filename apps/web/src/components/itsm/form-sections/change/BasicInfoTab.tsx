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
import { CHANGE_CATEGORIES, type ChangeFormState } from './types';

interface BasicInfoTabProps {
  form: ChangeFormState;
  departments: { id: string; name: string }[];
  onChange: (field: string, value: string | boolean) => void;
}

export function BasicInfoTab({ form, departments, onChange }: BasicInfoTabProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Change Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            required
            placeholder="Brief description of the change"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            required
            rows={4}
            placeholder="Detailed description of what will be changed and why..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="changeType">Change Type *</Label>
          <Select
            value={form.changeType}
            onValueChange={(v) => onChange('changeType', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STANDARD">Standard (Pre-approved)</SelectItem>
              <SelectItem value="NORMAL">Normal (Requires approval)</SelectItem>
              <SelectItem value="EMERGENCY">Emergency (Urgent)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => onChange('category', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANGE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => onChange('priority', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityImpact">Security Impact</Label>
          <Select
            value={form.securityImpact}
            onValueChange={(v) => onChange('securityImpact', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NONE">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select
            value={form.departmentId || '__none__'}
            onValueChange={(v) => onChange('departmentId', v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessJustification">Business Justification</Label>
          <Textarea
            id="businessJustification"
            value={form.businessJustification}
            onChange={(e) => onChange('businessJustification', e.target.value)}
            rows={3}
            placeholder="Why is this change needed? What business value does it provide?"
          />
        </div>
      </CardContent>
    </Card>
  );
}
