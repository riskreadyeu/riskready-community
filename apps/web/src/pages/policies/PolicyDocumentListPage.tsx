
import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  FolderTree,
  Filter,
  Eye,
  Edit3,
  GitBranch,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListPageLayout } from "@/components/archer";
import { DataTable, StatusBadge, Column, RowAction } from "@/components/common";
import {
  getPolicies,
  type PolicyDocument,
  type DocumentType,
  type DocumentStatus,
} from "@/lib/policies-api";
import { cn } from "@/lib/utils";

const documentTypeLabels: Record<DocumentType, string> = {
  POLICY: "Policy",
  STANDARD: "Standard",
  PROCEDURE: "Procedure",
  WORK_INSTRUCTION: "Work Instruction",
  FORM: "Form",
  TEMPLATE: "Template",
  CHECKLIST: "Checklist",
  GUIDELINE: "Guideline",
  RECORD: "Record",
};

const documentTypeColors: Record<string, string> = {
  POLICY: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  STANDARD: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  PROCEDURE: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  WORK_INSTRUCTION: "bg-green-500/10 text-green-500 border-green-500/30",
  FORM: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  TEMPLATE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  CHECKLIST: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  GUIDELINE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  RECORD: "bg-pink-500/10 text-pink-500 border-pink-500/30",
};

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  DRAFT: "secondary",
  PENDING_REVIEW: "warning",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  PUBLISHED: "success",
  UNDER_REVISION: "default",
  SUPERSEDED: "secondary",
  RETIRED: "destructive",
  ARCHIVED: "secondary",
};

export default function PolicyDocumentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">(
    (searchParams.get("type") as DocumentType) || "all"
  );
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">(
    (searchParams.get("status") as DocumentStatus) || "all"
  );

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPolicies({
        skip: (page - 1) * pageSize,
        take: pageSize,
        search: searchQuery || undefined,
        documentType: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setDocuments(response.results);
      setTotalCount(response.count);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    setSearchParams(params, { replace: true });
  }, [searchQuery, typeFilter, statusFilter, setSearchParams]);

  const columns: Column<PolicyDocument>[] = [
    {
      key: "documentId",
      header: "ID",
      className: "w-[100px]",
      render: (doc) => (
        <span className="font-mono text-xs text-muted-foreground">{doc.documentId}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      className: "min-w-[200px]",
      render: (doc) => (
        <div>
          <Link
            to={`/policies/documents/${doc.id}`}
            className="font-medium hover:text-primary transition-colors line-clamp-1"
          >
            {doc.title}
          </Link>
          {doc.parentDocument && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <FolderTree className="w-3 h-3" />
              {doc.parentDocument.documentId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "documentType",
      header: "Type",
      className: "w-[110px]",
      render: (doc) => (
        <Badge variant="outline" className={cn("text-xs", documentTypeColors[doc.documentType] || "")}>
          {documentTypeLabels[doc.documentType] || doc.documentType}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[110px]",
      render: (doc) => (
        <StatusBadge
          status={doc.status.replace(/_/g, " ")}
          variant={statusVariants[doc.status] || "default"}
        />
      ),
    },
    {
      key: "version",
      header: "Ver",
      className: "w-[60px]",
      render: (doc) => (
        <span className="text-xs text-muted-foreground">v{doc.version}</span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      className: "min-w-[200px]",
      render: (doc) => (
        <span className="text-sm">
          {doc.owner
            ? `${doc.owner.firstName || ""} ${doc.owner.lastName || ""}`.trim() || doc.owner.email
            : doc.documentOwner}
        </span>
      ),
    },
    {
      key: "nextReviewDate",
      header: "Review Date",
      className: "w-[110px]",
      sortable: true,
      render: (doc) => {
        if (!doc.nextReviewDate) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
        const date = new Date(doc.nextReviewDate);
        const isOverdue = date < new Date();
        const isDueSoon = !isOverdue && date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue && "text-destructive",
            isDueSoon && !isOverdue && "text-warning"
          )}>
            {isOverdue && <Clock className="w-3 h-3" />}
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
  ];

  const rowActions: RowAction<PolicyDocument>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (doc) => `/policies/documents/${doc.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      href: (doc) => `/policies/documents/${doc.id}/edit`,
    },
    {
      label: "Version History",
      icon: <GitBranch className="w-4 h-4" />,
      href: (doc) => `/policies/documents/${doc.id}/versions`,
    },
    {
      label: "Submit for Approval",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
      hidden: (doc) => doc.status !== "DRAFT" && doc.status !== "UNDER_REVISION",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive",
      separator: true,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
      hidden: (doc) => doc.status === "PUBLISHED" || doc.status === "APPROVED",
    },
  ];

  return (
    <ListPageLayout
      title="Policy Documents"
      description="Manage all policies, standards, procedures, and work instructions"
      breadcrumbs={[
        { label: "Policies", href: "/policies" },
        { label: "Documents" },
      ]}
      actions={
        <div className="flex gap-2">
          <Link to="/policies/hierarchy">
            <Button variant="outline" size="sm">
              <FolderTree className="h-4 w-4 mr-2" />
              Hierarchy View
            </Button>
          </Link>
          <Link to="/policies/documents/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </Link>
        </div>
      }
    >
      <DataTable
        data={documents}
        columns={columns}
        keyExtractor={(doc) => doc.id}
        rowActions={rowActions}
        rowHref={(doc) => `/policies/documents/${doc.id}`}
        loading={loading}
        emptyMessage="No documents found"
        pagination={{
          page,
          pageSize,
          total: totalCount,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        filterSlot={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 w-64 bg-secondary/50 border-border"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as DocumentType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 bg-secondary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(documentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as DocumentStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="UNDER_REVISION">Under Revision</SelectItem>
                <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </ListPageLayout>
  );
}
