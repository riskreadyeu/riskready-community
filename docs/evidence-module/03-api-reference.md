# Evidence Module - API Reference

This document provides comprehensive API documentation for all Evidence module endpoints.

## Base URLs

| Controller | Base URL |
|------------|----------|
| Evidence | `/api/evidence` |
| Evidence Requests | `/api/evidence-requests` |
| Evidence Links | `/api/evidence-links` |
| Evidence Migration | `/api/evidence-migration` |

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Evidence Endpoints

### List Evidence

Retrieves a paginated list of evidence with optional filters.

```http
GET /api/evidence
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Records to skip (pagination) |
| `take` | number | Records to return (default: 10) |
| `evidenceType` | string | Filter by type (DOCUMENT, CERTIFICATE, etc.) |
| `status` | string | Filter by status (PENDING, APPROVED, etc.) |
| `classification` | string | Filter by classification |
| `sourceType` | string | Filter by source type |
| `category` | string | Filter by category |
| `search` | string | Search in title and description |
| `collectedById` | string | Filter by collector |
| `validUntilBefore` | date | Expiring before date |
| `validUntilAfter` | date | Expiring after date |

**Example:**

```http
GET /api/evidence?status=APPROVED&evidenceType=CERTIFICATE&take=20
```

**Response:**

```json
{
  "items": [
    {
      "id": "cuid123",
      "evidenceRef": "EVD-2025-0001",
      "title": "ISO 27001 Certificate",
      "evidenceType": "CERTIFICATE",
      "status": "APPROVED",
      "classification": "INTERNAL",
      "validUntil": "2026-12-31T00:00:00Z",
      "collectedBy": {
        "id": "user1",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 45,
  "skip": 0,
  "take": 10
}
```

---

### Get Evidence Statistics

Retrieves aggregated evidence statistics.

```http
GET /api/evidence/stats
```

**Response:**

```json
{
  "total": 150,
  "byStatus": {
    "PENDING": 12,
    "UNDER_REVIEW": 5,
    "APPROVED": 120,
    "REJECTED": 3,
    "EXPIRED": 8,
    "ARCHIVED": 2
  },
  "byType": {
    "DOCUMENT": 45,
    "CERTIFICATE": 20,
    "REPORT": 30,
    "LOG": 25,
    "SCREENSHOT": 15,
    "OTHER": 15
  },
  "byClassification": {
    "PUBLIC": 10,
    "INTERNAL": 100,
    "CONFIDENTIAL": 35,
    "RESTRICTED": 5
  },
  "expiringThisMonth": 5,
  "pendingReview": 17
}
```

---

### Get Expiring Evidence

Retrieves evidence expiring within specified days.

```http
GET /api/evidence/expiring?days=30
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Days until expiry |

**Response:**

```json
{
  "items": [
    {
      "id": "cuid123",
      "evidenceRef": "EVD-2025-0001",
      "title": "Vendor SOC 2 Report",
      "evidenceType": "REPORT",
      "validUntil": "2025-02-15T00:00:00Z",
      "daysUntilExpiry": 25
    }
  ],
  "count": 5
}
```

---

### Get Evidence Details

Retrieves a single evidence record with full details.

```http
GET /api/evidence/:id
```

**Response:**

```json
{
  "id": "cuid123",
  "evidenceRef": "EVD-2025-0001",
  "title": "ISO 27001 Certificate",
  "description": "Annual ISO 27001 certification",
  "evidenceType": "CERTIFICATE",
  "status": "APPROVED",
  "classification": "INTERNAL",
  "tags": ["iso27001", "certification", "annual"],
  "category": "Compliance",
  
  "fileName": "iso27001-cert-2025.pdf",
  "originalFileName": "ISO_27001_Certificate_2025.pdf",
  "fileUrl": "/files/evidence/cuid123/iso27001-cert-2025.pdf",
  "fileSizeBytes": 245678,
  "mimeType": "application/pdf",
  
  "hashSha256": "abc123...",
  "hashMd5": "def456...",
  "isForensicallySound": false,
  
  "sourceType": "MANUAL_UPLOAD",
  "collectedAt": "2025-01-15T10:30:00Z",
  "collectedBy": {
    "id": "user1",
    "firstName": "John",
    "lastName": "Doe"
  },
  
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2026-12-31T00:00:00Z",
  
  "reviewedAt": "2025-01-16T14:00:00Z",
  "reviewedBy": { "id": "user2", "firstName": "Jane", "lastName": "Smith" },
  "approvedAt": "2025-01-16T15:00:00Z",
  "approvedBy": { "id": "user2", "firstName": "Jane", "lastName": "Smith" },
  
  "version": 1,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-16T15:00:00Z",
  
  "controlLinks": [...],
  "vendorLinks": [...],
  "incidentLinks": []
}
```

---

### Create Evidence

Creates a new evidence record.

```http
POST /api/evidence
```

**Request Body:**

```json
{
  "title": "Quarterly Access Review Report",
  "description": "Q1 2025 access review results",
  "evidenceType": "REPORT",
  "classification": "CONFIDENTIAL",
  "tags": ["access-review", "quarterly", "q1-2025"],
  "category": "Access Control",
  
  "fileName": "q1-2025-access-review.pdf",
  "originalFileName": "Q1_2025_Access_Review_Report.pdf",
  "fileUrl": "/uploads/q1-2025-access-review.pdf",
  "fileSizeBytes": 156789,
  "mimeType": "application/pdf",
  
  "hashSha256": "abc123...",
  
  "sourceType": "MANUAL_UPLOAD",
  "collectedAt": "2025-01-20T09:00:00Z",
  "collectedById": "user1",
  
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2025-03-31T00:00:00Z",
  
  "createdById": "user1"
}
```

**Response:** Returns the created evidence with generated `evidenceRef`.

---

### Update Evidence

Updates an existing evidence record.

```http
PUT /api/evidence/:id
```

**Request Body:** Partial evidence object with fields to update.

```json
{
  "title": "Updated Title",
  "classification": "RESTRICTED",
  "validUntil": "2025-06-30T00:00:00Z",
  "updatedById": "user1"
}
```

---

### Delete Evidence

Deletes an evidence record (cascades to links).

```http
DELETE /api/evidence/:id
```

---

## Evidence Workflow Endpoints

### Submit for Review

Submits evidence for review.

```http
POST /api/evidence/:id/submit-for-review
```

**Request Body:**

```json
{
  "userId": "user1"
}
```

**Response:** Updated evidence with status `UNDER_REVIEW`.

---

### Approve Evidence

Approves evidence after review.

```http
POST /api/evidence/:id/approve
```

**Request Body:**

```json
{
  "userId": "user2",
  "notes": "Verified certificate authenticity"
}
```

**Response:** Updated evidence with status `APPROVED`.

---

### Reject Evidence

Rejects evidence with reason.

```http
POST /api/evidence/:id/reject
```

**Request Body:**

```json
{
  "userId": "user2",
  "reason": "Certificate expired, please upload current version"
}
```

**Response:** Updated evidence with status `REJECTED`.

---

### Archive Evidence

Archives evidence (no longer active but retained).

```http
POST /api/evidence/:id/archive
```

**Request Body:**

```json
{
  "userId": "user1"
}
```

**Response:** Updated evidence with status `ARCHIVED`.

---

### Create New Version

Creates a new version of existing evidence.

```http
POST /api/evidence/:id/new-version
```

**Request Body:**

```json
{
  "title": "ISO 27001 Certificate 2026",
  "evidenceType": "CERTIFICATE",
  "fileName": "iso27001-cert-2026.pdf",
  "fileUrl": "/uploads/iso27001-cert-2026.pdf",
  "fileSizeBytes": 256789,
  "mimeType": "application/pdf",
  "hashSha256": "xyz789...",
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2027-12-31T00:00:00Z",
  "createdById": "user1"
}
```

**Response:** New evidence record with `previousVersionId` set to original.

---

## Evidence Request Endpoints

### List Evidence Requests

```http
GET /api/evidence-requests
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Pagination offset |
| `take` | number | Page size |
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `assignedToId` | string | Filter by assignee |
| `assignedDepartmentId` | string | Filter by department |
| `requestedById` | string | Filter by requester |
| `contextType` | string | Filter by context type |
| `contextId` | string | Filter by context ID |
| `overdue` | boolean | Show only overdue requests |

**Response:**

```json
{
  "items": [
    {
      "id": "cuid456",
      "requestRef": "REQ-2025-0001",
      "title": "Q1 Access Review Evidence",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "dueDate": "2025-01-31T00:00:00Z",
      "assignedTo": {
        "id": "user3",
        "firstName": "Bob",
        "lastName": "Wilson"
      },
      "contextType": "Control",
      "contextRef": "A.9.2.5"
    }
  ],
  "total": 15,
  "skip": 0,
  "take": 10
}
```

---

### Get Request Statistics

```http
GET /api/evidence-requests/stats
```

**Response:**

```json
{
  "total": 50,
  "byStatus": {
    "OPEN": 10,
    "IN_PROGRESS": 15,
    "SUBMITTED": 5,
    "ACCEPTED": 18,
    "REJECTED": 2
  },
  "byPriority": {
    "LOW": 10,
    "MEDIUM": 25,
    "HIGH": 12,
    "CRITICAL": 3
  },
  "overdue": 3,
  "dueSoon": 8
}
```

---

### Get My Requests

Gets requests assigned to a specific user.

```http
GET /api/evidence-requests/my-requests/:userId
```

**Response:**

```json
{
  "assigned": [...],
  "created": [...],
  "overdue": [...]
}
```

---

### Get Request Details

```http
GET /api/evidence-requests/:id
```

**Response:**

```json
{
  "id": "cuid456",
  "requestRef": "REQ-2025-0001",
  "title": "Q1 Access Review Evidence",
  "description": "Please provide evidence of quarterly access review completion",
  "evidenceType": "REPORT",
  "requiredFormat": "PDF",
  "acceptanceCriteria": "Must include review date, reviewer name, and findings",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2025-01-31T00:00:00Z",
  "assignedTo": {...},
  "requestedBy": {...},
  "contextType": "Control",
  "contextId": "ctrl123",
  "contextRef": "A.9.2.5",
  "fulfillments": [...]
}
```

---

### Create Evidence Request

```http
POST /api/evidence-requests
```

**Request Body:**

```json
{
  "title": "Vendor SOC 2 Report",
  "description": "Please provide the latest SOC 2 Type II report",
  "evidenceType": "REPORT",
  "requiredFormat": "PDF",
  "acceptanceCriteria": "Must be dated within last 12 months",
  "priority": "HIGH",
  "dueDate": "2025-02-28T00:00:00Z",
  "assignedToId": "user3",
  "contextType": "Vendor",
  "contextId": "vendor123",
  "contextRef": "VND-001",
  "requestedById": "user1",
  "createdById": "user1"
}
```

---

### Update Evidence Request

```http
PUT /api/evidence-requests/:id
```

**Request Body:** Partial request object.

---

### Delete Evidence Request

```http
DELETE /api/evidence-requests/:id
```

---

## Evidence Request Workflow Endpoints

### Start Progress

Marks request as in progress.

```http
POST /api/evidence-requests/:id/start-progress
```

**Response:** Request with status `IN_PROGRESS`.

---

### Submit Evidence

Submits evidence to fulfill request.

```http
POST /api/evidence-requests/:id/submit
```

**Request Body:**

```json
{
  "evidenceId": "cuid123",
  "userId": "user3",
  "notes": "Attached the latest SOC 2 report"
}
```

**Response:** Request with status `SUBMITTED`, creates fulfillment link.

---

### Accept Submission

Accepts the submitted evidence.

```http
POST /api/evidence-requests/:id/accept
```

**Response:** Request with status `ACCEPTED`.

---

### Reject Submission

Rejects the submitted evidence.

```http
POST /api/evidence-requests/:id/reject
```

**Request Body:**

```json
{
  "reason": "Report is older than 12 months, please provide current report"
}
```

**Response:** Request with status `REJECTED`.

---

### Cancel Request

Cancels an evidence request.

```http
POST /api/evidence-requests/:id/cancel
```

**Response:** Request with status `CANCELLED`.

---

## Evidence Link Endpoints

### Link Evidence to Entity

Creates a link between evidence and another entity.

```http
POST /api/evidence-links
```

**Request Body:**

```json
{
  "evidenceId": "cuid123",
  "entityType": "control",
  "entityId": "ctrl456",
  "linkType": "operating",
  "notes": "Monthly access review logs",
  "createdById": "user1"
}
```

**Supported Entity Types:**

| Entity Type | Description | Link Types |
|-------------|-------------|------------|
| `control` | Control | design, implementation, operating, general |
| `capability` | Capability | maturity, assessment, general |
| `test` | Effectiveness Test | test_result |
| `nonconformity` | Nonconformity | finding, root_cause, cap_implementation, verification |
| `incident` | Incident | forensic, communication, notification, lessons_learned |
| `risk` | Risk | assessment, acceptance, monitoring |
| `treatment` | Treatment Plan | implementation, approval, progress |
| `policy` | Policy Document | supporting, appendix, acknowledgment |
| `vendor` | Vendor | certification, soc_report, assessment, contract |
| `assessment` | Vendor Assessment | response, finding, remediation |
| `contract` | Vendor Contract | signed_contract, amendment, sla |
| `asset` | Asset | configuration, vulnerability_scan, backup_verification |
| `change` | Change | approval, test_result, pir |
| `application` | Application | security_assessment, pentest, configuration |
| `isra` | Application ISRA | bia, tva, srl |

**Response:**

```json
{
  "id": "link789",
  "evidenceId": "cuid123",
  "controlId": "ctrl456",
  "linkType": "operating",
  "notes": "Monthly access review logs",
  "createdAt": "2025-01-20T10:00:00Z"
}
```

---

### Unlink Evidence from Entity

Removes a link between evidence and entity.

```http
DELETE /api/evidence-links?evidenceId=cuid123&entityType=control&entityId=ctrl456
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `evidenceId` | string | Yes | Evidence ID |
| `entityType` | string | Yes | Entity type |
| `entityId` | string | Yes | Entity ID |

---

### Get Evidence for Entity

Retrieves all evidence linked to a specific entity.

```http
GET /api/evidence-links/entity/:entityType/:entityId
```

**Example:**

```http
GET /api/evidence-links/entity/control/ctrl456
```

**Response:**

```json
{
  "items": [
    {
      "id": "link789",
      "linkType": "operating",
      "notes": "Monthly access review logs",
      "evidence": {
        "id": "cuid123",
        "evidenceRef": "EVD-2025-0001",
        "title": "Access Review Report",
        "evidenceType": "REPORT",
        "status": "APPROVED"
      }
    }
  ],
  "count": 3
}
```

---

### Bulk Link Evidence

Links multiple evidence records to a single entity.

```http
POST /api/evidence-links/bulk
```

**Request Body:**

```json
{
  "evidenceIds": ["cuid123", "cuid124", "cuid125"],
  "entityType": "incident",
  "entityId": "inc789",
  "linkType": "forensic",
  "createdById": "user1"
}
```

**Response:**

```json
{
  "linked": 3,
  "links": [...]
}
```

---

## Evidence Migration Endpoints

### Run Full Migration

Migrates all legacy evidence to central repository.

```http
POST /api/evidence-migration/run?dryRun=true
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dryRun` | boolean | true | If true, only simulate |

**Response:**

```json
{
  "incidentEvidence": {
    "migratedCount": 25,
    "skippedCount": 0,
    "errors": []
  },
  "documentAttachments": {
    "migratedCount": 150,
    "skippedCount": 5,
    "errors": []
  },
  "vendorDocuments": {
    "migratedCount": 80,
    "skippedCount": 2,
    "errors": []
  }
}
```

---

### Migrate Incident Evidence

Migrates only IncidentEvidence records.

```http
POST /api/evidence-migration/incident-evidence?dryRun=true
```

---

### Migrate Document Attachments

Migrates only DocumentAttachment records.

```http
POST /api/evidence-migration/document-attachments?dryRun=true
```

---

### Migrate Vendor Documents

Migrates only VendorDocument records.

```http
POST /api/evidence-migration/vendor-documents?dryRun=true
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
    { "field": "evidenceType", "message": "Invalid evidence type" }
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
| 409 | Conflict (e.g., duplicate link) |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/evidence?skip=20&take=10
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
GET /api/evidence?status=APPROVED&evidenceType=CERTIFICATE&classification=INTERNAL
```

---

## Date Formats

All dates should be in ISO 8601 format:

```
2025-01-20T10:30:00Z
2025-01-20T10:30:00.000Z
2025-01-20
```







