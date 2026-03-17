# BCM API Reference

## Base URL
All endpoints are prefixed with `/api/bcm/`

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## BIA Assessment

### Get Pending Processes
```http
GET /api/bcm/bia/pending
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Pagination limit |
| departmentId | string | Filter by department |

**Response:**
```json
{
  "results": [
    {
      "id": "clx...",
      "name": "Order Processing",
      "processCode": "PROC-001",
      "biaStatus": "pending",
      "department": { "id": "...", "name": "Operations" },
      "processOwner": { "id": "...", "firstName": "John", "lastName": "Doe" }
    }
  ],
  "count": 10
}
```

### Get BIA Coverage Stats
```http
GET /api/bcm/bia/coverage
```

**Response:**
```json
{
  "total": 50,
  "pending": 20,
  "inProgress": 5,
  "completed": 25,
  "coveragePercentage": 50,
  "criticalityDistribution": [
    { "criticality": "critical", "count": 5 },
    { "criticality": "high", "count": 10 }
  ]
}
```

### Start BIA Assessment
```http
POST /api/bcm/bia/:processId/start
```

### Save BIA Data
```http
PUT /api/bcm/bia/:processId
```

**Request Body:**
```json
{
  "bcpCriticality": "critical",
  "recoveryTimeObjectiveMinutes": 240,
  "recoveryPointObjectiveMinutes": 60,
  "systemDependencies": ["ERP", "CRM"]
}
```

### Complete BIA Assessment
```http
POST /api/bcm/bia/:processId/complete
```

**Request Body:**
```json
{
  "data": {
    "bcpCriticality": "critical",
    "bcpEnabled": true,
    "recoveryTimeObjectiveMinutes": 240,
    "recoveryPointObjectiveMinutes": 60,
    "maximumTolerableDowntimeMinutes": 480,
    "minimumStaff": 5,
    "systemDependencies": ["ERP", "CRM"],
    "supplierDependencies": ["Cloud Provider"],
    "recoveryStrategies": ["Failover to DR site"]
  },
  "notes": "Initial assessment completed"
}
```

### Get Assessment History
```http
GET /api/bcm/bia/history/:processId
```

### Get Upcoming Reviews
```http
GET /api/bcm/bia/upcoming-reviews?daysAhead=30
```

---

## BCM Programs

### List Programs
```http
GET /api/bcm/programs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Pagination limit |
| status | string | Filter by status |

### Get Program
```http
GET /api/bcm/programs/:id
```

### Create Program
```http
POST /api/bcm/programs
```

**Request Body:**
```json
{
  "name": "Enterprise BCM Program",
  "description": "Main BCM program",
  "scope": "All critical business processes",
  "programOwnerId": "user-id",
  "policyDocumentId": "policy-id",
  "doraApplicable": true,
  "nis2Applicable": true
}
```

### Update Program
```http
PUT /api/bcm/programs/:id
```

### Delete Program
```http
DELETE /api/bcm/programs/:id
```

### Generate Program Code
```http
GET /api/bcm/programs/generate-code
```

### Get Dashboard Stats
```http
GET /api/bcm/programs/dashboard-stats
```

---

## Continuity Plans

### List Plans
```http
GET /api/bcm/plans
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Pagination limit |
| status | string | Filter by status |
| planType | string | Filter by type |
| programId | string | Filter by program |

### Get Plan
```http
GET /api/bcm/plans/:id
```

### Create Plan
```http
POST /api/bcm/plans
```

**Request Body:**
```json
{
  "name": "Production Outage BCP",
  "planType": "business_continuity",
  "programId": "program-id",
  "description": "Plan for production outages",
  "activationCriteria": "Production system unavailable > 15 minutes",
  "testFrequency": "quarterly"
}
```

### Update Plan
```http
PUT /api/bcm/plans/:id
```

### Delete Plan
```http
DELETE /api/bcm/plans/:id
```

### Add Processes to Plan
```http
POST /api/bcm/plans/:id/processes
```

**Request Body:**
```json
{
  "processIds": ["process-1", "process-2"]
}
```

**Note:** Returns error if any process has `biaStatus !== 'completed'`

### Remove Processes from Plan
```http
DELETE /api/bcm/plans/:id/processes
```

### Approve Plan
```http
POST /api/bcm/plans/:id/approve
```

### Activate Plan
```http
POST /api/bcm/plans/:id/activate
```

**Request Body:**
```json
{
  "incidentId": "optional-incident-id",
  "reason": "Production database failure"
}
```

### Get Eligible Plans
```http
GET /api/bcm/plans/eligible-for-activation
```

---

## Test Exercises

### List Tests
```http
GET /api/bcm/tests
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Pagination limit |
| status | string | Filter by status |
| testType | string | Filter by type |
| programId | string | Filter by program |
| planId | string | Filter by plan |

### Get Test
```http
GET /api/bcm/tests/:id
```

### Create Test
```http
POST /api/bcm/tests
```

**Request Body:**
```json
{
  "name": "Q1 Tabletop Exercise",
  "testType": "tabletop",
  "programId": "program-id",
  "planId": "optional-plan-id",
  "scheduledDate": "2025-03-15T10:00:00Z",
  "facilitatorId": "user-id",
  "scenarioDescription": "Ransomware attack scenario",
  "objectives": ["Validate communication", "Test escalation"]
}
```

### Update Test
```http
PUT /api/bcm/tests/:id
```

### Delete Test
```http
DELETE /api/bcm/tests/:id
```

### Start Test
```http
POST /api/bcm/tests/:id/start
```

### Complete Test
```http
POST /api/bcm/tests/:id/complete
```

**Request Body:**
```json
{
  "objectivesMet": true,
  "lessonsLearned": "Communication needs improvement",
  "successAreas": ["Quick escalation", "Good documentation"],
  "improvementAreas": ["Communication delays"],
  "actualRtoMinutes": 180,
  "rtoMet": true,
  "durationHours": 2
}
```

### Cancel Test
```http
POST /api/bcm/tests/:id/cancel
```

### Create Finding
```http
POST /api/bcm/tests/:testId/findings
```

**Request Body:**
```json
{
  "findingType": "gap",
  "severity": "high",
  "title": "Communication delay",
  "description": "15 minute delay in notifying stakeholders",
  "recommendation": "Implement automated notification system",
  "priority": "short_term",
  "assignedToId": "user-id",
  "dueDate": "2025-04-15"
}
```

### Update Finding
```http
PUT /api/bcm/tests/findings/:findingId
```

### Resolve Finding
```http
POST /api/bcm/tests/findings/:findingId/resolve
```

**Request Body:**
```json
{
  "resolutionNotes": "Implemented automated notification system"
}
```

### Link Finding to NC
```http
POST /api/bcm/tests/findings/:findingId/link-nc
```

**Request Body:**
```json
{
  "nonconformityId": "nc-id"
}
```

### Get Upcoming Tests
```http
GET /api/bcm/tests/upcoming?daysAhead=30
```

### Get Test Stats
```http
GET /api/bcm/tests/stats
```

---

## Plan Activations

### List Activations
```http
GET /api/bcm/activations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Pagination limit |
| status | string | Filter by status |
| planId | string | Filter by plan |
| incidentId | string | Filter by incident |

### Get Activation
```http
GET /api/bcm/activations/:id
```

### Get Active Activations
```http
GET /api/bcm/activations/active
```

### Get Activations for Incident
```http
GET /api/bcm/activations/incident/:incidentId
```

### Deactivate
```http
POST /api/bcm/activations/:id/deactivate
```

**Request Body:**
```json
{
  "actualRtoMinutes": 180,
  "actualRpoAchieved": true,
  "recoveryNotes": "Systems restored successfully"
}
```

### Abort Activation
```http
POST /api/bcm/activations/:id/abort
```

**Request Body:**
```json
{
  "reason": "False alarm - issue resolved automatically"
}
```

### Add Timeline Event
```http
POST /api/bcm/activations/:id/timeline
```

**Request Body:**
```json
{
  "event": "Primary systems restored",
  "notes": "Database failover completed"
}
```

### Get Activation Stats
```http
GET /api/bcm/activations/stats
```

---

## Dashboard

### Get Full Dashboard
```http
GET /api/bcm/dashboard
```

**Response:**
```json
{
  "biaCoverage": { ... },
  "programStats": { ... },
  "testStats": { ... },
  "activationStats": { ... },
  "upcomingReviews": [ ... ],
  "upcomingTests": [ ... ],
  "activeActivations": [ ... ]
}
```

