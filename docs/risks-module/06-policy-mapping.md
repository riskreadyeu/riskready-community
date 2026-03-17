# Risk Management Module - Policy to Application Mapping

**Version:** 1.0  
**Created:** December 2024  
**Purpose:** Maps organizational risk management policies, standards, and procedures to application implementation

---

## Table of Contents

1. [Overview](#overview)
2. [POL-002 Policy Mapping](#pol-002-policy-mapping)
3. [STD-002-01 Standard Mapping](#std-002-01-standard-mapping)
4. [PRO-002-01 Procedure Mapping](#pro-002-01-procedure-mapping)
5. [PRO-002-03 Procedure Mapping](#pro-002-03-procedure-mapping)
6. [Form Mapping](#form-mapping)
7. [Compliance Summary](#compliance-summary)

---

## Overview

This document demonstrates how the RiskReady GRC application implements the organizational risk management framework defined in:

| Document | ID | Purpose |
|----------|-----|---------|
| Information Risk Management Policy | POL-002 | Establishes risk management framework |
| Risk Assessment Methodology Standard | STD-002-01 | Defines assessment methodology |
| Risk Treatment Standard | STD-002-02 | Defines treatment options |
| Threat Intelligence Standard | STD-002-03 | Defines threat integration |
| Risk Assessment Procedure | PRO-002-01 | Step-by-step assessment process |
| Risk Register Management Procedure | PRO-002-02 | Register maintenance process |
| Risk Acceptance Procedure | PRO-002-03 | Acceptance workflow |

---

## POL-002 Policy Mapping

### Section 5.2 - Risk Assessment Methodology

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Qualitative Assessment** | 5.2.1 | 5x5 Likelihood × Impact matrix | `risk-scoring.ts: calculateScore()` |
| **Likelihood Scale** (Rare→Almost Certain) | 5.2.1 | `LikelihoodLevel` enum with 5 values | `risk-scoring.ts: LIKELIHOOD_VALUES` |
| **Impact Scale** (Insignificant→Catastrophic) | 5.2.1 | `ImpactLevel` enum with 5 values | `risk-scoring.ts: IMPACT_VALUES` |
| **Risk Matrix produces levels** | 5.2.1 | Function returns VERY_LOW→CRITICAL | `risk-scoring.ts: getRiskLevel()` |
| **Quantitative Assessment (ALE)** | 5.2.1 | SLE × ARO = ALE calculation | `risk-scoring.ts: calculateALE()` |
| **Annual Comprehensive Assessment** | 5.2.2 | Risk Register supports full ISMS scope | `RiskService.findAll()` |
| **Project/System Assessments** | 5.2.2 | Per-risk assessments with scenarios | `RiskScenarioService` |
| **Triggered Assessments** | 5.2.3 | Can create risks anytime | `RiskService.create()` |

### Section 5.3 - Risk Appetite and Tolerance

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Risk Tolerance Thresholds** | 5.3.2 | Thresholds defined in constants | `risk-scoring.ts: RISK_LEVEL_THRESHOLDS` |
| **Critical: 20-25** | 5.3.2 | ✅ Implemented | `getRiskLevel()` returns 'CRITICAL' for 20-25 |
| **High: 15-19** | 5.3.2 | ✅ Implemented | `getRiskLevel()` returns 'HIGH' for 15-19 |
| **Medium: 10-14** | 5.3.2 | ✅ Implemented | `getRiskLevel()` returns 'MEDIUM' for 10-14 |
| **Low: 5-9** | 5.3.2 | ✅ Implemented | `getRiskLevel()` returns 'LOW' for 5-9 |
| **Very Low: 1-4** | 5.3.2 | ✅ Implemented | `getRiskLevel()` returns 'VERY_LOW' for 1-4 |
| **Treatment Requirements by Level** | 5.3.2 | Requirements defined | `risk-scoring.ts: TREATMENT_REQUIREMENTS` |
| **Risk Tolerance Statements** | 5.3.2 | Full RTS module | `RiskToleranceStatementService` |

### Section 5.4 - Risk Treatment Options

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Modify (Mitigate)** | 5.4.1 | `MITIGATE` treatment type | `TreatmentType.MITIGATE` |
| **Retain (Accept)** | 5.4.2 | `ACCEPT` treatment type | `TreatmentType.ACCEPT` |
| **Avoid (Eliminate)** | 5.4.3 | `AVOID` treatment type | `TreatmentType.AVOID` |
| **Share (Transfer)** | 5.4.4 | `TRANSFER` + `SHARE` types | `TreatmentType.TRANSFER/SHARE` |

### Section 5.5 - Risk Acceptance Authority

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Authority Matrix** | 5.5 | Authority lookup function | `risk-scoring.ts: getAcceptanceAuthority()` |
| **Critical: CEO + Board** | 5.5 | Returns CEO + Board | `getAcceptanceAuthority(20+)` |
| **High: CISO + Committee** | 5.5 | Returns CISO + Committee | `getAcceptanceAuthority(15-19)` |
| **Medium: CISO** | 5.5 | Returns CISO | `getAcceptanceAuthority(10-14)` |
| **Low: Risk Owner** | 5.5 | Returns Risk Owner | `getAcceptanceAuthority(1-9)` |
| **Documented Acceptance** | 5.5 | Treatment Plan with ACCEPT type | `TreatmentPlan.treatmentType = 'ACCEPT'` |
| **Time Limitation** | 5.5 | Acceptance expiry field | `TreatmentPlan.acceptanceExpiryDate` |

### Section 5.6 - Threat Intelligence Integration

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Threat Sources** | 5.6 | Scenario cause field | `RiskScenario.cause` |
| **Emerging Threats** | 5.6 | Can add new scenarios anytime | `RiskScenarioService.create()` |

### Section 5.7 - Risk Register Management

| Policy Requirement | Policy Section | App Implementation | Code Reference |
|-------------------|----------------|-------------------|----------------|
| **Unique risk identifier** | 5.7 | `riskId` field | `Risk.riskId` |
| **Risk description and scenario** | 5.7 | Description + Scenarios | `Risk.description`, `RiskScenario` |
| **Asset(s) affected** | 5.7 | Organisation link | `Risk.organisationId` |
| **Threat source(s)** | 5.7 | Scenario cause | `RiskScenario.cause` |
| **Vulnerability(ies)** | 5.7 | Scenario event | `RiskScenario.event` |
| **Existing controls** | 5.7 | Controls relationship | `Risk.controls[]` |
| **Likelihood and impact ratings** | 5.7 | Assessment fields | `likelihood`, `impact` |
| **Inherent and residual scores** | 5.7 | Score fields | `inherentScore`, `residualScore` |
| **Risk owner** | 5.7 | Owner field | `Risk.riskOwner` |
| **Treatment option and plan** | 5.7 | Treatment Plans | `TreatmentPlan` |
| **Review date** | 5.7 | Updated timestamp | `Risk.updatedAt` |

---

## STD-002-01 Standard Mapping

### Risk Assessment Methodology

| Standard Requirement | Standard Section | App Implementation | Code Reference |
|---------------------|------------------|-------------------|----------------|
| **5x5 Risk Matrix** | 6 | L × I calculation | `calculateScore()` |
| **Likelihood Definitions** | 6.1 | Enum with descriptions | `LIKELIHOOD_VALUES`, `LIKELIHOOD_LABELS` |
| **Impact Definitions** | 6.2 | Enum with descriptions | `IMPACT_VALUES`, `IMPACT_LABELS` |
| **Risk Score = L × I** | 6.3 | Multiplication | `calculateScore()` |
| **Risk Level Thresholds** | 6.4 | Threshold constants | `RISK_LEVEL_THRESHOLDS` |
| **Asset-Based Approach** | 5.1.1 | Risk → Scenarios | `Risk.scenarios[]` |
| **Scenario-Based Approach** | 5.1.2 | Full scenario model | `RiskScenario` |
| **Cause-Event-Consequence** | 5.1.2 | Scenario fields | `cause`, `event`, `consequence` |
| **SLE/ARO/ALE** | 7 | Quantitative fields | `sleLow`, `sleLikely`, `sleHigh`, `aro`, `ale` |
| **PERT Calculation** | 7 | Expected ALE function | `calculateExpectedALE()` |

### Control Effectiveness

| Standard Requirement | Standard Section | App Implementation | Code Reference |
|---------------------|------------------|-------------------|----------------|
| **Control Strength Rating** | 8 | 5-level effectiveness | `CONTROL_EFFECTIVENESS` |
| **None/Weak/Moderate/Strong/Very Strong** | 8 | Enum values | `ControlStrength` type |
| **Likelihood Reduction** | 8.1 | Reduction calculation | `calculateResidualLikelihood()` |
| **Impact Reduction** | 8.2 | Reduction calculation | `calculateResidualImpact()` |
| **Residual Score Calculation** | 8.3 | Combined calculation | `calculateResidualScore()` |

### Impact Level Assessment (1-5 Scale)

| Standard Requirement | Standard Section | App Implementation | Code Reference |
|---------------------|------------------|-------------------|----------------|
| **Simple Impact Scale** | 6.2 | 5 impact levels (Negligible→Severe) | `ImpactLevel` enum |
| **Negligible Impact** | 6.2.1 | Impact level 1 | Value: 1 |
| **Minor Impact** | 6.2.2 | Impact level 2 | Value: 2 |
| **Moderate Impact** | 6.2.3 | Impact level 3 | Value: 3 |
| **Major Impact** | 6.2.4 | Impact level 4 | Value: 4 |
| **Severe Impact** | 6.2.5 | Impact level 5 | Value: 5 |
| **Impact Calculation** | 6.2 | Direct multiplication with likelihood | `calculateScore()` |

---

## PRO-002-01 Procedure Mapping

### Risk Assessment Process Steps

| Procedure Step | Procedure Section | App Feature | How App Supports |
|----------------|-------------------|-------------|------------------|
| **Step 1: Planning** | 6.1 | Risk creation | `RiskService.create()` initiates assessment |
| **Step 2: Asset Identification** | 6.2 | Organisation context | `Risk.organisationId` links to org |
| **Step 3: Threat Identification** | 6.3 | Scenario cause | `RiskScenario.cause` documents threats |
| **Step 4: Vulnerability Identification** | 6.4 | Scenario event | `RiskScenario.event` documents vulnerabilities |
| **Step 5: Control Identification** | 6.5 | Controls linkage | `Risk.controls[]` M:M relationship |
| **Step 6: Risk Analysis** | 6.6 | Score calculation | `calculateScore()`, auto-calculation in service |
| **Step 7: Risk Evaluation** | 6.7 | Level determination | `getRiskLevel()`, `exceedsRiskAppetite()` |
| **Step 8: Documentation** | 6.8 | Risk Register | Full Risk entity with all fields |
| **Step 9: Review/Approval** | 6.9 | Status workflow | `RiskStatus` lifecycle |

### Risk Register Entry Requirements (Section 9)

| Required Field | Procedure Section | App Field | Database Column |
|----------------|-------------------|-----------|-----------------|
| Risk ID | 9.1 | `riskId` | `Risk.riskId` |
| Risk Title | 9.1 | `title` | `Risk.title` |
| Risk Description | 9.1 | `description` | `Risk.description` |
| Date Identified | 9.1 | `createdAt` | `Risk.createdAt` |
| Identified By | 9.1 | `createdBy` | `Risk.createdById` |
| Risk Category | 9.1 | Scenarios | `RiskScenario.framework` |
| Asset(s) Affected | 9.1 | Organisation | `Risk.organisationId` |
| Threat Source | 9.2 | Scenario cause | `RiskScenario.cause` |
| Vulnerability | 9.2 | Scenario event | `RiskScenario.event` |
| Existing Controls | 9.2 | Controls | `Risk.controls[]` |
| Likelihood - Inherent | 9.2 | `likelihood` | `RiskScenario.likelihood` |
| Impact - Inherent | 9.2 | `impact` | `RiskScenario.impact` |
| Inherent Risk Score | 9.2 | `inherentScore` | `Risk.inherentScore` |
| Control Effectiveness | 9.2 | Control assessment | Via control effectiveness |
| Residual Likelihood | 9.2 | `residualLikelihood` | `RiskScenario.residualLikelihood` |
| Residual Impact | 9.2 | `residualImpact` | `RiskScenario.residualImpact` |
| Residual Risk Score | 9.2 | `residualScore` | `Risk.residualScore` |
| Risk Level | 9.3 | Calculated | `getRiskLevel(score)` |
| Treatment Required | 9.3 | Calculated | `exceedsRiskAppetite(score)` |
| Risk Owner | 9.4 | `riskOwner` | `Risk.riskOwner` |
| Treatment Strategy | 9.4 | Treatment type | `TreatmentPlan.treatmentType` |
| Treatment Plan Reference | 9.4 | Treatment ID | `TreatmentPlan.treatmentId` |
| Review Date | 9.5 | `updatedAt` | `Risk.updatedAt` |
| Last Updated | 9.5 | `updatedAt` | `Risk.updatedAt` |
| Updated By | 9.5 | `updatedBy` | `Risk.updatedById` |

---

## PRO-002-03 Procedure Mapping

### Risk Acceptance Process

| Procedure Step | Procedure Section | App Feature | How App Supports |
|----------------|-------------------|-------------|------------------|
| **Step 1: Request Initiation** | 8.1 | Create Treatment Plan | `TreatmentPlanService.create()` with type ACCEPT |
| **Step 2: InfoSec Review** | 8.2 | Status workflow | `TreatmentPlan.status = 'PROPOSED'` |
| **Step 3: Approval Routing** | 8.3 | Approval workflow | `TreatmentPlanService.approve()` |
| **Step 4: Approval Decision** | 8.4 | Approval status | `TreatmentPlan.approvedDate`, `approvedById` |
| **Step 5: Documentation** | 8.5 | Risk Register update | Links to Risk, stored in register |
| **Step 6: Ongoing Monitoring** | 8.6 | KRI monitoring | `KeyRiskIndicator` linked to Risk |
| **Step 7: Acceptance Renewal** | 8.7 | Expiry tracking | `TreatmentPlan.acceptanceExpiryDate` |

### Acceptance Period Limits (Section 10)

| Risk Level | Max Initial | Max Renewal | Max Cumulative | App Constant |
|------------|-------------|-------------|----------------|--------------|
| Critical | 6 months | 6 months | 18 months | `ACCEPTANCE_PERIOD_LIMITS.CRITICAL` |
| High | 12 months | 12 months | 36 months | `ACCEPTANCE_PERIOD_LIMITS.HIGH` |
| Medium | 24 months | 24 months | No limit | `ACCEPTANCE_PERIOD_LIMITS.MEDIUM` |
| Low | 36 months | 36 months | No limit | `ACCEPTANCE_PERIOD_LIMITS.LOW` |
| Very Low | 36 months | 36 months | No limit | `ACCEPTANCE_PERIOD_LIMITS.VERY_LOW` |

**App Validation Function:** `validateAcceptancePeriod(riskScore, requestedMonths, renewalCount)`

### Risk Acceptance Authority Matrix (Section 7)

| Risk Level | Primary Approver | Secondary Approver | Board Notification |
|------------|------------------|--------------------|--------------------|
| Critical | CEO | Board/Steering Committee | Immediate |
| High | CISO | Steering Committee | Within 5 days |
| Medium | CISO | N/A | Quarterly summary |
| Low | Risk Owner | InfoSec Manager acknowledgment | Annual summary |

**App Function:** `getAcceptanceAuthority(riskScore)` returns the approval requirements.

### Compensating Controls (Section 11)

| Requirement | Procedure Section | App Implementation | Code Reference |
|-------------|-------------------|-------------------|----------------|
| Control documentation | 11.5 | Control linking | `Risk.controls[]` |
| Control types | 11.2 | Control types in module | `Control.type` |
| Effectiveness monitoring | 11.6 | KRI monitoring | `KeyRiskIndicator.status` |
| Control failure | 11.8 | KRI RED status | `KRI.status = 'RED'` |

---

## Form Mapping

### FRM-002-03-01: Risk Acceptance Request Form

| Form Section | Form Field | App Entity | App Field |
|--------------|------------|------------|-----------|
| Section A | Risk ID | Risk | `riskId` |
| Section A | Risk Title | Risk | `title` |
| Section A | Risk Category | Risk | `framework` |
| Section A | Asset(s) Affected | Risk | `organisationId` |
| Section A | Risk Owner | Risk | `riskOwner` |
| Section A | Request Date | TreatmentPlan | `createdAt` |
| Section A | Requested Acceptance Period | TreatmentPlan | `targetEndDate` - `targetStartDate` |
| Section B | Risk Description | Risk | `description` |
| Section B | Threat Sources | RiskScenario | `cause` |
| Section B | Vulnerabilities | RiskScenario | `event` |
| Section B | Existing Controls | Risk.controls | Control relationships |
| Section C | Inherent Likelihood | RiskScenario | `likelihood` |
| Section C | Inherent Impact | RiskScenario | `impact` |
| Section C | Inherent Risk Score | Risk | `inherentScore` |
| Section C | Residual Likelihood | RiskScenario | `residualLikelihood` |
| Section C | Residual Impact | RiskScenario | `residualImpact` |
| Section C | Residual Risk Score | Risk | `residualScore` |
| Section D | Business Justification | TreatmentPlan | `acceptanceRationale` |
| Section E | Treatment Alternatives | TreatmentPlan | `description` |
| Section F | Compensating Controls | TreatmentPlan | `controlIds` |
| Section G | Monitoring Plan | KRI | Linked KRIs |
| Section H | Acceptance Conditions | TreatmentPlan | `acceptanceConditions` |
| Section H | Expiry Date | TreatmentPlan | `acceptanceExpiryDate` |
| Section I | Supporting Documentation | - | External attachments |
| Section J | Risk Owner Acknowledgment | TreatmentPlan | `riskOwnerId` |
| Section K | InfoSec Review | TreatmentPlan | `status = 'PROPOSED'` |
| Section L | Approval Decision | TreatmentPlan | `approvedDate`, `approvedById` |

### FRM-002-03-02: Risk Acceptance Approval Form

| Form Field | App Entity | App Field |
|------------|------------|-----------|
| Risk ID | Risk | `riskId` |
| Risk Level | Calculated | `getRiskLevel(residualScore)` |
| Approval Authority | Calculated | `getAcceptanceAuthority(score)` |
| Decision | TreatmentPlan | `status` |
| Acceptance Period | TreatmentPlan | `targetEndDate` |
| Expiration Date | TreatmentPlan | `acceptanceExpiryDate` |
| Conditions | TreatmentPlan | `acceptanceConditions` |
| Rationale | TreatmentPlan | `acceptanceRationale` |
| Approver Signature | TreatmentPlan | `approvedById`, `approvedDate` |

---

## Compliance Summary

### ISO 27001:2022 Control Coverage

| Control | Title | App Feature | Compliance |
|---------|-------|-------------|------------|
| **6.1.2** | Information security risk assessment | Risk Register + Scenarios + Scoring | ✅ Full |
| **6.1.3** | Information security risk treatment | Treatment Plans + RTS | ✅ Full |
| **5.7** | Threat intelligence | Scenario cause/event + risk scoring | ✅ Supported |
| **5.8** | Information security in project management | Per-risk assessment | ✅ Supported |
| **8.2** | Information security risk assessment execution | Scoring + KRI monitoring | ✅ Full |
| **8.3** | Information security risk treatment implementation | Treatment Actions | ✅ Full |

### Policy Document Coverage

| Document | Sections Covered | App Modules | Coverage |
|----------|------------------|-------------|----------|
| **POL-002** | All sections | Risk, Scenario, Treatment, RTS, KRI | ✅ 100% |
| **STD-002-01** | Sections 5-8 | Risk scoring, impact levels, control effectiveness | ✅ 100% |
| **STD-002-02** | Treatment options | Treatment Plans | ✅ 100% |
| **PRO-002-01** | Steps 1-9 | Risk workflow | ✅ 100% |
| **PRO-002-03** | Steps 1-7 | Acceptance workflow | ✅ 100% |

### App Feature to Policy Traceability

| App Feature | Primary Policy Reference | Supporting References |
|-------------|-------------------------|----------------------|
| Risk Register | POL-002 §5.7 | PRO-002-01 §9 |
| Risk Scenarios | STD-002-01 §5.1.2 | PRO-002-01 §6.3-6.4 |
| Risk Scoring | POL-002 §5.2, STD-002-01 §6 | PRO-002-01 §6.6 |
| Risk Levels | POL-002 §5.3.2 | PRO-002-01 §6.7 |
| Treatment Plans | POL-002 §5.4 | STD-002-02 |
| Treatment Actions | POL-002 §5.4.1 | PRO-002-01 §10.3 |
| Risk Acceptance | POL-002 §5.5 | PRO-002-03 |
| Acceptance Authority | POL-002 §5.5 | PRO-002-03 §7 |
| Acceptance Periods | PRO-002-03 §10 | POL-002 §5.5 |
| Risk Tolerance (RTS) | POL-002 §5.3 | PRO-002-03 §11 |
| Key Risk Indicators | POL-002 §5.7 | PRO-002-03 §8.6 |
| Impact Assessment | STD-002-01 §6.2 | POL-002 §5.2 |
| Control Effectiveness | STD-002-01 §8 | PRO-002-01 §5.4 |
| Quantitative Analysis (ALE) | STD-002-01 §7 | POL-002 §5.2.1 |

---

## Audit Evidence Generation

The application can generate the following evidence for ISO 27001 audits:

| Evidence Type | App Source | Export Capability |
|---------------|------------|-------------------|
| Risk Register Extract | `/api/risks` | ✅ Export to CSV/Excel |
| Risk Assessment History | `Risk.updatedAt`, `createdAt` | ✅ Audit trail |
| Treatment Plans | `/api/risks/treatment-plans` | ✅ Export |
| Acceptance Decisions | `TreatmentPlan.approvedDate` | ✅ With approver |
| KRI Measurements | `KRIHistory` | ✅ Historical data |
| Control Linkage | `Risk.controls` | ✅ Control mapping |
| Risk Owner Assignment | `Risk.riskOwner` | ✅ Accountability |
| Score Calculations | `inherentScore`, `residualScore` | ✅ Reproducible |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | System | Initial mapping document |
