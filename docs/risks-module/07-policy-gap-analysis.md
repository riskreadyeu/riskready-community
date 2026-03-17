# Risk Management Module - Policy Gap Analysis

**Version:** 1.1  
**Updated:** December 2024  
**Purpose:** Identifies gaps between documented policies/procedures and current app implementation

---

## ⚠️ CRITICAL FINDING: Policy Document Inconsistencies

**Before analyzing app gaps, this audit discovered INCONSISTENCIES WITHIN THE POLICY DOCUMENTS THEMSELVES:**

### Risk Level Threshold Inconsistency - ✅ RESOLVED

| Document | Low | Medium | High | Critical | Status |
|----------|-----|--------|------|----------|--------|
| **STD-002-01** (line 101) | 1-7 | 8-14 | 15-19 | 20-25 | ✅ |
| **STD-002-02** (line 2266-2269) | 1-7 | 8-14 | 15-19 | 20-25 | ✅ |
| **PRO-002-02** (line 140) | 1-7 | 8-14 | 15-19 | 20-25 | ✅ **FIXED** |
| **App (current)** | 1-7 | 8-14 | 15-19 | 20-25 | ✅ **FIXED** |

**Resolution:** PRO-002-02 and App updated to match POL-002 (December 2024)

### Control Effectiveness Scale Inconsistency - ✅ RESOLVED

| Document | Scale | Status |
|----------|-------|--------|
| **PRO-002-02** (line 123) | Very Strong (>90%), Strong (75%), Moderate (50%), Weak (20%), None (0%) | ✅ **FIXED** |
| **App (current)** | None, Weak, Moderate, Strong, Very Strong | ✅ Aligned |

**Resolution:** PRO-002-02 updated to use 5-level scale matching app (December 2024)

### Impact Terminology Inconsistency

| Document | Lowest | Second | Middle | Fourth | Highest |
|----------|--------|--------|--------|--------|---------|
| **STD-002-01** | Insignificant | Minor | Moderate | Major | Catastrophic |
| **App (current)** | Negligible | Minor | Moderate | Major | Severe |

**Issue:** "Insignificant" vs "Negligible" and "Catastrophic" vs "Severe" terminology differs.

### Impact Level Assessment - ✅ SIMPLIFIED

| Risk Type | Impact Method | Scale |
|-----------|---------------|-------|
| **All Risks** | 5×5 Risk Matrix | Impact Level (1-5) |

**Methodology:** All risks now use a simple impact scale (Negligible=1 → Severe=5) multiplied by likelihood (Rare=1 → Almost Certain=5) to produce risk score (1-25). This unified approach satisfies ISO 27001:2022 clause 6.1.2(e).

---

## Recommended Action: Document Updates

**The following have been simplified:**

1. ✅ **Risk methodology now uses 5×5 matrix** - unified across all risks
2. ✅ **Impact scale is simple (1-5)** - Negligible, Minor, Moderate, Major, Severe
3. ✅ **Likelihood scale is simple (1-5)** - Rare, Unlikely, Possible, Likely, Almost Certain
4. ✅ **Risk score = Likelihood × Impact** - ranges from 1 to 25

---

## Executive Summary

This document identifies features described in the ISO 27001 policies, standards, and procedures (POL-002, STD-002-01/02/03, PRO-002-01/02/03) that are **NOT yet implemented** in the RiskReady GRC application. These gaps represent potential enhancements needed for full policy compliance.

### Gap Severity Legend

| Severity | Description |
|----------|-------------|
| 🔴 **Critical** | Core requirement not implemented - audit risk |
| 🟠 **High** | Important feature missing - manual workaround required |
| 🟡 **Medium** | Enhancement needed - partial implementation exists |
| 🟢 **Low** | Nice-to-have - cosmetic or minor gap |

---

## App vs Standards Detailed Comparison

### STD-002-01 (Risk Assessment Methodology) Requirements

| Requirement | Standard Section | App Status | Gap |
|-------------|------------------|------------|-----|
| **Qualitative 5x5 Matrix** | §5.3.1 | ✅ Implemented | None |
| **Quantitative ALE (SLE × ARO)** | §5.3.2 | ✅ Added to `risk-scoring.ts` | None |
| **Three-Point PERT Estimation** | §5.3.2 | ✅ `calculateExpectedALE()` | None |
| **Asset-Based Approach** | §5.1.1 | ⚠️ Partial - Risk→Org link only | No asset inventory link |
| **Scenario-Based Approach** | §5.1.2 | ✅ Full `RiskScenario` model | None |
| **Threat Catalogs (MITRE ATT&CK)** | §5.4.2 | ❌ Not implemented | No threat library |
| **Vulnerability Scanning Integration** | §5.4.4 | ❌ Not implemented | No vuln scan import |
| **Risk Appetite by Classification** | §6.1 | ⚠️ Partial | No asset classification link |
| **Assessment Frequency Triggers** | §5.2 | ❌ Not implemented | No scheduled assessments |

### STD-002-02 (Risk Treatment) Requirements

| Requirement | Standard Section | App Status | Gap |
|-------------|------------------|------------|-----|
| **Treatment Options (4 types)** | §5 | ✅ 5 types (includes SHARE) | None - exceeds |
| **Preventive/Detective/Corrective Controls** | §5.1.2 | ⚠️ Partial | No control type field |
| **Control Selection Criteria** | §5.1.3 | ❌ Not implemented | No selection guidance |
| **Cost-Benefit Analysis (>$10K)** | §5.1.4 | ⚠️ Manual only | No calculation assistance |
| **Treatment Plan Approval Timeline** | §5.1.5 | ❌ Not enforced | See table below |
| **Risk Acceptance Periods** | §5.2.4 | ✅ Added to `risk-scoring.ts` | Constants only, not enforced |
| **SoA Integration** | §8 | ❌ Not implemented | No Statement of Applicability |
| **Treatment Progress Reports** | §11 | ⚠️ Stats only | No exportable reports |
| **ROSI Calculation** | §13.4 | ✅ `calculateROSI()` added | None |

**STD-002-02 Treatment Plan Approval Timelines (§5.1.5):**

| Risk Level | Plan Approval | Implementation Start | Complete | App Enforces? |
|------------|---------------|---------------------|----------|---------------|
| Critical | 5 business days | Immediate | 30 days | ❌ No |
| High | 10 business days | Within 5 days | 60 days | ❌ No |
| Medium | 20 business days | Within 10 days | 90 days | ❌ No |
| Low | 30 business days | Within 30 days | 180 days | ❌ No |

### STD-002-03 (Threat Intelligence) Requirements

| Requirement | Standard Section | App Status | Gap |
|-------------|------------------|------------|-----|
| **Threat Intelligence Program** | §5.1 | ❌ Not implemented | No TI module |
| **Commercial Threat Feeds (≥2)** | §6.2.1 | ❌ Not implemented | No feed integration |
| **IOC Management** | §6.2.2 | ❌ Not implemented | No IOC database |
| **STIX/TAXII Format Support** | §3 | ❌ Not implemented | No standard format |
| **Threat Actor Profiling** | §5.2 | ❌ Not implemented | No threat actor library |
| **TLP Classification** | §3 | ❌ Not implemented | No TLP support |
| **ISAC Participation** | §6.2.4 | N/A | Manual process |
| **Threat Hunting Activities** | §5.4 | ❌ Not implemented | No hunting module |

### PRO-002-02 (Risk Register Management) Requirements

| Requirement | Procedure Section | App Status | Gap |
|-------------|-------------------|------------|-----|
| **Risk ID Format (RISK-YYYY-NNN)** | §5.2 | ⚠️ Different format | App uses different pattern |
| **Mandatory Fields (34 fields)** | §5.2 | ⚠️ ~70% covered | Missing ~10 fields |
| **Impact Level Ratings** | §5.2 (lines 125-137) | ✅ Implemented | App uses 5×5 matrix |
| **Risk Status Values** | §5.2 (line 153) | ⚠️ Different | App: IDENTIFIED→CLOSED |
| **Control Effectiveness Rating** | §5.2 (line 123) | ❌ Different scale | 4 vs 5 levels |
| **Change History Log** | §5.2 (line 163) | ❌ Not implemented | No field-level audit |
| **Risk Register Views (8 views)** | §5.3 | ⚠️ Partial | Dashboard only |
| **Validation Rules (12 rules)** | §5.4 | ❌ Not enforced | No validation |
| **New Risk Approval Workflow** | §6.1.2 | ❌ Not implemented | No approval routing |
| **Email Notifications** | §6.1.2 (Step 6) | ❌ Not implemented | No notification system |
| **Risk Closure Procedure** | §6.3 | ⚠️ Partial | No closure workflow |
| **Archiving Procedure** | §6.4 | ❌ Not implemented | No archive function |

**PRO-002-02 Missing Mandatory Fields:**

| Field | App Has? | Notes |
|-------|----------|-------|
| Risk Category (Strategic/Operational/etc.) | ❌ No | Uses framework instead |
| Vulnerability Exploited | ❌ No | Scenario `event` partial |
| Control Effectiveness (5-level) | ✅ Yes | Implemented |
| Impact Level Rating | ✅ Yes | 5×5 matrix |
| Likelihood Rating | ✅ Yes | 5×5 matrix |
| Risk Score Calculation | ✅ Yes | Likelihood × Impact |
| Risk Owner Email | ❌ No | Only owner name |
| Identification Method | ❌ No | No field |
| Transfer Mechanism | ❌ No | For TRANSFER type |
| Change History | ❌ No | Only timestamps |

---

## Gap Analysis by Category

### 1. Workflow & Automation Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **W-01** | **Automated Approval Routing** | PRO-002-03 §7 | App has `approve()` method but no automatic routing based on risk level | 🟠 High | Users must manually determine approver |
| **W-02** | **Multi-Level Approval Chain** | PRO-002-03 §7 | Single approver field exists; no chain support for Critical risks (CEO → Board) | 🟠 High | Cannot enforce dual-approval |
| **W-03** | **Workflow State Machine** | PRO-002-03 §8 | Status can be changed to any value; no transition rules enforced | 🟡 Medium | Invalid state transitions possible |
| **W-04** | **Automatic Status Updates** | PRO-002-01 §6.7 | Risk status doesn't auto-update when thresholds change | 🟡 Medium | Manual status updates required |
| **W-05** | **Escalation Triggers** | PRO-002-03 §8.3 | No automatic escalation when deadlines missed | 🟠 High | Overdue items not escalated |

**Recommended Implementation:**

```typescript
// Example: Approval routing service
interface ApprovalChain {
  level: RiskLevel;
  primaryApprover: Role;
  secondaryApprover?: Role;
  autoEscalateAfterDays: number;
}

const APPROVAL_CHAINS: ApprovalChain[] = [
  { level: 'CRITICAL', primaryApprover: 'CEO', secondaryApprover: 'BOARD', autoEscalateAfterDays: 3 },
  { level: 'HIGH', primaryApprover: 'CISO', secondaryApprover: 'STEERING_COMMITTEE', autoEscalateAfterDays: 5 },
  { level: 'MEDIUM', primaryApprover: 'CISO', autoEscalateAfterDays: 10 },
  { level: 'LOW', primaryApprover: 'RISK_OWNER', autoEscalateAfterDays: 0 },
];
```

---

### 2. Notification Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **N-01** | **Email Notifications** | PRO-002-03 §8, §10 | No email notification system | 🔴 Critical | Users not alerted to pending tasks |
| **N-02** | **Expiry Reminders** | PRO-002-03 §10.5 | `acceptanceExpiryDate` stored but no reminders sent | 🟠 High | Acceptances expire without notice |
| **N-03** | **Board Notification Timeline** | PRO-002-03 §7 | No automatic board notification (Immediate/5-days/Quarterly) | 🟠 High | Manual board notifications required |
| **N-04** | **Overdue Alerts** | PRO-002-01 §6.8 | Treatment overdue count shown but no alerts | 🟡 Medium | No proactive notification |
| **N-05** | **Approval Request Notifications** | PRO-002-03 §8.3 | No notification when approval requested | 🟠 High | Approvers must check manually |
| **N-06** | **Risk Owner Assignment Notification** | PRO-002-02 §5 | No notification when assigned as risk owner | 🟡 Medium | Owners may not know |

**Recommended Implementation:**

```typescript
// Example: Notification service
interface NotificationConfig {
  type: 'EMAIL' | 'IN_APP' | 'SLACK' | 'TEAMS';
  events: NotificationEvent[];
}

type NotificationEvent = 
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'ACCEPTANCE_EXPIRING_30_DAYS'
  | 'ACCEPTANCE_EXPIRING_7_DAYS'
  | 'ACCEPTANCE_EXPIRED'
  | 'TREATMENT_OVERDUE'
  | 'RISK_OWNER_ASSIGNED'
  | 'KRI_THRESHOLD_BREACHED';
```

---

### 3. Form & Document Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **F-01** | **FRM-002-01 Risk Assessment Worksheet** | PRO-002-01 §5.3 | No downloadable/printable form | 🟡 Medium | Manual form creation |
| **F-02** | **FRM-002-02 Risk Register Template Export** | PRO-002-01 §5.3 | No Excel/PDF export of risk register | 🟡 Medium | Manual report creation |
| **F-03** | **FRM-002-03 Risk Assessment Report** | PRO-002-01 §6.8 | No automated assessment report generation | 🟡 Medium | Manual report writing |
| **F-04** | **FRM-002-03-01 Risk Acceptance Request Form** | PRO-002-03 §14 | No form matching procedure template | 🟡 Medium | UI doesn't match form structure |
| **F-05** | **FRM-002-03-02 Risk Acceptance Approval Form** | PRO-002-03 §14 | No approval form generation | 🟡 Medium | Approvals not documentable |
| **F-06** | **Document Attachment Support** | PRO-002-03 §14.2 | No file attachment capability | 🟠 High | Cannot attach evidence |

**Recommendation:** Add document generation and attachment features.

---

### 4. Audit Trail & History Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **A-01** | **Decision Rationale History** | PRO-002-03 §8.4 | Only latest rationale stored; no history | 🟡 Medium | Historical decisions lost |
| **A-02** | **Approval/Rejection Comments** | PRO-002-03 §8.4 | No rejection reason field | 🟡 Medium | Cannot document why rejected |
| **A-03** | **Change Log** | POL-002 §5.7 | `createdAt`/`updatedAt` only; no field-level changes | 🟡 Medium | Cannot see what changed |
| **A-04** | **Version History** | PRO-002-02 §5.2 | No versioning of risk assessments | 🟡 Medium | Cannot compare assessments over time |
| **A-05** | **Digital Signatures** | PRO-002-03 §14 | `approvedById` but no signature | 🟢 Low | Electronic signature not required |

**Recommendation:** Implement audit log service with field-level change tracking.

---

### 5. Reporting Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **R-01** | **Executive Risk Report** | POL-002 §5.8 | Dashboard exists but no PDF/export | 🟡 Medium | Manual report creation |
| **R-02** | **Board Risk Summary** | PRO-002-03 §10.4 | No board-level summary report | 🟡 Medium | Manual board prep |
| **R-03** | **Acceptance Register Report** | PRO-002-03 §10.3 | No filtered report of all acceptances | 🟡 Medium | Manual extraction |
| **R-04** | **Treatment Progress Report** | PRO-002-02 §5.4 | Stats available but no downloadable report | 🟡 Medium | Manual report creation |
| **R-05** | **KRI Trend Report** | POL-002 §5.7 | History stored but no trend visualization | 🟡 Medium | Limited trend analysis |
| **R-06** | **Scheduled Reports** | POL-002 §5.8 | No automated report scheduling | 🟡 Medium | Manual report runs |

---

### 6. Validation & Enforcement Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **V-01** | **Acceptance Period Validation** | PRO-002-03 §10 | Constants added in `risk-scoring.ts` but not enforced in service | 🟠 High | Invalid periods can be set |
| **V-02** | **Mandatory Fields Enforcement** | PRO-002-03 §14 | Many fields optional that should be required | 🟡 Medium | Incomplete records |
| **V-03** | **Approval Authority Enforcement** | PRO-002-03 §7 | No check that approver has authority | 🔴 Critical | Anyone can approve |
| **V-04** | **Compensating Control Requirement** | PRO-002-03 §11 | No validation that compensating controls documented | 🟡 Medium | Acceptance without controls |
| **V-05** | **Treatment Deadline Enforcement** | POL-002 §5.3.2 | Deadlines not auto-set based on risk level | 🟡 Medium | Manual deadline setting |
| **V-06** | **Cumulative Acceptance Check** | PRO-002-03 §10 | No check for max cumulative acceptance period | 🟠 High | Unlimited renewals possible |

**Recommended Implementation:**

```typescript
// Example: Add to treatment-plan.service.ts

async createAcceptance(data: AcceptanceRequest) {
  const riskScore = await this.getRiskScore(data.riskId);
  
  // Validate period
  const validation = validateAcceptancePeriod(
    riskScore,
    data.requestedMonths,
    await this.getRenewalCount(data.riskId)
  );
  
  if (!validation.valid) {
    throw new BadRequestException(validation.message);
  }
  
  // Validate approver authority
  const authority = getAcceptanceAuthority(riskScore);
  const approverRole = await this.getUserRole(data.approverId);
  if (!this.hasAuthority(approverRole, authority)) {
    throw new ForbiddenException(
      `Risk level ${getRiskLevel(riskScore)} requires ${authority.primary} approval`
    );
  }
  
  // Continue with creation...
}
```

---

### 7. Integration Gaps

| Gap ID | Requirement | Policy Reference | Current State | Severity | Impact |
|--------|-------------|------------------|---------------|----------|--------|
| **I-01** | **Asset Register Integration** | PRO-002-01 §6.2 | Risks link to org but not specific assets | 🟡 Medium | Asset-risk mapping missing |
| **I-02** | **Incident Integration** | PRO-002-01 §2.1 | No incident → risk auto-creation | 🟡 Medium | Manual incident-to-risk |
| **I-03** | **Vulnerability Integration** | PRO-002-01 §6.4 | No vuln scan import | 🟢 Low | Manual vulnerability entry |
| **I-04** | **Threat Intelligence Feed** | STD-002-03 | No threat feed integration | 🟢 Low | Manual threat updates |
| **I-05** | **Calendar Integration** | PRO-002-01 §6.1 | No calendar for review dates | 🟢 Low | Manual calendar management |

---

## Summary: What's IN the App vs. Policies

### ✅ Fully Implemented (App matches Policy)

| Feature | Policy | App Implementation |
|---------|--------|-------------------|
| Risk Scoring (5x5 Matrix) | POL-002 §5.2, STD-002-01 | `calculateScore()`, `getRiskLevel()` |
| 5 Risk Levels (Very Low → Critical) | POL-002 §5.3.2 | `RISK_LEVEL_THRESHOLDS` |
| Treatment Types (Mitigate/Accept/Avoid/Transfer/Share) | POL-002 §5.4 | `TreatmentType` enum |
| Impact Level Assessment | STD-002-01 §6.2 | 5-level impact scale (1-5) |
| Risk Register Fields | POL-002 §5.7 | `Risk` model with all required fields |
| Risk Scenarios (Cause-Event-Consequence) | STD-002-01 §5.1.2 | `RiskScenario` model |
| Control Linkage | PRO-002-01 §6.5 | `Risk.controls[]` relation |
| Key Risk Indicators | POL-002 §5.7 | `KeyRiskIndicator` with RAG status |
| Treatment Plans & Actions | POL-002 §5.4.1 | `TreatmentPlan`, `TreatmentAction` |
| Risk Tolerance Statements | POL-002 §5.3 | `RiskToleranceStatement` |
| Acceptance Fields | PRO-002-03 §14 | `acceptanceRationale`, `acceptanceConditions`, `acceptanceExpiryDate` |
| Approval Tracking | PRO-002-03 §8.4 | `approvedDate`, `approvedById` |
| Control Effectiveness | STD-002-01 §8 | `CONTROL_EFFECTIVENESS`, `calculateResidualScore()` |
| Acceptance Period Limits | PRO-002-03 §10 | `ACCEPTANCE_PERIOD_LIMITS`, `validateAcceptancePeriod()` |
| Approval Authority Matrix | PRO-002-03 §7 | `getAcceptanceAuthority()` |
| Quantitative Analysis (ALE) | STD-002-01 §7 | `calculateALE()`, `calculateExpectedALE()` |

### 🔴 Critical Gaps (Requires Implementation)

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | **Notification Service** (N-01) | High | Users not alerted |
| 2 | **Approval Authority Enforcement** (V-03) | Medium | Anyone can approve |
| 3 | **Acceptance Period Enforcement** (V-01) | Low | Invalid periods possible |

### 🟠 High Priority Gaps

| Priority | Gap | Effort |
|----------|-----|--------|
| 4 | Multi-level approval chain (W-02) | Medium |
| 5 | Automatic approval routing (W-01) | Medium |
| 6 | Expiry reminders (N-02) | Medium |
| 7 | Document attachments (F-06) | Medium |
| 8 | Escalation triggers (W-05) | Medium |

### 🟡 Medium Priority Gaps

| Gap | Effort |
|-----|--------|
| Workflow state machine (W-03) | Medium |
| Form exports (F-01 to F-05) | Medium |
| Report generation (R-01 to R-06) | High |
| Audit trail history (A-01 to A-04) | Medium |
| Treatment deadline auto-set (V-05) | Low |

---

## Recommended Implementation Roadmap

### Phase 1: Critical (Sprint 1-2)
1. Add acceptance period validation to `TreatmentPlanService`
2. Add approval authority check to `approve()` method
3. Implement basic notification service (in-app notifications first)

### Phase 2: High Priority (Sprint 3-4)
4. Build approval workflow engine
5. Add email notification integration
6. Implement expiry reminder job (cron)
7. Add document attachment support

### Phase 3: Medium Priority (Sprint 5-8)
8. Workflow state machine with transition rules
9. Audit log service with field-level changes
10. Report generation service (PDF/Excel)
11. Form template generation

### Phase 4: Low Priority (Future)
12. Threat intelligence integration
13. Asset register integration
14. Calendar integration
15. Advanced analytics

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | System | Initial gap analysis |
