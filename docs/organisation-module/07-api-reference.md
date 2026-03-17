# API Reference

This document provides a reference for the Organisation Module API endpoints, enabling integration with external systems and custom development.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Endpoints by Entity](#endpoints-by-entity)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## API Overview

### Base URL

```
/api/organisation
```

### HTTP Methods

| Method | Purpose |
|--------|---------|
| GET | Retrieve resources |
| POST | Create new resources |
| PUT | Update existing resources |
| DELETE | Remove resources |

### Response Format

All responses are JSON with the following structure:

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description of the error",
    "details": { ... }
  }
}
```

---

## Authentication

All API requests require authentication via session cookie or Bearer token.

### Session Authentication
```
Cookie: session=<session_token>
```

### Bearer Token
```
Authorization: Bearer <access_token>
```

---

## Common Patterns

### Pagination

```
GET /api/organisation/departments?page=1&limit=20
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

### Filtering

```
GET /api/organisation/departments?isActive=true&criticalityLevel=high
```

### Sorting

```
GET /api/organisation/departments?sortBy=name&sortOrder=asc
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| sortBy | field name | Field to sort by |
| sortOrder | asc, desc | Sort direction |

### Including Relations

```
GET /api/organisation/departments?include=departmentHead,members
```

---

## Endpoints by Entity

### Organisation Profile

#### Get Organisation Profile
```
GET /api/organisation/profile
```

**Response:**
```json
{
  "id": "clx...",
  "name": "Acme Corporation",
  "legalName": "Acme Corporation Ltd",
  "ismsScope": "...",
  "ismsPolicy": "...",
  "isoCertificationStatus": "certified",
  ...
}
```

#### Update Organisation Profile
```
PUT /api/organisation/profile
Content-Type: application/json

{
  "name": "Acme Corporation",
  "ismsScope": "Updated scope statement..."
}
```

---

### Departments

#### List Departments
```
GET /api/organisation/departments
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| parentId | string | Filter by parent department |
| criticalityLevel | string | Filter by criticality |

#### Get Department
```
GET /api/organisation/departments/:id
```

#### Create Department
```
POST /api/organisation/departments
Content-Type: application/json

{
  "name": "Information Security",
  "departmentCode": "IT-SEC",
  "parentId": "clx...",
  "departmentHeadId": "clx...",
  "criticalityLevel": "high"
}
```

#### Update Department
```
PUT /api/organisation/departments/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "headcount": 25
}
```

#### Delete Department
```
DELETE /api/organisation/departments/:id
```

---

### Department Members

#### List Department Members
```
GET /api/organisation/departments/:departmentId/members
```

#### Add Department Member
```
POST /api/organisation/departments/:departmentId/members
Content-Type: application/json

{
  "userId": "clx..."
}
```

#### Remove Department Member
```
DELETE /api/organisation/departments/:departmentId/members/:userId
```

---

### Locations

#### List Locations
```
GET /api/organisation/locations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| inIsmsScope | boolean | Filter by ISMS scope |
| locationType | string | Filter by type |
| country | string | Filter by country |

#### Get Location
```
GET /api/organisation/locations/:id
```

#### Create Location
```
POST /api/organisation/locations
Content-Type: application/json

{
  "name": "London Headquarters",
  "locationCode": "LOC-HQ",
  "locationType": "headquarters",
  "address": "123 Tech Street",
  "city": "London",
  "country": "United Kingdom",
  "inIsmsScope": true
}
```

#### Update Location
```
PUT /api/organisation/locations/:id
```

#### Delete Location
```
DELETE /api/organisation/locations/:id
```

---

### Organisational Units

#### List Organisational Units
```
GET /api/organisation/organisational-units
```

#### Get Organisational Unit
```
GET /api/organisation/organisational-units/:id
```

#### Create Organisational Unit
```
POST /api/organisation/organisational-units
Content-Type: application/json

{
  "name": "Cloud Services Division",
  "code": "CSD",
  "unitType": "division",
  "headId": "clx..."
}
```

#### Update Organisational Unit
```
PUT /api/organisation/organisational-units/:id
```

#### Delete Organisational Unit
```
DELETE /api/organisation/organisational-units/:id
```

---

### Executive Positions

#### List Executive Positions
```
GET /api/organisation/executive-positions
```

#### Get Executive Position
```
GET /api/organisation/executive-positions/:id
```

#### Create Executive Position
```
POST /api/organisation/executive-positions
Content-Type: application/json

{
  "title": "Chief Information Security Officer",
  "executiveLevel": "c-level",
  "personId": "clx...",
  "reportsToId": "clx...",
  "securityResponsibilities": "Overall security strategy..."
}
```

#### Update Executive Position
```
PUT /api/organisation/executive-positions/:id
```

#### Delete Executive Position
```
DELETE /api/organisation/executive-positions/:id
```

---

### Key Personnel

#### List Key Personnel
```
GET /api/organisation/key-personnel
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| ismsRole | string | Filter by ISMS role |

#### Get Key Personnel
```
GET /api/organisation/key-personnel/:id
```

#### Create Key Personnel
```
POST /api/organisation/key-personnel
Content-Type: application/json

{
  "personCode": "PERS-CISO",
  "name": "John Smith",
  "jobTitle": "Chief Information Security Officer",
  "ismsRole": "CISO",
  "securityResponsibilities": "...",
  "userId": "clx..."
}
```

#### Update Key Personnel
```
PUT /api/organisation/key-personnel/:id
```

#### Delete Key Personnel
```
DELETE /api/organisation/key-personnel/:id
```

---

### Security Champions

#### List Security Champions
```
GET /api/organisation/security-champions
```

#### Get Security Champion
```
GET /api/organisation/security-champions/:id
```

#### Create Security Champion
```
POST /api/organisation/security-champions
Content-Type: application/json

{
  "userId": "clx...",
  "departmentId": "clx...",
  "championLevel": "senior",
  "responsibilities": "..."
}
```

#### Update Security Champion
```
PUT /api/organisation/security-champions/:id
```

#### Delete Security Champion
```
DELETE /api/organisation/security-champions/:id
```

---

### Business Processes

#### List Business Processes
```
GET /api/organisation/business-processes
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| processType | string | Filter by type (core, support, management) |
| criticalityLevel | string | Filter by criticality |
| departmentId | string | Filter by department |

#### Get Business Process
```
GET /api/organisation/business-processes/:id
```

#### Create Business Process
```
POST /api/organisation/business-processes
Content-Type: application/json

{
  "name": "Software Development",
  "processCode": "PROC-DEV",
  "processType": "core",
  "criticalityLevel": "high",
  "processOwnerId": "clx...",
  "departmentId": "clx...",
  "bcpEnabled": true,
  "recoveryTimeObjectiveMinutes": 240
}
```

#### Update Business Process
```
PUT /api/organisation/business-processes/:id
```

#### Delete Business Process
```
DELETE /api/organisation/business-processes/:id
```

---

### External Dependencies

#### List External Dependencies
```
GET /api/organisation/external-dependencies
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| dependencyType | string | Filter by type |
| criticalityLevel | string | Filter by criticality |
| riskRating | string | Filter by risk rating |

#### Get External Dependency
```
GET /api/organisation/external-dependencies/:id
```

#### Create External Dependency
```
POST /api/organisation/external-dependencies
Content-Type: application/json

{
  "name": "AWS",
  "dependencyType": "cloud_provider",
  "criticalityLevel": "critical",
  "contractReference": "AWS-2024-001",
  "contractStart": "2024-01-01",
  "contractEnd": "2026-12-31"
}
```

#### Update External Dependency
```
PUT /api/organisation/external-dependencies/:id
```

#### Delete External Dependency
```
DELETE /api/organisation/external-dependencies/:id
```

---

### Regulators

#### List Regulators
```
GET /api/organisation/regulators
```

#### Get Regulator
```
GET /api/organisation/regulators/:id
```

#### Create Regulator
```
POST /api/organisation/regulators
Content-Type: application/json

{
  "name": "Information Commissioner's Office",
  "regulatorCode": "ICO",
  "regulatoryType": "data_protection",
  "jurisdiction": "United Kingdom"
}
```

#### Update Regulator
```
PUT /api/organisation/regulators/:id
```

#### Delete Regulator
```
DELETE /api/organisation/regulators/:id
```

---

### Security Committees

#### List Security Committees
```
GET /api/organisation/security-committees
```

#### Get Security Committee
```
GET /api/organisation/security-committees/:id
```

#### Create Security Committee
```
POST /api/organisation/security-committees
Content-Type: application/json

{
  "name": "Information Security Steering Committee",
  "committeeType": "steering",
  "chairId": "clx...",
  "meetingFrequency": "monthly"
}
```

#### Update Security Committee
```
PUT /api/organisation/security-committees/:id
```

#### Delete Security Committee
```
DELETE /api/organisation/security-committees/:id
```

---

### Committee Memberships

#### List Committee Memberships
```
GET /api/organisation/security-committees/:committeeId/memberships
```

#### Add Committee Member
```
POST /api/organisation/security-committees/:committeeId/memberships
Content-Type: application/json

{
  "userId": "clx...",
  "role": "member",
  "hasVotingRights": true
}
```

#### Update Committee Membership
```
PUT /api/organisation/committee-memberships/:id
```

#### Remove Committee Member
```
DELETE /api/organisation/committee-memberships/:id
```

---

### Committee Meetings

#### List Committee Meetings
```
GET /api/organisation/committee-meetings
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| committeeId | string | Filter by committee |
| status | string | Filter by status |
| fromDate | date | Filter from date |
| toDate | date | Filter to date |

#### Get Committee Meeting
```
GET /api/organisation/committee-meetings/:id
```

#### Create Committee Meeting
```
POST /api/organisation/committee-meetings
Content-Type: application/json

{
  "committeeId": "clx...",
  "title": "Monthly Security Review",
  "meetingType": "regular",
  "meetingDate": "2024-12-15",
  "startTime": "10:00",
  "endTime": "11:30",
  "locationType": "virtual",
  "virtualMeetingLink": "https://..."
}
```

#### Update Committee Meeting
```
PUT /api/organisation/committee-meetings/:id
```

#### Delete Committee Meeting
```
DELETE /api/organisation/committee-meetings/:id
```

---

### Meeting Attendances

#### List Meeting Attendances
```
GET /api/organisation/committee-meetings/:meetingId/attendances
```

#### Record Attendance
```
POST /api/organisation/committee-meetings/:meetingId/attendances
Content-Type: application/json

{
  "memberId": "clx...",
  "attendanceStatus": "present",
  "arrivalTime": "10:00"
}
```

#### Update Attendance
```
PUT /api/organisation/meeting-attendances/:id
```

---

### Meeting Decisions

#### List Meeting Decisions
```
GET /api/organisation/meeting-decisions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| meetingId | string | Filter by meeting |
| decisionType | string | Filter by type |
| implemented | boolean | Filter by implementation status |

#### Get Meeting Decision
```
GET /api/organisation/meeting-decisions/:id
```

#### Create Meeting Decision
```
POST /api/organisation/meeting-decisions
Content-Type: application/json

{
  "meetingId": "clx...",
  "title": "Approve Security Policy Update",
  "description": "...",
  "decisionType": "policy",
  "voteType": "unanimous",
  "votesFor": 8,
  "votesAgainst": 0,
  "responsiblePartyId": "clx...",
  "implementationDeadline": "2024-12-31"
}
```

#### Update Meeting Decision
```
PUT /api/organisation/meeting-decisions/:id
```

#### Delete Meeting Decision
```
DELETE /api/organisation/meeting-decisions/:id
```

---

### Meeting Action Items

#### List Action Items
```
GET /api/organisation/action-items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| meetingId | string | Filter by meeting |
| assignedToId | string | Filter by assignee |
| status | string | Filter by status |
| priority | string | Filter by priority |
| overdue | boolean | Filter overdue items |

#### Get Action Item
```
GET /api/organisation/action-items/:id
```

#### Create Action Item
```
POST /api/organisation/action-items
Content-Type: application/json

{
  "meetingId": "clx...",
  "title": "Update access control policy",
  "description": "...",
  "assignedToId": "clx...",
  "priority": "high",
  "dueDate": "2024-12-31"
}
```

#### Update Action Item
```
PUT /api/organisation/action-items/:id
Content-Type: application/json

{
  "status": "completed",
  "completionDate": "2024-12-20",
  "completionNotes": "Policy updated and published"
}
```

#### Delete Action Item
```
DELETE /api/organisation/action-items/:id
```

---

### Interested Parties

#### List Interested Parties
```
GET /api/organisation/interested-parties
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| partyType | string | Filter by type |
| powerLevel | string | Filter by power level |
| interestLevel | string | Filter by interest level |

#### Get Interested Party
```
GET /api/organisation/interested-parties/:id
```

#### Create Interested Party
```
POST /api/organisation/interested-parties
Content-Type: application/json

{
  "partyCode": "STKH-CUST-001",
  "name": "Enterprise Customers",
  "partyType": "customer",
  "expectations": "...",
  "requirements": "...",
  "powerLevel": "high",
  "interestLevel": "high"
}
```

#### Update Interested Party
```
PUT /api/organisation/interested-parties/:id
```

#### Delete Interested Party
```
DELETE /api/organisation/interested-parties/:id
```

---

### Context Issues

#### List Context Issues
```
GET /api/organisation/context-issues
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| issueType | string | Filter by type (internal, external) |
| category | string | Filter by category |
| impactLevel | string | Filter by impact |
| status | string | Filter by status |
| trendDirection | string | Filter by trend |

#### Get Context Issue
```
GET /api/organisation/context-issues/:id
```

#### Create Context Issue
```
POST /api/organisation/context-issues
Content-Type: application/json

{
  "issueCode": "CTX-EXT-001",
  "issueType": "external",
  "category": "regulatory",
  "title": "New Data Protection Regulation",
  "description": "...",
  "impactLevel": "high",
  "ismsRelevance": "...",
  "monitoringFrequency": "quarterly"
}
```

#### Update Context Issue
```
PUT /api/organisation/context-issues/:id
```

#### Delete Context Issue
```
DELETE /api/organisation/context-issues/:id
```

---

### Products & Services

#### List Products/Services
```
GET /api/organisation/products-services
```

#### Get Product/Service
```
GET /api/organisation/products-services/:id
```

#### Create Product/Service
```
POST /api/organisation/products-services
Content-Type: application/json

{
  "productCode": "PROD-001",
  "name": "Cloud Platform",
  "productType": "saas",
  "inIsmsScope": true
}
```

#### Update Product/Service
```
PUT /api/organisation/products-services/:id
```

#### Delete Product/Service
```
DELETE /api/organisation/products-services/:id
```

---

### Technology Platforms

#### List Technology Platforms
```
GET /api/organisation/technology-platforms
```

#### Get Technology Platform
```
GET /api/organisation/technology-platforms/:id
```

#### Create Technology Platform
```
POST /api/organisation/technology-platforms
Content-Type: application/json

{
  "platformCode": "PLAT-001",
  "name": "AWS Cloud Infrastructure",
  "platformType": "cloud",
  "criticalityLevel": "critical",
  "inIsmsScope": true
}
```

#### Update Technology Platform
```
PUT /api/organisation/technology-platforms/:id
```

#### Delete Technology Platform
```
DELETE /api/organisation/technology-platforms/:id
```

---

### Applicable Frameworks

#### List Applicable Frameworks
```
GET /api/organisation/applicable-frameworks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isApplicable | boolean | Filter by applicability |
| frameworkType | string | Filter by type |
| complianceStatus | string | Filter by compliance status |

#### Get Applicable Framework
```
GET /api/organisation/applicable-frameworks/:id
```

#### Create Applicable Framework
```
POST /api/organisation/applicable-frameworks
Content-Type: application/json

{
  "frameworkCode": "ISO27001",
  "name": "ISO/IEC 27001:2022",
  "frameworkType": "standard",
  "version": "2022",
  "isApplicable": true,
  "isCertifiable": true
}
```

#### Update Applicable Framework
```
PUT /api/organisation/applicable-frameworks/:id
```

#### Delete Applicable Framework
```
DELETE /api/organisation/applicable-frameworks/:id
```

---

### Regulatory Eligibility Surveys

#### List Surveys
```
GET /api/organisation/regulatory-eligibility-surveys
```

#### Get Survey
```
GET /api/organisation/regulatory-eligibility-surveys/:id
```

#### Create Survey
```
POST /api/organisation/regulatory-eligibility-surveys
Content-Type: application/json

{
  "surveyType": "GDPR",
  "surveyVersion": "1.0"
}
```

#### Submit Survey Response
```
POST /api/organisation/regulatory-eligibility-surveys/:id/responses
Content-Type: application/json

{
  "questionId": "clx...",
  "answer": "yes",
  "notes": "..."
}
```

#### Complete Survey
```
POST /api/organisation/regulatory-eligibility-surveys/:id/complete
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| INTERNAL_ERROR | 500 | Server error |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "name": "Name is required",
        "departmentCode": "Code must be unique"
      }
    }
  }
}
```

---

## Examples

### Create Complete Department Structure

```javascript
// 1. Create parent department
const itDept = await fetch('/api/organisation/departments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Information Technology',
    departmentCode: 'IT',
    criticalityLevel: 'high'
  })
});

// 2. Create child department
const secDept = await fetch('/api/organisation/departments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Security Operations',
    departmentCode: 'IT-SEC',
    parentId: itDept.data.id,
    criticalityLevel: 'critical'
  })
});

// 3. Assign department head
await fetch(`/api/organisation/departments/${secDept.data.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    departmentHeadId: 'user-id-here'
  })
});
```

### Schedule and Conduct Meeting

```javascript
// 1. Create meeting
const meeting = await fetch('/api/organisation/committee-meetings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    committeeId: 'committee-id',
    title: 'Monthly Security Review',
    meetingDate: '2024-12-15',
    startTime: '10:00',
    endTime: '11:30'
  })
});

// 2. Record attendance
await fetch(`/api/organisation/committee-meetings/${meeting.data.id}/attendances`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: 'member-id',
    attendanceStatus: 'present'
  })
});

// 3. Record decision
await fetch('/api/organisation/meeting-decisions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meetingId: meeting.data.id,
    title: 'Approve Q1 Security Budget',
    decisionType: 'resource',
    votesFor: 5,
    votesAgainst: 0
  })
});

// 4. Create action item
await fetch('/api/organisation/action-items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meetingId: meeting.data.id,
    title: 'Implement approved budget allocations',
    assignedToId: 'user-id',
    priority: 'high',
    dueDate: '2024-12-31'
  })
});
```

### Track Context Issue Lifecycle

```javascript
// 1. Create issue
const issue = await fetch('/api/organisation/context-issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    issueCode: 'CTX-EXT-001',
    issueType: 'external',
    category: 'regulatory',
    title: 'New Privacy Regulation',
    impactLevel: 'high',
    monitoringFrequency: 'monthly'
  })
});

// 2. Update after review
await fetch(`/api/organisation/context-issues/${issue.data.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lastReviewDate: new Date().toISOString(),
    nextReviewDate: '2025-01-15',
    trendDirection: 'stable'
  })
});

// 3. Escalate to risk
await fetch(`/api/organisation/context-issues/${issue.data.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escalatedToRisk: true,
    linkedRiskId: 'risk-id-from-risk-module'
  })
});
```
