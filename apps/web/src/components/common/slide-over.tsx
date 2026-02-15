import { ReactNode } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: SlideOverProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full bg-background shadow-xl border-l",
          "flex flex-col",
          "animate-in slide-in-from-right duration-300",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t px-6 py-4 bg-muted/30">{footer}</div>
        )}
      </div>
    </>
  );
}

interface SlideOverFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function SlideOverForm({
  open,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  isValid = true,
  size = "md",
}: SlideOverFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button onClick={() => onSubmit()} disabled={isSubmitting || !isValid}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </SlideOver>
  );
}
