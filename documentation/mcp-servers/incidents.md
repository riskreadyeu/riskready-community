# Incidents MCP Server

**Server name**: `riskready-incidents`
**Package**: `apps/mcp-server-incidents`
**Version**: 0.1.0

Manages security incidents, incident timelines, affected assets, control links, and lessons learned.

## Query Tools (11)

### Incidents (4)

| Tool | Description |
|------|-------------|
| `list_incidents` | List incidents with filters: status, severity, category. Paginated. |
| `get_incident` | Single incident with timeline count, affected assets, lessons learned, control links. |
| `search_incidents` | Search by reference number, title, or description. |
| `get_incident_stats` | Aggregate stats: by status, severity, category. Open incidents, CIA breach counts. |

### Incident Details (4)

| Tool | Description |
|------|-------------|
| `list_incident_timeline` | Timeline entries for an incident, ordered chronologically. |
| `list_incident_lessons` | Lessons learned for an incident. |
| `get_incident_assets` | Affected assets for an incident. |
| `get_incident_controls` | Control links (failed, bypassed, effective) for an incident. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_incident_trending` | Counts by month for last 12 months, broken down by severity. |
| `get_mttr_report` | Mean Time To Respond/Resolve: avg time from detection to containment and closure. |
| `get_incident_control_gaps` | Controls linked to incidents as failed or bypassed. |

## Mutation Tools (8)

### Incident Mutations (4)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_incident` | referenceNumber, title, description, severity, category, source, detectedAt, isConfirmed, reporterId, handlerId, incidentManagerId, sourceRef |
| `propose_update_incident` | incidentId, title, description, severity, category, confidentiality/integrity/availabilityBreach, isConfirmed, handlerId, incidentManagerId, sourceRef, source, status |
| `propose_transition_incident` | incidentId, targetStatus, resolutionType (when closing) |
| `propose_close_incident` | incidentId, resolutionType, rootCauseIdentified, lessonsLearnedCompleted, correctiveActionsIdentified, resolutionSummary |

### Asset & Control Links (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_add_incident_asset` | incidentId, assetId, impactType (COMPROMISED/AFFECTED/AT_RISK), notes |
| `propose_link_incident_control` | incidentId, controlId, linkType (failed/bypassed/effective/not_applicable), notes |

### Timeline & Lessons (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_add_timeline_entry` | incidentId, timestamp, entryType, title, description, visibility, sourceSystem |
| `propose_create_lesson` | incidentId, category, observation, recommendation, priority, targetDate, status, assignedToId, completedDate |

## Resources (4)

| URI | Description |
|-----|-------------|
| `incidents://lifecycle` | Incident status lifecycle and transitions |
| `incidents://severity` | Severity classification guide |
| `incidents://regulatory-reporting` | NIS2 and DORA regulatory reporting requirements and timelines |
| `incidents://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `incident-response` | Guide incident response workflow for a specific incident |
| `post-incident-review` | Conduct post-incident review for a closed/post-incident phase incident |
| `incident-reporting` | Generate incident status report for management or regulators |
