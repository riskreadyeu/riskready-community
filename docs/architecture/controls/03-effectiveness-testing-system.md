# Effectiveness Testing System

This document describes the three-layer effectiveness testing methodology used to verify control effectiveness at Design, Implementation, and Operating levels.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Three-Layer Testing Model](#2-three-layer-testing-model)
3. [Data Model](#3-data-model)
4. [Test Results](#4-test-results)
5. [Effectiveness Summary](#5-effectiveness-summary)
6. [Event-Driven Nonconformity](#6-event-driven-nonconformity)
7. [Service API](#7-service-api)
8. [Integration with Risk Module](#8-integration-with-risk-module)

---

## 1. Overview

The Effectiveness Testing System provides a structured approach to verify that controls are:

1. **Designed** correctly to meet security objectives
2. **Implemented** as designed in the environment
3. **Operating** effectively and consistently over time

This three-layer model follows industry best practices (ISACA, COSO) for internal control testing.

### Key Features

- Three distinct test types per capability
- Test result tracking (PASS, PARTIAL, FAIL, NOT_TESTED, NOT_APPLICABLE)
- Evidence collection and documentation
- Automatic nonconformity creation on test failures
- Overall effectiveness status calculation

---

## 2. Three-Layer Testing Model

### Test Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                    EFFECTIVENESS TESTING                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Layer 1: DESIGN                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Question: Is the control designed to meet the objective?    │   │
│  │ Focus: Policy, procedure, architecture documentation        │   │
│  │ Evidence: Design documents, policies, specifications        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                       │
│                            ▼                                       │
│  Layer 2: IMPLEMENTATION                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Question: Is the control deployed as designed?              │   │
│  │ Focus: Configuration, deployment verification               │   │
│  │ Evidence: Configuration exports, screenshots, test results  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                       │
│                            ▼                                       │
│  Layer 3: OPERATING                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Question: Does the control work consistently over time?     │   │
│  │ Focus: Ongoing effectiveness, sample testing                │   │
│  │ Evidence: Logs, reports, sample selections                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Layer Details

| Layer | Purpose | Typical Tests | Evidence Types |
|-------|---------|---------------|----------------|
| **DESIGN** | Verify control intent | Review policies, architecture | Design docs, procedures, diagrams |
| **IMPLEMENTATION** | Verify correct deployment | Configuration review, inspection | Screenshots, exports, build logs |
| **OPERATING** | Verify ongoing effectiveness | Sample testing, log review | Transaction logs, audit trails |

---

## 3. Data Model

### CapabilityEffectivenessTest Entity

```prisma
model CapabilityEffectivenessTest {
  id String @id @default(cuid())

  // Test type (which layer)
  testType EffectivenessTestType

  // Test result
  testResult TestResult @default(NOT_TESTED)
  testDate   DateTime?
  tester     String?

  // Test objective and steps
  objective    String? @db.Text  // Brief description
  testSteps    String? @db.Text  // Detailed numbered steps (1.1, 1.2)
  testCriteria String? @db.Text  // Legacy combined field

  // Evidence
  evidenceRequired String? @db.Text
  evidenceLocation String?
  evidenceNotes    String? @db.Text

  // SOA and pass criteria
  soaCriteria  String? @db.Text  // Statement of Applicability criteria
  passCriteria String? @db.Text  // Pass criteria for the test

  // Findings
  findings        String? @db.Text  // What was found during testing
  recommendations String? @db.Text  // Recommendations for improvement

  // Relationships
  capabilityId    String
  capability      Capability
  nonconformities Nonconformity[]
  evidenceLinks   EvidenceTest[]
}
```

### Test Type Enum

```typescript
enum EffectivenessTestType {
  DESIGN         // Is the control designed to meet the objective?
  IMPLEMENTATION // Is the control deployed as designed?
  OPERATING      // Does the control work consistently over time?
}
```

### Database Indexes

```prisma
@@index([testType])
@@index([testResult])
@@index([capabilityId])
@@index([testDate])
```

---

## 4. Test Results

### TestResult Enum

```typescript
enum TestResult {
  PASS           // Control meets all criteria
  PARTIAL        // Control partially meets criteria
  FAIL           // Control does not meet criteria
  NOT_TESTED     // Test not yet performed
  NOT_APPLICABLE // Test not applicable to this control
}
```

### Result Descriptions

| Result | Meaning | Action |
|--------|---------|--------|
| **PASS** | All test criteria satisfied | Document evidence, close test |
| **PARTIAL** | Some criteria met, gaps exist | Document gaps, plan remediation |
| **FAIL** | Significant deficiencies found | Create nonconformity, escalate |
| **NOT_TESTED** | Test not yet performed | Schedule test |
| **NOT_APPLICABLE** | Test doesn't apply | Document justification |

---

## 5. Effectiveness Summary

### Calculating Overall Effectiveness

The system calculates overall effectiveness from the latest test of each type:

```typescript
async getEffectivenessSummary(capabilityId: string) {
  const tests = await findAll({ capabilityId });

  // Get latest test for each type
  const latestByType = {
    DESIGN: null,
    IMPLEMENTATION: null,
    OPERATING: null,
  };

  for (const test of tests) {
    if (!latestByType[test.testType]) {
      latestByType[test.testType] = test;
    }
  }

  // Calculate overall status
  const passCount = countPasses(latestByType);
  const failCount = countFails(latestByType);
  const testedCount = countTested(latestByType);

  return determineOverallStatus(passCount, failCount, testedCount);
}
```

### Overall Status Determination

```typescript
function determineOverallStatus(passCount, failCount, testedCount) {
  if (testedCount === 0) return 'NOT_TESTED';
  if (failCount > 0) return 'NOT_EFFECTIVE';
  if (passCount === 3) return 'EFFECTIVE';
  return 'PARTIALLY_EFFECTIVE';
}
```

### Status Flow Chart

```
                    ┌─────────────────┐
                    │  Any FAIL test? │
                    └────────┬────────┘
                             │
              ┌─────── Yes ──┴── No ───────┐
              │                            │
              ▼                            ▼
      ┌──────────────┐          ┌─────────────────┐
      │ NOT_EFFECTIVE │         │  All 3 PASS?    │
      └──────────────┘          └────────┬────────┘
                                         │
                          ┌─────── Yes ──┴── No ───────┐
                          │                            │
                          ▼                            ▼
                   ┌───────────┐         ┌────────────────────┐
                   │ EFFECTIVE │         │ PARTIALLY_EFFECTIVE │
                   └───────────┘         └────────────────────┘
```

### Summary Response

```typescript
interface EffectivenessSummary {
  design: EffectivenessTest | null;
  implementation: EffectivenessTest | null;
  operating: EffectivenessTest | null;
  overallStatus: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | 'NOT_TESTED';
  passCount: number;
  testedCount: number;
}
```

---

## 6. Event-Driven Nonconformity

### Automatic Nonconformity Creation

When a test result changes to FAIL, the system automatically creates a nonconformity:

```typescript
// EffectivenessTestService.update()
if (data.testResult === TestResult.FAIL &&
    currentTest?.testResult !== TestResult.FAIL) {

  const event = new TestFailedEvent(
    testId,
    capability.id,
    capability.name,
    capability.capabilityId,
    control.id,
    control.name,
    control.controlId,
    testType,
    TestResult.FAIL,
    findings,
    recommendations,
    sourceStandard,
    userId,
  );

  this.eventEmitter.emit('test.failed', event);
}
```

### TestFailedEvent

```typescript
class TestFailedEvent {
  constructor(
    public testId: string,
    public capabilityId: string,
    public capabilityName: string,
    public capabilityCode: string,
    public controlId: string,
    public controlName: string,
    public controlCode: string,
    public testType: EffectivenessTestType,
    public testResult: TestResult,
    public findings: string | null,
    public recommendations: string | null,
    public sourceStandard: string | null,
    public userId: string,
  ) {}
}
```

### Event Listener (Nonconformity Creation)

```typescript
@OnEvent('test.failed')
async handleTestFailed(event: TestFailedEvent) {
  await nonconformityService.create({
    title: `Test Failure: ${event.capabilityCode} - ${event.testType}`,
    controlId: event.controlId,
    capabilityId: event.capabilityId,
    sourceTest: event.testId,
    sourceStandard: event.sourceStandard,
    description: event.findings,
    recommendations: event.recommendations,
    // ... additional fields
  });
}
```

---

## 7. Service API

### EffectivenessTestService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, testType?, testResult?` | `{ results, count }` | List tests with filters |
| `findOne` | `id: string` | `Test \| null` | Get test by ID |
| `findByCapability` | `capabilityId: string` | `Test[]` | Get capability's tests |
| `create` | `data` | `Test` | Create new test |
| `update` | `id, data` | `Test` | Update test (triggers events) |
| `delete` | `id: string` | `Test` | Delete test |
| `getEffectivenessSummary` | `capabilityId` | `Summary` | Get capability's effectiveness |

### Create Test

```typescript
interface CreateTestInput {
  capabilityId: string;
  testType: EffectivenessTestType;
  testResult?: TestResult;      // Default: NOT_TESTED
  testDate?: Date;
  tester?: string;
  testCriteria?: string;
  evidenceRequired?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  findings?: string;
  recommendations?: string;
  createdById?: string;
}
```

### Update Test

```typescript
interface UpdateTestInput {
  testResult?: TestResult;       // Triggers event if changed to FAIL
  testDate?: Date;
  tester?: string;
  testCriteria?: string;
  evidenceRequired?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  findings?: string;
  recommendations?: string;
  updatedById?: string;
}
```

---

## 8. Integration with Risk Module

### F2 Factor Calculation

Effectiveness test results feed into the Risk Scenario F2 (Control Effectiveness) factor:

```
┌─────────────────────────────────────────────────────────────────┐
│                    F2 FACTOR CALCULATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Risk Scenario                                                    │
│       │                                                           │
│       ▼                                                           │
│  Linked Controls ──► Capabilities ──► Effectiveness Tests        │
│       │                                                           │
│       ▼                                                           │
│  Average Effectiveness Score (0-100%)                             │
│       │                                                           │
│       ▼                                                           │
│  Convert to F2 Factor (1-5 scale)                                 │
│       │                                                           │
│  ┌────┴────────────────────────────────────────────────────┐     │
│  │ 0-20% → 5 (Very Low effectiveness)                       │     │
│  │ 21-40% → 4 (Low effectiveness)                           │     │
│  │ 41-60% → 3 (Moderate effectiveness)                      │     │
│  │ 61-80% → 2 (Good effectiveness)                          │     │
│  │ 81-100% → 1 (Excellent effectiveness)                    │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Impact on Risk Scoring

```
Inherent Likelihood = (F1 × 34%) + (F2 × 33%) + (F3 × 33%)

Where F2 = Control Effectiveness Factor (1-5)
  - Higher F2 = Controls less effective = Higher likelihood
  - Lower F2 = Controls more effective = Lower likelihood
```

---

## Testing Best Practices

### Design Testing

1. Review control design documentation
2. Verify alignment with control objectives
3. Check for completeness of procedures
4. Validate approval and sign-off

### Implementation Testing

1. Verify control is deployed per design
2. Check configuration against requirements
3. Inspect actual implementations
4. Test technical controls for proper setup

### Operating Testing

1. Select sample period (e.g., 30 days)
2. Pull sample of transactions/events
3. Verify control operated correctly
4. Document exceptions and deviations

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | CapabilityEffectivenessTest model |
| `src/controls/services/effectiveness-test.service.ts` | Test management service |
| `src/shared/events/control-events.ts` | TestFailedEvent definition |
| `src/config/controls.config.ts` | Test result configuration |

---

## Related Documentation

- [01-control-system.md](01-control-system.md) - Parent control system
- [02-capability-maturity-system.md](02-capability-maturity-system.md) - Capability management
- [04-metrics-monitoring-system.md](04-metrics-monitoring-system.md) - Continuous monitoring
- [Risk Module: Risk Scenario System](../risk-management/05-risk-scenario-system.md) - F2 factor usage
