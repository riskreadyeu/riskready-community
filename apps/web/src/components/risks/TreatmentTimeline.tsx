import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Target,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isPast, isFuture, differenceInDays } from 'date-fns';

// ============================================
// TREATMENT TIMELINE
// Visual timeline of treatment plans and tasks
// Shows progress, deadlines, and milestones
// ============================================

export type TreatmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type TreatmentType = 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | 'AVOID';

export interface TreatmentTask {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dueDate?: string;
  assigneeId?: string;
  assigneeName?: string;
  completedAt?: string;
}

export interface TreatmentPlan {
  id: string;
  name: string;
  description?: string;
  type: TreatmentType;
  status: TreatmentStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetResidualScore?: number;
  currentScore?: number;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  ownerId?: string;
  ownerName?: string;
  tasks: TreatmentTask[];
  progress: number; // 0-100
}

interface TreatmentTimelineProps {
  treatments: TreatmentPlan[];
  onViewDetails?: (treatmentId: string) => void;
  onEditTreatment?: (treatmentId: string) => void;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<TreatmentStatus, { color: string; bgColor: string; icon: typeof CheckCircle2; label: string }> = {
  NOT_STARTED: { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Clock, label: 'Not Started' },
  IN_PROGRESS: { color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900', icon: PlayCircle, label: 'In Progress' },
  ON_HOLD: { color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900', icon: PauseCircle, label: 'On Hold' },
  COMPLETED: { color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900', icon: CheckCircle2, label: 'Completed' },
  OVERDUE: { color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900', icon: AlertTriangle, label: 'Overdue' },
  CANCELLED: { color: 'text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900', icon: Clock, label: 'Cancelled' },
};

const TYPE_CONFIG: Record<TreatmentType, { color: string; label: string }> = {
  MITIGATE: { color: 'bg-blue-500', label: 'Mitigate' },
  TRANSFER: { color: 'bg-purple-500', label: 'Transfer' },
  ACCEPT: { color: 'bg-yellow-500', label: 'Accept' },
  AVOID: { color: 'bg-red-500', label: 'Avoid' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: 'bg-gray-400', label: 'Low' },
  MEDIUM: { color: 'bg-blue-400', label: 'Medium' },
  HIGH: { color: 'bg-orange-500', label: 'High' },
  CRITICAL: { color: 'bg-red-500', label: 'Critical' },
};

function getEffectiveStatus(treatment: TreatmentPlan): TreatmentStatus {
  if ((treatment.status as string) === 'COMPLETED') return 'COMPLETED';
  if (treatment.dueDate && isPast(new Date(treatment.dueDate)) && (treatment.status as string) !== 'COMPLETED') {
    return 'OVERDUE';
  }
  return treatment.status;
}

export function TreatmentTimeline({
  treatments,
  onViewDetails,
  onEditTreatment,
  compact = false,
  className,
}: TreatmentTimelineProps) {
  // Sort by priority and due date
  const sortedTreatments = useMemo(() => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...treatments].sort((a, b) => {
      // Overdue first
      const aOverdue = a.dueDate && isPast(new Date(a.dueDate)) && a.status !== 'COMPLETED';
      const bOverdue = b.dueDate && isPast(new Date(b.dueDate)) && b.status !== 'COMPLETED';
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Then by priority
      const aPriority = priorityOrder[a.priority] ?? 2;
      const bPriority = priorityOrder[b.priority] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });
  }, [treatments]);

  const stats = useMemo(() => {
    const total = treatments.length;
    const completed = treatments.filter((t) => t.status === 'COMPLETED').length;
    const overdue = treatments.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'COMPLETED').length;
    const inProgress = treatments.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total, completed, overdue, inProgress };
  }, [treatments]);

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        {sortedTreatments.slice(0, 3).map((treatment) => (
          <TreatmentCardCompact
            key={treatment.id}
            treatment={treatment}
            onClick={() => onViewDetails?.(treatment.id)}
          />
        ))}
        {treatments.length > 3 && (
          <div className="text-center">
            <Button variant="ghost" size="sm">
              View all {treatments.length} treatments
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Plans</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-muted-foreground">Overdue</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {/* Treatment Cards */}
        <div className="space-y-4">
          {sortedTreatments.map((treatment, index) => (
            <TreatmentCard
              key={treatment.id}
              treatment={treatment}
              index={index}
              onViewDetails={onViewDetails}
              onEdit={onEditTreatment}
            />
          ))}
        </div>
      </div>

      {treatments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No treatment plans defined for this risk.
        </div>
      )}
    </div>
  );
}

function TreatmentCard({
  treatment,
  index,
  onViewDetails,
  onEdit,
}: {
  treatment: TreatmentPlan;
  index: number;
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const effectiveStatus = getEffectiveStatus(treatment);
  const statusConfig = STATUS_CONFIG[effectiveStatus];
  const typeConfig = TYPE_CONFIG[treatment.type];
  const priorityConfig = PRIORITY_CONFIG[treatment.priority];
  const StatusIcon = statusConfig.icon;

  const daysUntilDue = treatment.dueDate
    ? differenceInDays(new Date(treatment.dueDate), new Date())
    : null;

  const completedTasks = treatment.tasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTasks = treatment.tasks.length;

  return (
    <div className="relative pl-12">
      {/* Timeline Node */}
      <div
        className={cn(
          'absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center',
          statusConfig.bgColor,
        )}
      >
        <StatusIcon className={cn('w-3 h-3', statusConfig.color)} />
      </div>

      {/* Card */}
      <Card className={cn('transition-shadow hover:shadow-md', effectiveStatus === 'OVERDUE' && 'border-red-300 dark:border-red-800')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn(typeConfig.color, 'text-white text-xs')}>
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <div className={cn('w-2 h-2 rounded-full mr-1', priorityConfig?.color)} />
                  {priorityConfig?.label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Title */}
              <h4 className="font-medium truncate">{treatment.name}</h4>

              {/* Description */}
              {treatment.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {treatment.description}
                </p>
              )}

              {/* Progress & Tasks */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{treatment.progress}%</span>
                </div>
                <Progress value={treatment.progress} className="h-1.5" />
                <div className="text-xs text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {treatment.dueDate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn('flex items-center gap-1', effectiveStatus === 'OVERDUE' && 'text-red-500')}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            {daysUntilDue !== null && daysUntilDue < 0
                              ? `${Math.abs(daysUntilDue)}d overdue`
                              : daysUntilDue === 0
                                ? 'Due today'
                                : `${daysUntilDue}d left`}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Due: {format(new Date(treatment.dueDate), 'PPP')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {treatment.ownerName && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{treatment.ownerName}</span>
                  </div>
                )}
                {treatment.targetResidualScore && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Target: {treatment.targetResidualScore}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => onViewDetails?.(treatment.id)}>
                View
              </Button>
              {onEdit && effectiveStatus !== 'COMPLETED' && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(treatment.id)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TreatmentCardCompact({
  treatment,
  onClick,
}: {
  treatment: TreatmentPlan;
  onClick?: () => void;
}) {
  const effectiveStatus = getEffectiveStatus(treatment);
  const statusConfig = STATUS_CONFIG[effectiveStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors',
        effectiveStatus === 'OVERDUE' && 'border-red-300 dark:border-red-800',
      )}
      onClick={onClick}
    >
      <div className={cn('p-2 rounded-full', statusConfig.bgColor)}>
        <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{treatment.name}</div>
        <div className="text-xs text-muted-foreground">
          {treatment.progress}% complete
        </div>
      </div>
      <div className="text-right">
        <Badge variant="outline" className="text-xs">
          {TYPE_CONFIG[treatment.type].label}
        </Badge>
      </div>
    </div>
  );
}

export default TreatmentTimeline;
