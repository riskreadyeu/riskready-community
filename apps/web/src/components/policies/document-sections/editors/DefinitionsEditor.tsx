import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { DefinitionEntry } from "../types";

interface DefinitionsEditorProps {
  definitions: DefinitionEntry[];
  onChange: (data: DefinitionEntry[]) => void;
}

export function DefinitionsEditor({
  definitions,
  onChange,
}: DefinitionsEditorProps) {
  const addDefinition = () => {
    onChange([...definitions, { term: "", definition: "" }]);
  };

  const updateDefinition = (index: number, updates: Partial<DefinitionEntry>) => {
    const updated = [...definitions];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeDefinition = (index: number) => {
    onChange(definitions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr,2fr,auto] gap-2 p-3 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <span>Term</span>
          <span>Definition</span>
          <span className="w-10" />
        </div>
        <div className="divide-y">
          {definitions.map((def, index) => (
            <div key={index} className="grid grid-cols-[1fr,2fr,auto] gap-2 p-3 items-start">
              <Input
                value={def.term}
                onChange={(e) => updateDefinition(index, { term: e.target.value })}
                placeholder="Term"
                className="h-9"
              />
              <Textarea
                value={def.definition}
                onChange={(e) => updateDefinition(index, { definition: e.target.value })}
                placeholder="Definition"
                className="min-h-[80px]"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDefinition(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={addDefinition}>
        <Plus className="h-4 w-4 mr-2" />
        Add Definition
      </Button>
    </div>
  );
}
