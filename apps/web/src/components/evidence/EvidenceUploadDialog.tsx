import { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, X, File, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  type EvidenceType,
  type EvidenceClassification,
  type CreateEvidenceInput,
  createEvidence,
} from "@/lib/evidence-api";

interface EvidenceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string;
}

const evidenceTypes: { value: EvidenceType; label: string }[] = [
  { value: "DOCUMENT", label: "Document" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "REPORT", label: "Report" },
  { value: "POLICY", label: "Policy" },
  { value: "PROCEDURE", label: "Procedure" },
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "LOG", label: "Log File" },
  { value: "CONFIGURATION", label: "Configuration" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING_NOTES", label: "Meeting Notes" },
  { value: "APPROVAL_RECORD", label: "Approval Record" },
  { value: "AUDIT_REPORT", label: "Audit Report" },
  { value: "ASSESSMENT_RESULT", label: "Assessment Result" },
  { value: "TEST_RESULT", label: "Test Result" },
  { value: "SCAN_RESULT", label: "Scan Result" },
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "OTHER", label: "Other" },
];

const classificationOptions: { value: EvidenceClassification; label: string; color: string }[] = [
  { value: "PUBLIC", label: "Public", color: "bg-green-500/10 text-green-500" },
  { value: "INTERNAL", label: "Internal", color: "bg-blue-500/10 text-blue-500" },
  { value: "CONFIDENTIAL", label: "Confidential", color: "bg-amber-500/10 text-amber-500" },
  { value: "RESTRICTED", label: "Restricted", color: "bg-red-500/10 text-red-500" },
];

interface FormData {
  title: string;
  description: string;
  evidenceType: EvidenceType;
  classification: EvidenceClassification;
  category: string;
  tags: string;
  validFrom: string;
  validUntil: string;
  notes: string;
}

export function EvidenceUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
}: EvidenceUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      evidenceType: "DOCUMENT",
      classification: "INTERNAL",
      category: "",
      tags: "",
      validFrom: "",
      validUntil: "",
      notes: "",
    },
  });

  const evidenceType = watch("evidenceType");
  const classification = watch("classification");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!watch("title")) {
        setValue("title", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!watch("title")) {
        setValue("title", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setUploading(true);
      setError(null);

      // In a real implementation, you would upload the file first
      // and get back a URL. For now, we'll create the evidence record
      // with placeholder file info.
      
      const input: CreateEvidenceInput = {
        title: data.title,
        description: data.description || undefined,
        evidenceType: data.evidenceType,
        classification: data.classification,
        category: data.category || undefined,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        validFrom: data.validFrom || undefined,
        validUntil: data.validUntil || undefined,
        notes: data.notes || undefined,
        createdById: userId,
        // File info (would come from upload service in real implementation)
        fileName: selectedFile?.name,
        originalFileName: selectedFile?.name,
        fileSizeBytes: selectedFile?.size,
        mimeType: selectedFile?.type,
        collectedAt: new Date().toISOString(),
        collectedById: userId,
      };

      await createEvidence(input);
      
      reset();
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create evidence:", err);
      setError(err instanceof Error ? err.message : "Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Evidence
          </DialogTitle>
          <DialogDescription>
            Upload a new piece of evidence to the central repository
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${selectedFile ? "bg-secondary/30" : ""}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-10 w-10 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-4"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a file here, or click to browse
                </p>
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                />
              </>
            )}
          </div>

          {/* Title & Description */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Evidence title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Access Control, Audit"
                {...register("category")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the evidence..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Type & Classification */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Evidence Type *</Label>
              <Select
                value={evidenceType}
                onValueChange={(v) => setValue("evidenceType", v as EvidenceType)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Classification *</Label>
              <Select
                value={classification}
                onValueChange={(v) => setValue("classification", v as EvidenceClassification)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classificationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={opt.color}>
                          {opt.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated tags (e.g., SOC2, access-review, Q4)"
              {...register("tags")}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Validity Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                {...register("validFrom")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                {...register("validUntil")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={2}
              {...register("notes")}
            />
          </div>

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
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

