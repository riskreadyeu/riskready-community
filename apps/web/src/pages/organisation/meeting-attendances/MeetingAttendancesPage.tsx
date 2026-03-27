import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
} from "@/components/common";
import {
  getMeetingAttendances,
  type MeetingAttendance,
} from "@/lib/organisation-api";

const attendanceStatusLabels: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
  left_early: "Left Early",
  proxy: "Proxy",
};

export default function MeetingAttendancesPage() {
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<MeetingAttendance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMeetingAttendances();
      setAttendances(data.results);
    } catch (err) {
      console.error("Error loading meeting attendances:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendances = statusFilter === "all"
    ? attendances
    : attendances.filter((a) => a.attendanceStatus === statusFilter);

  const columns: Column<MeetingAttendance>[] = [
    {
      key: "member",
      header: "Member",
      render: (attendance) => (
        <span className="font-medium">
          {attendance.member
            ? `${attendance.member.firstName || ""} ${attendance.member.lastName || ""}`.trim() || attendance.member.email
            : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (attendance) => (
        <StatusBadge
          status={attendanceStatusLabels[attendance.attendanceStatus] || attendance.attendanceStatus}
          variant={
            attendance.attendanceStatus === "present" ? "success" :
            attendance.attendanceStatus === "absent" ? "destructive" :
            attendance.attendanceStatus === "excused" ? "secondary" :
            "default"
          }
        />
      ),
    },
    {
      key: "arrival",
      header: "Arrival",
      render: (attendance) => (
        <span className="text-sm text-muted-foreground">
          {attendance.arrivalTime || "-"}
        </span>
      ),
    },
    {
      key: "departure",
      header: "Departure",
      render: (attendance) => (
        <span className="text-sm text-muted-foreground">
          {attendance.departureTime || "-"}
        </span>
      ),
    },
    {
      key: "voting",
      header: "Voted",
      render: (attendance) => (
        attendance.participatedInVoting ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )
      ),
    },
    {
      key: "contributed",
      header: "Contributed",
      render: (attendance) => (
        attendance.contributedToDiscussion ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )
      ),
    },
    {
      key: "proxy",
      header: "Proxy",
      render: (attendance) => (
        <span className="text-sm">
          {attendance.proxyAttendee
            ? `${attendance.proxyAttendee.firstName || ""} ${attendance.proxyAttendee.lastName || ""}`.trim() || attendance.proxyAttendee.email
            : "-"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const presentCount = attendances.filter((a) => a.attendanceStatus === "present").length;
  const absentCount = attendances.filter((a) => a.attendanceStatus === "absent").length;
  const votingCount = attendances.filter((a) => a.participatedInVoting).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Meeting Attendances"
        description="Track attendance records for committee meetings"
        backLink="/organisation/committee-meetings"
        backLabel="Back to Meetings"
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Records"
          value={attendances.length}
          icon={<Users className="h-4 w-4" />}
          subtitle="All attendance records"
        />
        <StatCard
          title="Present"
          value={presentCount}
          icon={<CheckCircle className="h-4 w-4" />}
          subtitle={`${Math.round((presentCount / attendances.length) * 100) || 0}% attendance`}
        />
        <StatCard
          title="Absent"
          value={absentCount}
          icon={<XCircle className="h-4 w-4" />}
          subtitle="Members absent"
        />
        <StatCard
          title="Voted"
          value={votingCount}
          icon={<Calendar className="h-4 w-4" />}
          subtitle="Participated in voting"
        />
      </StatCardGrid>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="left_early">Left Early</SelectItem>
            <SelectItem value="proxy">Proxy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAttendances}
        keyExtractor={(attendance) => attendance.id}
        emptyMessage="No attendance records found"
      />
    </div>
  );
}
