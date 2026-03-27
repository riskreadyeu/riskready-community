"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentHeaderData, DocumentControlData } from "./types";

interface DocumentHeaderProps {
  data: DocumentHeaderData;
  documentControl?: DocumentControlData;
  className?: string;
}

const classificationColors: Record<string, string> = {
  PUBLIC: "bg-green-500/10 text-green-600 border-green-500/30",
  INTERNAL: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  CONFIDENTIAL: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  RESTRICTED: "bg-red-500/10 text-red-600 border-red-500/30",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  PENDING_REVIEW: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  APPROVED: "bg-green-500/10 text-green-600 border-green-500/30",
  PUBLISHED: "bg-green-500/10 text-green-600 border-green-500/30",
  UNDER_REVISION: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  SUPERSEDED: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  RETIRED: "bg-red-500/10 text-red-600 border-red-500/30",
  ARCHIVED: "bg-gray-500/10 text-gray-600 border-gray-500/30",
};

export function DocumentHeader({ data, documentControl, className }: DocumentHeaderProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Metadata rows - matches the actual markdown format
  const metadataRows = [
    { label: "Classification", value: data.classification, highlight: true },
    { label: "Policy ID", value: data.documentId },
    { label: "Version", value: data.version },
    { label: "Document Owner", value: data.documentOwner },
    { label: "Author", value: data.author },
    { label: "Approved by", value: data.approvedBy },
    { label: "Approval Date", value: formatDate(data.approvalDate) },
    { label: "Effective Date", value: formatDate(data.effectiveDate) },
    { label: "Review Frequency", value: data.reviewFrequency?.replace(/_/g, " ") },
    { label: "Next Review Date", value: formatDate(data.nextReviewDate) },
    { label: "Distribution", value: data.distribution?.join(", ") },
  ].filter(row => row.value && row.value !== "—");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Title */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <Badge variant="outline" className={statusColors[data.status] || ""}>
          {data.status?.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Inline Metadata - matches the actual policy header format */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {metadataRows.map((row, index) => (
              <div key={index} className="flex items-start">
                <span className="font-semibold text-sm w-40 shrink-0">{row.label}:</span>
                <span className={cn(
                  "text-sm",
                  row.highlight && classificationColors[row.value] && "px-2 py-0.5 rounded"
                )}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Control Table (for Standards/Procedures) */}
      {documentControl && (
        <>
          <Separator />
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-4">Document Control</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    {documentControl.documentType && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Document Type</td>
                        <td className="px-4 py-2 text-sm">{documentControl.documentType}</td>
                      </tr>
                    )}
                    {documentControl.parentPolicy && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Parent Policy</td>
                        <td className="px-4 py-2 text-sm">
                          {documentControl.parentPolicyId && (
                            <span className="font-mono text-xs text-muted-foreground mr-2">
                              {documentControl.parentPolicyId}
                            </span>
                          )}
                          {documentControl.parentPolicy}
                        </td>
                      </tr>
                    )}
                    {documentControl.distribution && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Distribution</td>
                        <td className="px-4 py-2 text-sm">{documentControl.distribution}</td>
                      </tr>
                    )}
                    {documentControl.confidentiality && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Confidentiality</td>
                        <td className="px-4 py-2 text-sm">{documentControl.confidentiality}</td>
                      </tr>
                    )}
                    {documentControl.approvalAuthority && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Approval Authority</td>
                        <td className="px-4 py-2 text-sm">{documentControl.approvalAuthority}</td>
                      </tr>
                    )}
                    {documentControl.implementationDate && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Implementation Date</td>
                        <td className="px-4 py-2 text-sm">{formatDate(documentControl.implementationDate)}</td>
                      </tr>
                    )}
                    {documentControl.compliance && (
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium w-1/3 bg-muted/50">Compliance</td>
                        <td className="px-4 py-2 text-sm">{documentControl.compliance}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
