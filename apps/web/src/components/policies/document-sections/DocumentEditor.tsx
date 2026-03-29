
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Save, FileText } from "lucide-react";
import {
  SECTION_LABELS,
  type DocumentType,
  type DocumentSectionType,
  type EditorSection,
} from "./types";
import { SortableSectionItem, AddSectionDialog } from "./editors";

// Re-export EditorSection for backward compatibility
export type { EditorSection } from "./types";

interface DocumentEditorProps {
  documentType: DocumentType;
  sections: EditorSection[];
  onChange: (sections: EditorSection[]) => void;
  onSave?: () => void;
  className?: string;
}

// Main Document Editor Component
export function DocumentEditor({
  documentType,
  sections,
  onChange,
  onSave,
  className,
}: DocumentEditorProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        const newSections = [...sections];
        const [removed] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, removed!);

        // Update order numbers
        newSections.forEach((s, i) => {
          s.order = i;
        });

        onChange(newSections);
      }
    },
    [sections, onChange]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      onChange(
        sections.map((s) =>
          s.id === id ? { ...s, isVisible: !s.isVisible } : s
        )
      );
    },
    [sections, onChange]
  );

  const toggleCollapse = useCallback(
    (id: string) => {
      onChange(
        sections.map((s) =>
          s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s
        )
      );
    },
    [sections, onChange]
  );

  const updateSection = useCallback(
    (id: string, updates: Partial<EditorSection>) => {
      onChange(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    },
    [sections, onChange]
  );

  const deleteSection = useCallback(
    (id: string) => {
      onChange(sections.filter((s) => s.id !== id));
    },
    [sections, onChange]
  );

  const addSection = useCallback(
    (type: DocumentSectionType) => {
      const newSection: EditorSection = {
        id: `section-${Date.now()}`,
        type,
        title: SECTION_LABELS[type],
        order: sections.length,
        isVisible: true,
        isCollapsed: false,
      };
      onChange([...sections, newSection]);
    },
    [sections, onChange]
  );

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {documentType}
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          {onSave && (
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Sections List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onToggleVisibility={toggleVisibility}
                  onToggleCollapse={toggleCollapse}
                  onUpdateSection={updateSection}
                  onDeleteSection={deleteSection}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium mb-2">No sections yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add sections to start building your document.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Section
          </Button>
        </div>
      )}

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={addSection}
        documentType={documentType}
        existingSections={sections.map((s) => s.type)}
      />
    </div>
  );
}
