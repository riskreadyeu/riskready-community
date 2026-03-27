import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { RevisionEntry } from "../types";

interface RevisionsEditorProps {
  revisions: RevisionEntry[];
  onChange: (data: RevisionEntry[]) => void;
}

export function RevisionsEditor({
  revisions,
  onChange,
}: RevisionsEditorProps) {
  const addRevision = () => {
    onChange([
      ...revisions,
      {
        version: "",
        date: new Date().toISOString().split("T")[0]!,
        author: "",
        description: "",
      },
    ]);
  };

  const updateRevision = (index: number, updates: Partial<RevisionEntry>) => {
    const updated = [...revisions];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeRevision = (index: number) => {
    onChange(revisions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="grid grid-cols-[80px,100px,1fr,1fr,auto] gap-2 p-3 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <span>Version</span>
          <span>Date</span>
          <span>Author</span>
          <span>Description</span>
          <span className="w-10" />
        </div>
        <div className="divide-y">
          {revisions.map((rev, index) => (
            <div key={index} className="grid grid-cols-[80px,100px,1fr,1fr,auto] gap-2 p-3 items-start">
              <Input
                value={rev.version}
                onChange={(e) => updateRevision(index, { version: e.target.value })}
                placeholder="1.0"
                className="h-9"
              />
              <Input
                type="date"
                value={rev.date}
                onChange={(e) => updateRevision(index, { date: e.target.value })}
                className="h-9"
              />
              <Input
                value={rev.author}
                onChange={(e) => updateRevision(index, { author: e.target.value })}
                placeholder="Author name"
                className="h-9"
              />
              <Input
                value={rev.description}
                onChange={(e) => updateRevision(index, { description: e.target.value })}
                placeholder="Description of changes"
                className="h-9"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRevision(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={addRevision}>
        <Plus className="h-4 w-4 mr-2" />
        Add Revision
      </Button>
    </div>
  );
}
