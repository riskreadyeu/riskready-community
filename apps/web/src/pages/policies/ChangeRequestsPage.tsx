
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Clock,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, DataTable, StatusBadge, Column, RowAction } from "@/components/common";
import {
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type ChangeRequest,
  type ChangeRequestStatus,
} from "@/lib/policies-api";

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  SUBMITTED: "default",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  IN_PROGRESS: "warning",
  IMPLEMENTED: "success",
  VERIFIED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

const changeTypeColors: Record<string, string> = {
  INITIAL: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  MINOR_UPDATE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  CLARIFICATION: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  ENHANCEMENT: "bg-green-500/10 text-green-500 border-green-500/30",
  CORRECTION: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  REGULATORY_UPDATE: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  MAJOR_REVISION: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  RESTRUCTURE: "bg-red-500/10 text-red-500 border-red-500/30",
};

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-500 border-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  LOW: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

export default function ChangeRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<ChangeRequestStatus | "all">("all");

  const loadChangeRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getChangeRequests({
        skip: (page - 1) * pageSize,
        take: pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setChangeRequests(response.results);
      setTotalCount(response.count);
    } catch (err) {
      console.error("Error loading change requests:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    loadChangeRequests();
  }, [loadChangeRequests]);

  const handleApprove = async (cr: ChangeRequest) => {
    try {
      await approveChangeRequest(cr.id, {
        approvedById: "current-user-id", // TODO: Get from auth context
        approvalComments: "Approved",
      });
      loadChangeRequests();
    } catch (err) {
      console.error("Error approving change request:", err);
    }
  };

  const handleReject = async (cr: ChangeRequest) => {
    try {
      await rejectChangeRequest(cr.id, {
        approvedById: "current-user-id", // TODO: Get from auth context
        approvalComments: "Rejected",
      });
      loadChangeRequests();
    } catch (err) {
      console.error("Error rejecting change request:", err);
    }
  };

  const columns: Column<ChangeRequest>[] = [
    {
      key: "changeRequestId",
      header: "ID",
      className: "w-[100px]",
      render: (cr) => (
        <span className="font-mono text-xs text-muted-foreground">{cr.changeRequestId}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (cr) => (
        <div>
          <p className="font-medium">{cr.title}</p>
          {cr.document && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <FileText className="w-3 h-3" />
              {cr.document.documentId} - {cr.document.title}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "changeType",
      header: "Type",
      className: "w-[130px]",
      render: (cr) => (
        <Badge variant="outline" className={changeTypeColors[cr.changeType] || ""}>
          {cr.changeType.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      className: "w-[100px]",
      render: (cr) => (
        <Badge variant="outline" className={priorityColors[cr.priority] || ""}>
          {cr.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[130px]",
      render: (cr) => (
        <StatusBadge
          status={cr.status.replace(/_/g, " ")}
          variant={statusVariants[cr.status] || "default"}
        />
      ),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      className: "w-[150px]",
      render: (cr) => (
        <span className="text-sm">
          {cr.requestedBy
            ? `${cr.requestedBy.firstName || ""} ${cr.requestedBy.lastName || ""}`.trim()
            : "-"}
        </span>
      ),
    },
    {
      key: "targetDate",
      header: "Target Date",
      className: "w-[110px]",
      render: (cr) => {
        if (!cr.targetDate) return <span className="text-muted-foreground">-</span>;
        const date = new Date(cr.targetDate);
        const isOverdue = cr.status !== "IMPLEMENTED" && cr.status !== "VERIFIED" && date < new Date();
        return (
          <span className={isOverdue ? "text-destructive" : ""}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  const rowActions: RowAction<ChangeRequest>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
    },
    {
      label: "Approve",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: handleApprove,
      hidden: (cr) => cr.status !== "SUBMITTED" && cr.status !== "UNDER_REVIEW",
    },
    {
      label: "Reject",
      icon: <XCircle className="w-4 h-4" />,
      variant: "destructive",
      onClick: handleReject,
      hidden: (cr) => cr.status !== "SUBMITTED" && cr.status !== "UNDER_REVIEW",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Change Requests"
        description="Manage document change requests and track their implementation"
        actions={
          <Button size="sm" onClick={() => toast.info("Create records via Claude Code or Claude Desktop using MCP tools")}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        }
      />

      <DataTable
        data={changeRequests}
        columns={columns}
        keyExtractor={(cr) => cr.id}
        rowActions={rowActions}
        loading={loading}
        emptyMessage="No change requests found"
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
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ChangeRequestStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
