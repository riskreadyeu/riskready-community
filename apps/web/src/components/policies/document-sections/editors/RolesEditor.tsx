import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users } from "lucide-react";
import type { RoleEntry } from "../types";

interface RolesEditorProps {
  roles: RoleEntry[];
  onChange: (data: RoleEntry[]) => void;
}

export function RolesEditor({
  roles,
  onChange,
}: RolesEditorProps) {
  const addRole = () => {
    onChange([...roles, { role: "", responsibilities: [] }]);
  };

  const updateRole = (index: number, updates: Partial<RoleEntry>) => {
    const updated = [...roles];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeRole = (index: number) => {
    onChange(roles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {roles.map((role, index) => (
        <Card key={index}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <Input
                value={role.role}
                onChange={(e) => updateRole(index, { role: e.target.value })}
                placeholder="Role name"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRole(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block">Responsibilities (one per line)</Label>
            <Textarea
              value={role.responsibilities.join("\n")}
              onChange={(e) =>
                updateRole(index, {
                  responsibilities: e.target.value.split("\n").filter((r) => r.trim()),
                })
              }
              placeholder="Enter responsibilities..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addRole}>
        <Plus className="h-4 w-4 mr-2" />
        Add Role
      </Button>
    </div>
  );
}
