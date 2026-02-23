import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  createTreatmentAction, 
  updateTreatmentAction,
  type TreatmentAction, 
  type ActionStatus,
  type TreatmentPriority,
} from "@/lib/risks-api";
import { ListTodo, Loader2 } from "lucide-react";

interface TreatmentActionDialogProps {
  action?: TreatmentAction;
  treatmentPlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TreatmentActionDialog({ 
  action, 
  treatmentPlanId,
  open, 
  onOpenChange, 
  onSuccess 
}: TreatmentActionDialogProps) {
  const isEditing = !!action;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    actionId: "",
    title: "",
    description: "",
    status: "NOT_STARTED" as ActionStatus,
    priority: "MEDIUM" as TreatmentPriority,
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    completionNotes: "",
    blockerNotes: "",
  });

  useEffect(() => {
    if (action) {
      setForm({
        actionId: action.actionId || "",
        title: action.title || "",
        description: action.description || "",
        status: action.status,
        priority: action.priority,
        dueDate: action.dueDate ? action.dueDate.split("T")[0]! : "",
        estimatedHours: action.estimatedHours?.toString() || "",
        actualHours: action.actualHours?.toString() || "",
        completionNotes: action.completionNotes || "",
        blockerNotes: action.blockerNotes || "",
      });
    } else {
      resetForm();
    }
  }, [action]);

  const resetForm = () => {
    setForm({
      actionId: "",
      title: "",
      description: "",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      dueDate: "",
      estimatedHours: "",
      actualHours: "",
      completionNotes: "",
      blockerNotes: "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.actionId || !form.title) {
      setError("Action ID and Title are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        actionId: form.actionId,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours ? parseInt(form.estimatedHours) : undefined,
        actualHours: form.actualHours ? parseInt(form.actualHours) : undefined,
        completionNotes: form.completionNotes || undefined,
        blockerNotes: form.blockerNotes || undefined,
      };

      if (isEditing && action) {
        await updateTreatmentAction(action.id, payload);
      } else {
        await createTreatmentAction(treatmentPlanId, payload);
      }
      
      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (err: unknown) {
      console.error("Error saving action:", err);
      setError(err instanceof Error ? err.message : "Failed to save action");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) resetForm();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            {isEditing ? `Edit Action - ${action.actionId}` : "Add Action"}
          </DialogTitle>
          <DialogDescription>
            Define an action item for this treatment plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actionId">Action ID *</Label>
                <Input
                  id="actionId"
                  value={form.actionId}
                  onChange={(e) => setForm({ ...form, actionId: e.target.value })}
                  placeholder="e.g., TP-001-A01"
                  disabled={isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as ActionStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional details about this action..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as TreatmentPriority })}
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
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  placeholder="e.g., 8"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualHours">Actual Hours</Label>
                <Input
                  id="actualHours"
                  type="number"
                  value={form.actualHours}
                  onChange={(e) => setForm({ ...form, actualHours: e.target.value })}
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
            </div>

            {form.status === "COMPLETED" && (
              <div className="space-y-2">
                <Label htmlFor="completionNotes">Completion Notes</Label>
                <Textarea
                  id="completionNotes"
                  value={form.completionNotes}
                  onChange={(e) => setForm({ ...form, completionNotes: e.target.value })}
                  placeholder="Notes about completion..."
                  rows={2}
                />
              </div>
            )}

            {form.status === "BLOCKED" && (
              <div className="space-y-2">
                <Label htmlFor="blockerNotes">Blocker Notes</Label>
                <Textarea
                  id="blockerNotes"
                  value={form.blockerNotes}
                  onChange={(e) => setForm({ ...form, blockerNotes: e.target.value })}
                  placeholder="What is blocking this action?"
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Adding..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Add Action"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
