# API Reference

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

All endpoints require JWT authentication via HTTP-only cookies:
- `access_token`: Short-lived access token
- `refresh_session`: Refresh token for session management

---

## Applications

### List Applications

```http
GET /api/applications
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | number | Pagination offset |
| take | number | Page size (default: 50) |
| search | string | Search by name or appId |
| criticality | string | Filter by criticality level |
| status | string | Filter by lifecycle status |

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "appId": "APP-001",
      "name": "Core Banking System",
      "criticality": "CRITICAL",
      "lifecycleStatus": "ACTIVE",
      ...
    }
  ],
  "total": 100
}
```

### Get Application

```http
GET /api/applications/:id
```

**Response:** Full application object with all 43 fields.

### Create Application

```http
POST /api/applications
```

**Required Fields:**
- `appId`: Unique application identifier
- `name`: Application name

**Response:** Created application object.

### Update Application

```http
PUT /api/applications/:id
```

**Body:** Partial application object with fields to update.

### Delete Application

```http
DELETE /api/applications/:id
```

---

## ISRA (Information Security Risk Assessment)

### List ISRAs for Application

```http
GET /api/applications/:applicationId/isra
```

### Get ISRA

```http
GET /api/applications/:applicationId/isra/:israId
```

**Response:**
```json
{
  "id": "clx...",
  "applicationId": "clx...",
  "assessmentVersion": 1,
  "status": "IN_PROGRESS",
  "startDate": "2024-01-15T00:00:00Z",
  "bia": { ... },
  "tva": { ... },
  "srl": { ... }
}
```

### Create ISRA

```http
POST /api/applications/:applicationId/isra
```

**Body:**
```json
{
  "leadAssessorId": "clx...",
  "notes": "Annual assessment"
}
```

### Update ISRA Status

```http
PUT /api/applications/:applicationId/isra/:israId/status
```

**Body:**
```json
{
  "status": "COMPLETED"
}
```

### Get ISRA Progress

```http
GET /api/applications/:applicationId/isra/:israId/progress
```

**Response:**
```json
{
  "biaComplete": true,
  "tvaComplete": false,
  "srlComplete": false,
  "overallProgress": 33
}
```

---

## BIA (Business Impact Analysis)

### Get BIA Questions

```http
GET /api/bia-questions
```

**Response:**
```json
{
  "DATA_PRIVACY": [
    {
      "id": "clx...",
      "questionId": "1.0",
      "section": "DATA_PRIVACY",
      "question": "Does the application process personal data?",
      "responseType": "YES_NO_NA",
      "options": null,
      "isGdprRelated": true,
      ...
    }
  ],
  "CONFIDENTIALITY": [...],
  "INTEGRITY": [...],
  "AVAILABILITY": [...],
  "AI_ML": [...]
}
```

### Get Section Questions

```http
GET /api/bia-questions/:section
```

**Sections:** `DATA_PRIVACY`, `CONFIDENTIALITY`, `INTEGRITY`, `AVAILABILITY`, `AI_ML`

### Get BIA for ISRA

```http
GET /api/applications/:applicationId/isra/:israId/bia
```

**Response:**
```json
{
  "id": "clx...",
  "israId": "clx...",
  "dataPrivacyCompleted": true,
  "confidentialityCompleted": true,
  "integrityCompleted": false,
  "availabilityCompleted": false,
  "aiMlCompleted": false,
  "confidentialityImpact": 3,
  "integrityImpact": 2,
  "availabilityImpact": 2,
  "businessCriticality": "HIGH",
  "riskLevel": "HIGH",
  "responses": [...]
}
```

### Initialize BIA (Questionnaire Mode)

```http
POST /api/applications/:applicationId/isra/:israId/bia
```

**Body:** Empty `{}` to initialize questionnaire-based BIA.

### Create BIA (Legacy Mode)

```http
POST /api/applications/:applicationId/isra/:israId/bia
```

**Body:**
```json
{
  "confidentialityImpact": 3,
  "integrityImpact": 2,
  "availabilityImpact": 2,
  "businessCriticality": "HIGH"
}
```

### Submit BIA Section

```http
POST /api/applications/:applicationId/isra/:israId/bia/:biaId/section
```

**Body:**
```json
{
  "section": "DATA_PRIVACY",
  "responses": [
    {
      "questionId": "1.0",
      "responseValue": "YES",
      "notes": "Processes customer PII"
    },
    {
      "questionId": "2.0",
      "responseValue": "NO"
    }
  ],
  "assessmentNotes": "Section notes here"
}
```

### Recalculate BIA Ratings

```http
POST /api/applications/:applicationId/isra/:israId/bia/:biaId/recalculate
```

Forces recalculation of CIA ratings from responses.

---

## TVA (Threat Vulnerability Assessment)

### Get Threat Catalog

```http
GET /api/threat-catalog
```

**Response:**
```json
[
  {
    "id": "clx...",
    "threatId": "T001",
    "category": "MALWARE",
    "name": "Ransomware Attack",
    "baseLikelihood": 3,
    "confidentialityImpact": 2,
    "integrityImpact": 4,
    "availabilityImpact": 4
  }
]
```

### Get TVA for ISRA

```http
GET /api/applications/:applicationId/isra/:israId/tva
```

### Create/Initialize TVA

```http
POST /api/applications/:applicationId/isra/:israId/tva
```

### Add Threat to TVA

```http
POST /api/applications/:applicationId/isra/:israId/tva/:tvaId/threats
```

**Body:**
```json
{
  "threatCatalogId": "clx...",
  "isApplicable": true,
  "likelihood": 3,
  "rationale": "Web-facing application increases exposure"
}
```

### Update Threat Entry

```http
PUT /api/applications/:applicationId/isra/:israId/tva/:tvaId/threats/:entryId
```

### Add Vulnerability

```http
POST /api/applications/:applicationId/isra/:israId/tva/:tvaId/vulnerabilities
```

**Body:**
```json
{
  "vulnerabilityId": "CVE-2024-1234",
  "name": "Critical XSS Vulnerability",
  "severity": 4,
  "status": "OPEN",
  "cveReference": "CVE-2024-1234"
}
```

---

## SRL (Security Requirements List)

### Get SRL Master Requirements

```http
GET /api/srl-requirements
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| applicability | string | Filter by applicability level |
| domain | string | Filter by domain |

### Get SRL for ISRA

```http
GET /api/applications/:applicationId/isra/:israId/srl
```

**Response:**
```json
{
  "id": "clx...",
  "israId": "clx...",
  "generatedRiskLevel": "HIGH",
  "coveragePercentage": 75.5,
  "entries": [
    {
      "id": "clx...",
      "requirementId": "SRL-001",
      "requirement": { ... },
      "coverageStatus": "COVERED",
      "evidenceNotes": "MFA enforced via Azure AD",
      "linkedNCId": null
    }
  ]
}
```

### Generate SRL

```http
POST /api/applications/:applicationId/isra/:israId/srl/generate
```

Generates SRL entries based on BIA risk level.

### Update SRL Entry Coverage

```http
PUT /api/applications/:applicationId/isra/:israId/srl/:srlId/entries/:entryId
```

**Body:**
```json
{
  "coverageStatus": "COVERED",
  "evidenceNotes": "Control implemented via..."
}
```

### Process SRL Gaps

```http
POST /api/applications/:applicationId/isra/:israId/srl/:srlId/process-gaps
```

Creates Nonconformities for all GAP and PARTIAL entries.

---

## Nonconformities

### Get NC Statistics

```http
GET /api/isra-nc-stats
```

**Response:**
```json
{
  "total": 45,
  "bySeverity": {
    "CRITICAL": 5,
    "HIGH": 12,
    "MEDIUM": 18,
    "LOW": 10
  },
  "byStatus": {
    "OPEN": 30,
    "IN_PROGRESS": 10,
    "CLOSED": 5
  }
}
```

### List NCs for ISRA

```http
GET /api/applications/:applicationId/isra/:israId/nonconformities
```

---

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |
