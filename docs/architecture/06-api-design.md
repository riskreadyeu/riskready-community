# API Design

This document details the RESTful API design conventions, endpoint patterns, and request/response formats.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [URL Structure](#url-structure)
3. [HTTP Methods](#http-methods)
4. [Request Formats](#request-formats)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Pagination](#pagination)
8. [Filtering & Sorting](#filtering--sorting)

---

## API Overview

### Base URL

```
http://localhost:3000/api
```

### API Versioning

Currently, the API is unversioned. Future versions may use:
```
/api/v1/...
/api/v2/...
```

### Content Type

All requests and responses use JSON:
```
Content-Type: application/json
```

### Authentication

All protected endpoints require authentication via HTTP-only cookie:
```
Cookie: token=<JWT>
```

---

## URL Structure

### Resource Naming Conventions

| Convention | Example |
|------------|---------|
| Plural nouns | `/departments`, `/locations` |
| Lowercase | `/business-processes` |
| Hyphen-separated | `/external-dependencies` |
| Hierarchical | `/committees/:id/meetings` |

### URL Patterns

```
# Collection
GET    /api/{module}/{resource}

# Single resource
GET    /api/{module}/{resource}/:id

# Create
POST   /api/{module}/{resource}

# Update
PUT    /api/{module}/{resource}/:id

# Delete
DELETE /api/{module}/{resource}/:id

# Nested resources
GET    /api/{module}/{resource}/:id/{sub-resource}
POST   /api/{module}/{resource}/:id/{sub-resource}
```

### Module Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Authentication |
| Organisation | `/api/organisation` | Organisation management |
| Health | `/api/health` | Health checks |

---

## HTTP Methods

### Method Usage

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Update resource (full) | Yes | No |
| PATCH | Update resource (partial) | Yes | No |
| DELETE | Remove resource | Yes | No |

### Examples

```http
# List all departments
GET /api/organisation/departments

# Get single department
GET /api/organisation/departments/clx123abc

# Create department
POST /api/organisation/departments
Content-Type: application/json

{
  "name": "Information Technology",
  "departmentCode": "IT"
}

# Update department
PUT /api/organisation/departments/clx123abc
Content-Type: application/json

{
  "name": "IT Department",
  "description": "Updated description"
}

# Delete department
DELETE /api/organisation/departments/clx123abc
```

---

## Request Formats

### Create Request

```http
POST /api/organisation/departments
Content-Type: application/json

{
  "name": "Information Technology",
  "departmentCode": "IT",
  "description": "IT department responsible for technology",
  "parentId": null,
  "departmentHeadId": "clx456def",
  "criticalityLevel": "high",
  "headcount": 50,
  "budget": 1000000,
  "budgetCurrency": "USD"
}
```

### Update Request

```http
PUT /api/organisation/departments/clx123abc
Content-Type: application/json

{
  "name": "Information Technology Department",
  "description": "Updated description",
  "headcount": 55
}
```

### Query Parameters

```http
# Filtering
GET /api/organisation/departments?isActive=true&criticalityLevel=high

# Pagination
GET /api/organisation/departments?page=1&limit=20

# Sorting
GET /api/organisation/departments?sortBy=name&sortOrder=asc

# Search
GET /api/organisation/departments?search=technology

# Include relations
GET /api/organisation/departments?include=departmentHead,members
```

---

## Response Formats

### Success Response - Single Resource

```json
{
  "id": "clx123abc",
  "name": "Information Technology",
  "departmentCode": "IT",
  "description": "IT department",
  "parentId": null,
  "departmentHeadId": "clx456def",
  "criticalityLevel": "high",
  "headcount": 50,
  "isActive": true,
  "createdAt": "2024-12-15T10:00:00.000Z",
  "updatedAt": "2024-12-15T10:00:00.000Z",
  "createdById": "clx789ghi",
  "updatedById": "clx789ghi",
  "departmentHead": {
    "id": "clx456def",
    "name": "John Smith",
    "email": "john@example.com"
  }
}
```

### Success Response - Collection

```json
{
  "data": [
    {
      "id": "clx123abc",
      "name": "Information Technology",
      "departmentCode": "IT",
      ...
    },
    {
      "id": "clx456def",
      "name": "Finance",
      "departmentCode": "FIN",
      ...
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Success Response - Create

```json
// HTTP 201 Created
{
  "id": "clx123abc",
  "name": "Information Technology",
  "departmentCode": "IT",
  ...
  "createdAt": "2024-12-15T10:00:00.000Z"
}
```

### Success Response - Update

```json
// HTTP 200 OK
{
  "id": "clx123abc",
  "name": "Updated Name",
  ...
  "updatedAt": "2024-12-15T11:00:00.000Z"
}
```

### Success Response - Delete

```json
// HTTP 200 OK
{
  "message": "Department deleted successfully"
}

// Or HTTP 204 No Content (no body)
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    },
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

### HTTP Status Codes

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

### Error Examples

#### 400 Bad Request
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request body",
    "details": {
      "body": "Request body must be valid JSON"
    },
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

#### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Department with id 'clx123abc' not found",
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

#### 409 Conflict
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Department with code 'IT' already exists",
    "details": {
      "field": "departmentCode",
      "value": "IT"
    },
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

#### 422 Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "name": "Name is required",
        "departmentCode": "Code must be at least 2 characters",
        "headcount": "Headcount must be a positive number"
      }
    },
    "timestamp": "2024-12-15T10:00:00.000Z"
  }
}
```

---

## Pagination

### Request

```http
GET /api/organisation/departments?page=2&limit=20
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 20 | Items per page (max: 100) |

### Response

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### Implementation

```typescript
// Service
async getDepartments(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100

  const [data, total] = await Promise.all([
    this.prisma.department.findMany({
      skip,
      take,
      orderBy: { name: 'asc' },
    }),
    this.prisma.department.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
      hasNextPage: page * take < total,
      hasPrevPage: page > 1,
    },
  };
}
```

---

## Filtering & Sorting

### Filtering

```http
# Single filter
GET /api/organisation/departments?isActive=true

# Multiple filters (AND)
GET /api/organisation/departments?isActive=true&criticalityLevel=high

# Array filter (IN)
GET /api/organisation/departments?criticalityLevel=high,critical

# Search
GET /api/organisation/departments?search=technology
```

### Filter Implementation

```typescript
async getDepartments(query: {
  isActive?: boolean;
  criticalityLevel?: string | string[];
  search?: string;
}) {
  const where: any = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.criticalityLevel) {
    const levels = Array.isArray(query.criticalityLevel)
      ? query.criticalityLevel
      : query.criticalityLevel.split(',');
    where.criticalityLevel = { in: levels };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { departmentCode: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return this.prisma.department.findMany({ where });
}
```

### Sorting

```http
# Single sort
GET /api/organisation/departments?sortBy=name&sortOrder=asc

# Multiple sorts
GET /api/organisation/departments?sortBy=criticalityLevel,name&sortOrder=desc,asc
```

### Sort Implementation

```typescript
async getDepartments(query: {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const orderBy: any = {};

  if (query.sortBy) {
    orderBy[query.sortBy] = query.sortOrder || 'asc';
  } else {
    orderBy.name = 'asc'; // Default sort
  }

  return this.prisma.department.findMany({ orderBy });
}
```

---

## Organisation Module Endpoints

### Organisation Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/profile` | Get organisation profile |
| PUT | `/api/organisation/profile` | Update organisation profile |

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/departments` | List departments |
| GET | `/api/organisation/departments/:id` | Get department |
| POST | `/api/organisation/departments` | Create department |
| PUT | `/api/organisation/departments/:id` | Update department |
| DELETE | `/api/organisation/departments/:id` | Delete department |
| GET | `/api/organisation/departments/:id/members` | List members |
| POST | `/api/organisation/departments/:id/members` | Add member |
| DELETE | `/api/organisation/departments/:id/members/:userId` | Remove member |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/locations` | List locations |
| GET | `/api/organisation/locations/:id` | Get location |
| POST | `/api/organisation/locations` | Create location |
| PUT | `/api/organisation/locations/:id` | Update location |
| DELETE | `/api/organisation/locations/:id` | Delete location |

### Business Processes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/business-processes` | List processes |
| GET | `/api/organisation/business-processes/:id` | Get process |
| POST | `/api/organisation/business-processes` | Create process |
| PUT | `/api/organisation/business-processes/:id` | Update process |
| DELETE | `/api/organisation/business-processes/:id` | Delete process |

### External Dependencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/external-dependencies` | List dependencies |
| GET | `/api/organisation/external-dependencies/:id` | Get dependency |
| POST | `/api/organisation/external-dependencies` | Create dependency |
| PUT | `/api/organisation/external-dependencies/:id` | Update dependency |
| DELETE | `/api/organisation/external-dependencies/:id` | Delete dependency |

### Security Committees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/security-committees` | List committees |
| GET | `/api/organisation/security-committees/:id` | Get committee |
| POST | `/api/organisation/security-committees` | Create committee |
| PUT | `/api/organisation/security-committees/:id` | Update committee |
| DELETE | `/api/organisation/security-committees/:id` | Delete committee |

### Committee Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/committee-meetings` | List meetings |
| GET | `/api/organisation/committee-meetings/:id` | Get meeting |
| POST | `/api/organisation/committee-meetings` | Create meeting |
| PUT | `/api/organisation/committee-meetings/:id` | Update meeting |
| DELETE | `/api/organisation/committee-meetings/:id` | Delete meeting |

### Meeting Decisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/meeting-decisions` | List decisions |
| GET | `/api/organisation/meeting-decisions/:id` | Get decision |
| POST | `/api/organisation/meeting-decisions` | Create decision |
| PUT | `/api/organisation/meeting-decisions/:id` | Update decision |
| DELETE | `/api/organisation/meeting-decisions/:id` | Delete decision |

### Action Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/action-items` | List action items |
| GET | `/api/organisation/action-items/:id` | Get action item |
| POST | `/api/organisation/action-items` | Create action item |
| PUT | `/api/organisation/action-items/:id` | Update action item |
| DELETE | `/api/organisation/action-items/:id` | Delete action item |

### Interested Parties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/interested-parties` | List parties |
| GET | `/api/organisation/interested-parties/:id` | Get party |
| POST | `/api/organisation/interested-parties` | Create party |
| PUT | `/api/organisation/interested-parties/:id` | Update party |
| DELETE | `/api/organisation/interested-parties/:id` | Delete party |

### Context Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/context-issues` | List issues |
| GET | `/api/organisation/context-issues/:id` | Get issue |
| POST | `/api/organisation/context-issues` | Create issue |
| PUT | `/api/organisation/context-issues/:id` | Update issue |
| DELETE | `/api/organisation/context-issues/:id` | Delete issue |

### Key Personnel

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/key-personnel` | List personnel |
| GET | `/api/organisation/key-personnel/:id` | Get personnel |
| POST | `/api/organisation/key-personnel` | Create personnel |
| PUT | `/api/organisation/key-personnel/:id` | Update personnel |
| DELETE | `/api/organisation/key-personnel/:id` | Delete personnel |

### Applicable Frameworks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organisation/applicable-frameworks` | List frameworks |
| GET | `/api/organisation/applicable-frameworks/:id` | Get framework |
| POST | `/api/organisation/applicable-frameworks` | Create framework |
| PUT | `/api/organisation/applicable-frameworks/:id` | Update framework |
| DELETE | `/api/organisation/applicable-frameworks/:id` | Delete framework |
