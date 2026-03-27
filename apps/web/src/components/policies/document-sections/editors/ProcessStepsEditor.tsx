import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { ProcessStepEntry } from "../types";

interface ProcessStepsEditorProps {
  steps: ProcessStepEntry[];
  onChange: (data: ProcessStepEntry[]) => void;
}

export function ProcessStepsEditor({
  steps,
  onChange,
}: ProcessStepsEditorProps) {
  const addStep = () => {
    const nextNumber = steps.length > 0 ? String(steps.length + 1) : "1";
    onChange([
      ...steps,
      { stepNumber: nextNumber, title: "", description: "", activities: [] },
    ]);
  };

  const updateStep = (index: number, updates: Partial<ProcessStepEntry>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={index}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono font-semibold">
                {step.stepNumber}
              </div>
              <Input
                value={step.title}
                onChange={(e) => updateStep(index, { title: e.target.value })}
                placeholder="Step title"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={step.description}
                onChange={(e) => updateStep(index, { description: e.target.value })}
                placeholder="Step description..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsible</Label>
                <Input
                  value={step.responsible || ""}
                  onChange={(e) => updateStep(index, { responsible: e.target.value })}
                  placeholder="Who performs this step"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Duration</Label>
                <Input
                  value={step.estimatedDuration || ""}
                  onChange={(e) => updateStep(index, { estimatedDuration: e.target.value })}
                  placeholder="e.g., 1 hour, 2-3 days"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addStep}>
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}
