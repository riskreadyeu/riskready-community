"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  UserCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, DataTable, StatusBadge, Column, RowAction } from "@/components/common";
import {
  getAcknowledgments,
  getAcknowledgmentStats,
  type DocumentAcknowledgment,
} from "@/lib/policies-api";
import { cn } from "@/lib/utils";

const methodLabels: Record<string, string> = {
  WEB_PORTAL: "Web Portal",
  EMAIL_LINK: "Email Link",
  TRAINING_COMPLETION: "Training",
  DIGITAL_SIGNATURE: "Digital Signature",
};

export default function AcknowledgmentsPage() {
  const [loading, setLoading] = useState(true);
  const [acknowledgments, setAcknowledgments] = useState<DocumentAcknowledgment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<"all" | "acknowledged" | "pending" | "overdue">("all");
  const [stats, setStats] = useState<any>(null);

  const loadAcknowledgments = useCallback(async () => {
    try {
      setLoading(true);
      
      let isAcknowledged: boolean | undefined;
      if (statusFilter === "acknowledged") isAcknowledged = true;
      else if (statusFilter === "pending" || statusFilter === "overdue") isAcknowledged = false;

      const [ackResponse, statsResponse] = await Promise.all([
        getAcknowledgments({
          skip: (page - 1) * pageSize,
          take: pageSize,
          isAcknowledged,
        }),
        getAcknowledgmentStats(),
      ]);

      let results = ackResponse.results;
      
      // Filter overdue on client side (backend can do this too)
      if (statusFilter === "overdue") {
        results = results.filter(a => a.isOverdue);
      }

      setAcknowledgments(results);
      setTotalCount(statusFilter === "overdue" ? results.length : ackResponse.count);
      setStats(statsResponse);
    } catch (err) {
      console.error("Error loading acknowledgments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    loadAcknowledgments();
  }, [loadAcknowledgments]);

  const columns: Column<DocumentAcknowledgment>[] = [
    {
      key: "document",
      header: "Document",
      render: (ack) => (
        <div>
          {ack.document && (
            <Link
              to={`/policies/documents/${ack.documentId}`}
              className="hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">
                  {ack.document.documentId}
                </span>
              </div>
              <p className="font-medium mt-0.5">{ack.document.title}</p>
            </Link>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">v{ack.documentVersion}</p>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      className: "w-[180px]",
      render: (ack) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {ack.user
              ? `${ack.user.firstName?.[0] || ""}${ack.user.lastName?.[0] || ""}`.toUpperCase() ||
                ack.user.email[0]!.toUpperCase()
              : "?"}
          </div>
          <div>
            {ack.user && (
              <>
                <p className="text-sm font-medium">
                  {ack.user.firstName} {ack.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{ack.user.email}</p>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[130px]",
      render: (ack) => {
        if (ack.isAcknowledged) {
          return (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Acknowledged</span>
            </div>
          );
        }
        if (ack.isOverdue) {
          return (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Overdue</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-warning">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      className: "w-[110px]",
      render: (ack) => {
        if (!ack.dueDate) return <span className="text-muted-foreground">-</span>;
        const date = new Date(ack.dueDate);
        return (
          <span className={cn(
            "text-sm",
            ack.isOverdue && "text-destructive font-medium"
          )}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "acknowledgedAt",
      header: "Acknowledged",
      className: "w-[130px]",
      render: (ack) => {
        if (!ack.acknowledgedAt) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="text-sm">
            <p>{new Date(ack.acknowledgedAt).toLocaleDateString()}</p>
            {ack.method && (
              <Badge variant="outline" className="mt-1 text-[10px]">
                {methodLabels[ack.method] || ack.method}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "reminders",
      header: "Reminders",
      className: "w-[100px]",
      render: (ack) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span className="text-sm">{ack.remindersSent}</span>
        </div>
      ),
    },
  ];

  const rowActions: RowAction<DocumentAcknowledgment>[] = [
    {
      label: "Send Reminder",
      icon: <Bell className="w-4 h-4" />,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
      hidden: (ack) => ack.isAcknowledged,
    },
  ];

  const completionRate = stats?.completionRate ?? 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Acknowledgments"
        description="Track policy acknowledgments across the organization"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.info("This feature is coming soon")}>
            <Bell className="h-4 w-4 mr-2" />
            Send Bulk Reminders
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Completion Rate</span>
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2">{completionRate}%</div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Acknowledged</span>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {stats?.acknowledged ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.total ?? 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Pending</span>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">
              {stats?.pending ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              awaiting acknowledgment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Overdue</span>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">
              {stats?.overdue ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              past due date
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={acknowledgments}
        columns={columns}
        keyExtractor={(ack) => ack.id}
        rowActions={rowActions}
        loading={loading}
        emptyMessage="No acknowledgments found"
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
              setStatusFilter(value as typeof statusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-9 bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
