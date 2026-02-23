import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { PrerequisiteEntry } from "../types";

interface PrerequisitesEditorProps {
  prerequisites: PrerequisiteEntry[];
  onChange: (data: PrerequisiteEntry[]) => void;
}

export function PrerequisitesEditor({
  prerequisites,
  onChange,
}: PrerequisitesEditorProps) {
  const addPrerequisite = () => {
    onChange([...prerequisites, { item: "", isMandatory: true, category: "MANDATORY" as const }]);
  };

  const updatePrerequisite = (index: number, updates: Partial<PrerequisiteEntry>) => {
    const updated = [...prerequisites];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removePrerequisite = (index: number) => {
    onChange(prerequisites.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {prerequisites.map((prereq, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <Input
              value={prereq.item}
              onChange={(e) => updatePrerequisite(index, { item: e.target.value })}
              placeholder="Prerequisite item"
              className="flex-1"
            />
            <Select
              value={prereq.isMandatory ? "mandatory" : "optional"}
              onValueChange={(v) =>
                updatePrerequisite(index, { isMandatory: v === "mandatory" })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandatory">Mandatory</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePrerequisite(index)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addPrerequisite}>
        <Plus className="h-4 w-4 mr-2" />
        Add Prerequisite
      </Button>
    </div>
  );
}
