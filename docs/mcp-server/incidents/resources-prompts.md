# Incidents MCP Server - Resources & Prompts

## Resources

Resources provide reference documentation and guidance for incident response and regulatory compliance.

### incident-response-process

**Name**: `incident-response-process`

**URI**: `incidents://process/incident-response`

**Description**: Comprehensive guide to the incident response process covering the full lifecycle, severity definitions, and response procedures.

**Contents**:
- Incident Lifecycle (8 stages from DETECTED to CLOSED)
- Severity Definitions (CRITICAL, HIGH, MEDIUM, LOW) with response times and escalation requirements
- Response Procedures including evidence collection, communication, and regulatory notification requirements

**Key Topics**:
- Detailed actions for each lifecycle stage
- Response time SLAs by severity
- Evidence collection and chain of custody requirements
- Communication requirements (internal and external)
- Regulatory notification requirements (NIS2, DORA, GDPR)

**Use Cases**:
- Training incident response team members
- Reference during active incident response
- Establishing incident response procedures
- Determining appropriate severity classification

---

### nis2-reporting-guide

**Name**: `nis2-reporting-guide`

**URI**: `incidents://compliance/nis2-reporting`

**Description**: Complete guide to NIS2 (Network and Information Security Directive 2) incident reporting obligations for EU essential and important entities.

**Contents**:
- NIS2 Overview and entity classification
- Significant incident criteria (Article 23(3))
- Reporting timelines (24h, 72h, 1 month)
- CSIRT obligations and coordination
- Cross-border incident handling
- Penalties for non-compliance

**Key Topics**:
- Essential vs. Important entity distinctions
- 4 significance criteria:
  1. Severe operational disruption
  2. Financial loss
  3. Affected persons
  4. Material damage
- Early warning (24h) requirements and content
- Notification (72h) requirements and content
- Intermediate and final report requirements
- CSIRT registration and cooperation obligations
- Cross-border impact assessment and coordination
- Penalty structure (up to €10M or 2% turnover for essential entities)

**Use Cases**:
- Determining if NIS2 applies to an organization
- Assessing if an incident meets significance criteria
- Calculating reporting deadlines
- Understanding CSIRT coordination requirements
- Preparing regulatory notifications
- Compliance risk assessment

---

### dora-reporting-guide

**Name**: `dora-reporting-guide`

**URI**: `incidents://compliance/dora-reporting`

**Description**: Complete guide to DORA (Digital Operational Resilience Act) incident reporting obligations for EU financial entities.

**Contents**:
- DORA Overview and applicable entities
- Major incident classification (7 criteria)
- Reporting timelines (4h, ongoing, 1 month)
- ICT third-party provider involvement
- Competent authority notification process
- Content requirements for all reports

**Key Topics**:
- Applicable entity types (credit institutions, payment institutions, investment firms, crypto-asset providers, ICT third-party service providers, etc.)
- 7 criteria for major incident classification:
  1. Clients/counterparties affected (count/percentage)
  2. Reputational impact (media, complaints, regulatory inquiry)
  3. Duration/downtime (>2h critical, >24h important)
  4. Geographic spread (>=2 member states)
  5. Data impact (loss, breach, records)
  6. Economic impact (costs, % of CET1)
  7. Transactions affected (count/value/percentage)
- Initial notification (4h from detection) requirements
- Intermediate report timing and content
- Final report (1 month from resolution) requirements
- ICT third-party provider assessment and coordination
- Voluntary reporting of cyber threats and vulnerabilities
- Single reporting portal usage

**Use Cases**:
- Determining if DORA applies to an organization
- Evaluating incidents against 7 major incident criteria
- Calculating precise reporting deadlines
- Assessing ICT third-party provider involvement
- Preparing initial, intermediate, and final reports
- Understanding financial sector regulatory obligations

---

## Prompts

Prompts provide guided workflows for complex incident management tasks, combining multiple tool calls with structured analysis.

### incident-triage

**Name**: `incident-triage`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| incidentId | string | Yes | Incident UUID to triage |

**Description**: Comprehensive incident triage workflow that classifies severity, assesses NIS2/DORA applicability, identifies affected assets, and recommends response actions.

**Workflow Steps**:

1. **Get Incident Details** - Retrieves full incident information using `get_incident`
2. **Verify Severity Classification** - Compares incident against severity definitions (CRITICAL/HIGH/MEDIUM/LOW)
3. **Analyze Affected Assets** - Reviews impact on systems and data, identifies critical infrastructure
4. **Assess Regulatory Implications**:
   - NIS2 Assessment: Evaluates significance criteria using `get_nis2_assessment`
   - DORA Assessment: Evaluates 7 major incident criteria using `get_dora_assessment`
   - Calculates reporting deadlines
5. **Review Timeline and Evidence** - Uses `get_incident_timeline` and `get_incident_evidence_items` to verify response progress
6. **Identify Response Priorities** - Determines immediate containment, evidence collection, notifications
7. **Check Related Incidents** - Uses `get_incident_relations` to identify patterns or coordinated attacks
8. **Synthesize Triage Assessment** - Produces comprehensive report

**Output Sections**:
- Triage Summary
- Severity Confirmation (with justification)
- Impact Assessment (systems, data, business, CIA triad)
- Regulatory Status (NIS2/DORA determination with deadlines)
- Affected Assets Analysis
- Recommended Actions (containment, investigation, evidence, communication, regulatory)
- Response Team composition
- Timeline Targets
- Risk Flags requiring escalation

**Use Cases**:
- Initial incident classification and prioritization
- Determining appropriate response team and resources
- Assessing regulatory reporting obligations
- Creating incident response plan
- Executive briefing preparation
- Escalation decision-making

**Example**:
```typescript
await client.getPrompt("incident-triage", {
  incidentId: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
});
```

---

### regulatory-assessment

**Name**: `regulatory-assessment`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| incidentId | string | Yes | Incident UUID to assess |

**Description**: Comprehensive regulatory assessment workflow for NIS2 and DORA frameworks, including classification, deadline calculation, and notification compliance tracking.

**Workflow Steps**:

1. **Get Incident Details** - Retrieves incident information using `get_incident`
2. **NIS2 Assessment**:
   - Retrieves assessment using `get_nis2_assessment`
   - Evaluates each significance criterion in detail:
     - Severe operational disruption (duration, scope, critical functions)
     - Financial loss (direct, indirect, currency, comparison to turnover)
     - Affected persons (count, impact type, data sensitivity)
     - Material damage (physical, reputational, environmental)
   - Determines significance classification
   - Calculates reporting deadlines from classification timestamp
   - Assesses cross-border impact
   - Verifies CSIRT registration
3. **DORA Assessment**:
   - Retrieves assessment using `get_dora_assessment`
   - Evaluates all 7 criteria with threshold analysis:
     1. Clients/counterparties affected vs. thresholds
     2. Reputational impact (media type, complaints, inquiries)
     3. Duration/downtime vs. function type thresholds
     4. Geographic spread across member states
     5. Data impact (integrity, confidentiality, availability, records)
     6. Economic impact (costs, CET1 percentage, threshold comparison)
     7. Transactions affected (count, value, daily average percentage)
   - Counts criteria breached (need >=1 for major incident)
   - Determines major incident classification
   - Calculates reporting deadlines from detection timestamp
   - Assesses ICT third-party provider involvement
4. **Review Notification Status**:
   - Lists notifications using `list_notifications` filtered by incident
   - Checks framework, type, status, due dates, submission dates
   - Identifies overdue notifications using `get_overdue_notifications`
   - Reviews authority responses
5. **Check Regulatory Authorities**:
   - Lists authorities using `list_regulatory_authorities`
   - Identifies CSIRT for NIS2, financial supervisor for DORA, DPA for GDPR
   - Notes submission methods and contact details
6. **Timeline Compliance Check**:
   - Calculates elapsed time since detection and classification
   - Identifies missed deadlines
   - Calculates remaining time for pending notifications
7. **Synthesize Regulatory Assessment** - Produces comprehensive compliance report

**Output Sections**:
- Executive Summary (frameworks applicable, classification results, compliance status)
- NIS2 Assessment Detail (criteria evaluation, classification, timeline, CSIRT)
- DORA Assessment Detail (7-criteria evaluation with thresholds, classification, timeline, third-party)
- Current Compliance Status (submitted/pending/overdue notifications)
- Recommended Actions (immediate, short-term, documentation, communication, remediation)
- Risk Assessment (compliance risk level, potential penalties, escalation)

**Use Cases**:
- Determining regulatory reporting obligations
- Preparing regulatory notifications (NIS2 early warning, notification, final report; DORA initial, intermediate, final)
- Compliance risk assessment
- Legal and executive briefings
- Deadline tracking and management
- Authority coordination planning
- Post-incident regulatory closure

**Example**:
```typescript
await client.getPrompt("regulatory-assessment", {
  incidentId: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
});
```

---

## Usage Patterns

### Combining Resources and Prompts

**Scenario**: AI agent triaging a new incident

```typescript
// 1. First, read the incident response process guide
const processGuide = await client.readResource("incidents://process/incident-response");

// 2. Execute the triage prompt with process knowledge in context
const triagePrompt = await client.getPrompt("incident-triage", {
  incidentId: "incident-uuid"
});

// 3. If regulatory frameworks apply, read compliance guides
const nis2Guide = await client.readResource("incidents://compliance/nis2-reporting");
const doraGuide = await client.readResource("incidents://compliance/dora-reporting");

// 4. Execute regulatory assessment with compliance knowledge
const regulatoryPrompt = await client.getPrompt("regulatory-assessment", {
  incidentId: "incident-uuid"
});
```

### Reference Documentation During Tool Usage

**Scenario**: Creating incident proposals with proper severity classification

```typescript
// Read severity definitions from process guide
const processGuide = await client.readResource("incidents://process/incident-response");

// Use severity knowledge to create properly classified proposal
await client.callTool("propose_incident", {
  organisationId: "org-uuid",
  referenceNumber: "INC-2025-042",
  title: "Data exfiltration detected",
  description: "Large volume of data transferred to external IP",
  severity: "CRITICAL", // Based on severity definitions in process guide
  category: "DATA_BREACH",
  source: "SIEM",
  detectedAt: "2025-02-11T14:30:00Z",
  reason: "SIEM detected 50GB data transfer to unknown external IP over encrypted channel"
});
```

### Regulatory Compliance Workflow

**Scenario**: Assessing and reporting a significant incident

```typescript
// 1. Read NIS2 and DORA guides
const nis2Guide = await client.readResource("incidents://compliance/nis2-reporting");
const doraGuide = await client.readResource("incidents://compliance/dora-reporting");

// 2. Execute regulatory assessment prompt
const assessment = await client.getPrompt("regulatory-assessment", {
  incidentId: "incident-uuid"
});

// 3. Based on assessment, list relevant authorities
const authorities = await client.callTool("list_regulatory_authorities", {
  countryCode: "IE",
  authorityType: "CSIRT"
});

// 4. Check notification status and deadlines
const notifications = await client.callTool("list_notifications", {
  incidentId: "incident-uuid",
  framework: "NIS2"
});

const overdue = await client.callTool("get_overdue_notifications", {});
```
