# Control 5.1: Policies for Information Security

## Overview

| Attribute | Value |
|-----------|-------|
| Control ID | 5.1 |
| Control Name | Policies for information security |
| Theme | ORGANISATIONAL |
| ISO 27001:2022 | Clause 5.1 |

## Purpose

This control ensures that information security policies are:
- Defined and approved by management
- Communicated to all relevant personnel
- Reviewed at planned intervals
- Updated when significant changes occur

---

## Capabilities

Control 5.1 is implemented through four capabilities, each addressing a specific aspect of policy management.

### 5.1-C01: Policy Development and Approval

| Attribute | Value |
|-----------|-------|
| Type | PROCESS |
| Current Maturity | 0/5 |
| Evidence Count | 0 |

#### Description
Ensures policies are properly developed, reviewed, and approved by appropriate management before publication.

#### Test Types

| Test Type | Status | Evidence Required |
|-----------|--------|-------------------|
| DESIGN | NOT_TESTED | Policy document PDF with signature page; version control log showing annual review dates; policy approval workflow from GRC system |
| IMPLEMENTATION | NOT_TESTED | Screenshots of approval workflow configuration; sample approved policy with audit trail |
| OPERATING | NOT_TESTED | Last 3 months of approval workflow records; evidence of rejected/revised policies |

#### Policy Module Mapping

| Policy Module Feature | Maps To |
|-----------------------|---------|
| `DocumentApprovalWorkflow` | Approval records with multi-step workflow |
| `DocumentVersion` | Version history with timestamps |
| `ApprovalWorkflowStep` | Individual approver decisions |
| `PolicyDocumentAuditLog` | Complete audit trail |

#### Auto-Evidence Collection
```
POST /api/policies/evidence/collect/:organisationId
```
Collects:
- Completed approval workflows (status: APPROVED)
- Approver names and timestamps
- Workflow type (SEQUENTIAL, PARALLEL, CONSENSUS)

---

### 5.1-C02: Policy Communication and Acknowledgment

| Attribute | Value |
|-----------|-------|
| Type | PROCESS |
| Current Maturity | 0/5 |
| Evidence Count | 0 |

#### Description
Ensures policies are effectively communicated to relevant personnel and acknowledgment is tracked.

#### Test Types

| Test Type | Status | Evidence Required |
|-----------|--------|-------------------|
| DESIGN | NOT_TESTED | LMS completion report showing acknowledgment rates by department; HR onboarding checklist with policy sign-off; sample of 10 recent hire acknowledgment records |
| IMPLEMENTATION | NOT_TESTED | Acknowledgment workflow configuration; notification templates |
| OPERATING | NOT_TESTED | Acknowledgment compliance rates for last quarter; escalation records for non-compliance |

#### Policy Module Mapping

| Policy Module Feature | Maps To |
|-----------------------|---------|
| `PolicyAcknowledgment` | Individual acknowledgment records |
| `PolicyDocument.distribution` | Target audience for communication |
| `PolicyDocument.acknowledgments` | Aggregated acknowledgment status |

#### Auto-Evidence Collection
Collects:
- Acknowledgment counts per document
- Compliance rates (acknowledged/required)
- Documents requiring acknowledgment

---

### 5.1-C03: Topic-Specific Policy Framework

| Attribute | Value |
|-----------|-------|
| Type | PROCESS |
| Current Maturity | 0/5 |
| Evidence Count | 0 |

#### Description
Ensures a comprehensive framework of topic-specific policies exists, properly organized and linked to the master information security policy.

#### Test Types

| Test Type | Status | Evidence Required |
|-----------|--------|-------------------|
| DESIGN | NOT_TESTED | Policy library index with review dates; cross-reference matrix showing policy-to-master-policy linkage; sample of 3 topic policies with approval signatures |
| IMPLEMENTATION | NOT_TESTED | Policy hierarchy diagram; document type breakdown |
| OPERATING | NOT_TESTED | Evidence of new policies added in response to requirements; gap analysis results |

#### Policy Module Mapping

| Policy Module Feature | Maps To |
|-----------------------|---------|
| `PolicyDocument` inventory | Complete policy library |
| `PolicyDocument.documentType` | Classification (POLICY, STANDARD, PROCEDURE, GUIDELINE) |
| `PolicyDocument.parentDocumentId` | Hierarchy/linkage to master policy |
| `DocumentControlMapping` | ISO 27001 control mapping |
| `DocumentRelation` | Cross-references between documents |

#### Auto-Evidence Collection
Collects:
- Total published document count
- Breakdown by document type
- Framework completeness indicator

---

### 5.1-C04: Policy Review and Maintenance

| Attribute | Value |
|-----------|-------|
| Type | PROCESS |
| Current Maturity | 0/5 |
| Evidence Count | 0 |

#### Description
Ensures policies are reviewed at planned intervals and updated when significant changes occur.

#### Test Types

| Test Type | Status | Evidence Required |
|-----------|--------|-------------------|
| DESIGN | NOT_TESTED | Policy review schedule vs actual review dates; change management tickets triggering policy updates; review meeting minutes with attendee list |
| IMPLEMENTATION | NOT_TESTED | Review scheduler configuration; reminder notification setup |
| OPERATING | NOT_TESTED | Review completion rates; overdue review reports; change request history |

#### Policy Module Mapping

| Policy Module Feature | Maps To |
|-----------------------|---------|
| `DocumentReview` | Review records with outcomes |
| `DocumentChangeRequest` | Change management records |
| `PolicyDocument.reviewFrequency` | Scheduled review intervals |
| `PolicyDocument.nextReviewDate` | Upcoming review tracking |
| `PolicyDocument.lastReviewDate` | Review compliance |

#### Auto-Evidence Collection
Collects:
- Completed review records
- Review outcomes (NO_CHANGES, MINOR_CHANGES, MAJOR_CHANGES, RETIRE)
- Implemented change requests

---

## Evidence Collection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EVIDENCE COLLECTION FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Policy Module                    Evidence Collector               │
│   ─────────────                    ──────────────────               │
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────┐              │
│   │ Approval        │─────────────►│ 5.1-C01         │              │
│   │ Workflows       │              │ Evidence        │              │
│   └─────────────────┘              └─────────────────┘              │
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────┐              │
│   │ Acknowledgments │─────────────►│ 5.1-C02         │              │
│   │                 │              │ Evidence        │              │
│   └─────────────────┘              └─────────────────┘              │
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────┐              │
│   │ Document        │─────────────►│ 5.1-C03         │              │
│   │ Inventory       │              │ Evidence        │              │
│   └─────────────────┘              └─────────────────┘              │
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────┐              │
│   │ Reviews &       │─────────────►│ 5.1-C04         │              │
│   │ Change Requests │              │ Evidence        │              │
│   └─────────────────┘              └─────────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Evidence Collection

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies/evidence/collect/:organisationId` | Trigger evidence collection |
| GET | `/api/policies/evidence/summary/:organisationId` | Get evidence summary |

### Response Format

```json
{
  "success": true,
  "collected": 15,
  "linked": 15,
  "errors": []
}
```

---

## Supporting Procedure

### PRO-001-01: Policy and Document Management Procedure

This procedure defines the operational processes that generate evidence for Control 5.1:

| Section | Supports Capability |
|---------|---------------------|
| Section 4: Document Creation | 5.1-C03 |
| Section 5: Review and Approval | 5.1-C01 |
| Section 6: Publication and Communication | 5.1-C02 |
| Section 7: Review Cycle | 5.1-C04 |
| Section 8: Change Management | 5.1-C04 |

---

## Maturity Model

Each capability is assessed against a 5-level maturity model:

| Level | Name | Description | Evidence Indicators |
|-------|------|-------------|---------------------|
| L1 | Initial | Ad-hoc, undocumented | No formal process |
| L2 | Managed | Documented but inconsistent | Procedure exists |
| L3 | Defined | Standardized and consistent | Process followed consistently |
| L4 | Quantitatively Managed | Measured and controlled | Metrics tracked |
| L5 | Optimizing | Continuous improvement | Regular optimization |

### Maturity Criteria by Capability

#### 5.1-C01: Policy Development and Approval
| Level | Criteria |
|-------|----------|
| L1 | Policies exist but no formal approval process |
| L2 | Approval process documented in PRO-001-01 |
| L3 | All policies go through approval workflow |
| L4 | Approval cycle time tracked and optimized |
| L5 | Predictive analytics for approval bottlenecks |

#### 5.1-C02: Policy Communication and Acknowledgment
| Level | Criteria |
|-------|----------|
| L1 | Policies published but no tracking |
| L2 | Acknowledgment process documented |
| L3 | >80% acknowledgment rate achieved |
| L4 | Acknowledgment rates tracked by department |
| L5 | Automated escalation and 95%+ compliance |

#### 5.1-C03: Topic-Specific Policy Framework
| Level | Criteria |
|-------|----------|
| L1 | Some policies exist |
| L2 | Policy hierarchy defined |
| L3 | All ISO 27001 topics covered |
| L4 | Gap analysis performed regularly |
| L5 | Proactive policy creation for emerging risks |

#### 5.1-C04: Policy Review and Maintenance
| Level | Criteria |
|-------|----------|
| L1 | Reviews happen occasionally |
| L2 | Review schedule defined |
| L3 | >90% reviews completed on time |
| L4 | Change triggers tracked and measured |
| L5 | Predictive review scheduling |

---

## Test Execution Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DESIGN    │────►│IMPLEMENTATION│────►│  OPERATING  │
│    TEST     │     │    TEST     │     │    TEST     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
 "Does the          "Is the             "Is the
  control           control              control
  exist?"           deployed?"           working?"
```

### Test Results

| Result | Description |
|--------|-------------|
| NOT_TESTED | Test not yet performed |
| PASS | Control meets requirements |
| FAIL | Control does not meet requirements |
| PARTIAL | Control partially meets requirements |
| NOT_APPLICABLE | Control not applicable to this context |

---

## Implementation Checklist

- [ ] Run evidence collector for Control 5.1
- [ ] Review auto-collected evidence
- [ ] Complete DESIGN tests for all capabilities
- [ ] Complete IMPLEMENTATION tests
- [ ] Schedule OPERATING tests (quarterly)
- [ ] Set maturity targets
- [ ] Track progress to target maturity

---

## Related Documents

| Document | Relationship |
|----------|--------------|
| POL-001 | Information Security Policy (master) |
| PRO-001-01 | Policy and Document Management Procedure |
| ISO 27001:2022 | Clause 5.1 requirements |
