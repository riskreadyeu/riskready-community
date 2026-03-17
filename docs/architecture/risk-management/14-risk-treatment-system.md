# Risk Treatment System Architecture

This document details the architecture of the Risk Treatment Plan system, including treatment planning, ROI calculations, notifications, history tracking, templates, and dependencies.

---

## Table of Contents

1. [Overview](#overview)
2. [Treatment Plan Module](#treatment-plan-module)
3. [Utility Functions](#utility-functions)
4. [Treatment Notifications](#treatment-notifications)
5. [Treatment History](#treatment-history)
6. [Treatment Templates](#treatment-templates)
7. [Treatment Dependencies](#treatment-dependencies)
8. [Frontend Components](#frontend-components)
9. [API Endpoints](#api-endpoints)

---

## Overview

### Purpose

The Risk Treatment System provides comprehensive functionality for:
- **Treatment Planning**: Create and manage risk treatment plans with automated calculations
- **ROI Analysis**: Calculate return on investment and cost-benefit ratios
- **Progress Tracking**: Monitor treatment effectiveness and completion
- **Notifications**: Alert stakeholders of overdue or due-soon treatments
- **History Tracking**: Audit trail of all treatment plan changes
- **Templates**: Reusable treatment patterns for common scenarios
- **Dependencies**: Link related treatments with BLOCKS, REQUIRES, RELATED relationships

### Key Features

✅ **Automated Calculations**
- Target residual score calculation based on expected reduction percentage
- ROI and cost-benefit analysis
- Risk reduction value estimation
- Treatment effectiveness tracking

✅ **Tolerance Validation**
- Validates target scores meet risk tolerance thresholds
- Prevents inadequate treatment plans
- Enforces acceptance rationale for ACCEPT type

✅ **Smart Defaults**
- Auto-populates missing fields based on risk scenario data
- Suggests target dates based on risk level and tolerance status
- Generates cost-benefit summaries

✅ **Comprehensive Tracking**
- Treatment plan history with lifecycle events
- Action-level progress tracking
- Effectiveness comparison (target vs actual results)

---

## Treatment Plan Module

### Directory Structure

```
apps/server/src/risks/
├── controllers/
│   └── treatment-plan.controller.ts    # HTTP endpoints
├── services/
│   ├── treatment-plan.service.ts       # Business logic
│   ├── treatment-notification.service.ts # Notifications
│   └── treatment-history.service.ts    # History tracking
└── utils/
    └── risk-scoring.ts                 # ROI & calculations
```

### Treatment Plan Service

**Location**: `apps/server/src/risks/services/treatment-plan.service.ts`

#### Core Responsibilities

1. **CRUD Operations**: Create, read, update, delete treatment plans
2. **Validation**: Ensure target scores meet tolerance thresholds
3. **Auto-Calculation**: Calculate missing fields (target score, expected reduction, ROI)
4. **Progress Tracking**: Monitor treatment effectiveness
5. **Action Management**: Create and track treatment actions

#### Key Methods

```typescript
class TreatmentPlanService {
  // Core CRUD
  async findAll(params): Promise<{ results: TreatmentPlan[]; count: number }>
  async findOne(id: string): Promise<TreatmentPlan>
  async findByRisk(riskId: string): Promise<TreatmentPlan[]>
  async create(data): Promise<TreatmentPlan>
  async update(id: string, data): Promise<TreatmentPlan>
  async delete(id: string): Promise<void>
  
  // Statistics
  async getStats(organisationId?: string): Promise<TreatmentPlanStats>
  
  // Workflow
  async approve(id: string, approvedById: string): Promise<TreatmentPlan>
  async updateProgress(id: string, percentage: number, notes?: string): Promise<TreatmentPlan>
  
  // Actions
  async createAction(data): Promise<TreatmentAction>
  async updateAction(id: string, data): Promise<TreatmentAction>
  async deleteAction(id: string): Promise<void>
  
  // Internal
  private async computeDefaults(plan): Promise<ComputedDefaults>
  private async recalculatePlanProgress(treatmentPlanId: string): Promise<void>
}
```

#### Auto-Calculation Logic

**Target Residual Score Calculation**:
```typescript
// If expectedReduction is provided but targetResidualScore is not
if (expectedReduction && !targetResidualScore) {
  targetResidualScore = calculateTargetResidualScore(
    currentScore, 
    expectedReduction
  );
}

// If targetResidualScore is provided but expectedReduction is not
if (targetResidualScore && !expectedReduction) {
  expectedReduction = calculateExpectedReduction(
    currentScore, 
    targetResidualScore
  );
}
```

**Tolerance Validation**:
```typescript
// Validate target score meets tolerance (unless ACCEPT type)
if (targetResidualScore && treatmentType !== 'ACCEPT') {
  const isAcceptable = isWithinTolerance(
    targetResidualScore, 
    toleranceThreshold
  );
  
  if (!isAcceptable) {
    throw new BadRequestException(
      `Target residual score (${targetResidualScore}) still exceeds ` +
      `risk tolerance threshold (${toleranceThreshold}). ` +
      `Consider additional treatments or use ACCEPT type.`
    );
  }
}
```

**Smart Defaults**:
```typescript
private async computeDefaults(plan) {
  const computed: string[] = [];
  
  // Get scenario data
  const scenario = await this.prisma.riskScenario.findFirst({
    where: { riskId: plan.riskId },
    select: { residualScore, toleranceThreshold, toleranceStatus }
  });
  
  // Calculate target score if missing
  if (!plan.targetResidualScore) {
    targetResidualScore = Math.max(1, threshold - TARGET_SCORE_OFFSET);
    computed.push('targetResidualScore');
  }
  
  // Calculate target end date based on tolerance status
  if (!plan.targetEndDate) {
    const daysToAdd = toleranceStatus === 'CRITICAL' ? 7
      : toleranceStatus === 'EXCEEDS' ? 30
      : 90;
    targetEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    computed.push('targetEndDate');
  }
  
  return { targetResidualScore, targetEndDate, _computed: computed };
}
```

#### Effectiveness Tracking

When a treatment is completed (progress = 100%), the service captures the actual residual score:

```typescript
async updateProgress(id: string, progressPercentage: number) {
  let currentResidualScore: number | undefined;
  
  if (progressPercentage >= 100) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      select: { riskId: true }
    });
    
    const risk = await this.prisma.risk.findUnique({
      where: { id: plan.riskId },
      select: { residualScore: true }
    });
    
    currentResidualScore = risk?.residualScore;
  }
  
  return this.prisma.treatmentPlan.update({
    where: { id },
    data: {
      progressPercentage,
      status: progressPercentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
      actualEndDate: progressPercentage >= 100 ? new Date() : undefined,
      currentResidualScore, // Captures actual result for comparison
    }
  });
}
```

This enables comparison between:
- **Target**: `targetResidualScore` (planned reduction)
- **Actual**: `currentResidualScore` (achieved reduction)

---

## Utility Functions

### Risk Scoring Utilities

**Location**: `apps/server/src/risks/utils/risk-scoring.ts`

#### ROI Calculation Functions

**Calculate Target Residual Score**:
```typescript
/**
 * Calculate target residual score based on expected reduction percentage
 * @param currentScore - Current risk score (1-25)
 * @param reductionPercentage - Expected reduction percentage (0-100)
 * @returns Target residual score after treatment
 */
export function calculateTargetResidualScore(
  currentScore: number,
  reductionPercentage: number
): number {
  if (!currentScore || currentScore <= 0) return 0;
  if (reductionPercentage >= 100) return 0; // Fully mitigated
  if (reductionPercentage <= 0) return currentScore; // No reduction
  
  const reductionFactor = (100 - reductionPercentage) / 100;
  const targetScore = currentScore * reductionFactor;
  
  return Math.max(1, Math.min(25, Math.round(targetScore)));
}
```

**Calculate Expected Reduction**:
```typescript
/**
 * Calculate expected reduction percentage from current and target scores
 * @param currentScore - Current risk score (1-25)
 * @param targetScore - Target risk score (1-25)
 * @returns Expected reduction percentage (0-100)
 */
export function calculateExpectedReduction(
  currentScore: number,
  targetScore: number
): number {
  if (!currentScore || currentScore <= 0) return 0;
  if (!targetScore || targetScore <= 0) return 100; // Full mitigation
  if (targetScore >= currentScore) return 0; // No reduction
  
  const reduction = ((currentScore - targetScore) / currentScore) * 100;
  return Math.max(0, Math.min(100, Math.round(reduction)));
}
```

**Calculate Treatment ROI**:
```typescript
/**
 * Calculate ROI (Return on Investment) for a treatment plan
 * ROI = ((Risk Reduction Value - Treatment Cost) / Treatment Cost) * 100
 * @param riskReductionValue - Monetary value of risk reduction
 * @param treatmentCost - Cost of implementing treatment
 * @returns ROI percentage
 */
export function calculateTreatmentROI(
  riskReductionValue: number,
  treatmentCost: number
): number {
  if (treatmentCost <= 0) return 0;
  
  const roi = ((riskReductionValue - treatmentCost) / treatmentCost) * 100;
  return Math.round(roi * 100) / 100; // Round to 2 decimal places
}
```

**Estimate Risk Reduction Value**:
```typescript
/**
 * Estimate risk reduction value based on risk score reduction
 * @param currentScore - Current risk score (1-25)
 * @param targetScore - Target risk score after treatment (1-25)
 * @param baseValuePerPoint - Base monetary value per risk score point (default: 10000)
 * @param riskLevelMultiplier - Multiplier based on risk level (default: 1)
 * @returns Estimated monetary value of risk reduction
 */
export function estimateRiskReductionValue(
  currentScore: number,
  targetScore: number,
  baseValuePerPoint = 10000,
  riskLevelMultiplier = 1
): number {
  if (targetScore >= currentScore) return 0;
  
  const scoreReduction = currentScore - targetScore;
  const value = scoreReduction * baseValuePerPoint * riskLevelMultiplier;
  
  return Math.round(value);
}
```

**Risk Level Multipliers**:
```typescript
export function getRiskLevelMultiplier(score: number): number {
  const level = getRiskLevel(score);
  
  switch (level) {
    case 'CRITICAL': return 5.0;  // 5x multiplier
    case 'HIGH': return 3.0;      // 3x multiplier
    case 'MEDIUM': return 1.5;    // 1.5x multiplier
    case 'LOW': return 1.0;       // 1x multiplier
    default: return 0.5;
  }
}
```

**Cost-Benefit Analysis**:
```typescript
export function generateCostBenefitAnalysis(
  currentScore: number,
  targetScore: number,
  estimatedCost: number,
  baseValuePerPoint = 10000
): {
  riskReduction: number;
  riskReductionPercentage: number;
  riskLevelMultiplier: number;
  estimatedRiskValue: number;
  estimatedCost: number;
  netBenefit: number;
  roi: number;
  costBenefitRatio: number;
  recommendation: string;
} {
  const multiplier = getRiskLevelMultiplier(currentScore);
  const riskValue = estimateRiskReductionValue(
    currentScore, 
    targetScore, 
    baseValuePerPoint, 
    multiplier
  );
  const netBenefit = riskValue - estimatedCost;
  const roi = calculateTreatmentROI(riskValue, estimatedCost);
  
  let recommendation = '';
  if (roi > 100) recommendation = 'Highly recommended - Excellent ROI';
  else if (roi > 50) recommendation = 'Recommended - Good ROI';
  else if (roi > 0) recommendation = 'Consider - Positive ROI';
  else if (roi > -25) recommendation = 'Marginal - Low ROI, consider alternatives';
  else recommendation = 'Not recommended - Negative ROI';
  
  return {
    riskReduction: currentScore - targetScore,
    riskReductionPercentage: calculateExpectedReduction(currentScore, targetScore),
    riskLevelMultiplier: multiplier,
    estimatedRiskValue: riskValue,
    estimatedCost,
    netBenefit,
    roi,
    costBenefitRatio: riskValue / estimatedCost,
    recommendation
  };
}
```

---

## Treatment Notifications

### Notification Service

**Location**: `apps/server/src/risks/services/treatment-notification.service.ts`

#### Purpose

Detect and notify stakeholders about:
- Overdue treatment plans and actions
- Due-soon treatments requiring attention
- Completed treatments awaiting approval
- Approved treatments ready for implementation

#### Key Methods

```typescript
class TreatmentNotificationService {
  /**
   * Get overdue treatment plans
   */
  async getOverdueTreatments(organisationId?: string): Promise<{
    plans: TreatmentPlan[];
    count: number;
  }>
  
  /**
   * Get treatment plans due soon (within next 7 days)
   */
  async getDueSoonTreatments(organisationId?: string): Promise<{
    plans: TreatmentPlan[];
    count: number;
  }>
  
  /**
   * Get overdue treatment actions
   */
  async getOverdueActions(organisationId?: string): Promise<{
    actions: TreatmentAction[];
    count: number;
  }>
  
  /**
   * Get actions due soon (within next 7 days)
   */
  async getDueSoonActions(organisationId?: string): Promise<{
    actions: TreatmentAction[];
    count: number;
  }>
  
  /**
   * Notify on treatment completion
   */
  async notifyTreatmentCompleted(treatmentPlanId: string): Promise<void>
  
  /**
   * Notify on treatment approval
   */
  async notifyTreatmentApproved(treatmentPlanId: string): Promise<void>
}
```

#### Implementation Example

```typescript
async getOverdueTreatments(organisationId?: string) {
  const where: any = {
    status: { in: ['IN_PROGRESS', 'APPROVED'] },
    targetEndDate: { lt: new Date() }
  };
  
  if (organisationId) {
    where.organisationId = organisationId;
  }
  
  const [plans, count] = await Promise.all([
    this.prisma.treatmentPlan.findMany({
      where,
      include: {
        risk: { select: { riskId, title, inherentScore, residualScore } },
        implementer: { select: { id, email, firstName, lastName } },
        riskOwner: { select: { id, email, firstName, lastName } }
      },
      orderBy: { targetEndDate: 'asc' }
    }),
    this.prisma.treatmentPlan.count({ where })
  ]);
  
  return { plans, count };
}
```

---

## Treatment History

### History Service

**Location**: `apps/server/src/risks/services/treatment-history.service.ts`

#### Purpose

Maintain a complete audit trail of all treatment plan changes and lifecycle events.

#### History Actions

```typescript
enum TreatmentHistoryAction {
  CREATED
  UPDATED
  APPROVED
  REJECTED
  STARTED
  PROGRESS_UPDATED
  COMPLETED
  CANCELLED
  REOPENED
  ACTION_ADDED
  ACTION_COMPLETED
  ACTION_BLOCKED
  COMMENT_ADDED
}
```

#### Key Methods

```typescript
class TreatmentHistoryService {
  /**
   * Log a treatment plan change
   */
  async logChange(
    treatmentPlanId: string,
    action: TreatmentHistoryAction,
    userId: string,
    details?: any,
    notes?: string
  ): Promise<TreatmentPlanHistory>
  
  /**
   * Get history for a treatment plan
   */
  async getHistory(
    treatmentPlanId: string,
    options?: { take?: number; skip?: number }
  ): Promise<{ entries: TreatmentPlanHistory[]; count: number }>
  
  /**
   * Get recent changes across all treatments
   */
  async getRecentChanges(
    organisationId?: string,
    limit = 50
  ): Promise<TreatmentPlanHistory[]>
}
```

#### Usage Example

```typescript
// In TreatmentPlanService.create()
await this.historyService.logChange(
  plan.id,
  'CREATED',
  userId,
  { targetResidualScore, estimatedCost },
  'Treatment plan created'
);

// In TreatmentPlanService.approve()
await this.historyService.logChange(
  id,
  'APPROVED',
  approvedById,
  { approvedDate: new Date() },
  'Treatment plan approved for implementation'
);
```

---

## Treatment Templates

### Purpose

Provide reusable treatment patterns for common risk scenarios, reducing time to create treatment plans.

### Template Model

```prisma
model TreatmentTemplate {
  id                String            @id @default(cuid())
  templateId        String            // "TPL-001", "TPL-002"
  title             String
  description       String            @db.Text
  treatmentType     TreatmentType     @default(MITIGATE)
  priority          TreatmentPriority @default(MEDIUM)
  riskLevels        String[]          // Applicable risk levels
  estimatedCostMin  Decimal?          @db.Decimal(15, 2)
  estimatedCostMax  Decimal?          @db.Decimal(15, 2)
  
  organisationId    String?
  organisation      OrganisationProfile? @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  
  createdById       String?
  createdBy         User?             @relation("TemplateCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt         DateTime          @default(now())
  
  @@unique([templateId, organisationId])
}
```

### Template Usage

Templates can be:
1. **System-wide**: Available to all organisations (`organisationId = null`)
2. **Organisation-specific**: Custom templates per organisation

When creating a treatment plan from a template:
- Pre-fills title, description, treatment type, priority
- Suggests estimated cost range
- Validates risk level compatibility

---

## Treatment Dependencies

### Purpose

Link related treatments to manage complex risk mitigation strategies where treatments:
- **BLOCKS**: One treatment must complete before another can start
- **REQUIRES**: One treatment needs another to be effective
- **RELATED**: Treatments are connected but independent

### Dependency Model

```prisma
model TreatmentDependency {
  id                String         @id @default(cuid())
  
  sourceTreatmentId String
  sourceTreatment   TreatmentPlan  @relation("SourceDependencies", fields: [sourceTreatmentId], references: [id], onDelete: Cascade)
  
  targetTreatmentId String
  targetTreatment   TreatmentPlan  @relation("TargetDependencies", fields: [targetTreatmentId], references: [id], onDelete: Cascade)
  
  dependencyType    DependencyType // BLOCKS, REQUIRES, RELATED
  description       String?        @db.Text
  isMandatory       Boolean        @default(true)
  
  createdAt         DateTime       @default(now())
  createdById       String?
  createdBy         User?          @relation("DependencyCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  @@unique([sourceTreatmentId, targetTreatmentId])
  @@index([sourceTreatmentId])
  @@index([targetTreatmentId])
  @@index([dependencyType])
}

enum DependencyType {
  BLOCKS    // Source must complete before target can start
  REQUIRES  // Target needs source to be effective
  RELATED   // Informational link
}
```

### Dependency Validation

When starting a treatment with BLOCKS dependencies:
```typescript
// Check if all blocking treatments are completed
const blockingDeps = await prisma.treatmentDependency.findMany({
  where: {
    targetTreatmentId: treatmentId,
    dependencyType: 'BLOCKS',
    isMandatory: true
  },
  include: {
    sourceTreatment: { select: { status, title } }
  }
});

const incomplete = blockingDeps.filter(
  dep => dep.sourceTreatment.status !== 'COMPLETED'
);

if (incomplete.length > 0) {
  throw new BadRequestException(
    `Cannot start treatment. Blocked by: ${incomplete.map(d => d.sourceTreatment.title).join(', ')}`
  );
}
```

---

## Frontend Components

### TreatmentPlanDialog

**Location**: `apps/web/src/components/risks/TreatmentPlanDialog.tsx`

#### Purpose

Modal dialog for creating and editing treatment plans with all critical fields.

#### Enhanced Fields (24/29 fields, 83% coverage)

**Section 1: Basic Information**
- Treatment ID, Associated Risk, Title, Description

**Section 2: Treatment Type & Classification**
- Treatment Type (MITIGATE, TRANSFER, AVOID, ACCEPT)
- Priority (LOW, MEDIUM, HIGH, CRITICAL)
- Status (DRAFT, PROPOSED, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED)

**Section 3: Ownership & Responsibility** ⭐ NEW
- Risk Owner (user dropdown)
- Implementer (user dropdown)

**Section 4: Financial & Risk Reduction Targets** ⭐ ENHANCED
- Estimated Cost
- Expected Reduction % (0-100)
- Expected ROI %
- Target Residual Score
- Proposed Date
- Cost/Benefit Analysis

**Section 5: Timeline**
- Target Start Date
- Target End Date

**Section 6: Risk Acceptance Details** (conditional on ACCEPT type) ⭐ ENHANCED
- Acceptance Rationale
- Acceptance Criteria
- Acceptance Expiry Date ⭐ NEW

**Section 7: Related Controls**
- Control IDs

#### Form State Management

```typescript
const [form, setForm] = useState({
  // Basic
  treatmentId: "",
  riskId: "",
  title: "",
  description: "",
  
  // Classification
  treatmentType: "MITIGATE",
  priority: "MEDIUM",
  status: "DRAFT",
  
  // Ownership ⭐ NEW
  riskOwnerId: "",
  implementerId: "",
  
  // Financial & Targets ⭐ ENHANCED
  estimatedCost: "",
  expectedReduction: "",  // ⭐ NEW
  roi: "",                // ⭐ NEW
  targetResidualScore: "",
  proposedDate: "",       // ⭐ NEW
  costBenefit: "",
  
  // Timeline
  targetStartDate: "",
  targetEndDate: "",
  
  // Acceptance ⭐ ENHANCED
  acceptanceRationale: "",
  acceptanceCriteria: "",
  acceptanceExpiryDate: "", // ⭐ NEW
  
  // Controls
  controlIds: "",
});
```

#### User Dropdown Integration

```typescript
const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  try {
    const usersData = await getUsers();
    setUsers(usersData);
  } catch (err) {
    console.error('Error loading users:', err);
  }
};

// In form JSX
<Select
  value={form.riskOwnerId}
  onValueChange={(value) => setForm({ ...form, riskOwnerId: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select risk owner" />
  </SelectTrigger>
  <SelectContent>
    {users.map((user) => (
      <SelectItem key={user.id} value={user.id}>
        {user.firstName} {user.lastName} ({user.email})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### API Payload

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const payload = {
    treatmentId: form.treatmentId,
    riskId: form.riskId,
    title: form.title,
    description: form.description,
    treatmentType: form.treatmentType,
    priority: form.priority,
    status: form.status,
    
    // Ownership
    riskOwnerId: form.riskOwnerId || undefined,
    implementerId: form.implementerId || undefined,
    
    // Financial & Targets
    estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
    expectedReduction: form.expectedReduction ? parseInt(form.expectedReduction) : undefined,
    roi: form.roi ? parseFloat(form.roi) : undefined,
    targetResidualScore: form.targetResidualScore ? parseInt(form.targetResidualScore) : undefined,
    proposedDate: form.proposedDate || undefined,
    costBenefit: form.costBenefit || undefined,
    
    // Timeline
    targetStartDate: form.targetStartDate || undefined,
    targetEndDate: form.targetEndDate || undefined,
    
    // Acceptance
    acceptanceRationale: form.acceptanceRationale || undefined,
    acceptanceCriteria: form.acceptanceCriteria || undefined,
    acceptanceExpiryDate: form.acceptanceExpiryDate || undefined,
    
    // Controls
    controlIds: form.controlIds || undefined,
  };
  
  if (isEditing) {
    await updateTreatmentPlan(plan.id, payload);
  } else {
    await createTreatmentPlan(payload);
  }
};
```

---

## API Endpoints

### Treatment Plan Endpoints

**Base Path**: `/api/risks/treatment-plans`

#### List Treatment Plans
```
GET /api/risks/treatment-plans
Query Parameters:
  - skip: number (pagination offset)
  - take: number (page size)
  - status: TreatmentStatus (filter by status)
  - type: TreatmentType (filter by type)
  - priority: TreatmentPriority (filter by priority)
  - riskId: string (filter by risk)
  - organisationId: string (filter by organisation)

Response:
{
  results: TreatmentPlan[],
  count: number
}
```

#### Get Treatment Plan
```
GET /api/risks/treatment-plans/:id

Response: TreatmentPlan (with computed defaults)
```

#### Get Treatment Plans by Risk
```
GET /api/risks/treatment-plans/by-risk/:riskId

Response: TreatmentPlan[]
```

#### Get Treatment Plan Statistics
```
GET /api/risks/treatment-plans/stats
Query Parameters:
  - organisationId: string (optional)

Response:
{
  total: number,
  overdueCount: number,
  completedThisMonth: number,
  byStatus: { [status: string]: number },
  byType: { [type: string]: number },
  byPriority: { [priority: string]: number }
}
```

#### Create Treatment Plan
```
POST /api/risks/treatment-plans
Body:
{
  treatmentId: string,
  title: string,
  description: string,
  treatmentType?: TreatmentType,
  priority?: TreatmentPriority,
  status?: TreatmentStatus,
  targetResidualScore?: number,
  expectedReduction?: number,
  estimatedCost?: number,
  costBenefit?: string,
  roi?: number,
  proposedDate?: string,
  targetStartDate?: string,
  targetEndDate?: string,
  riskOwnerId?: string,
  implementerId?: string,
  acceptanceRationale?: string,
  acceptanceCriteria?: string,
  acceptanceExpiryDate?: string,
  controlIds?: string,
  riskId: string,
  organisationId?: string
}

Response: TreatmentPlan
```

#### Update Treatment Plan
```
PUT /api/risks/treatment-plans/:id
Body: (all fields optional)
{
  title?: string,
  description?: string,
  treatmentType?: TreatmentType,
  priority?: TreatmentPriority,
  status?: TreatmentStatus,
  targetResidualScore?: number,
  currentResidualScore?: number,
  expectedReduction?: number,
  estimatedCost?: number,
  actualCost?: number,
  costBenefit?: string,
  roi?: number,
  proposedDate?: string,
  approvedDate?: string,
  targetStartDate?: string,
  targetEndDate?: string,
  actualStartDate?: string,
  actualEndDate?: string,
  riskOwnerId?: string,
  implementerId?: string,
  acceptanceRationale?: string,
  acceptanceCriteria?: string,
  acceptanceExpiryDate?: string,
  progressPercentage?: number,
  progressNotes?: string,
  controlIds?: string
}

Response: TreatmentPlan
```

#### Approve Treatment Plan
```
PUT /api/risks/treatment-plans/:id/approve

Response: TreatmentPlan (with approvedDate and approvedBy)
```

#### Update Progress
```
PUT /api/risks/treatment-plans/:id/progress
Body:
{
  progressPercentage: number,
  progressNotes?: string
}

Response: TreatmentPlan
```

#### Delete Treatment Plan
```
DELETE /api/risks/treatment-plans/:id

Response: void
```

### Treatment Action Endpoints

#### Create Action
```
POST /api/risks/treatment-plans/:id/actions
Body:
{
  actionId: string,
  title: string,
  description?: string,
  status?: ActionStatus,
  priority?: TreatmentPriority,
  dueDate?: string,
  assignedToId?: string,
  estimatedHours?: number
}

Response: TreatmentAction
```

#### Update Action
```
PUT /api/risks/treatment-plans/actions/:actionId
Body:
{
  title?: string,
  description?: string,
  status?: ActionStatus,
  priority?: TreatmentPriority,
  dueDate?: string,
  completedDate?: string,
  assignedToId?: string,
  estimatedHours?: number,
  actualHours?: number,
  completionNotes?: string,
  blockerNotes?: string
}

Response: TreatmentAction
```

#### Delete Action
```
DELETE /api/risks/treatment-plans/actions/:actionId

Response: void
```

---

## Configuration

### Risk Treatment Configuration

**Location**: `apps/server/src/config/risks.config.ts`

```typescript
export const RISKS_CONFIG = {
  treatment: {
    // Target score offset from tolerance threshold
    targetScoreOffset: 2,
    
    // Treatment deadlines by tolerance status (days)
    deadlines: {
      CRITICAL: 7,    // 7 days for critical risks
      EXCEEDS: 30,    // 30 days for risks exceeding tolerance
      DEFAULT: 90,    // 90 days for other risks
    },
    
    // Progress tracking
    progressThresholds: {
      NOT_STARTED: 0,
      IN_PROGRESS: 1,
      COMPLETED: 100,
    },
  },
  
  tolerance: {
    defaultThreshold: 7,  // Default tolerance threshold (LOW risk max)
  },
  
  // ... other risk configuration
};
```

---

## Best Practices

### 1. Always Validate Target Scores

Ensure target residual scores meet tolerance thresholds before approving treatments:

```typescript
const isAcceptable = isWithinTolerance(targetScore, toleranceThreshold);
if (!isAcceptable && treatmentType !== 'ACCEPT') {
  // Reject or require additional justification
}
```

### 2. Use Auto-Calculation

Let the system calculate missing fields to ensure consistency:

```typescript
// Provide either expectedReduction OR targetResidualScore
// The system will calculate the other
const payload = {
  expectedReduction: 50, // 50% reduction
  // targetResidualScore will be auto-calculated
};
```

### 3. Track Effectiveness

Always capture actual results when completing treatments:

```typescript
await updateProgress(treatmentId, 100, 'Treatment completed');
// System automatically captures currentResidualScore for comparison
```

### 4. Use Templates for Common Scenarios

Create templates for frequently used treatment patterns:

```typescript
const template = await createTemplate({
  templateId: 'TPL-PATCH-MGMT',
  title: 'Patch Management Enhancement',
  description: 'Implement automated patch management system',
  treatmentType: 'MITIGATE',
  riskLevels: ['MEDIUM', 'HIGH'],
  estimatedCostMin: 5000,
  estimatedCostMax: 15000,
});
```

### 5. Link Related Treatments

Use dependencies to manage complex treatment strategies:

```typescript
await createDependency({
  sourceTreatmentId: 'TP-001', // Firewall upgrade
  targetTreatmentId: 'TP-002', // Network segmentation
  dependencyType: 'BLOCKS',
  description: 'Firewall must be upgraded before implementing segmentation',
});
```

---

## Summary

The Risk Treatment System provides:

✅ **Comprehensive Planning**: 24/29 fields (83%) captured in creation workflow
✅ **Automated Calculations**: ROI, target scores, expected reduction
✅ **Tolerance Validation**: Ensures treatments meet risk appetite
✅ **Effectiveness Tracking**: Compare planned vs actual results
✅ **Notifications**: Alert stakeholders of overdue/due-soon items
✅ **History Tracking**: Complete audit trail of changes
✅ **Templates**: Reusable patterns for common scenarios
✅ **Dependencies**: Manage complex treatment relationships

This architecture supports the complete treatment lifecycle from planning through execution and effectiveness measurement.
