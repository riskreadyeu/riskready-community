# Policy Module - API Reference

**Version**: 2.0  
**Base URL**: `/api/policies`  
**Authentication**: JWT Bearer Token (Required)

---

## 1. Policy Documents

### 1.1 List Documents

```http
GET /api/policies
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organisationId` | string | Required. Organisation ID |
| `skip` | number | Pagination offset (default: 0) |
| `take` | number | Page size (default: 25, max: 100) |
| `documentType` | string | Filter by type (POLICY, STANDARD, etc.) |
| `status` | string | Filter by status (DRAFT, PUBLISHED, etc.) |
| `classification` | string | Filter by classification |
| `search` | string | Search in title, ID, content |
| `parentId` | string | Filter by parent document |

**Response:**

```json
{
  "data": [
    {
      "id": "clx123...",
      "documentId": "POL-002",
      "title": "Information Risk Management Policy",
      "documentType": "POLICY",
      "classification": "INTERNAL",
      "status": "PUBLISHED",
      "version": "1.0",
      "documentOwner": "Chief Information Security Officer",
      "effectiveDate": "2025-01-15T00:00:00Z",
      "nextReviewDate": "2026-01-15T00:00:00Z",
      "createdAt": "2025-01-10T10:00:00Z",
      "updatedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "total": 45,
  "skip": 0,
  "take": 25
}
```

---

### 1.2 Get Document

```http
GET /api/policies/:id
```

**Response:**

```json
{
  "id": "clx123...",
  "documentId": "POL-002",
  "title": "Information Risk Management Policy",
  "shortTitle": "Risk Management Policy",
  "documentType": "POLICY",
  "classification": "INTERNAL",
  "distribution": ["All employees", "Contractors"],
  "purpose": "This policy establishes the framework...",
  "scope": "This policy applies to...",
  "content": "# Information Risk Management Policy\n\n...",
  "summary": "Comprehensive risk management framework...",
  "documentOwner": "Chief Information Security Officer",
  "author": "Information Security Team",
  "approvedBy": "CEO",
  "version": "1.0",
  "majorVersion": 1,
  "minorVersion": 0,
  "status": "PUBLISHED",
  "approvalLevel": "EXECUTIVE",
  "approvalDate": "2025-01-15T00:00:00Z",
  "reviewFrequency": "ANNUAL",
  "lastReviewDate": null,
  "nextReviewDate": "2026-01-15T00:00:00Z",
  "effectiveDate": "2025-01-15T00:00:00Z",
  "tags": ["risk-management", "iso-27001"],
  "keywords": ["risk assessment", "risk treatment"],
  "parentDocument": null,
  "childDocuments": [
    { "id": "clx456...", "documentId": "STD-002-01", "title": "..." }
  ],
  "owner": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

---

### 1.3 Create Document

```http
POST /api/policies
```

**Request Body:**

```json
{
  "documentId": "POL-015",
  "title": "Data Protection Policy",
  "documentType": "POLICY",
  "classification": "CONFIDENTIAL",
  "distribution": ["All employees"],
  "purpose": "This policy establishes...",
  "scope": "This policy applies to...",
  "content": "# Data Protection Policy\n\n...",
  "documentOwner": "Data Protection Officer",
  "author": "Privacy Team",
  "approvalLevel": "EXECUTIVE",
  "reviewFrequency": "ANNUAL",
  "tags": ["data-protection", "privacy"],
  "parentDocumentId": null,
  "organisationId": "org123"
}
```

**Response:** Created document object (201)

---

### 1.4 Update Document

```http
PUT /api/policies/:id
```

**Request Body:** Partial document object

**Response:** Updated document object

---

### 1.5 Update Status

```http
PUT /api/policies/:id/status
```

**Request Body:**

```json
{
  "status": "PUBLISHED",
  "userId": "user123"
}
```

---

### 1.6 Delete Document

```http
DELETE /api/policies/:id?hard=false
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `hard` | boolean | Hard delete (default: false for soft delete) |

---

## 2. Approval Workflows

### 2.1 Get Current Workflow

```http
GET /api/policies/:documentId/workflow/current
```

**Response:**

```json
{
  "id": "wf123",
  "documentId": "clx123",
  "workflowType": "NEW_DOCUMENT",
  "status": "IN_PROGRESS",
  "currentStepOrder": 2,
  "totalSteps": 3,
  "initiatedBy": { "id": "user1", "firstName": "John" },
  "initiatedAt": "2025-01-10T10:00:00Z",
  "steps": [
    {
      "id": "step1",
      "stepOrder": 1,
      "stepName": "Manager Review",
      "approverRole": "MANAGEMENT",
      "status": "APPROVED",
      "decision": "APPROVE",
      "completedAt": "2025-01-11T14:00:00Z"
    },
    {
      "id": "step2",
      "stepOrder": 2,
      "stepName": "CISO Approval",
      "approverRole": "SENIOR_MANAGEMENT",
      "status": "IN_REVIEW",
      "decision": null
    },
    {
      "id": "step3",
      "stepOrder": 3,
      "stepName": "Executive Sign-off",
      "approverRole": "EXECUTIVE",
      "status": "PENDING"
    }
  ]
}
```

---

### 2.2 Create Workflow

```http
POST /api/policies/:documentId/workflows
```

**Request Body:**

```json
{
  "workflowType": "NEW_DOCUMENT",
  "steps": [
    {
      "stepOrder": 1,
      "stepName": "Manager Review",
      "approverRole": "MANAGEMENT",
      "dueDate": "2025-01-20"
    },
    {
      "stepOrder": 2,
      "stepName": "CISO Approval",
      "approverId": "user456",
      "dueDate": "2025-01-25"
    }
  ],
  "initiatedById": "user123",
  "comments": "Submitting for initial approval"
}
```

**Workflow Types:**

| Type | Description |
|------|-------------|
| `NEW_DOCUMENT` | New document approval |
| `REVISION` | Document revision approval |
| `REVIEW` | Periodic review approval |
| `EXCEPTION` | Exception approval |

---

### 2.3 Process Approval Step

```http
POST /api/policies/workflows/steps/:stepId/process
```

**Request Body:**

```json
{
  "decision": "APPROVE",
  "comments": "Reviewed and approved. Good content.",
  "signature": "base64-signature-data",
  "userId": "user456"
}
```

**Decisions:**

| Decision | Description |
|----------|-------------|
| `APPROVE` | Approve and move to next step |
| `REJECT` | Reject workflow |
| `REQUEST_CHANGES` | Request modifications |
| `DELEGATE` | Delegate to another user |

---

### 2.4 Delegate Step

```http
POST /api/policies/workflows/steps/:stepId/delegate
```

**Request Body:**

```json
{
  "delegatedToId": "user789",
  "userId": "user456"
}
```

---

### 2.5 Cancel Workflow

```http
POST /api/policies/workflows/:id/cancel
```

**Request Body:**

```json
{
  "userId": "user123"
}
```

---

### 2.6 Get Pending Approvals

```http
GET /api/policies/approvals/pending?userId=user123
```

**Response:** Array of pending approval steps for the user

---

## 3. Document Versions

### 3.1 List Versions

```http
GET /api/policies/:documentId/versions
```

**Response:**

```json
[
  {
    "id": "ver123",
    "version": "1.0",
    "majorVersion": 1,
    "minorVersion": 0,
    "changeType": "INITIAL",
    "changeDescription": "Initial document creation",
    "createdAt": "2025-01-15T10:00:00Z",
    "createdBy": { "firstName": "John", "lastName": "Smith" }
  }
]
```

---

### 3.2 Get Version

```http
GET /api/policies/versions/:versionId
```

---

### 3.3 Create Version

```http
POST /api/policies/:documentId/versions
```

**Request Body:**

```json
{
  "content": "Updated content...",
  "changeType": "MINOR_UPDATE",
  "changeDescription": "Updated section 3.2",
  "changeSummary": "Clarified risk assessment process",
  "changeReason": "Audit finding",
  "createdById": "user123"
}
```

---

### 3.4 Compare Versions

```http
GET /api/policies/:documentId/versions/compare?from=1.0&to=2.0
```

---

## 4. Document Reviews

### 4.1 List Reviews

```http
GET /api/policies/:documentId/reviews
```

---

### 4.2 Create Review

```http
POST /api/policies/:documentId/reviews
```

**Request Body:**

```json
{
  "reviewType": "SCHEDULED",
  "outcome": "NO_CHANGES",
  "findings": "Document is current and accurate",
  "recommendations": "Continue annual review cycle",
  "changesRequired": false,
  "reviewedById": "user123"
}
```

**Review Outcomes:**

| Outcome | Description |
|---------|-------------|
| `NO_CHANGES` | Document is current |
| `MINOR_CHANGES` | Minor updates needed |
| `MAJOR_CHANGES` | Significant revision required |
| `SUPERSEDE` | Replace with new document |
| `RETIRE` | Document no longer needed |

---

### 4.3 Complete Review

```http
PUT /api/policies/reviews/:id/complete
```

---

## 5. Acknowledgments

### 5.1 List Acknowledgments

```http
GET /api/policies/:documentId/acknowledgments
```

---

### 5.2 Request Acknowledgments

```http
POST /api/policies/:documentId/acknowledgments/request
```

**Request Body:**

```json
{
  "userIds": ["user1", "user2", "user3"],
  "dueDate": "2025-02-01",
  "message": "Please review and acknowledge this policy"
}
```

---

### 5.3 Acknowledge Document

```http
POST /api/policies/acknowledgments/:id/acknowledge
```

**Request Body:**

```json
{
  "userId": "user123"
}
```

---

### 5.4 Send Reminder

```http
POST /api/policies/acknowledgments/:id/remind
```

---

## 6. Exceptions

### 6.1 List Exceptions

```http
GET /api/policies/exceptions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | string | Filter by document |
| `status` | string | Filter by status |

---

### 6.2 Create Exception

```http
POST /api/policies/:documentId/exceptions
```

**Request Body:**

```json
{
  "title": "Temporary exemption from encryption requirement",
  "description": "Legacy system cannot support encryption...",
  "justification": "Migration planned for Q2 2025...",
  "riskAssessment": "Compensating controls in place...",
  "compensatingControls": "Network segmentation, enhanced monitoring",
  "startDate": "2025-01-15",
  "endDate": "2025-06-30",
  "requestedById": "user123"
}
```

---

### 6.3 Approve Exception

```http
POST /api/policies/exceptions/:id/approve
```

**Request Body:**

```json
{
  "approvedById": "user456",
  "approvalComments": "Approved with conditions..."
}
```

---

## 7. Change Requests

### 7.1 List Change Requests

```http
GET /api/policies/change-requests
```

---

### 7.2 Create Change Request

```http
POST /api/policies/:documentId/change-requests
```

**Request Body:**

```json
{
  "title": "Update risk assessment methodology",
  "description": "Align with new ISO 27005:2022 guidance",
  "justification": "Regulatory requirement",
  "changeType": "CONTENT",
  "priority": "HIGH",
  "impactAssessment": "Affects 3 related procedures",
  "affectedSections": ["Section 4.2", "Appendix A"],
  "requestedById": "user123"
}
```

---

### 7.3 Approve Change Request

```http
POST /api/policies/change-requests/:id/approve
```

---

### 7.4 Implement Change Request

```http
POST /api/policies/change-requests/:id/implement
```

---

## 8. Control Mappings

### 8.1 List Mappings

```http
GET /api/policies/:documentId/control-mappings
```

---

### 8.2 Create Mapping

```http
POST /api/policies/:documentId/control-mappings
```

**Request Body:**

```json
{
  "controlId": "ctrl123",
  "mappingType": "PRIMARY",
  "coverage": "FULL",
  "notes": "This policy fully implements the control"
}
```

---

### 8.3 Delete Mapping

```http
DELETE /api/policies/control-mappings/:id
```

---

## 9. Risk Mappings

### 9.1 List Risk Mappings

```http
GET /api/policies/:documentId/risk-mappings
```

---

### 9.2 Create Risk Mapping

```http
POST /api/policies/:documentId/risk-mappings
```

**Request Body:**

```json
{
  "riskId": "risk123",
  "mappingType": "ADDRESSES",
  "effectiveness": "HIGH",
  "notes": "Primary control for this risk"
}
```

---

## 10. Dashboard & Statistics

### 10.1 Get Dashboard Stats

```http
GET /api/policies/dashboard/stats?organisationId=org123
```

**Response:**

```json
{
  "totalDocuments": 89,
  "byStatus": {
    "DRAFT": 5,
    "PUBLISHED": 75,
    "UNDER_REVISION": 4,
    "RETIRED": 5
  },
  "byType": {
    "POLICY": 14,
    "STANDARD": 50,
    "PROCEDURE": 20,
    "OTHER": 5
  },
  "reviewsDue": 8,
  "pendingApprovals": 3,
  "pendingAcknowledgments": 45,
  "activeExceptions": 2
}
```

---

### 10.2 Get Reviews Due

```http
GET /api/policies/dashboard/reviews-due?days=30
```

---

### 10.3 Get Compliance Overview

```http
GET /api/policies/dashboard/compliance
```

---

## 11. Error Responses

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": "documentId",
    "issue": "Document ID already exists"
  }
}
```

**Common Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

*Next: [04-user-guide.md](./04-user-guide.md) - User guide for the module*








