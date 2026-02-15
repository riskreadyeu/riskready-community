"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Calendar,
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
  getExceptions,
  approveException,
  type DocumentException,
  type ExceptionStatus,
} from "@/lib/policies-api";
import { cn } from "@/lib/utils";

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  REQUESTED: "default",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  ACTIVE: "success",
  EXPIRED: "destructive",
  REVOKED: "destructive",
  CLOSED: "secondary",
};

const approvalLevelColors: Record<string, string> = {
  BOARD: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  EXECUTIVE: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  SENIOR_MANAGEMENT: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  MANAGEMENT: "bg-green-500/10 text-green-500 border-green-500/30",
  TEAM_LEAD: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  PROCESS_OWNER: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

export default function ExceptionsPage() {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<DocumentException[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | "all">("all");

  const loadExceptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getExceptions({
        skip: (page - 1) * pageSize,
        take: pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setExceptions(response.results);
      setTotalCount(response.count);
    } catch (err) {
      console.error("Error loading exceptions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const handleApprove = async (exc: DocumentException) => {
    try {
      await approveException(exc.id, {
        approvedById: "current-user-id", // TODO: Get from auth context
        approvalComments: "Approved",
      });
      loadExceptions();
    } catch (err) {
      console.error("Error approving exception:", err);
    }
  };

  const columns: Column<DocumentException>[] = [
    {
      key: "exceptionId",
      header: "ID",
      className: "w-[100px]",
      render: (exc) => (
        <span className="font-mono text-xs text-muted-foreground">{exc.exceptionId}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (exc) => (
        <div>
          <p className="font-medium">{exc.title}</p>
          {exc.document && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <FileText className="w-3 h-3" />
              {exc.document.documentId} - {exc.document.title}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "approvalLevel",
      header: "Approval Level",
      className: "w-[150px]",
      render: (exc) => (
        <Badge variant="outline" className={approvalLevelColors[exc.approvalLevel] || ""}>
          {exc.approvalLevel.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      render: (exc) => (
        <StatusBadge
          status={exc.status.replace(/_/g, " ")}
          variant={statusVariants[exc.status] || "default"}
        />
      ),
    },
    {
      key: "dates",
      header: "Period",
      className: "w-[180px]",
      render: (exc) => (
        <div className="text-xs">
          {exc.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span>
                {new Date(exc.startDate).toLocaleDateString()} - 
                {exc.expiryDate ? new Date(exc.expiryDate).toLocaleDateString() : "Open-ended"}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry",
      className: "w-[100px]",
      render: (exc) => {
        if (!exc.expiryDate) return <span className="text-muted-foreground">-</span>;
        const date = new Date(exc.expiryDate);
        const isExpired = date < new Date();
        const isExpiringSoon = !isExpired && date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        return (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isExpired && "text-destructive",
            isExpiringSoon && !isExpired && "text-warning"
          )}>
            {(isExpired || isExpiringSoon) && <Clock className="w-3 h-3" />}
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "requestedBy",
      header: "Requested By",
      className: "w-[130px]",
      render: (exc) => (
        <span className="text-sm">
          {exc.requestedBy
            ? `${exc.requestedBy.firstName || ""} ${exc.requestedBy.lastName || ""}`.trim()
            : "-"}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<DocumentException>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (exc) => {
        // TODO: Navigate to detail page or open dialog
        console.log("View:", exc.id);
      },
    },
    {
      label: "Approve",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: handleApprove,
      hidden: (exc) => exc.status !== "REQUESTED" && exc.status !== "UNDER_REVIEW",
    },
    {
      label: "Revoke",
      icon: <XCircle className="w-4 h-4" />,
      variant: "destructive",
      onClick: (exc) => {
        // TODO: Implement revoke
        console.log("Revoke:", exc.id);
      },
      hidden: (exc) => exc.status !== "ACTIVE" && exc.status !== "APPROVED",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Policy Exceptions"
        description="Manage policy exception requests and track their status"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Exception
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Pending Review</span>
          </div>
          <p className="text-2xl font-bold">
            {exceptions.filter(e => e.status === "REQUESTED" || e.status === "UNDER_REVIEW").length}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold">
            {exceptions.filter(e => e.status === "ACTIVE" || e.status === "APPROVED").length}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold">
            {exceptions.filter(e => {
              if (!e.expiryDate || e.status === "EXPIRED" || e.status === "CLOSED") return false;
              const date = new Date(e.expiryDate);
              return date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && date > new Date();
            }).length}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Expired</span>
          </div>
          <p className="text-2xl font-bold">
            {exceptions.filter(e => e.status === "EXPIRED").length}
          </p>
        </div>
      </div>

      <DataTable
        data={exceptions}
        columns={columns}
        keyExtractor={(exc) => exc.id}
        rowActions={rowActions}
        loading={loading}
        emptyMessage="No exceptions found"
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
              setStatusFilter(value as ExceptionStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-9 bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="REQUESTED">Requested</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
