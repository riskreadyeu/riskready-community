import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  Paperclip,
  GitBranch,
} from 'lucide-react';
import type { Change } from '@/lib/itsm-api';

interface ChangeOverviewTabProps {
  change: Change;
}

export function ChangeOverviewTab({ change }: ChangeOverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Basic Info */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{change.description}</p>
          {change.businessJustification && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Business Justification</h4>
              <p className="text-sm text-muted-foreground">{change.businessJustification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Requester:</span>
            <span className="text-sm">
              {change.requester
                ? `${change.requester.firstName || ''} ${change.requester.lastName || ''}`
                : 'Unknown'}
            </span>
          </div>
          {change.implementer && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Implementer:</span>
              <span className="text-sm">
                {change.implementer.firstName} {change.implementer.lastName}
              </span>
            </div>
          )}
          {change.department && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Department:</span>
              <span className="text-sm">{change.department.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Security Impact:</span>
            <Badge
              variant={
                change.securityImpact === 'CRITICAL' || change.securityImpact === 'HIGH'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {change.securityImpact}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Planned Start:</span>
            <span className="text-sm">
              {change.plannedStart
                ? new Date(change.plannedStart).toLocaleString()
                : 'Not scheduled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Planned End:</span>
            <span className="text-sm">
              {change.plannedEnd
                ? new Date(change.plannedEnd).toLocaleString()
                : 'Not scheduled'}
            </span>
          </div>
          {change.actualStart && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Actual Start:</span>
              <span className="text-sm">
                {new Date(change.actualStart).toLocaleString()}
              </span>
            </div>
          )}
          {change.actualEnd && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Actual End:</span>
              <span className="text-sm">{new Date(change.actualEnd).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {change.cabRequired && <Badge>CAB Required</Badge>}
            {change.pirRequired && <Badge>PIR Required</Badge>}
            {change.maintenanceWindow && <Badge variant="outline">Maintenance Window</Badge>}
            {change.outageRequired && (
              <Badge variant="destructive">Outage Required</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parent/Child Change Hierarchy */}
      {(change.parentChangeId || (change.childChanges && change.childChanges.length > 0)) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Change Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {change.parentChangeId && change.parentChange && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parent Change</div>
                <Link
                  to={`/itsm/changes/${change.parentChangeId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {change.parentChange.changeRef} — {change.parentChange.title}
                </Link>
              </div>
            )}
            {change.childChanges && change.childChanges.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Child Changes</div>
                <div className="space-y-1">
                  {change.childChanges.map((child) => (
                    <Link
                      key={child.id}
                      to={`/itsm/changes/${child.id}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      {child.changeRef} — {child.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {change.attachments && change.attachments.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {change.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <span>{att.fileName || att.name}</span>
                  <Badge variant="outline" className="text-xs">{att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : ''}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
