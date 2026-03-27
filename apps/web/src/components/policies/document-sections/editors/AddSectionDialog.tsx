import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import {
  SECTION_TEMPLATES,
  SECTION_LABELS,
  SECTION_ICONS,
  type DocumentType,
  type DocumentSectionType,
} from "../types";
import { iconMap } from "./icon-map";

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: DocumentSectionType) => void;
  documentType: DocumentType;
  existingSections: DocumentSectionType[];
}

export function AddSectionDialog({
  open,
  onClose,
  onAdd,
  documentType,
  existingSections,
}: AddSectionDialogProps) {
  const availableSections = SECTION_TEMPLATES[documentType].filter(
    (type) => !existingSections.includes(type) || type === "CUSTOM"
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Select a section type to add to your document.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-4">
            {availableSections.map((type) => {
              const iconName = SECTION_ICONS[type];
              const Icon = iconMap[iconName] || FileText;
              return (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{SECTION_LABELS[type]}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
