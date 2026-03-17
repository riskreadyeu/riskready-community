# Risk Management Module - API Reference

**Version:** 1.0  
**Created:** December 2024  

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Risk Endpoints](#risk-endpoints)
4. [Scenario Endpoints](#scenario-endpoints)
5. [KRI Endpoints](#kri-endpoints)
6. [Treatment Plan Endpoints](#treatment-plan-endpoints)
7. [RTS Endpoints](#rts-endpoints)

---

## Overview

All Risk Management endpoints are prefixed with `/api/risks` and require JWT authentication.

| Base Path | Controller | Description |
|-----------|------------|-------------|
| `/risks` | RiskController | Risk register operations |
| `/risks/scenarios` | RiskScenarioController | Scenario management |
| `/risks/kris` | KRIController | Key Risk Indicator operations |
| `/risks/treatment-plans` | TreatmentPlanController | Treatment plan management |
| `/risks/rts` | RiskToleranceStatementController | Risk tolerance statements |

---

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

---

## Risk Endpoints

### List Risks

Retrieve paginated list of risks with optional filters.

```http
GET /api/risks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip (pagination) |
| `take` | number | Records to return (default: 25) |
| `tier` | string | Filter by tier: CORE, EXTENDED, ADVANCED |
| `status` | string | Filter by status |
| `framework` | string | Filter by framework |
| `organisationId` | string | Filter by organisation |
| `search` | string | Search in riskId, title, description |

**Response:**

```json
{
  "results": [
    {
      "id": "clxyz...",
      "riskId": "R-01",
      "title": "Unauthorized Access to Systems",
      "description": "Risk of unauthorized access to critical systems...",
      "tier": "CORE",
      "status": "ASSESSED",
      "framework": "ISO",
      "inherentScore": 15,
      "residualScore": 8,
      "_count": {
        "scenarios": 3,
        "kris": 2
      },
      "scenarios": [
        { "id": "...", "scenarioId": "R-01-S01", "title": "..." }
      ]
    }
  ],
  "count": 42
}
```

---

### Get Risk Statistics

Retrieve aggregated statistics for the risk register.

```http
GET /api/risks/stats
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organisationId` | string | Filter by organisation |

**Response:**

```json
{
  "total": 42,
  "scenarioCount": 156,
  "kriCount": 89,
  "byTier": {
    "CORE": 20,
    "EXTENDED": 15,
    "ADVANCED": 7
  },
  "byStatus": {
    "IDENTIFIED": 5,
    "ASSESSED": 20,
    "TREATING": 10,
    "ACCEPTED": 5,
    "CLOSED": 2
  },
  "byFramework": {
    "ISO": 30,
    "SOC2": 8,
    "NIS2": 2,
    "DORA": 2
  }
}
```

---

### Get Risk Detail

Retrieve full risk details including related entities.

```http
GET /api/risks/:id
```

**Response:**

```json
{
  "id": "clxyz...",
  "riskId": "R-01",
  "title": "Unauthorized Access to Systems",
  "description": "...",
  "tier": "CORE",
  "status": "ASSESSED",
  "framework": "ISO",
  "likelihood": "POSSIBLE",
  "impact": "MAJOR",
  "inherentScore": 12,
  "residualScore": 6,
  "riskOwner": "John Smith",
  "treatmentPlan": "Implement MFA...",
  "acceptanceCriteria": "...",
  "_count": {
    "scenarios": 3,
    "kris": 2,
    "treatmentPlans": 1,
    "toleranceStatements": 1
  },
  "scenarios": [...],
  "kris": [...],
  "controls": [...],
  "treatmentPlans": [...],
  "toleranceStatements": [...],
  "createdBy": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-02-20T14:45:00Z"
}
```

---

### Create Risk

Create a new risk entry.

```http
POST /api/risks
```

**Request Body:**

```json
{
  "riskId": "R-43",
  "title": "Cloud Service Provider Failure",
  "description": "Risk of critical cloud service outage...",
  "tier": "EXTENDED",
  "status": "IDENTIFIED",
  "framework": "ISO",
  "riskOwner": "Jane Smith",
  "likelihood": "UNLIKELY",
  "impact": "MAJOR",
  "organisationId": "org_123"
}
```

**Response:** Created risk object

---

### Update Risk

Update an existing risk.

```http
PUT /api/risks/:id
```

**Request Body:**

```json
{
  "status": "ASSESSED",
  "likelihood": "POSSIBLE",
  "impact": "MAJOR",
  "inherentScore": 12,
  "residualScore": 6,
  "riskOwner": "John Smith",
  "treatmentPlan": "Implement controls...",
  "acceptanceCriteria": "..."
}
```

**Response:** Updated risk object

---

## Scenario Endpoints

### List Scenarios by Risk

```http
GET /api/risks/:riskId/scenarios
```

**Response:**

```json
[
  {
    "id": "...",
    "scenarioId": "R-01-S01",
    "title": "Phishing Attack",
    "cause": "Employee clicks malicious link",
    "event": "Credentials compromised",
    "consequence": "Unauthorized system access",
    "likelihood": "POSSIBLE",
    "impact": "MAJOR",
    "inherentScore": 12,
    "residualLikelihood": "UNLIKELY",
    "residualImpact": "MINOR",
    "residualScore": 4,
    "sleLikely": 50000,
    "aro": 0.5,
    "ale": 25000,
    "createdBy": {...}
  }
]
```

---

### Get All Scenarios

```http
GET /api/risks/scenarios
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip |
| `take` | number | Records to return |

---

### Get Scenario Detail

```http
GET /api/risks/scenarios/:id
```

**Response includes:**
- Full scenario details
- Parent risk reference
- Audit trail

---

### Create Scenario

```http
POST /api/risks/:riskId/scenarios
```

**Request Body:**

```json
{
  "scenarioId": "R-01-S02",
  "title": "Brute Force Attack",
  "cause": "Weak password policy",
  "event": "Account compromise through password guessing",
  "consequence": "Unauthorized access to sensitive data",
  "framework": "ISO",
  "likelihood": "POSSIBLE",
  "impact": "MAJOR",
  "residualLikelihood": "UNLIKELY",
  "residualImpact": "MINOR",
  "sleLow": 10000,
  "sleLikely": 50000,
  "sleHigh": 200000,
  "aro": 0.3,
  "controlIds": "8.1,8.2,8.3"
}
```

**Note:** `inherentScore` and `residualScore` are automatically calculated.

---

### Update Scenario

```http
PUT /api/risks/scenarios/:id
```

**Request Body:** Same fields as create (all optional)

---

### Delete Scenario

```http
DELETE /api/risks/scenarios/:id
```

---

## KRI Endpoints

### List KRIs by Risk

```http
GET /api/risks/:riskId/kris
```

---

### List All KRIs

```http
GET /api/risks/kris
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip |
| `take` | number | Records to return |
| `status` | string | Filter by RAG status |
| `tier` | string | Filter by tier |

---

### Get KRI Dashboard

```http
GET /api/risks/kris/dashboard
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organisationId` | string | Filter by organisation |

**Response:**

```json
{
  "total": 89,
  "statusCounts": {
    "GREEN": 45,
    "AMBER": 25,
    "RED": 10,
    "NOT_MEASURED": 9
  },
  "byTier": {
    "CORE": { "total": 50, "green": 30, "amber": 15, "red": 5 },
    "EXTENDED": { "total": 30, "green": 12, "amber": 8, "red": 4 },
    "ADVANCED": { "total": 9, "green": 3, "amber": 2, "red": 1 }
  }
}
```

---

### Get KRI Detail

```http
GET /api/risks/kris/:id
```

**Response includes:**
- Full KRI details
- Parent risk reference
- Historical values (last 20)
- Audit trail

---

### Create KRI

```http
POST /api/risks/:riskId/kris
```

**Request Body:**

```json
{
  "kriId": "KRI-042",
  "name": "Patch Compliance Rate",
  "description": "Percentage of systems with critical patches applied within SLA",
  "tier": "CORE",
  "framework": "ISO",
  "frequency": "MONTHLY",
  "unit": "%",
  "formula": "(Patched Systems / Total Systems) × 100",
  "dataSource": "Vulnerability Scanner",
  "automated": true,
  "thresholdGreen": "≥95%",
  "thresholdAmber": "80-94%",
  "thresholdRed": "<80%"
}
```

---

### Update KRI

```http
PUT /api/risks/kris/:id
```

---

### Update KRI Value

Record a new measurement and update status/trend.

```http
POST /api/risks/kris/:id/value
```

**Request Body:**

```json
{
  "value": "92%",
  "notes": "3 systems pending maintenance window"
}
```

**Response includes:**
- Updated KRI with new status and trend
- Status automatically calculated from thresholds
- Trend calculated from previous value

---

## Treatment Plan Endpoints

### List Treatment Plans

```http
GET /api/risks/treatment-plans
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip |
| `take` | number | Records to return |
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `riskId` | string | Filter by risk |
| `organisationId` | string | Filter by organisation |

---

### Get Treatment Plan Statistics

```http
GET /api/risks/treatment-plans/stats
```

**Response:**

```json
{
  "total": 35,
  "overdueCount": 5,
  "completedThisMonth": 8,
  "byStatus": {
    "DRAFT": 5,
    "PROPOSED": 3,
    "APPROVED": 2,
    "IN_PROGRESS": 15,
    "COMPLETED": 8,
    "ON_HOLD": 2
  },
  "byType": {
    "MITIGATE": 25,
    "TRANSFER": 3,
    "ACCEPT": 5,
    "AVOID": 2
  },
  "byPriority": {
    "CRITICAL": 5,
    "HIGH": 12,
    "MEDIUM": 15,
    "LOW": 3
  }
}
```

---

### Get Treatment Plan Detail

```http
GET /api/risks/treatment-plans/:id
```

**Response includes:**
- Full plan details
- Actions with assignees
- Risk reference
- Owner and implementer details
- Audit trail

---

### Create Treatment Plan

```http
POST /api/risks/treatment-plans
```

**Request Body:**

```json
{
  "treatmentId": "TP-015",
  "title": "Implement Multi-Factor Authentication",
  "description": "Deploy MFA across all critical systems...",
  "treatmentType": "MITIGATE",
  "priority": "HIGH",
  "targetResidualScore": 6,
  "estimatedCost": 50000,
  "costBenefit": "ROI within 6 months based on reduced incident costs",
  "targetStartDate": "2024-03-01",
  "targetEndDate": "2024-06-30",
  "riskOwnerId": "user_123",
  "implementerId": "user_456",
  "riskId": "risk_789",
  "organisationId": "org_123"
}
```

---

### Update Treatment Plan

```http
PUT /api/risks/treatment-plans/:id
```

---

### Approve Treatment Plan

```http
POST /api/risks/treatment-plans/:id/approve
```

---

### Update Progress

```http
POST /api/risks/treatment-plans/:id/progress
```

**Request Body:**

```json
{
  "progressPercentage": 75,
  "progressNotes": "Phase 3 complete. Starting user enrollment."
}
```

---

### Create Treatment Action

```http
POST /api/risks/treatment-plans/:id/actions
```

**Request Body:**

```json
{
  "actionId": "TP-015-A01",
  "title": "Procure MFA solution",
  "description": "Evaluate and purchase MFA platform",
  "status": "NOT_STARTED",
  "priority": "HIGH",
  "dueDate": "2024-03-15",
  "assignedToId": "user_789",
  "estimatedHours": 40
}
```

---

### Update Treatment Action

```http
PUT /api/risks/treatment-plans/actions/:id
```

---

### Delete Treatment Action

```http
DELETE /api/risks/treatment-plans/actions/:id
```

---

## RTS Endpoints

### List Risk Tolerance Statements

```http
GET /api/risks/rts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip |
| `take` | number | Records to return |
| `status` | string | Filter by status |
| `level` | string | Filter by tolerance level |
| `domain` | string | Filter by domain |
| `organisationId` | string | Filter by organisation |

---

### Get RTS Statistics

```http
GET /api/risks/rts/stats
```

---

### Get RTS Detail

```http
GET /api/risks/rts/:id
```

**Response includes:**
- Full RTS details
- Linked risks, scenarios, KRIs
- Approval information
- Audit trail

---

### Create RTS

```http
POST /api/risks/rts
```

**Request Body:**

```json
{
  "rtsId": "RTS-008",
  "title": "Vulnerability Management Tolerance",
  "objective": "Define acceptable vulnerability remediation timelines",
  "domain": "Vulnerability Management",
  "proposedToleranceLevel": "MEDIUM",
  "proposedRTS": "Critical vulnerabilities must be remediated within 7 days...",
  "conditions": [
    {
      "level": "HIGH",
      "description": "Critical: 7 days, High: 30 days",
      "proposedRts": "Accept risk if compensating controls present"
    }
  ],
  "anticipatedOperationalImpact": "Increased patching frequency",
  "rationale": "Based on industry benchmarks and threat landscape",
  "framework": "ISO",
  "effectiveDate": "2024-03-01",
  "reviewDate": "2025-03-01",
  "riskIds": ["risk_123", "risk_456"],
  "organisationId": "org_123"
}
```

---

### Update RTS

```http
PUT /api/risks/rts/:id
```

---

### Approve RTS

```http
POST /api/risks/rts/:id/approve
```

---

### Link Risks to RTS

```http
POST /api/risks/rts/:id/link-risks
```

**Request Body:**

```json
{
  "riskIds": ["risk_123", "risk_456"]
}
```

---

### Unlink Risks from RTS

```http
POST /api/risks/rts/:id/unlink-risks
```

---

