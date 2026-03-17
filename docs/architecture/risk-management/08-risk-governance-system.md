# Risk Governance System Architecture

## Overview

The Risk Governance system implements role-based access control (RBAC), approval workflows, escalation management, and governance role assignments. It enforces score-based approval thresholds, state-action matrices, and hierarchical decision authority per GRC compliance requirements.

---

## 1. Governance Roles

### GovernanceRoleCode Enum

| Role | Authority Level | Description |
|------|-----------------|-------------|
| `RISK_ANALYST` | Lowest | Creates/assesses scenarios |
| `RISK_OWNER` | Low | Owns and accepts within-tolerance risks |
| `TREATMENT_OWNER` | Low | Manages treatment execution |
| `CISO` | Medium | Accepts risks ≤15, decides escalations |
| `RISK_COMMITTEE` | High | Accepts risks ≤20, policy decisions |
| `BOARD` | Highest | Accepts any risk, final authority |
| `SYSTEM` | N/A | Automated transitions |

### Role Hierarchy Diagram

```
                          ┌─────────┐
                          │  BOARD  │ ← Can accept ANY risk score
                          └────┬────┘
                               │
                     ┌─────────┴─────────┐
                     │  RISK_COMMITTEE   │ ← Can accept score ≤ 20
                     └─────────┬─────────┘
                               │
                          ┌────┴────┐
                          │  CISO   │ ← Can accept score ≤ 15
                          └────┬────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        ┌─────┴─────┐   ┌──────┴──────┐   ┌─────┴──────┐
        │ RISK_OWNER│   │ RISK_ANALYST│   │ TREATMENT  │
        └───────────┘   └─────────────┘   │   OWNER    │
         ↑ Within         ↑ Create &      └────────────┘
           tolerance       assess           ↑ Treatment
           only                               only
```

---

## 2. Score-Based Approval Thresholds

### Approval Level Requirements

| Risk Score | Approval Level Required | Condition |
|------------|------------------------|-----------|
| ≤ Tolerance | RISK_OWNER | Within tolerance, standard acceptance |
| > Tolerance, ≤ 15 | CISO | Exceeds tolerance, manageable |
| 16-20 | RISK_COMMITTEE | High risk, committee review |
| 21-25 | BOARD | Critical risk, executive decision |

### Exception Handling

Exceptions (accepting risks that exceed tolerance) require elevated approval:

```typescript
determineRequiredApprovalLevel(
  score: number,
  toleranceThreshold: number,
  isException: boolean,
): RiskApprovalLevel {
  // If within tolerance and not exception, Risk Owner can approve
  if (!isException && score <= toleranceThreshold) {
    return RiskApprovalLevel.RISK_OWNER;
  }

  // Exception or exceeds tolerance - use score thresholds
  if (score > 20) return RiskApprovalLevel.BOARD;
  if (score > 15) return RiskApprovalLevel.RISK_COMMITTEE;
  if (score > toleranceThreshold) return RiskApprovalLevel.CISO;
  return RiskApprovalLevel.RISK_OWNER;
}
```

---

## 3. Role Capabilities Matrix

### Actions by Role

```typescript
const ROLE_CAPABILITIES: Record<GovernanceRoleCode, RiskAction[]> = {
  RISK_ANALYST: [
    'CREATE_SCENARIO', 'EDIT_SCENARIO', 'DELETE_SCENARIO',
    'SUBMIT_ASSESSMENT', 'REQUEST_REVIEW',
    'VIEW_RISK', 'VIEW_SCENARIO',
  ],
  RISK_OWNER: [
    'CREATE_SCENARIO', 'EDIT_SCENARIO', 'DELETE_SCENARIO',
    'SUBMIT_ASSESSMENT', 'ACCEPT_RISK', 'START_TREATMENT',
    'ESCALATE_RISK', 'REQUEST_REVIEW', 'COMPLETE_REVIEW', 'CLOSE_SCENARIO',
    'VIEW_RISK', 'VIEW_SCENARIO',
  ],
  TREATMENT_OWNER: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'UPDATE_TREATMENT', 'COMPLETE_TREATMENT',
  ],
  CISO: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'ACCEPT_RISK', 'ACCEPT_EXCEPTION',
    'DECIDE_ESCALATION', 'COMPLETE_REVIEW', 'CLOSE_SCENARIO',
    'OVERRIDE_EVALUATION',
  ],
  RISK_COMMITTEE: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'ACCEPT_RISK', 'ACCEPT_EXCEPTION',
    'DECIDE_ESCALATION', 'COMPLETE_REVIEW', 'CLOSE_SCENARIO', 'ARCHIVE_SCENARIO',
    'OVERRIDE_EVALUATION', 'ASSIGN_GOVERNANCE_ROLE',
  ],
  BOARD: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'ACCEPT_RISK', 'ACCEPT_EXCEPTION',
    'DECIDE_ESCALATION', 'COMPLETE_REVIEW', 'CLOSE_SCENARIO', 'ARCHIVE_SCENARIO',
    'OVERRIDE_EVALUATION', 'ASSIGN_GOVERNANCE_ROLE',
  ],
  SYSTEM: [
    'VIEW_RISK', 'VIEW_SCENARIO',
  ],
};
```

---

## 4. State-Action Matrix

### Valid Actions per Scenario Status

```typescript
const STATE_ACTION_MATRIX: Record<ScenarioStatus, RiskAction[]> = {
  DRAFT: [
    'EDIT_SCENARIO', 'DELETE_SCENARIO', 'SUBMIT_ASSESSMENT',
    'VIEW_RISK', 'VIEW_SCENARIO',
  ],
  ASSESSED: [
    'VIEW_RISK', 'VIEW_SCENARIO', 'EDIT_SCENARIO',
  ],
  EVALUATED: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'ACCEPT_RISK', 'ACCEPT_EXCEPTION',
    'START_TREATMENT', 'ESCALATE_RISK', 'OVERRIDE_EVALUATION',
  ],
  TREATING: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'UPDATE_TREATMENT', 'COMPLETE_TREATMENT',
  ],
  TREATED: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'SUBMIT_ASSESSMENT', // Re-assess after treatment
  ],
  ACCEPTED: [
    'VIEW_RISK', 'VIEW_SCENARIO', 'REQUEST_REVIEW',
  ],
  MONITORING: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'REQUEST_REVIEW', 'CLOSE_SCENARIO',
  ],
  ESCALATED: [
    'VIEW_RISK', 'VIEW_SCENARIO', 'DECIDE_ESCALATION',
  ],
  REVIEW: [
    'VIEW_RISK', 'VIEW_SCENARIO',
    'COMPLETE_REVIEW', 'CLOSE_SCENARIO',
  ],
  CLOSED: [
    'VIEW_RISK', 'VIEW_SCENARIO', 'ARCHIVE_SCENARIO',
  ],
  ARCHIVED: [
    'VIEW_RISK', 'VIEW_SCENARIO',
  ],
};
```

---

## 5. Authorization Service

### Main Authorization Flow

```typescript
async authorize(action: RiskAction, context: AuthorizationContext): Promise<AuthorizationResult> {
  // 1. Get user's governance roles
  const userRoles = await getUserRoles(context.userId, context);

  // 2. Check if any role allows this action
  const hasCapability = checkRoleCapability(userRoles, action);
  if (!hasCapability) {
    return {
      authorized: false,
      reason: `No governance role with ${action} capability`,
      missingRoles: getRolesWithCapability(action),
    };
  }

  // 3. If scenario context, check state validity
  if (context.scenarioId) {
    const scenario = await getScenario(context.scenarioId);

    // Check if action is valid in current state
    const stateValid = isActionValidInState(action, scenario.status);
    if (!stateValid) {
      return {
        authorized: false,
        reason: `Action ${action} not valid in ${scenario.status} state`,
      };
    }

    // 4. For acceptance, check score-based authority
    if (action === 'ACCEPT_RISK' || action === 'ACCEPT_EXCEPTION') {
      return checkScoreBasedAuthority(
        userRoles,
        scenario.residualScore,
        scenario.toleranceThreshold,
        action === 'ACCEPT_EXCEPTION',
      );
    }

    // 5. For escalation decisions, check authority level
    if (action === 'DECIDE_ESCALATION') {
      return checkEscalationAuthority(context.scenarioId, userRoles);
    }
  }

  return { authorized: true };
}
```

### Authorization Result Interface

```typescript
interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  requiredLevel?: RiskApprovalLevel;
  userLevel?: RiskApprovalLevel | null;
  missingRoles?: GovernanceRoleCode[];
}
```

---

## 6. Role Assignment

### UserGovernanceRole Entity

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | String | User receiving role |
| `roleCode` | GovernanceRoleCode | Role being assigned |
| `scope` | String | GLOBAL, ORGANISATION, RISK |
| `scopeEntityId` | String? | Specific entity ID for scoped roles |
| `assignedById` | String | User who assigned the role |
| `validFrom` | DateTime | When role becomes active |
| `validUntil` | DateTime? | When role expires (null = permanent) |
| `active` | Boolean | Active status |
| `assignmentNotes` | String? | Notes about assignment |

### Scope Hierarchy

```
GLOBAL
  └── All organisations, all risks
ORGANISATION
  └── All risks within specific organisation
RISK
  └── Specific risk only
```

### Role Assignment Logic

```typescript
async assignGovernanceRole(
  userId: string,
  roleCode: GovernanceRoleCode,
  scope: 'GLOBAL' | 'ORGANISATION' | 'RISK',
  scopeEntityId: string | null,
  assignedById: string,
  validUntil?: Date,
  notes?: string,
): Promise<any> {
  // Check if assigner has permission
  const assignerRoles = await getUserRoles(assignedById, { userId: assignedById });
  if (!checkRoleCapability(assignerRoles, 'ASSIGN_GOVERNANCE_ROLE')) {
    throw new ForbiddenException('Not authorized to assign governance roles');
  }

  // Prevent self-assignment of elevated roles
  if (userId === assignedById && isElevatedRole(roleCode)) {
    throw new ForbiddenException('Cannot self-assign elevated roles');
  }

  return prisma.userGovernanceRole.upsert({
    where: { userId_roleCode_scope_scopeEntityId: { userId, roleCode, scope, scopeEntityId: scopeEntityId || '' } },
    create: { userId, roleCode, scope, scopeEntityId, assignedById, validUntil, assignmentNotes: notes, active: true },
    update: { active: true, validUntil, assignmentNotes: notes, assignedById, updatedAt: new Date() },
  });
}
```

---

## 7. Escalation Management

### RiskEscalation Entity

| Field | Type | Purpose |
|-------|------|---------|
| `id` | String | Primary key |
| `scenarioId` | String | Escalated scenario |
| `escalatedTo` | RiskApprovalLevel | Required authority level |
| `escalatedBy` | String | User who escalated |
| `escalatedAt` | DateTime | Escalation time |
| `reason` | String | Why escalated |
| `deadline` | DateTime? | Decision deadline |
| `status` | String | PENDING, DECIDED, EXPIRED |
| `decision` | String? | ACCEPT, TREAT, TRANSFER, AVOID |
| `decisionNotes` | String? | Decision rationale |
| `decidedBy` | String? | Who made decision |
| `decidedAt` | DateTime? | Decision time |

### Escalation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EVALUATED State                          │
│                residualScore > toleranceThreshold           │
└─────────────────┬───────────────────────────────────────────┘
                  │ ESCALATE_RISK action
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Create RiskEscalation                      │
│ • escalatedTo = determineRequiredApprovalLevel(score)       │
│ • status = PENDING                                          │
│ • deadline = now + 7 days (configurable)                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   ESCALATED State                           │
│        Waiting for decision from authority                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ DECIDE_ESCALATION action
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Decision Options:                              │
│ • ACCEPT → ACCEPTED state                                   │
│ • TREAT → TREATING state                                    │
│ • TRANSFER → Assign to another risk owner                   │
│ • AVOID → Eliminate risk-causing activity                   │
└─────────────────────────────────────────────────────────────┘
```

### Escalation Authority Check

```typescript
async checkEscalationAuthority(
  scenarioId: string,
  userRoles: GovernanceRoleCode[],
): Promise<AuthorizationResult> {
  const escalation = await prisma.riskEscalation.findFirst({
    where: { scenarioId, status: 'PENDING' },
    orderBy: { escalatedAt: 'desc' },
  });

  if (!escalation) {
    return { authorized: false, reason: 'No pending escalation found' };
  }

  const userLevel = getHighestApprovalLevel(userRoles);
  if (!userLevel) {
    return { authorized: false, reason: 'User has no approval authority' };
  }

  const levelHierarchy = ['RISK_OWNER', 'CISO', 'RISK_COMMITTEE', 'BOARD'];
  const requiredIndex = levelHierarchy.indexOf(escalation.escalatedTo);
  const userIndex = levelHierarchy.indexOf(userLevel);

  if (userIndex >= requiredIndex) {
    return { authorized: true, requiredLevel: escalation.escalatedTo, userLevel };
  }

  return {
    authorized: false,
    reason: `Escalation requires ${escalation.escalatedTo} authority`,
    requiredLevel: escalation.escalatedTo,
    userLevel,
  };
}
```

---

## 8. Governance Service

### GovernanceService Overview

**Location:** `src/risks/services/governance.service.ts`

| Method | Purpose |
|--------|---------|
| `getGovernanceRoles()` | List all governance role definitions |
| `getUserRoleAssignments()` | Get user's assigned roles |
| `assignRole()` | Assign role to user |
| `revokeRole()` | Remove role from user |
| `getEscalationQueue()` | Get pending escalations |
| `createEscalation()` | Create new escalation |
| `decideEscalation()` | Record escalation decision |
| `getApprovalHistory()` | Get approval/decision history |

---

## 9. API Endpoints

### Authorization

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/authorization/check` | Check if action is authorized |
| GET | `/authorization/scenario/:id/permissions` | Get available actions for scenario |
| GET | `/authorization/roles` | List all governance roles |
| GET | `/authorization/roles/capabilities` | Get role → action mapping |

### Role Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/governance/roles/user/:userId` | Get user's role assignments |
| POST | `/governance/roles/assign` | Assign role to user |
| DELETE | `/governance/roles/revoke` | Revoke role from user |

### Escalations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/governance/escalations` | List pending escalations |
| GET | `/governance/escalations/:id` | Get escalation details |
| POST | `/governance/escalations` | Create escalation |
| PUT | `/governance/escalations/:id/decide` | Record decision |

---

## 10. Permission Checking Utility

### Usage in Controllers

```typescript
@Put(':id/accept')
async acceptRisk(@Request() req, @Param('id') scenarioId: string) {
  // Authorization check throws ForbiddenException if not authorized
  await this.authorizationService.requireAuthorization('ACCEPT_RISK', {
    userId: req.user.id,
    scenarioId,
    organisationId: req.user.organisationId,
  });

  return this.riskService.acceptRisk(scenarioId, req.user.id);
}
```

### Getting Available Actions

```typescript
// For UI to show/hide action buttons
async getScenarioPermissions(scenarioId: string, userId: string) {
  return {
    availableActions: ['ACCEPT_RISK', 'START_TREATMENT', 'ESCALATE_RISK'],
    currentStatus: 'EVALUATED',
    userRoles: ['RISK_OWNER', 'RISK_ANALYST'],
    approvalLevel: 'RISK_OWNER',
  };
}
```

---

## 11. Implementation Status

### Fully Implemented ✅
- Role capability matrix
- State-action matrix
- Score-based approval thresholds
- Role assignment with scoping
- Authorization checking
- Escalation creation and decision
- Self-assignment prevention for elevated roles

### Not Implemented ❌
- Time-limited role assignments (validUntil respected but not auto-revoked)
- Delegation chains (delegating authority temporarily)
- Four-eyes principle enforcement
- Approval workflow routing
- Committee voting mechanism
- Audit trail of authorization decisions

---

## 12. Key Files

| Component | File |
|-----------|------|
| Authorization Service | `src/risks/services/risk-authorization.service.ts` |
| Governance Service | `src/risks/services/governance.service.ts` |
| Constants | `src/risks/services/risk-authorization.service.ts` (ROLE_CAPABILITIES, STATE_ACTION_MATRIX) |
| Schema | `prisma/schema/controls.prisma` (UserGovernanceRole, RiskEscalation) |
