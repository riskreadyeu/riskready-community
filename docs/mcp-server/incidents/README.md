# Incidents MCP Server

Security incident register, timeline tracking, regulatory assessments, notifications, and lessons learned management.

## Key Numbers

| Metric | Count |
|--------|-------|
| Query Tools | 16 |
| Mutation Tools | 5 |
| Resources | 3 |
| Prompts | 2 |

## Core Design Principle

The Incidents MCP server provides comprehensive incident management following the full incident response lifecycle (DETECTED → TRIAGED → INVESTIGATING → CONTAINING → ERADICATING → RECOVERING → POST_INCIDENT → CLOSED) with integrated regulatory compliance assessments for NIS2 and DORA frameworks. All mutations follow the human-in-the-loop pattern via approval queue.

## Documentation

- [Tool Reference](./tool-reference.md) - Complete reference for all 21 tools
- [Resources & Prompts](./resources-prompts.md) - Available resources and prompt templates

## Quick Start

### List Incidents with Filters

```typescript
// List all critical/high severity incidents
await client.callTool("list_incidents", {
  severity: "CRITICAL",
  status: "INVESTIGATING"
});

// Search incidents by text
await client.callTool("search_incidents", {
  query: "ransomware"
});
```

### Get Incident Details

```typescript
// Get full incident with timeline, evidence, assessments
await client.callTool("get_incident", {
  id: "incident-uuid"
});

// Get regulatory assessments
await client.callTool("get_nis2_assessment", {
  incidentId: "incident-uuid"
});

await client.callTool("get_dora_assessment", {
  incidentId: "incident-uuid"
});
```

### Timeline and Evidence Tracking

```typescript
// Get incident timeline entries
await client.callTool("get_incident_timeline", {
  incidentId: "incident-uuid"
});

// Get evidence items collected
await client.callTool("get_incident_evidence_items", {
  incidentId: "incident-uuid"
});

// Get lessons learned
await client.callTool("get_incident_lessons_learned", {
  incidentId: "incident-uuid"
});
```

### Regulatory Notifications

```typescript
// List pending notifications
await client.callTool("list_notifications", {
  status: "PENDING",
  framework: "NIS2"
});

// Get overdue notifications
await client.callTool("get_overdue_notifications", {});

// List regulatory authorities
await client.callTool("list_regulatory_authorities", {
  countryCode: "IE",
  authorityType: "CSIRT"
});
```

### Analysis and Dashboards

```typescript
// Get comprehensive incident statistics
await client.callTool("get_incident_stats", {});

// Get dashboard summary
await client.callTool("get_incident_dashboard", {});

// Get controls affected by incident
await client.callTool("get_incident_affected_controls", {
  incidentId: "incident-uuid"
});
```

### Propose Changes (Human-in-the-Loop)

```typescript
// Propose creating new incident
await client.callTool("propose_incident", {
  organisationId: "org-uuid",
  referenceNumber: "INC-2025-001",
  title: "Ransomware infection detected",
  description: "Multiple systems showing encryption activity",
  severity: "CRITICAL",
  category: "MALWARE",
  source: "SIEM",
  detectedAt: "2025-02-11T10:30:00Z",
  reason: "Automated SIEM alert triggered for suspicious file encryption patterns"
});

// Propose status update
await client.callTool("propose_incident_status_update", {
  organisationId: "org-uuid",
  incidentId: "incident-uuid",
  newStatus: "CONTAINING",
  reason: "Systems isolated, malware identified, containment actions in progress"
});

// Propose timeline entry
await client.callTool("propose_timeline_entry", {
  organisationId: "org-uuid",
  incidentId: "incident-uuid",
  entryType: "ACTION_TAKEN",
  description: "Isolated infected systems from network",
  details: "Disconnected 5 workstations and 1 file server from network",
  reason: "Critical containment action to prevent further spread"
});

// Propose linking to risk scenario
await client.callTool("propose_link_incident_scenario", {
  organisationId: "org-uuid",
  incidentId: "incident-uuid",
  scenarioId: "scenario-uuid",
  linkType: "TRIGGERED_BY",
  reason: "Incident validates the ransomware attack scenario from risk register"
});

// Propose lessons learned
await client.callTool("propose_lessons_learned", {
  organisationId: "org-uuid",
  incidentId: "incident-uuid",
  category: "DETECTION",
  observation: "Initial detection took 4 hours due to delayed SIEM alert processing",
  recommendation: "Implement real-time SIEM alert forwarding to SOC team",
  priority: "HIGH",
  reason: "Faster detection could have prevented lateral movement"
});
```

### Use Prompts for Guided Workflows

```typescript
// Comprehensive incident triage
await client.getPrompt("incident-triage", {
  incidentId: "incident-uuid"
});

// Regulatory assessment (NIS2 + DORA)
await client.getPrompt("regulatory-assessment", {
  incidentId: "incident-uuid"
});
```

### Access Resources for Guidance

```typescript
// Incident response process guide
await client.readResource("incidents://process/incident-response");

// NIS2 reporting requirements
await client.readResource("incidents://compliance/nis2-reporting");

// DORA reporting requirements
await client.readResource("incidents://compliance/dora-reporting");
```

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk` (server, stdio transport)
- **Database**: PostgreSQL via Prisma ORM
- **Validation**: Zod schemas for all tool parameters
- **Architecture**: Modular tool registration with domain separation

## Incident Response Lifecycle

The server supports the complete incident response lifecycle:

1. **DETECTED** - Initial detection via SIEM, user report, threat intel, etc.
2. **TRIAGED** - Incident confirmed, severity assigned, regulatory assessment initiated
3. **INVESTIGATING** - Evidence collection, root cause analysis, impact assessment
4. **CONTAINING** - Actions to limit spread and impact
5. **ERADICATING** - Threat removal from environment
6. **RECOVERING** - System restoration and service recovery
7. **POST_INCIDENT** - Lessons learned and corrective actions
8. **CLOSED** - Final documentation and regulatory closure

## Regulatory Frameworks

### NIS2 (Network and Information Security Directive 2)

- **Significant Incident Criteria**: Severe operational disruption, financial loss, affected persons, material damage
- **Reporting Timeline**:
  - Early Warning: 24 hours from classification
  - Notification: 72 hours from classification
  - Final Report: 1 month from classification
- **Tools**: `get_nis2_assessment`, `list_significant_incidents`

### DORA (Digital Operational Resilience Act)

- **Major Incident Criteria**: 7-criteria assessment (clients affected, reputational impact, duration, geographic spread, data impact, economic impact, transactions affected)
- **Reporting Timeline**:
  - Initial Notification: 4 hours from detection
  - Intermediate Reports: As needed during incident
  - Final Report: 1 month from resolution
- **Tools**: `get_dora_assessment`, `list_major_dora_incidents`

## Human-in-the-Loop Pattern

All mutation tools create proposals that enter an approval queue:

- **propose_incident** - Creates incident proposal
- **propose_incident_status_update** - Status change proposal
- **propose_timeline_entry** - Timeline entry proposal
- **propose_link_incident_scenario** - Link to risk scenario proposal
- **propose_lessons_learned** - Lessons learned proposal

Human reviewers approve/reject proposals before they affect live data. Each proposal includes a `reason` field explaining the rationale to reviewers.

## Integration Points

- **Controls Module**: Links incidents to affected controls with effectiveness assessment
- **Risk Module**: Links incidents to risk scenarios that materialized
- **Assets Module**: Tracks affected assets with impact classification
- **Evidence Module**: Manages evidence collection and chain of custody
- **Audit Module**: Generates audit trail for all incident actions
