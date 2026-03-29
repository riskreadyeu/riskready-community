
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  GitBranch,
  GitCommit,
  Clock,
  User,
  ArrowLeft,
  ArrowLeftRight,
  FileText,
  Check,
  AlertCircle,
  ChevronDown,
  Diff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getPolicies,
  getVersions,
  compareVersions,
  PolicyDocument,
  DocumentVersion,
  ChangeType,
} from "@/lib/policies-api";

// Change type badges
const changeTypeBadges: Record<ChangeType, { label: string; color: string }> = {
  INITIAL: { label: "Initial", color: "bg-blue-500" },
  MINOR_UPDATE: { label: "Minor Update", color: "bg-gray-500" },
  CLARIFICATION: { label: "Clarification", color: "bg-purple-500" },
  ENHANCEMENT: { label: "Enhancement", color: "bg-green-500" },
  CORRECTION: { label: "Correction", color: "bg-yellow-500" },
  REGULATORY_UPDATE: { label: "Regulatory", color: "bg-red-500" },
  MAJOR_REVISION: { label: "Major Revision", color: "bg-orange-500" },
  RESTRUCTURE: { label: "Restructure", color: "bg-pink-500" },
};

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldVersion: string;
  newVersion: string;
}

function DiffViewer({ oldContent, newContent, oldVersion, newVersion }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  // Simple diff highlighting - in production use a proper diff library
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Create a simple unified diff view
  const createDiff = () => {
    const changes: Array<{ type: "add" | "remove" | "same"; line: string; oldNum?: number; newNum?: number }> = [];
    let oldNum = 1;
    let newNum = 1;

    // Simple line-by-line comparison (not optimal but works for demo)
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        changes.push({ type: "same", line: oldLine || "", oldNum: oldNum++, newNum: newNum++ });
      } else {
        if (oldLine !== undefined) {
          changes.push({ type: "remove", line: oldLine, oldNum: oldNum++ });
        }
        if (newLine !== undefined) {
          changes.push({ type: "add", line: newLine, newNum: newNum++ });
        }
      }
    }
    return changes;
  };

  const diff = createDiff();

  if (viewMode === "split") {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b bg-muted/50">
          <div className="flex-1 px-4 py-2 border-r">
            <span className="text-sm font-medium">Version {oldVersion}</span>
          </div>
          <div className="flex-1 px-4 py-2">
            <span className="text-sm font-medium">Version {newVersion}</span>
          </div>
        </div>
        <div className="flex max-h-[500px] overflow-auto">
          {/* Old version */}
          <ScrollArea className="flex-1 border-r">
            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
              {oldLines.map((line, i) => {
                const isRemoved = newLines[i] !== line;
                return (
                  <div
                    key={i}
                    className={cn(
                      "px-2 py-0.5 -mx-2",
                      isRemoved && "bg-red-100 dark:bg-red-950"
                    )}
                  >
                    <span className="text-muted-foreground mr-4 select-none w-8 inline-block text-right">
                      {i + 1}
                    </span>
                    {line}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {/* New version */}
          <ScrollArea className="flex-1">
            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
              {newLines.map((line, i) => {
                const isAdded = oldLines[i] !== line;
                return (
                  <div
                    key={i}
                    className={cn(
                      "px-2 py-0.5 -mx-2",
                      isAdded && "bg-green-100 dark:bg-green-950"
                    )}
                  >
                    <span className="text-muted-foreground mr-4 select-none w-8 inline-block text-right">
                      {i + 1}
                    </span>
                    {line}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Unified view
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/50">
        <span className="text-sm font-medium">
          Comparing {oldVersion} → {newVersion}
        </span>
      </div>
      <ScrollArea className="max-h-[500px]">
        <div className="p-4 font-mono text-sm whitespace-pre-wrap">
          {diff.map((change, i) => (
            <div
              key={i}
              className={cn(
                "px-2 py-0.5 -mx-2",
                change.type === "add" && "bg-green-100 dark:bg-green-950",
                change.type === "remove" && "bg-red-100 dark:bg-red-950"
              )}
            >
              <span className="text-muted-foreground mr-2 select-none w-4 inline-block">
                {change.type === "add" ? "+" : change.type === "remove" ? "-" : " "}
              </span>
              <span className="text-muted-foreground mr-4 select-none w-8 inline-block text-right">
                {change.oldNum || change.newNum}
              </span>
              {change.line}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function VersionHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const documentIdParam = searchParams.get("documentId");

  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>(documentIdParam || "");
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [version1, setVersion1] = useState<DocumentVersion | null>(null);
  const [version2, setVersion2] = useState<DocumentVersion | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      loadVersions(selectedDocument);
      setSearchParams({ documentId: selectedDocument });
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await getPolicies({ take: 100 });
      setDocuments(data.results);
      if (documentIdParam && data.results.some((d) => d.id === documentIdParam)) {
        setSelectedDocument(documentIdParam);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (docId: string) => {
    try {
      setLoadingVersions(true);
      const data = await getVersions(docId);
      setVersions(data);
      // Reset comparison when document changes
      setCompareMode(false);
      setVersion1(null);
      setVersion2(null);
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleVersionSelect = (version: DocumentVersion) => {
    if (!compareMode) return;

    if (!version1) {
      setVersion1(version);
    } else if (!version2) {
      // Ensure version1 is older
      if (version.majorVersion < version1.majorVersion ||
          (version.majorVersion === version1.majorVersion && version.minorVersion < version1.minorVersion)) {
        setVersion2(version1);
        setVersion1(version);
      } else {
        setVersion2(version);
      }
    } else {
      // Start fresh selection
      setVersion1(version);
      setVersion2(null);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocument);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Version History</h1>
          <p className="text-muted-foreground">
            Track changes and compare document versions
          </p>
        </div>
      </div>

      {/* Document Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Select Document</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDocument} onValueChange={setSelectedDocument}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a document to view versions" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <span className="font-mono text-xs mr-2">{doc.documentId}</span>
                  {doc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDocument && (
        <>
          {/* Selected Document Info */}
          {selectedDoc && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono text-sm">{selectedDoc.documentId}</span>
                      <Badge variant="outline">v{selectedDoc.version}</Badge>
                    </div>
                    <h2 className="text-lg font-semibold">{selectedDoc.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {versions.length} version{versions.length !== 1 ? "s" : ""} recorded
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={compareMode ? "default" : "outline"}
                      onClick={() => {
                        setCompareMode(!compareMode);
                        if (compareMode) {
                          setVersion1(null);
                          setVersion2(null);
                        }
                      }}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      {compareMode ? "Exit Compare" : "Compare Versions"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/policies/documents/${selectedDocument}`)}
                    >
                      View Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compare Mode Instructions */}
          {compareMode && (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Diff className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-medium">Version Comparison Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      {!version1
                        ? "Click on a version to select it as the first version to compare"
                        : !version2
                        ? "Click on another version to compare against"
                        : "Comparing versions - click on new versions to change selection"}
                    </p>
                  </div>
                  {version1 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version1.version}</Badge>
                      {version2 && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline">v{version2.version}</Badge>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diff Viewer */}
          {compareMode && version1 && version2 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Comparison</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "split" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("split")}
                    >
                      Split
                    </Button>
                    <Button
                      variant={viewMode === "unified" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("unified")}
                    >
                      Unified
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DiffViewer
                  oldContent={version1.content}
                  newContent={version2.content}
                  oldVersion={version1.version}
                  newVersion={version2.version}
                />
              </CardContent>
            </Card>
          )}

          {/* Version Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version Timeline</CardTitle>
              <CardDescription>Complete history of document changes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No version history</h3>
                  <p className="text-muted-foreground">
                    This document hasn't been modified since creation
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Version items */}
                  <div className="space-y-6">
                    {versions.map((version, index) => {
                      const changeType = changeTypeBadges[version.changeType];
                      const isSelected = version1?.id === version.id || version2?.id === version.id;
                      const selectionNum = version1?.id === version.id ? 1 : version2?.id === version.id ? 2 : null;

                      return (
                        <div
                          key={version.id}
                          className={cn(
                            "relative flex items-start gap-4 pl-12 cursor-pointer group",
                            compareMode && "hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg",
                            isSelected && "bg-primary/5"
                          )}
                          onClick={() => compareMode && handleVersionSelect(version)}
                        >
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              "absolute left-4 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center text-[10px] font-bold",
                              index === 0 ? "bg-primary" : "bg-muted-foreground/30",
                              isSelected && "ring-2 ring-primary ring-offset-2"
                            )}
                          >
                            {selectionNum}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-semibold">v{version.version}</span>
                              <Badge
                                variant="outline"
                                className={cn("text-white", changeType.color)}
                              >
                                {changeType.label}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="default" className="text-[10px]">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-1">{version.changeDescription}</p>
                            {version.changeSummary && (
                              <p className="text-sm text-muted-foreground">{version.changeSummary}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {version.createdBy?.firstName} {version.createdBy?.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(version.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          {!compareMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                // View this version
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
