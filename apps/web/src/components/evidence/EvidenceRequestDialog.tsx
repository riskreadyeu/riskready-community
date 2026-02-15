import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  type EvidenceType,
  type EvidenceRequestPriority,
  type CreateEvidenceRequestInput,
  createEvidenceRequest,
} from "@/lib/evidence-api";

interface EvidenceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string;
  contextType?: string;
  contextId?: string;
  contextRef?: string;
}

const evidenceTypes: { value: EvidenceType; label: string }[] = [
  { value: "DOCUMENT", label: "Document" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "REPORT", label: "Report" },
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "LOG", label: "Log File" },
  { value: "CONFIGURATION", label: "Configuration" },
  { value: "AUDIT_REPORT", label: "Audit Report" },
  { value: "ASSESSMENT_RESULT", label: "Assessment Result" },
  { value: "TEST_RESULT", label: "Test Result" },
  { value: "SCAN_RESULT", label: "Scan Result" },
  { value: "OTHER", label: "Other" },
];

const priorityOptions: { value: EvidenceRequestPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "text-muted-foreground" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-500" },
  { value: "HIGH", label: "High", color: "text-amber-500" },
  { value: "CRITICAL", label: "Critical", color: "text-red-500" },
];

interface FormData {
  title: string;
  description: string;
  evidenceType: EvidenceType | "";
  requiredFormat: string;
  acceptanceCriteria: string;
  priority: EvidenceRequestPriority;
  dueDate: string;
}

export function EvidenceRequestDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  contextType,
  contextId,
  contextRef,
}: EvidenceRequestDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      evidenceType: "",
      requiredFormat: "",
      acceptanceCriteria: "",
      priority: "MEDIUM",
      dueDate: "",
    },
  });

  const evidenceType = watch("evidenceType");
  const priority = watch("priority");

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const input: CreateEvidenceRequestInput = {
        title: data.title,
        description: data.description,
        evidenceType: data.evidenceType || undefined,
        requiredFormat: data.requiredFormat || undefined,
        acceptanceCriteria: data.acceptanceCriteria || undefined,
        priority: data.priority,
        dueDate: data.dueDate,
        contextType,
        contextId,
        contextRef,
        requestedById: userId,
        createdById: userId,
      };

      await createEvidenceRequest(input);
      
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create evidence request:", err);
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  // Calculate default due date (2 weeks from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Request Evidence
          </DialogTitle>
          <DialogDescription>
            Create a request for evidence from stakeholders
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Q4 Access Review Evidence"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what evidence is needed and why..."
              rows={3}
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Type & Priority */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Evidence Type</Label>
              <Select
                value={evidenceType}
                onValueChange={(v) => setValue("evidenceType", v as EvidenceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  {evidenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue("priority", v as EvidenceRequestPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              defaultValue={getDefaultDueDate()}
              {...register("dueDate", { required: "Due date is required" })}
            />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Required Format */}
          <div className="space-y-2">
            <Label htmlFor="requiredFormat">Required Format</Label>
            <Input
              id="requiredFormat"
              placeholder="e.g., PDF, screenshot, CSV export"
              {...register("requiredFormat")}
            />
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              placeholder="Describe what makes the evidence acceptable..."
              rows={2}
              {...register("acceptanceCriteria")}
            />
          </div>

          {contextRef && (
            <div className="p-3 rounded-lg bg-secondary/30 text-sm">
              <span className="text-muted-foreground">Linked to: </span>
              <span className="font-medium">{contextRef}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

