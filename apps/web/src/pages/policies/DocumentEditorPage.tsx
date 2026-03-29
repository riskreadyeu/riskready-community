
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Eye,
  ChevronRight,
  FileText,
  Undo,
  Redo,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DocumentEditor,
  DocumentRenderer,
  SECTION_TEMPLATES,
  SECTION_LABELS,
  type EditorSection,
  type DocumentType,
  type DocumentSectionType,
  type PolicyDocumentData,
} from "@/components/policies/document-sections";
import { getPolicy, type PolicyDocument } from "@/lib/policies-api";

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState<PolicyDocument | null>(null);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [hasChanges, setHasChanges] = useState(false);

  // Load document
  useEffect(() => {
    if (!id) {
      // New document - initialize with template
      initializeNewDocument("POLICY");
      setLoading(false);
      return;
    }

    loadDocument(id);
  }, [id]);

  const loadDocument = async (docId: string) => {
    try {
      setLoading(true);
      const doc = await getPolicy(docId);
      setDocument(doc);

      // Convert document to editor sections
      const editorSections = documentToSections(doc);
      setSections(editorSections);
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  // Initialize sections for a new document
  const initializeNewDocument = (type: DocumentType) => {
    const template = SECTION_TEMPLATES[type];
    const initialSections: EditorSection[] = template.map((sectionType, index) => ({
      id: `section-${Date.now()}-${index}`,
      type: sectionType,
      title: SECTION_LABELS[sectionType],
      order: index,
      isVisible: true,
      isCollapsed: true,
    }));
    setSections(initialSections);
  };

  // Convert a PolicyDocument to EditorSections
  const documentToSections = (doc: PolicyDocument): EditorSection[] => {
    const type = doc.documentType as DocumentType;
    const template = SECTION_TEMPLATES[type] || SECTION_TEMPLATES.POLICY;
    
    return template.map((sectionType, index) => {
      const section: EditorSection = {
        id: `section-${index}`,
        type: sectionType,
        title: SECTION_LABELS[sectionType],
        order: index,
        isVisible: true,
        isCollapsed: true,
      };

      // Populate content based on section type
      switch (sectionType) {
        case "PURPOSE":
          section.content = doc.purpose || "";
          break;
        case "SCOPE":
          section.content = doc.scope || "";
          break;
        case "POLICY_STATEMENTS":
        case "REQUIREMENTS":
          section.content = doc.content || "";
          break;
        // Add more mappings as needed
      }

      return section;
    });
  };

  // Handle section changes
  const handleSectionsChange = useCallback((newSections: EditorSection[]) => {
    setSections(newSections);
    setHasChanges(true);
  }, []);

  // Build preview data
  const buildPreviewData = (): PolicyDocumentData => {
    const purposeSection = sections.find((s) => s.type === "PURPOSE");
    const scopeSection = sections.find((s) => s.type === "SCOPE");
    const contentSection = sections.find(
      (s) => s.type === "POLICY_STATEMENTS" || s.type === "REQUIREMENTS"
    );

    return {
      id: document?.id || "new",
      documentId: document?.documentId || "NEW-001",
      title: document?.title || "New Document",
      documentType: (document?.documentType as DocumentType) || "POLICY",
      classification: document?.classification || "INTERNAL",
      status: document?.status || "DRAFT",
      version: document?.version || "1.0",
      documentOwner: document?.documentOwner || "Not assigned",
      author: document?.author || "Current User",
      reviewFrequency: document?.reviewFrequency || "ANNUAL",
      purpose: purposeSection?.content || "",
      scope: scopeSection?.content || "",
      content: contentSection?.content || "",
    };
  };

  // Save document
  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement save API call
      // For now, just show success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasChanges(false);
      toast.success("Document saved successfully");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link
                to="/policies/documents"
                className="hover:text-foreground transition-colors"
              >
                Documents
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span>{document?.documentId || "New Document"}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Edit</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "edit" | "preview")}>
              <TabsList className="h-9">
                <TabsTrigger value="edit" className="text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="sm"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {previewMode === "edit" ? (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {document ? `Edit: ${document.title}` : "Create New Document"}
              </h1>
              <div className="flex items-center gap-3">
                {document && (
                  <>
                    <Badge variant="outline">
                      {document.documentType.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline">{document.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      v{document.version}
                    </span>
                  </>
                )}
                {!document && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Document Type:</span>
                    <Select
                      defaultValue="POLICY"
                      onValueChange={(v) => initializeNewDocument(v as DocumentType)}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POLICY">Policy</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="PROCEDURE">Procedure</SelectItem>
                        <SelectItem value="WORK_INSTRUCTION">Work Instruction</SelectItem>
                        <SelectItem value="GUIDELINE">Guideline</SelectItem>
                        <SelectItem value="CHECKLIST">Checklist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DocumentEditor
              documentType={(document?.documentType as DocumentType) || "POLICY"}
              sections={sections}
              onChange={handleSectionsChange}
            />
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Preview Mode - This is how the document will appear to viewers</span>
              </div>
            </div>
            <DocumentRenderer
              document={buildPreviewData()}
              showTableOfContents
            />
          </div>
        )}
      </div>
    </div>
  );
}
