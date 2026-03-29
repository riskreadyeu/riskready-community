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
import { useZodForm, z } from "@/lib/form-utils";
import { FieldErrorMessage } from "@/components/common/form-field";

const actionSchema = z.object({
  actionId: z.string().min(1, "Action ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"]).default("NOT_STARTED"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().optional().default(""),
  estimatedHours: z.string().optional().default(""),
  actualHours: z.string().optional().default(""),
  completionNotes: z.string().optional().default(""),
  blockerNotes: z.string().optional().default(""),
});

type ActionFormValues = z.infer<typeof actionSchema>;

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

  const form = useZodForm(actionSchema, {
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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const status = watch("status");

  useEffect(() => {
    if (action) {
      reset({
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
      reset({
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
    }
  }, [action, reset]);

  const onSubmit = handleSubmit(async (data: ActionFormValues) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        actionId: data.actionId,
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : undefined,
        actualHours: data.actualHours ? parseInt(data.actualHours) : undefined,
        completionNotes: data.completionNotes || undefined,
        blockerNotes: data.blockerNotes || undefined,
      };

      if (isEditing && action) {
        await updateTreatmentAction(action.id, payload);
      } else {
        await createTreatmentAction(treatmentPlanId, payload);
      }

      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) reset();
    } catch (err: unknown) {
      console.error("Error saving action:", err);
      setError(err instanceof Error ? err.message : "Failed to save action");
    } finally {
      setSaving(false);
    }
  });

  const handleClose = () => {
    if (!isEditing) reset();
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

        <form onSubmit={onSubmit}>
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
                  {...register("actionId")}
                  placeholder="e.g., TP-001-A01"
                  disabled={isEditing}
                />
                <FieldErrorMessage error={errors.actionId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as ActionStatus, { shouldValidate: true })}
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
                {...register("title")}
                placeholder="What needs to be done?"
              />
              <FieldErrorMessage error={errors.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Additional details about this action..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={watch("priority")}
                  onValueChange={(v) => setValue("priority", v as TreatmentPriority, { shouldValidate: true })}
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
                  {...register("dueDate")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  {...register("estimatedHours")}
                  placeholder="e.g., 8"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualHours">Actual Hours</Label>
                <Input
                  id="actualHours"
                  type="number"
                  {...register("actualHours")}
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
            </div>

            {status === "COMPLETED" && (
              <div className="space-y-2">
                <Label htmlFor="completionNotes">Completion Notes</Label>
                <Textarea
                  id="completionNotes"
                  {...register("completionNotes")}
                  placeholder="Notes about completion..."
                  rows={2}
                />
              </div>
            )}

            {status === "BLOCKED" && (
              <div className="space-y-2">
                <Label htmlFor="blockerNotes">Blocker Notes</Label>
                <Textarea
                  id="blockerNotes"
                  {...register("blockerNotes")}
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
