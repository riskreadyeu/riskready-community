# Risk Lifecycle Automation Architecture

## Overview

The Risk Lifecycle Automation system provides event-driven processing, notifications, scheduled reviews, and acceptance expiry management. It ensures risks flow through proper workflows, stakeholders are notified, and time-based actions are enforced automatically.

---

## 1. Event Bus System

### Purpose

The Risk Event Bus implements event sourcing for risk state changes, enabling:
- Audit trail of all risk-related events
- Cascading updates across related entities
- Decoupled notification triggers
- Event history for compliance reporting

### RiskEventType Enum

```typescript
type RiskEventType =
  | 'risk.created' | 'risk.updated' | 'risk.deleted'
  | 'scenario.created' | 'scenario.updated' | 'scenario.deleted' | 'scenario.calculated'
  | 'control.linked' | 'control.unlinked' | 'control.tested' | 'control.effectiveness_changed'
  | 'asset.linked' | 'asset.unlinked' | 'asset.updated'
  | 'vendor.linked' | 'vendor.unlinked' | 'vendor.assessed'
  | 'application.linked' | 'application.unlinked'
  | 'kri.recorded' | 'kri.threshold_breached'
  | 'treatment.created' | 'treatment.completed' | 'treatment.delayed'
  | 'tolerance.exceeded' | 'tolerance.within'
  | 'review.completed' | 'review.overdue'
  | 'incident.created' | 'incident.resolved';
```

### Event Structure

```typescript
interface RiskEvent {
  type: RiskEventType;
  riskId: string;
  scenarioId?: string;
  sourceEntityType?: string;   // 'control', 'asset', 'kri', etc.
  sourceEntityId?: string;     // ID of triggering entity
  data: Record<string, unknown>; // Event-specific payload
  actorId?: string;            // User who triggered (null for system)
  isSystemEvent?: boolean;
  timestamp?: Date;
}
```

### Circuit Breaker

Prevents infinite event loops:

```typescript
// Maximum cascade depth = 5
if (currentDepth >= MAX_EVENT_DEPTH) {
  logger.warn(`Circuit breaker: Max event depth reached for risk ${riskId}`);
  return;
}

// Prevent re-entry for same event
const eventKey = `${riskId}:${type}:${scenarioId ?? 'none'}`;
if (processingEvents.has(eventKey)) {
  logger.warn(`Circuit breaker: Skipping duplicate event ${eventKey}`);
  return;
}
```

### Event Publishing

```typescript
async publish(event: RiskEvent): Promise<void> {
  // 1. Log event to database
  await prisma.riskEventLog.create({
    data: {
      riskId: event.riskId,
      eventType: event.type,
      eventData: event.data,
      sourceEntityType: event.sourceEntityType,
      sourceEntityId: event.sourceEntityId,
      actorId: event.actorId,
      isSystemEvent: event.isSystemEvent ?? false,
      createdAt: event.timestamp ?? new Date(),
    },
  });

  // 2. Emit to NestJS EventEmitter
  eventEmitter.emit(`risk.${event.type}`, event);
  eventEmitter.emit('risk.*', event); // Catch-all handlers
}
```

### Convenience Methods

```typescript
// Scenario updated
await emitScenarioUpdated(riskId, scenarioId, { field: 'residualScore', oldValue: 12, newValue: 8 }, userId);

// Scenario calculated
await emitScenarioCalculated(riskId, scenarioId, calculationResult, 'CONTROL_TESTED', userId);

// Control linked
await emitControlLinked(riskId, scenarioId, controlId, userId);

// Control tested
await emitControlTested(riskId, controlId, { testResult: 'PASS', effectiveness: 85 });

// KRI recorded (auto-emits threshold_breached if RED/AMBER)
await emitKRIRecorded(riskId, kriId, value, status, userId);

// Treatment completed
await emitTreatmentCompleted(riskId, treatmentId, { actualReduction: 5 }, userId);

// Tolerance exceeded
await emitToleranceExceeded(riskId, { score: 18, threshold: 12, gap: 6 });

// Incident created
await emitIncidentCreated(riskId, incidentId, { severity: 'HIGH', category: 'BREACH' }, userId);
```

### Event Handlers

```typescript
@Injectable()
export class RiskEventHandlers {
  @OnEvent('risk.control.tested')
  async handleControlTested(event: RiskEvent): Promise<void> {
    // Trigger recalculation of linked scenarios
  }

  @OnEvent('risk.kri.threshold_breached')
  async handleKRIThresholdBreached(event: RiskEvent): Promise<void> {
    // Create alert
    await prisma.riskAlert.create({
      data: {
        riskId: event.riskId,
        alertType: event.data.status === 'RED' ? 'KRI_RED' : 'KRI_AMBER',
        severity: event.data.status === 'RED' ? 'HIGH' : 'MEDIUM',
        title: 'KRI threshold breached',
        message: `KRI value ${event.data.value} breached ${event.data.status} threshold`,
      },
    });
  }

  @OnEvent('risk.treatment.completed')
  async handleTreatmentCompleted(event: RiskEvent): Promise<void> {
    // Trigger scenario recalculation
  }

  @OnEvent('risk.incident.created')
  async handleIncidentCreated(event: RiskEvent): Promise<void> {
    // Update F4 (Incident History) factor
  }
}
```

---

## 2. Notification System

### Notification Types

```typescript
enum RiskNotificationType {
  SCENARIO_CREATED,          // New scenario added
  ASSESSMENT_DUE,            // Assessment deadline approaching
  TREATMENT_ASSIGNED,        // User assigned as treatment owner
  TREATMENT_OVERDUE,         // Treatment past due date
  RISK_ACCEPTED,             // Risk accepted by approver
  KRI_WARNING,               // KRI hit amber threshold
  KRI_BREACH,                // KRI hit red threshold
  RISK_ESCALATED,            // Risk escalated to higher authority
  ESCALATION_DECISION_NEEDED,// Escalation awaiting decision
  REVIEW_TRIGGERED,          // Periodic review triggered
  ACCEPTANCE_EXPIRING,       // Acceptance validity expiring soon
  ACCEPTANCE_EXPIRED,        // Acceptance validity expired
  SCORE_INCREASED,           // Risk score went up
  TOLERANCE_EXCEEDED,        // Risk now exceeds tolerance
  INCIDENT_LINKED,           // Incident linked to risk
}
```

### Notification Channels

```typescript
enum RiskNotificationChannel {
  IN_APP,   // In-application notifications
  EMAIL,    // Email delivery
  SMS,      // SMS delivery
  SLACK,    // Slack webhook
  TEAMS,    // Microsoft Teams webhook
}
```

### Priority Levels

```typescript
enum RiskNotificationPriority {
  LOW,      // Informational
  NORMAL,   // Standard notifications
  HIGH,     // Requires attention
  URGENT,   // Immediate action required
}
```

### Notification Templates

```typescript
const NOTIFICATION_TEMPLATES = {
  SCENARIO_CREATED: {
    title: 'New Risk Scenario Created',
    message: 'A new risk scenario "{scenarioName}" has been created under risk "{riskName}".',
    defaultPriority: 'NORMAL',
    defaultChannels: ['IN_APP'],
  },
  TREATMENT_OVERDUE: {
    title: 'Treatment Action Overdue',
    message: 'Treatment action for "{scenarioName}" is overdue by {daysOverdue} days.',
    defaultPriority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL'],
  },
  KRI_BREACH: {
    title: 'KRI Critical Breach',
    message: 'KRI "{kriName}" has breached critical threshold! Current: {currentValue}, Critical: {criticalThreshold}.',
    defaultPriority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS'],
  },
  TOLERANCE_EXCEEDED: {
    title: 'Risk Tolerance Exceeded',
    message: 'Risk "{scenarioName}" now exceeds tolerance threshold. Score: {score}, Threshold: {threshold}.',
    defaultPriority: 'URGENT',
    defaultChannels: ['IN_APP', 'EMAIL'],
  },
  // ... more templates
};
```

### Creating Notifications

```typescript
// From template with variable interpolation
await notificationService.createFromTemplate(
  RiskNotificationType.KRI_BREACH,
  recipientUserId,
  {
    kriName: 'Patching Compliance',
    currentValue: '75%',
    criticalThreshold: '80%',
  },
  {
    entityType: 'kri',
    entityId: kriId,
    actionUrl: `/kris/${kriId}`,
    actionLabel: 'View KRI',
  },
);

// Notify by role
await notificationService.notifyByRole(
  RiskNotificationType.ESCALATION_DECISION_NEEDED,
  GovernanceRoleCode.CISO,
  { scenarioName: 'Data Breach Scenario', deadline: '2025-02-01' },
  { scope: 'ORGANISATION', scopeEntityId: orgId },
);

// Notify multiple recipients
await notificationService.notifyMultiple(
  RiskNotificationType.REVIEW_TRIGGERED,
  [userId1, userId2, userId3],
  { scenarioName: 'Ransomware Scenario', triggerReason: 'QUARTERLY', dueDate: '2025-02-15' },
);
```

### User Preferences

```typescript
interface NotificationPreference {
  userId: string;
  notificationType: RiskNotificationType;
  enableEmail: boolean;
  enableInApp: boolean;
  enableSMS: boolean;
  enableSlack: boolean;
  enableTeams: boolean;
  immediateDelivery: boolean;
  includeInDigest: boolean;
  muted: boolean;
  mutedUntil: Date | null;
}
```

### Delivery Processing

```typescript
async processPendingNotifications(): Promise<void> {
  const pending = await prisma.riskNotification.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    take: 100,
  });

  for (const notification of pending) {
    try {
      await deliverNotification(notification);
    } catch (error) {
      // Retry with exponential backoff (1min, 5min, 15min)
      if (notification.retryCount < notification.maxRetries) {
        await scheduleRetry(notification);
      } else {
        await markAsFailed(notification, error.message);
      }
    }
  }
}
```

---

## 3. Review Scheduler

### Review Frequencies

```typescript
enum ReviewFrequency {
  MONTHLY,      // Every 30 days
  QUARTERLY,    // Every 90 days
  SEMI_ANNUAL,  // Every 180 days
  ANNUAL,       // Every 365 days
}
```

### ReviewSchedule Entity

| Field | Type | Purpose |
|-------|------|---------|
| `riskId` | String | Risk being reviewed |
| `frequency` | ReviewFrequency | How often to review |
| `nextReviewDate` | DateTime | Next scheduled review |
| `lastReviewDate` | DateTime? | Last completed review |
| `lastReviewById` | String? | Who completed last review |
| `lastReviewNotes` | String? | Notes from last review |
| `assignedReviewers` | String[] | Users assigned to review |
| `createSnapshotOnReview` | Boolean | Auto-create snapshot |
| `remindersSent` | Int | Count of reminders sent |
| `lastReminderSent` | DateTime? | When last reminder was sent |

### Setting Review Schedule

```typescript
await reviewSchedulerService.setSchedule({
  riskId: 'risk-123',
  frequency: 'QUARTERLY',
  assignedReviewers: ['user-1', 'user-2'],
  createSnapshotOnReview: true,
});
```

### Getting Upcoming Reviews

```typescript
const upcomingReviews = await reviewSchedulerService.getUpcomingReviews(
  organisationId,
  30, // days ahead
);

// Returns:
[
  {
    riskId: 'risk-123',
    riskTitle: 'Data Breach Risk',
    riskOwner: { id: '...', firstName: 'John', ... },
    nextReviewDate: '2025-02-01',
    daysUntilDue: 7,
    frequency: 'QUARTERLY',
    assignedReviewers: ['user-1', 'user-2'],
    isOverdue: false,
  },
  // ...
]
```

### Completing a Review

```typescript
await reviewSchedulerService.completeReview({
  riskId: 'risk-123',
  reviewerId: 'user-1',
  notes: 'Quarterly review completed. No significant changes.',
  nextReviewDate: null, // Auto-calculate from frequency
});

// This will:
// 1. Create assessment snapshot (if configured)
// 2. Update lastReviewDate, lastReviewById
// 3. Calculate next review date
// 4. Reset reminder counters
// 5. Auto-resolve any REVIEW_OVERDUE alerts
```

### Overdue Processing (Cron Job)

```typescript
// Called by scheduler (e.g., daily at 8am)
async processOverdueReviews(organisationId: string): Promise<number> {
  const overdueReviews = await getOverdueReviews(organisationId);

  for (const review of overdueReviews) {
    // Check if alert already exists
    const existingAlert = await prisma.riskAlert.findFirst({
      where: { riskId: review.riskId, alertType: 'REVIEW_OVERDUE', dismissed: false },
    });

    if (!existingAlert) {
      await prisma.riskAlert.create({
        data: {
          riskId: review.riskId,
          alertType: 'REVIEW_OVERDUE',
          severity: Math.abs(review.daysUntilDue) > 30 ? 'HIGH' : 'MEDIUM',
          title: `Risk review overdue: ${review.riskTitle}`,
          message: `This risk review is ${Math.abs(review.daysUntilDue)} days overdue.`,
        },
      });
    }
  }
}
```

### Review Reminders (Cron Job)

```typescript
// Called by scheduler
async sendReviewReminders(organisationId: string, reminderDays: number[] = [7, 3, 1]) {
  const upcomingReviews = await getUpcomingReviews(organisationId, Math.max(...reminderDays) + 1);

  for (const review of upcomingReviews) {
    if (reminderDays.includes(review.daysUntilDue)) {
      // Check if already sent today
      const schedule = await prisma.reviewSchedule.findUnique({ where: { riskId: review.riskId } });
      if (schedule.lastReminderSent >= today) continue;

      // Update tracking and send notification
      await prisma.reviewSchedule.update({
        where: { riskId: review.riskId },
        data: { remindersSent: { increment: 1 }, lastReminderSent: new Date() },
      });

      // Send notification to assigned reviewers
      await notifyMultiple(REVIEW_TRIGGERED, review.assignedReviewers, { ... });
    }
  }
}
```

---

## 4. Acceptance Expiry Management

### Risk Acceptance Entity

| Field | Type | Purpose |
|-------|------|---------|
| `scenarioId` | String | Accepted scenario |
| `validUntil` | DateTime | Acceptance expiry date |
| `approvedAt` | DateTime? | When approved |
| `approvedById` | String? | Who approved |
| `requestedById` | String | Who requested acceptance |
| `active` | Boolean | Currently active acceptance |
| `expired` | Boolean | Has expired |
| `expiryNotified` | Boolean | Expiry notification sent |

### Expiry Alert Interface

```typescript
interface AcceptanceExpiryAlert {
  acceptanceId: string;
  scenarioId: string;
  riskId: string;
  riskTitle: string;
  acceptedAt: Date;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'VALID';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}
```

### Expiry Status Logic

```typescript
if (daysUntilExpiry < 0) {
  status = 'EXPIRED';
  severity = 'HIGH';
  message = `Risk acceptance expired ${Math.abs(daysUntilExpiry)} days ago. Immediate review required.`;
} else if (daysUntilExpiry <= 30) {
  status = 'EXPIRING_SOON';
  severity = daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM';
  message = `Risk acceptance expires in ${daysUntilExpiry} days. Review and renew if needed.`;
} else {
  status = 'VALID';
  severity = 'LOW';
  message = `Risk acceptance valid for ${daysUntilExpiry} more days.`;
}
```

### Expiry Summary

```typescript
await acceptanceExpiryService.getExpirySummary();

// Returns:
{
  expired: 2,
  expiringThisWeek: 3,
  expiringThisMonth: 8,
  valid: 45,
  total: 58,
  alerts: [...] // Non-valid acceptances
}
```

### Renewing Acceptance

```typescript
await acceptanceExpiryService.renewAcceptance(
  acceptanceId,
  new Date('2025-12-31'), // New expiry date
  'Annual renewal - risk profile unchanged',
  userId,
);

// Updates validUntil, resets expired/expiryNotified flags
```

### Processing Expired Acceptances (Cron Job)

```typescript
async processExpiredAcceptances(): Promise<{ processed: number; errors: string[] }> {
  const expired = await getExpiredAcceptances();

  for (const alert of expired) {
    // Mark acceptance as expired
    await prisma.riskAcceptance.update({
      where: { id: alert.acceptanceId },
      data: { expired: true, active: false },
    });

    // Transition scenario back to EVALUATED for re-decision
    await prisma.riskScenario.update({
      where: { id: alert.scenarioId },
      data: { status: 'EVALUATED', statusChangedAt: new Date() },
    });
  }
}
```

---

## 5. Scheduled Jobs Summary

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `processOverdueReviews` | Daily 8am | Create alerts for overdue reviews |
| `sendReviewReminders` | Daily 8am | Send reminders at 7, 3, 1 days before |
| `processExpiredAcceptances` | Daily 1am | Mark expired acceptances, transition scenarios |
| `processPendingNotifications` | Every 5 min | Deliver pending notifications |
| `checkKRIThresholds` | Daily 6am | Check all KRIs for breaches |

---

## 6. Key Files

| Component | File |
|-----------|------|
| Event Bus | `src/risks/services/risk-event-bus.service.ts` |
| Event Handlers | `src/risks/services/risk-event-bus.service.ts` (RiskEventHandlers) |
| Notifications | `src/risks/services/risk-notification.service.ts` |
| Review Scheduler | `src/risks/services/review-scheduler.service.ts` |
| Acceptance Expiry | `src/risks/services/acceptance-expiry.service.ts` |
| Scheduler Jobs | `src/risks/services/risk-scheduler.service.ts` |

---

## 7. Implementation Status

### Fully Implemented ✅
- Event bus with circuit breaker
- Event logging to database
- All notification types and templates
- User notification preferences
- Review scheduling and reminders
- Acceptance expiry detection
- Overdue processing

### Partially Implemented ⚠️
- Email delivery (placeholder, needs provider integration)
- Slack/Teams webhooks (placeholder, needs configuration)
- SMS delivery (placeholder, needs provider integration)

### Not Implemented ❌
- Notification digest (daily/weekly summary emails)
- Custom notification rules engine
- Webhook for external systems
- Real-time WebSocket notifications
- Mobile push notifications
