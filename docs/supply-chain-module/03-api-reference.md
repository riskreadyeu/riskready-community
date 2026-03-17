# Supply Chain Module - API Reference

This document provides comprehensive API documentation for all Supply Chain module endpoints.

## Base URL

All endpoints are prefixed with:

```
/api/supply-chain
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Dashboard Endpoints

### Get Dashboard Data

Retrieves comprehensive dashboard metrics.

```http
GET /api/supply-chain/dashboard
```

**Response:**

```json
{
  "vendorStats": {
    "total": 45,
    "byTier": {
      "CRITICAL": 5,
      "HIGH": 12,
      "MEDIUM": 20,
      "LOW": 8
    },
    "byStatus": {
      "ACTIVE": 38,
      "ASSESSMENT": 4,
      "PROSPECT": 3
    },
    "inDoraScope": 15,
    "inNis2Scope": 22,
    "criticalIctProviders": 5
  },
  "assessmentStats": {
    "inProgress": 8,
    "dueSoon": 5,
    "overdue": 2
  },
  "contractStats": {
    "expiringSoon": 3,
    "active": 42
  },
  "recentActivity": [...]
}
```

---

### Get Dashboard Summary

Retrieves summarized metrics for quick view.

```http
GET /api/supply-chain/dashboard/summary
```

**Response:**

```json
{
  "totalVendors": 45,
  "criticalVendors": 5,
  "pendingAssessments": 8,
  "expiringContracts": 3,
  "openFindings": 12
}
```

---

### Get Dashboard Alerts

Retrieves actionable alerts.

```http
GET /api/supply-chain/dashboard/alerts
```

**Response:**

```json
{
  "alerts": [
    {
      "type": "ASSESSMENT_DUE",
      "severity": "HIGH",
      "message": "Assessment for VND-001 due in 7 days",
      "vendorId": "cuid123",
      "dueDate": "2024-01-15T00:00:00Z"
    },
    {
      "type": "CONTRACT_EXPIRING",
      "severity": "MEDIUM",
      "message": "Contract CNT-VND002-001 expires in 30 days",
      "contractId": "cuid456"
    }
  ]
}
```

---

## Vendor Endpoints

### List Vendors

Retrieves a paginated list of vendors with optional filters.

```http
GET /api/supply-chain/vendors
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip (pagination) |
| `take` | number | Records to return (default: 10) |
| `tier` | string | Filter by tier: CRITICAL, HIGH, MEDIUM, LOW |
| `status` | string | Filter by status |
| `inDoraScope` | boolean | Filter DORA-scope vendors |
| `inNis2Scope` | boolean | Filter NIS2-scope vendors |
| `search` | string | Search by name or vendor code |

**Example:**

```http
GET /api/supply-chain/vendors?tier=CRITICAL&inDoraScope=true&take=20
```

**Response:**

```json
{
  "items": [
    {
      "id": "cuid123",
      "vendorCode": "VND-001",
      "name": "Cloud Provider Inc",
      "tier": "CRITICAL",
      "status": "ACTIVE",
      "inDoraScope": true,
      "isCriticalIctProvider": true,
      "nextAssessmentDue": "2024-03-15T00:00:00Z",
      "relationshipOwner": {
        "id": "user1",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 5,
  "skip": 0,
  "take": 10
}
```

---

### Get Vendor

Retrieves a single vendor with full details.

```http
GET /api/supply-chain/vendors/:id
```

**Response:**

```json
{
  "id": "cuid123",
  "vendorCode": "VND-001",
  "name": "Cloud Provider Inc",
  "legalName": "Cloud Provider International Ltd",
  "description": "Primary cloud infrastructure provider",
  "tier": "CRITICAL",
  "tierRationale": "Supports critical business functions",
  "status": "ACTIVE",
  "inDoraScope": true,
  "isCriticalIctProvider": true,
  "supportsEssentialFunction": true,
  "iso27001Certified": true,
  "iso27001CertExpiry": "2025-06-30T00:00:00Z",
  "soc2Type2Certified": true,
  "dataProcessingLocations": ["EU-WEST-1", "EU-CENTRAL-1"],
  "thirdCountryExposure": false,
  "inherentRiskScore": 35,
  "residualRiskScore": 65,
  "assessments": [...],
  "contracts": [...],
  "services": [...]
}
```

---

### Create Vendor

Creates a new vendor.

```http
POST /api/supply-chain/vendors
```

**Request Body:**

```json
{
  "name": "New Vendor Corp",
  "legalName": "New Vendor Corporation Ltd",
  "description": "Software development services",
  "vendorType": "SOFTWARE_VENDOR",
  "inDoraScope": true,
  "inNis2Scope": true,
  "isIctServiceProvider": true,
  "headquartersCountry": "DE",
  "primaryContactName": "Jane Smith",
  "primaryContactEmail": "jane@newvendor.com",
  "relationshipOwnerId": "user123"
}
```

**Response:** Returns the created vendor object with generated `vendorCode`.

---

### Update Vendor

Updates an existing vendor.

```http
PUT /api/supply-chain/vendors/:id
```

**Request Body:** Partial vendor object with fields to update.

---

### Delete Vendor

Deletes a vendor (cascades to related records).

```http
DELETE /api/supply-chain/vendors/:id
```

---

### Get Vendor Statistics

Retrieves aggregated vendor statistics.

```http
GET /api/supply-chain/vendors/stats
```

**Response:**

```json
{
  "total": 45,
  "byTier": {
    "CRITICAL": 5,
    "HIGH": 12,
    "MEDIUM": 20,
    "LOW": 8
  },
  "byStatus": {
    "ACTIVE": 38,
    "ASSESSMENT": 4,
    "PROSPECT": 3
  },
  "regulatoryScope": {
    "dora": 15,
    "nis2": 22,
    "gdpr": 40,
    "pci": 5
  },
  "certifications": {
    "iso27001": 28,
    "soc2": 22,
    "pciDss": 5
  }
}
```

---

### Get Concentration Risk

Analyzes concentration risk across vendors.

```http
GET /api/supply-chain/vendors/concentration-risk
```

**Response:**

```json
{
  "byServiceType": {
    "CLOUD": {
      "count": 3,
      "vendors": ["VND-001", "VND-002", "VND-003"],
      "criticalCount": 2,
      "singlePointOfFailure": false
    },
    "PAYMENT_PROCESSING": {
      "count": 1,
      "vendors": ["VND-010"],
      "criticalCount": 1,
      "singlePointOfFailure": true
    }
  },
  "byGeography": {
    "US": { "count": 15, "percentage": 33.3 },
    "DE": { "count": 10, "percentage": 22.2 },
    "UK": { "count": 8, "percentage": 17.8 }
  },
  "thirdCountryExposure": {
    "count": 5,
    "percentage": 11.1,
    "vendors": ["VND-005", "VND-012"]
  },
  "riskSummary": {
    "singlePointsOfFailure": 2,
    "highConcentrationServices": ["PAYMENT_PROCESSING", "DNS"],
    "recommendations": [...]
  }
}
```

---

### Get DORA Report

Generates DORA ICT Third-Party Register data.

```http
GET /api/supply-chain/vendors/dora-report
```

**Response:**

```json
{
  "reportDate": "2024-01-15T00:00:00Z",
  "totalIctProviders": 15,
  "criticalProviders": 5,
  "vendors": [
    {
      "vendorCode": "VND-001",
      "name": "Cloud Provider Inc",
      "leiCode": "5299001ABCDEF123456",
      "isCriticalIctProvider": true,
      "supportsEssentialFunction": true,
      "dataLocations": ["EU-WEST-1"],
      "thirdCountryExposure": false,
      "contractRef": "CNT-VND001-001",
      "doraArticle30Compliance": true,
      "exitPlanStatus": "TESTED"
    }
  ],
  "complianceSummary": {
    "withLeiCode": 12,
    "withExitPlan": 5,
    "article30Compliant": 10
  }
}
```

---

### Update Vendor Tier

Manually update vendor tier with justification.

```http
PUT /api/supply-chain/vendors/:id/tier
```

**Request Body:**

```json
{
  "tier": "CRITICAL",
  "overrideReason": "Supports critical payment processing function"
}
```

---

### Calculate Vendor Tier

Automatically calculate tier based on assessment and services.

```http
POST /api/supply-chain/vendors/:id/calculate-tier
```

**Response:**

```json
{
  "previousTier": "HIGH",
  "calculatedTier": "CRITICAL",
  "factors": [
    "isCriticalIctProvider: true",
    "supportsEssentialFunction: true",
    "latestAssessmentScore: 72"
  ]
}
```

---

## Assessment Endpoints

### List Assessments

```http
GET /api/supply-chain/assessments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Pagination offset |
| `take` | number | Page size |
| `vendorId` | string | Filter by vendor |
| `status` | string | Filter by status |
| `type` | string | Filter by assessment type |

---

### Get Assessment

```http
GET /api/supply-chain/assessments/:id
```

**Response includes:**
- Assessment details
- Assigned questions
- Responses with scores
- Findings

---

### Create Assessment

```http
POST /api/supply-chain/assessments
```

**Request Body:**

```json
{
  "vendorId": "cuid123",
  "assessmentType": "PERIODIC",
  "targetTier": "HIGH",
  "frameworksIncluded": ["ISO", "NIS2", "DORA"],
  "dueDate": "2024-02-28T00:00:00Z",
  "assessorId": "user456"
}
```

**Response:** Assessment with auto-generated questions based on tier and frameworks.

---

### Update Assessment

```http
PUT /api/supply-chain/assessments/:id
```

---

### Save Response

Save or update a question response.

```http
PUT /api/supply-chain/assessments/:id/response/:questionId
```

**Request Body:**

```json
{
  "score": 4,
  "response": "We have documented access control policies reviewed annually",
  "evidenceProvided": "Policy document ACC-001, review log from 2024-01",
  "evidenceUrls": ["https://docs.example.com/acc-001"]
}
```

---

### Submit Assessment

Submit assessment for review.

```http
POST /api/supply-chain/assessments/:id/submit
```

---

### Calculate Score

Calculate overall and domain scores.

```http
POST /api/supply-chain/assessments/:id/calculate-score
```

**Response:**

```json
{
  "overallScore": 78.5,
  "domainScores": {
    "1. Governance & Organization": 85.2,
    "2. Information Security Management": 72.1,
    "3. Risk Management": 80.0
  },
  "calculatedTier": "HIGH",
  "answeredQuestions": 180,
  "totalQuestions": 211
}
```

---

### Complete Assessment

Mark assessment as complete and update vendor.

```http
POST /api/supply-chain/assessments/:id/complete
```

---

### Create Finding

Create a finding from assessment.

```http
POST /api/supply-chain/assessments/:id/findings
```

**Request Body:**

```json
{
  "title": "Inadequate Access Control Review",
  "description": "Access control reviews are not performed quarterly as required",
  "severity": "HIGH",
  "domain": "6. Access Control",
  "questionNumbers": [45, 46],
  "remediationPlan": "Implement quarterly access reviews",
  "remediationDueDate": "2024-03-31T00:00:00Z"
}
```

---

### Get Due Assessments

```http
GET /api/supply-chain/assessments/due
```

Returns assessments due within 30 days.

---

## Question Endpoints

### List Questions

```http
GET /api/supply-chain/questions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Pagination offset |
| `take` | number | Page size |
| `search` | string | Search in question text |

---

### Get Questions by Domain

```http
GET /api/supply-chain/questions/by-domain
```

**Response:**

```json
{
  "1. Governance & Organization": [
    { "id": "q1", "questionNumber": 1, "questionText": "..." }
  ],
  "2. Information Security Management": [...]
}
```

---

### Get Questions for Tier

```http
GET /api/supply-chain/questions/for-tier?tier=CRITICAL
```

Returns questions applicable to the specified tier.

---

### Get Questions for Frameworks

```http
GET /api/supply-chain/questions/for-frameworks?frameworks=ISO,NIS2
```

Returns questions from specified framework layers.

---

### Get Domain Summary

```http
GET /api/supply-chain/questions/domain-summary
```

**Response:**

```json
{
  "domains": [
    {
      "name": "1. Governance & Organization",
      "totalQuestions": 17,
      "byFramework": { "ISO": 10, "NIS2": 4, "DORA": 3 },
      "byWeight": { "CRITICAL": 2, "HIGH": 5, "MEDIUM": 8, "LOW": 2 }
    }
  ]
}
```

---

### Get Question Statistics

```http
GET /api/supply-chain/questions/statistics
```

**Response:**

```json
{
  "total": 223,
  "byFramework": { "ISO": 102, "NIS2": 55, "DORA": 66 },
  "byWeight": { "CRITICAL": 25, "HIGH": 68, "MEDIUM": 98, "LOW": 32 },
  "byTierApplicability": { "All": 176, "Critical/High": 35, "Critical": 12 },
  "byDomain": {
    "1. Governance & Organization": 17,
    "2. Information Security Management": 17
  }
}
```

---

## Contract Endpoints

### List Contracts

```http
GET /api/supply-chain/contracts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `vendorId` | string | Filter by vendor |
| `status` | string | Filter by status |
| `expiringWithinDays` | number | Show expiring contracts |

---

### Get Contract

```http
GET /api/supply-chain/contracts/:id
```

---

### Create Contract

```http
POST /api/supply-chain/contracts
```

**Request Body:**

```json
{
  "vendorId": "cuid123",
  "title": "Master Service Agreement",
  "contractType": "MSA",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "expiryDate": "2026-12-31T00:00:00Z",
  "contractValue": 500000,
  "contractCurrency": "EUR",
  "autoRenewal": true,
  "renewalTermMonths": 12,
  "renewalNoticeDays": 90
}
```

---

### Update Contract

```http
PUT /api/supply-chain/contracts/:id
```

---

### Delete Contract

```http
DELETE /api/supply-chain/contracts/:id
```

---

### Get DORA Compliance Status

```http
GET /api/supply-chain/contracts/:id/dora-compliance
```

**Response:**

```json
{
  "checklist": [
    { "field": "hasServiceDescription", "label": "Full service description", "article": "Art. 30(2)(a)", "compliant": true },
    { "field": "hasDataLocations", "label": "Data processing locations", "article": "Art. 30(2)(b)", "compliant": true },
    { "field": "hasAuditRights", "label": "Full audit rights", "article": "Art. 30(3)(e)", "compliant": false }
  ],
  "compliantCount": 8,
  "totalRequirements": 11,
  "compliancePercentage": 72.7
}
```

---

### Update DORA Compliance

```http
PUT /api/supply-chain/contracts/:id/dora-compliance
```

**Request Body:**

```json
{
  "doraComplianceChecklist": {
    "clearDescription": true,
    "dataLocations": true,
    "accessRights": true
  }
}
```

---

### Get Expiring Contracts

```http
GET /api/supply-chain/contracts/expiring?days=90
```

---

## Review Endpoints

### List Reviews

```http
GET /api/supply-chain/reviews
```

---

### Get Review

```http
GET /api/supply-chain/reviews/:id
```

---

### Create Review

```http
POST /api/supply-chain/reviews
```

---

### Update Review

```http
PUT /api/supply-chain/reviews/:id
```

---

### Get Upcoming Reviews

```http
GET /api/supply-chain/reviews/upcoming
```

---

### Get Overdue Reviews

```http
GET /api/supply-chain/reviews/overdue
```

---

### Complete Review

```http
POST /api/supply-chain/reviews/:id/complete
```

**Request Body:**

```json
{
  "summary": "Annual review completed successfully",
  "performanceScore": 85,
  "slaCompliance": 98.5,
  "findings": "Minor documentation gaps identified",
  "recommendations": "Update BCP documentation",
  "tierAfter": "HIGH"
}
```

---

### Schedule Review

Schedule a review for a vendor.

```http
POST /api/supply-chain/reviews/schedule/:vendorId
```

**Request Body:**

```json
{
  "reviewType": "PERIODIC",
  "scheduledDate": "2024-03-15T00:00:00Z",
  "reviewPeriod": "Q1 2024",
  "reviewerId": "user789"
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "vendorId", "message": "vendorId must be a valid CUID" }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/supply-chain/vendors?skip=20&take=10
```

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "skip": 20,
  "take": 10
}
```

---

## Filtering

Most list endpoints support filtering via query parameters:

```http
GET /api/supply-chain/vendors?tier=CRITICAL&status=ACTIVE&inDoraScope=true
```

Multiple values for the same filter use comma separation:

```http
GET /api/supply-chain/questions/for-frameworks?frameworks=ISO,NIS2
```
