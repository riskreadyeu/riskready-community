import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getChangeCalendar, type ChangeStatus, type ChangePriority } from '@/lib/itsm-api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

interface CalendarChange {
  id: string;
  changeRef: string;
  title: string;
  changeType: string;
  category: string;
  priority: ChangePriority;
  status: ChangeStatus;
  plannedStart?: string;
  plannedEnd?: string;
  maintenanceWindow: boolean;
  outageRequired: boolean;
  estimatedDowntime?: number;
  requester?: { id: string; firstName?: string; lastName?: string };
  assetLinks: Array<{ asset: { id: string; assetTag: string; name: string; businessCriticality: string } }>;
}

export default function ChangeCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [changes, setChanges] = useState<CalendarChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    loadCalendar();
  }, [currentMonth]);

  async function loadCalendar() {
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const data = await getChangeCalendar(start.toISOString(), end.toISOString());
      setChanges(data.changes);
    } catch (err) {
      console.error('Failed to load calendar:', err);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get changes for a specific day
  function getChangesForDay(day: Date): CalendarChange[] {
    return changes.filter((change) => {
      if (!change.plannedStart) return false;
      const start = parseISO(change.plannedStart);
      const end = change.plannedEnd ? parseISO(change.plannedEnd) : start;
      return day >= start && day <= end || isSameDay(start, day);
    });
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-blue-500',
    LOW: 'bg-gray-500',
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    APPROVED: 'default',
    SCHEDULED: 'default',
    IMPLEMENTING: 'secondary',
    IN_PROGRESS: 'secondary',
    COMPLETED: 'outline',
  };

  const selectedDayChanges = selectedDay ? getChangesForDay(selectedDay) : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/itsm/changes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Change Calendar</h1>
            <p className="text-sm text-muted-foreground">
              View and manage scheduled changes
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/itsm/changes/new">New Change</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-96 items-center justify-center">Loading...</div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {/* Calendar days */}
                {days.map((day) => {
                  const dayChanges = getChangesForDay(day);
                  const hasChanges = dayChanges.length > 0;
                  const hasCritical = dayChanges.some((c) => c.priority === 'CRITICAL');
                  const hasOutage = dayChanges.some((c) => c.outageRequired);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[80px] rounded-lg border p-2 text-left transition-colors hover:bg-accent ${
                        selectedDay && isSameDay(day, selectedDay)
                          ? 'border-primary bg-accent'
                          : 'border-border'
                      } ${isToday(day) ? 'ring-2 ring-primary/20' : ''}`}
                    >
                      <div className={`text-sm font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {hasChanges && (
                        <div className="mt-1 space-y-1">
                          {dayChanges.slice(0, 2).map((change) => (
                            <div
                              key={change.id}
                              className={`rounded px-1 py-0.5 text-xs text-white ${priorityColors[change.priority]}`}
                            >
                              {change.changeRef}
                            </div>
                          ))}
                          {dayChanges.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayChanges.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-1 flex gap-1">
                        {hasCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        {hasOutage && <Zap className="h-3 w-3 text-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <div className="py-8 text-center text-muted-foreground">
                Click on a day to see scheduled changes
              </div>
            ) : selectedDayChanges.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No changes scheduled for this day
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayChanges.map((change) => (
                  <Link
                    key={change.id}
                    to={`/itsm/changes/${change.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{change.changeRef}</div>
                        <div className="text-sm text-muted-foreground">{change.title}</div>
                      </div>
                      <Badge variant={statusColors[change.status]}>
                        {change.status}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge
                        className={`${priorityColors[change.priority]} text-white`}
                      >
                        {change.priority}
                      </Badge>
                      <Badge variant="outline">{change.changeType}</Badge>
                      {change.outageRequired && (
                        <Badge variant="destructive">
                          <Zap className="mr-1 h-3 w-3" />
                          Outage
                        </Badge>
                      )}
                      {change.maintenanceWindow && (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Maint. Window
                        </Badge>
                      )}
                    </div>

                    {change.plannedStart && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(parseISO(change.plannedStart), 'HH:mm')}
                        {change.plannedEnd && ` - ${format(parseISO(change.plannedEnd), 'HH:mm')}`}
                        {change.estimatedDowntime && ` (${change.estimatedDowntime} min downtime)`}
                      </div>
                    )}

                    {change.assetLinks.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Affects: {change.assetLinks.map((l) => l.asset.assetTag).join(', ')}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="glass-card">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span className="text-sm">Critical Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span className="text-sm">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span className="text-sm">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Outage Required</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Critical Change</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
