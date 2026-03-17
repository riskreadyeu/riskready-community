# Capability 5.1-C01: Policy Development and Approval

## Evidence Mapping Analysis

---

## 1. Capability Overview

| Attribute | Value |
|-----------|-------|
| Capability ID | 5.1-C01 |
| Name | Policy Development and Approval |
| Type | PROCESS |
| Current Maturity | 0/5 |
| Evidence Linked | 0 |

### Description
> Information security policy exists, covers required scope, and is approved by management

---

## 2. Evidence Requirements by Test Type

### 2.1 DESIGN Test

**Purpose:** Verify the control is properly designed

| Evidence Required | Status | Source in App |
|-------------------|--------|---------------|
| Policy document with approval record | ✅ Available | `DocumentApprovalWorkflow` + `ApprovalStep` (electronic approval is sufficient - signed PDF not required) |
| Version control log showing annual review dates | ✅ Available | `DocumentVersion` table |
| Policy approval workflow from GRC system | ✅ Available | `DocumentApprovalWorkflow` + `ApprovalStep` tables |

> **Note:** ISO 27001 does not require wet signatures or PDFs. Electronic approval workflows with proper audit trails are accepted as evidence of management approval.

### 2.2 IMPLEMENTATION Test

**Purpose:** Verify the control is properly deployed

| Evidence Required | Status | Source in App |
|-------------------|--------|---------------|
| Screenshots of approval workflow configuration | ⚠️ Manual | UI exists but needs screenshot capture |
| Sample approved policy with audit trail | ✅ Available | `PolicyDocumentAuditLog` table |
| Workflow type configuration | ✅ Available | `DocumentApprovalWorkflow.workflowType` |

### 2.3 OPERATING Test

**Purpose:** Verify the control is working effectively

| Evidence Required | Status | Source in App |
|-------------------|--------|---------------|
| Last 3 months of approval workflow records | ✅ Available | `DocumentApprovalWorkflow` (filter by date) |
| Evidence of rejected/revised policies | ✅ Available | Workflows with `status: REJECTED` |
| Approval cycle time metrics | ⚠️ Needs calc | Can derive from `initiatedAt` → `completedAt` |

---

## 3. Policy Module Features for 5.1-C01

### 3.1 Data Models

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     APPROVAL WORKFLOW DATA MODEL                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PolicyDocument                    DocumentApprovalWorkflow             │
│  ──────────────                    ─────────────────────────            │
│  • documentId (POL-001)            • workflowType                       │
│  • title                             - SEQUENTIAL                       │
│  • status                            - PARALLEL                         │
│  • approvalLevel                     - CONSENSUS                        │
│    - EXECUTIVE                       - HIERARCHICAL                     │
│    - SENIOR_MANAGEMENT             • status                             │
│    - DEPARTMENT_HEAD                 - PENDING                          │
│    - TEAM_LEAD                       - IN_PROGRESS                      │
│  • approvedBy                        - APPROVED                         │
│  • approvalDate                      - REJECTED                         │
│  • version                           - CANCELLED                        │
│                                    • initiatedAt                        │
│         │                          • completedAt                        │
│         │                          • dueDate                            │
│         ▼                                                               │
│  DocumentVersion                           │                            │
│  ───────────────                           ▼                            │
│  • version (1.0, 2.0)              ApprovalStep                         │
│  • changeLog                       ────────────                         │
│  • changedAt                       • stepOrder                          │
│  • changedBy                       • approverRole                       │
│                                    • approverId                         │
│         │                          • status (PENDING/APPROVED/REJECTED) │
│         ▼                          • decision                           │
│  PolicyDocumentAuditLog            • comments                           │
│  ──────────────────────            • decidedAt                          │
│  • action                                                               │
│    - CREATED                                                            │
│    - UPDATED                                                            │
│    - APPROVED                                                           │
│    - REJECTED                                                           │
│    - REVIEWED                                                           │
│  • description                                                          │
│  • previousValue                                                        │
│  • newValue                                                             │
│  • performedBy                                                          │
│  • performedAt                                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Service Methods

| Service | Method | Purpose | Evidence Type |
|---------|--------|---------|---------------|
| `ApprovalWorkflowService` | `createWorkflow()` | Initiate approval process | IMPLEMENTATION |
| `ApprovalWorkflowService` | `processStep()` | Record approval/rejection | OPERATING |
| `ApprovalWorkflowService` | `delegateStep()` | Delegate approval | OPERATING |
| `ApprovalWorkflowService` | `cancelWorkflow()` | Cancel workflow | OPERATING |
| `ApprovalWorkflowService` | `getPendingApprovals()` | List pending approvals | OPERATING |
| `ApprovalWorkflowService` | `getDefaultWorkflowSteps()` | Get workflow template | DESIGN |
| `DocumentVersionService` | `create()` | Create version record | DESIGN |
| `PolicyAuditService` | `log()` | Create audit entry | ALL |

### 3.3 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/policies/:id/workflows` | List approval workflows |
| GET | `/api/policies/:id/workflow/current` | Get current workflow |
| GET | `/api/policies/:id/workflow/validate` | Validate document has required approvers |
| POST | `/api/policies/:id/workflows` | Create new workflow |
| POST | `/api/policies/workflows/steps/:stepId/process` | Approve/reject step |
| POST | `/api/policies/workflows/steps/:stepId/delegate` | Delegate step |
| POST | `/api/policies/workflows/:id/cancel` | Cancel workflow |
| GET | `/api/policies/approvals/pending` | My pending approvals |
| GET | `/api/policies/workflows/approval-matrix` | Get approval matrix by document type |
| GET | `/api/policies/workflows/default-by-type` | Get default workflow for document type |

### 3.4 Approval Matrix by Document Type

| Document Type | Approvers | Workflow | Mandatory Custom List |
|---------------|-----------|----------|----------------------|
| **POLICY** | Custom per policy | SEQUENTIAL/PARALLEL | ✅ YES |
| **STANDARD** | CISO/CIO | SEQUENTIAL | No |
| **PROCEDURE** | Control Owner → CISO/CIO | SEQUENTIAL | No |
| **GUIDELINE** | Control Owner | SEQUENTIAL | No |
| **WORK_INSTRUCTION** | Control Owner | SEQUENTIAL | No |

> **Enforcement:** The `createWorkflow()` method enforces these rules:
> - **POLICY**: Rejects workflow creation if no approvers provided. Error: *"Policies require a mandatory list of approvers"*
> - **STANDARD/PROCEDURE/GUIDELINE**: Auto-applies default approvers if none provided

---

## 4. Current Data State

### 4.1 What We Have

| Data | Count | Notes |
|------|-------|-------|
| Published Documents | 81 | Seeded without formal workflows |
| Approval Workflows | 0 | No formal workflows created yet |
| Approval Steps | 0 | No workflow steps |
| Document Versions | 0 | No version history yet |
| Audit Log Entries | 5 | Some review/create actions |

### 4.2 Sample Audit Log

| Action | Document | Description |
|--------|----------|-------------|
| CREATED | PRO-001-01 | Document created and published |
| REVIEWED | POL-001 | Document reviewed: NO_CHANGES |
| REVIEWED | POL-005 | Document reviewed: MAJOR_CHANGES |
| UPDATED | POL-005 | Change request submitted |

### 4.3 Sample Documents with Approval Info

| Document ID | Approval Level | Approved By | Date |
|-------------|----------------|-------------|------|
| STD-001-01 | SENIOR_MANAGEMENT | [Management Name/Committee] | Not set |
| STD-002-01 | SENIOR_MANAGEMENT | (not set) | 2025-01-15 |
| STD-002-02 | SENIOR_MANAGEMENT | CISO / Steering Committee | 2025-01-15 |

---

## 5. Evidence Gap Analysis

### 5.1 Gaps Identified

| Gap | Impact | Remediation |
|-----|--------|-------------|
| No formal approval workflows executed | Cannot demonstrate OPERATING effectiveness | Create workflows for new/updated policies |
| No version history | Cannot show version control | Enable versioning on document updates |
| Approval metrics not calculated | Cannot show efficiency | Add dashboard metrics |

> **Note:** PDF generation with signatures is NOT a gap for ISO 27001 compliance. Electronic approval workflows are sufficient evidence.

### 5.2 Evidence Collection Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EVIDENCE COLLECTION STRATEGY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  IMMEDIATE (Auto-collect from existing data):                           │
│  ─────────────────────────────────────────────                          │
│  • Audit log entries showing document lifecycle                         │
│  • Document inventory with approval levels                              │
│  • Review records demonstrating oversight                               │
│                                                                         │
│  SHORT-TERM (Requires workflow execution):                              │
│  ──────────────────────────────────────────                             │
│  • Execute approval workflows for policy updates                        │
│  • Capture approval/rejection decisions                                 │
│  • Build 3-month history of workflow records                            │
│                                                                         │
│  MEDIUM-TERM (Feature enhancements):                                    │
│  ─────────────────────────────────────                                  │
│  • Approval cycle time metrics                                          │
│  • Workflow efficiency dashboard                                        │
│  • PDF export (optional - for external sharing only)                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Test Criteria (Proposed)

### 6.1 DESIGN Test Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| D1 | Approval workflow exists | `DocumentApprovalWorkflow` model defined |
| D2 | Multiple workflow types supported | SEQUENTIAL, PARALLEL, CONSENSUS, HIERARCHICAL |
| D3 | Approval levels defined | EXECUTIVE, SENIOR_MANAGEMENT, DEPARTMENT_HEAD, TEAM_LEAD |
| D4 | Audit trail capability | `PolicyDocumentAuditLog` captures all actions |
| D5 | Version control capability | `DocumentVersion` model defined |

### 6.2 IMPLEMENTATION Test Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| I1 | Workflow UI functional | Users can initiate workflows |
| I2 | Approval UI functional | Approvers can approve/reject |
| I3 | Notifications configured | Email/in-app notifications sent |
| I4 | Audit logging active | Actions create audit entries |
| I5 | Version tracking active | Updates create version records |

### 6.3 OPERATING Test Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| O1 | Workflows executed | ≥1 workflow completed in last 90 days |
| O2 | Approvals recorded | ≥1 approval decision recorded |
| O3 | Rejections handled | Rejected workflows have revision records |
| O4 | Cycle time reasonable | Average approval ≤10 business days |
| O5 | No unauthorized approvals | All approvals by authorized roles |

---

## 7. Auto-Evidence Mapping

The `PolicyEvidenceCollectorService` maps to 5.1-C01:

```typescript
// From policy-evidence-collector.service.ts

private async collectApprovalEvidence(
  organisationId: string,
  capabilityId: string,  // 5.1-C01
): Promise<CollectedEvidence[]> {

  const approvals = await this.prisma.documentApprovalWorkflow.findMany({
    where: {
      document: { organisationId },
      status: 'APPROVED',
    },
    include: {
      document: { select: { id, documentId, title } },
      steps: {
        where: { status: 'APPROVED' },
        include: { approver: { select: { firstName, lastName } } },
      },
    },
  });

  // Creates evidence records:
  // - Title: "Approval: {document title}"
  // - Description: Workflow details, approvers, dates
  // - Links to capability 5.1-C01
}
```

---

## 8. Maturity Progression

| Level | Criteria | Evidence Required |
|-------|----------|-------------------|
| **L1** | Ad-hoc approvals exist | Document has `approvedBy` field populated |
| **L2** | Workflow process documented | PRO-001-01 exists and is published |
| **L3** | Workflows consistently used | ≥80% of policy updates use formal workflow |
| **L4** | Metrics tracked | Approval cycle time dashboard available |
| **L5** | Continuous improvement | Evidence of workflow optimization |

---

## 9. Next Steps

1. **Execute sample workflows** - Create approval workflows for existing documents
2. **Enable versioning** - Track document changes with version records
3. **Add test criteria** - Populate `testCriteria` field in effectiveness tests
4. **Run evidence collector** - Link existing data to capability
5. **Assess maturity** - Update L1-L5 flags based on evidence

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| PRO-001-01 | Policy and Document Management Procedure |
| control-5.1-policy-mapping.md | Full Control 5.1 mapping |
