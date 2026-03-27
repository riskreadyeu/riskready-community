"use client";

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Link2,
  FileText,
  FileCheck,
  FileCog,
  FileStack,
  File,
  ExternalLink,
  FolderTree,
  ClipboardList,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RelatedDocumentEntry } from "./types";

interface RelatedDocumentsProps {
  documents: RelatedDocumentEntry[];
  title?: string;
  sectionNumber?: string;
  className?: string;
}

// Category configuration matching actual document structure
const categoryConfig: Record<string, { label: string; icon: React.ElementType; order: number }> = {
  PARENT: { label: "Parent Policy", icon: FolderTree, order: 1 },
  SUPPORTING_POLICY: { label: "Supporting Policies", icon: FileCheck, order: 2 },
  SUPPORTING_STANDARD: { label: "Supporting Standards and Procedures", icon: FileCog, order: 3 },
  SUPPORTING_PROCEDURE: { label: "Supporting Standards and Procedures", icon: FileStack, order: 3 },
  TEMPLATE: { label: "Templates and Forms", icon: FileSpreadsheet, order: 4 },
  FORM: { label: "Templates and Forms", icon: ClipboardList, order: 4 },
  EXTERNAL: { label: "External References", icon: BookOpen, order: 5 },
};

// Determine document type icon based on document ID prefix
const getDocumentIcon = (documentId: string) => {
  if (documentId.startsWith("POL")) return FileCheck;
  if (documentId.startsWith("STD")) return FileCog;
  if (documentId.startsWith("PRO") || documentId.startsWith("PROC")) return FileStack;
  if (documentId.startsWith("FRM")) return ClipboardList;
  if (documentId.startsWith("TMP")) return FileSpreadsheet;
  return File;
};

export function RelatedDocuments({
  documents,
  title = "Related Documents",
  sectionNumber,
  className,
}: RelatedDocumentsProps) {
  // Group by category
  const grouped = documents.reduce((acc, doc) => {
    const category = doc.category || "EXTERNAL";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, RelatedDocumentEntry[]>);

  // Sort categories by order
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const orderA = categoryConfig[a]?.order || 99;
    const orderB = categoryConfig[b]?.order || 99;
    return orderA - orderB;
  });

  // Merge categories with same label (e.g., SUPPORTING_STANDARD and SUPPORTING_PROCEDURE)
  const mergedCategories: Array<{ label: string; icon: React.ElementType; documents: RelatedDocumentEntry[] }> = [];
  sortedCategories.forEach(([category, docs]) => {
    const config = categoryConfig[category] || { label: category, icon: FileText, order: 99 };
    const existing = mergedCategories.find(c => c.label === config.label);
    if (existing) {
      existing.documents.push(...docs);
    } else {
      mergedCategories.push({ label: config.label, icon: config.icon, documents: docs });
    }
  });

  const renderDocumentTable = (docs: RelatedDocumentEntry[]) => (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-32">
              Document ID
            </th>
            <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Document Name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {docs.map((doc, index) => {
            const Icon = getDocumentIcon(doc.documentId);
            const isExternal = doc.url && (doc.url.startsWith("http") || doc.category === "EXTERNAL");

            return (
              <tr
                key={index}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  index % 2 === 0 ? "bg-background" : "bg-muted/10"
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    to={doc.url || `/policies/documents/${doc.documentId}`}
                    target={isExternal ? "_blank" : undefined}
                    className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {doc.documentId}
                    {isExternal && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={doc.url || `/policies/documents/${doc.documentId}`}
                    target={isExternal ? "_blank" : undefined}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {doc.title}
                    {doc.description && (
                      <span className="text-muted-foreground ml-1">— {doc.description}</span>
                    )}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-5 w-5 text-primary" />
          {sectionNumber && <span className="text-muted-foreground">{sectionNumber}.</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No related documents</p>
          </div>
        ) : (
          <div className="space-y-8">
            {mergedCategories.map(({ label, icon: Icon, documents: docs }, catIndex) => (
              <div key={label}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">
                    {sectionNumber ? `${sectionNumber}.${catIndex + 1}` : ""} {label}
                  </h4>
                </div>

                {/* Documents Table */}
                {renderDocumentTable(docs)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
