
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  FolderTree,
  ChevronRight,
  ChevronDown,
  FileCheck,
  FileCog,
  FileStack,
  File,
  Search,
  Filter,
  Expand,
  Shrink,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPolicyHierarchy, PolicyDocument, DocumentType, DocumentStatus } from "@/lib/policies-api";

// Document type icons
const typeIcons: Record<DocumentType, typeof FileText> = {
  POLICY: FileCheck,
  STANDARD: FileCog,
  PROCEDURE: FileStack,
  WORK_INSTRUCTION: File,
  FORM: File,
  TEMPLATE: File,
  CHECKLIST: File,
  GUIDELINE: File,
  RECORD: File,
};

// Document type colors
const typeColors: Record<DocumentType, string> = {
  POLICY: "bg-blue-500",
  STANDARD: "bg-purple-500",
  PROCEDURE: "bg-green-500",
  WORK_INSTRUCTION: "bg-orange-500",
  FORM: "bg-gray-500",
  TEMPLATE: "bg-gray-500",
  CHECKLIST: "bg-gray-500",
  GUIDELINE: "bg-gray-500",
  RECORD: "bg-gray-500",
};

// Status badges
const statusBadges: Record<DocumentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_REVIEW: { label: "Pending Review", variant: "outline" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  PUBLISHED: { label: "Published", variant: "default" },
  UNDER_REVISION: { label: "Under Revision", variant: "secondary" },
  SUPERSEDED: { label: "Superseded", variant: "destructive" },
  RETIRED: { label: "Retired", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

interface TreeNodeProps {
  document: PolicyDocument;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  searchTerm: string;
}

function TreeNode({ document, level, expanded, onToggle, searchTerm }: TreeNodeProps) {
  const navigate = useNavigate();
  const hasChildren = document.childDocuments && document.childDocuments.length > 0;
  const isExpanded = expanded.has(document.id);
  const Icon = typeIcons[document.documentType] || FileText;
  const colorClass = typeColors[document.documentType] || "bg-gray-500";
  const statusInfo = statusBadges[document.status];

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Check if document matches search
  const matchesSearch =
    !searchTerm ||
    document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.documentId.toLowerCase().includes(searchTerm.toLowerCase());

  // Check if any children match
  const hasMatchingChildren = (doc: PolicyDocument): boolean => {
    if (!doc.childDocuments) return false;
    return doc.childDocuments.some(
      (child) =>
        child.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hasMatchingChildren(child)
    );
  };

  const shouldShow = !searchTerm || matchesSearch || hasMatchingChildren(document);

  if (!shouldShow) return null;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors",
          level > 0 && "ml-6"
        )}
        style={{ marginLeft: level * 24 }}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(document.id);
          }}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded hover:bg-muted",
            !hasChildren && "invisible"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Document type icon */}
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colorClass + "/10")}>
          <Icon className={cn("h-4 w-4", colorClass.replace("bg-", "text-"))} />
        </div>

        {/* Document info */}
        <div className="flex-1 min-w-0" onClick={() => navigate(`/policies/documents/${document.id}`)}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {highlightMatch(document.documentId)}
            </span>
            <Badge variant={statusInfo.variant} className="text-[10px] h-5">
              {statusInfo.label}
            </Badge>
          </div>
          <div className="text-sm font-medium truncate">{highlightMatch(document.title)}</div>
        </div>

        {/* Child count */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {document.childDocuments!.length} child{document.childDocuments!.length !== 1 ? "ren" : ""}
          </span>
        )}

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => navigate(`/policies/documents/${document.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-muted ml-6" style={{ marginLeft: level * 24 + 24 }}>
          {document.childDocuments!.map((child) => (
            <TreeNode
              key={child.id}
              document={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentHierarchyPage() {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<DocumentType | "ALL">("ALL");

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const data = await getPolicyHierarchy();
      setDocuments(data);
      // Auto-expand root level
      setExpanded(new Set(data.map((d) => d.id)));
    } catch (error) {
      console.error("Error loading hierarchy:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (docs: PolicyDocument[]) => {
      docs.forEach((doc) => {
        allIds.add(doc.id);
        if (doc.childDocuments) collectIds(doc.childDocuments);
      });
    };
    collectIds(documents);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Count documents by type
  const countByType = (docs: PolicyDocument[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    const count = (d: PolicyDocument[]) => {
      d.forEach((doc) => {
        counts[doc.documentType] = (counts[doc.documentType] || 0) + 1;
        if (doc.childDocuments) count(doc.childDocuments);
      });
    };
    count(docs);
    return counts;
  };

  const typeCounts = countByType(documents);

  // Filter documents
  const filteredDocuments = filterType === "ALL" 
    ? documents 
    : documents.filter((d) => {
        const matchesType = d.documentType === filterType;
        const hasMatchingChild = (doc: PolicyDocument): boolean => {
          if (doc.documentType === filterType) return true;
          return doc.childDocuments?.some(hasMatchingChild) || false;
        };
        return matchesType || hasMatchingChild(d);
      });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Hierarchy</h1>
          <p className="text-muted-foreground">
            Visual tree view of policy document structure
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {(["POLICY", "STANDARD", "PROCEDURE", "WORK_INSTRUCTION"] as DocumentType[]).map((type) => {
          const Icon = typeIcons[type];
          const colorClass = typeColors[type];
          return (
            <Card
              key={type}
              className={cn(
                "cursor-pointer transition-colors",
                filterType === type && "ring-2 ring-primary"
              )}
              onClick={() => setFilterType(filterType === type ? "ALL" : type)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {type.toLowerCase().replace("_", " ")}s
                </CardTitle>
                <div className={cn("p-2 rounded-lg", colorClass + "/10")}>
                  <Icon className={cn("h-4 w-4", colorClass.replace("bg-", "text-"))} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeCounts[type] || 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filterType !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  {filterType.toLowerCase().replace("_", " ")}
                  <button onClick={() => setFilterType("ALL")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <Expand className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <Shrink className="h-4 w-4 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search term"
                  : "Start by creating your first policy document"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => (
                <TreeNode
                  key={doc.id}
                  document={doc}
                  level={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Document Type Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(typeColors).slice(0, 4).map(([type, color]) => {
              const Icon = typeIcons[type as DocumentType];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("flex h-6 w-6 items-center justify-center rounded", color + "/10")}>
                    <Icon className={cn("h-3 w-3", color.replace("bg-", "text-"))} />
                  </div>
                  <span className="text-sm capitalize">{type.toLowerCase().replace("_", " ")}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
