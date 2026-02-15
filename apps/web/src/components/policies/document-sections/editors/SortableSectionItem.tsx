import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "../types";
import { iconMap } from "./icon-map";
import { SectionContentEditor } from "./SectionContentEditor";
import type { EditorSection } from "../types";

interface SortableSectionItemProps {
  section: EditorSection;
  onToggleVisibility: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<EditorSection>) => void;
  onDeleteSection: (id: string) => void;
}

export function SortableSectionItem({
  section,
  onToggleVisibility,
  onToggleCollapse,
  onUpdateSection,
  onDeleteSection,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const iconName = SECTION_ICONS[section.type];
  const Icon = iconMap[iconName] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg bg-card",
        !section.isVisible && "opacity-50"
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-muted p-1 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => onToggleCollapse(section.id)}
          className="p-1 hover:bg-muted rounded"
        >
          {section.isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className="p-1.5 rounded bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <Input
          value={section.title}
          onChange={(e) => onUpdateSection(section.id, { title: e.target.value })}
          className="flex-1 h-8 text-sm font-medium"
        />

        <Badge variant="outline" className="text-[10px]">
          {section.type}
        </Badge>

        <button
          onClick={() => onToggleVisibility(section.id)}
          className="p-1.5 hover:bg-muted rounded"
          title={section.isVisible ? "Hide section" : "Show section"}
        >
          {section.isVisible ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => onDeleteSection(section.id)}
          className="p-1.5 hover:bg-destructive/10 rounded text-destructive"
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Section Content Editor */}
      {!section.isCollapsed && (
        <div className="p-4">
          <SectionContentEditor
            section={section}
            onUpdate={(updates) => onUpdateSection(section.id, updates)}
          />
        </div>
      )}
    </div>
  );
}
