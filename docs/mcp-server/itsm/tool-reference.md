# Tool Reference

Total tools: 30 (23 query + 7 mutation)

Domains: Assets, Asset Relationships, Software Inventory, Capacity Management, Change Management, Change Approvals, Change Templates, Analysis, Mutations

All tools return JSON responses. Query tools support pagination where noted. Tools return `{ error: "...", id: "..." }` when records are not found.

---

## Asset Tools

### list_assets

List assets with filtering by type, status, criticality, department, location, cloud provider, and scope flags.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetType | string | No | - | Filter by asset type |
| status | string | No | - | Filter by asset status |
| businessCriticality | string | No | - | Filter by business criticality |
| departmentId | string | No | - | Filter by department UUID |
| locationId | string | No | - | Filter by location UUID |
| cloudProvider | string | No | - | Filter by cloud provider |
| inIsmsScope | boolean | No | - | Filter by ISMS scope inclusion |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated list with count, page info, and results array. Each asset includes id, assetTag, name, type, status, criticality, classification, risk/compliance scores, and relationship/control/vulnerability counts.

---

### get_asset

Get detailed asset information by ID including owner, custodian, relationships, business processes, controls, and installed software.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Asset UUID |

**Returns:** Complete asset record with owner/custodian user details, department, location, vendor, outgoing/incoming relationships (with connected asset names), business process links, control links, and up to 20 installed software records. Returns error object if asset not found.

---

### search_assets

Search assets by text query across name, asset tag, FQDN, and description fields.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query text |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated search results with same structure as list_assets. Case-insensitive search across name, assetTag, fqdn, and description fields.

---

### get_asset_security_posture

Get comprehensive security posture for an asset including encryption, backups, monitoring, vulnerabilities, SCA scores, and Wazuh agent status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Asset UUID |

**Returns:** Security-focused asset projection including encryption settings (at rest/in transit/method), backup configuration (enabled/frequency/lastBackupDate), monitoring/logging flags, vulnerability scan results (lastVulnScan, openVulnsCritical/High/Medium/Low, slaBreachedVulns), Wazuh agent details (agentId/status/lastCheckIn), SCA metrics (score/policyName/pass/fail/total checks), risk/compliance scores, and capacity status. Returns error if asset not found.

---

## Asset Relationship Tools

### get_asset_relationships

Get all relationships for an asset (both outgoing and incoming) with connected asset details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:** Object with outgoing array (relationships where this asset is the source), incoming array (relationships where this asset is the target), and totalRelationships count. Each relationship includes full relationship record plus fromAsset and toAsset details (assetTag, name, assetType).

---

### get_asset_controls

Get all control mappings for an asset with control details and implementation status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:** Count and array of assetControls. Each link includes the relationship record plus control details (id, controlId, name, framework, implementationStatus).

---

### get_asset_risks

Get all risk mappings for an asset with risk details including tier, status, and residual score.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:** Count and array of assetRisks. Each link includes the relationship record plus risk details (id, riskId, title, tier, status, residualScore).

---

### get_asset_business_processes

Get all business process mappings for an asset with process details including criticality and BCP status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:** Count and array of assetBusinessProcesses. Each link includes the relationship record plus business process details (id, name, processCode, criticalityLevel, bcpEnabled).

---

## Asset Software Tools

### list_asset_software

List all installed software for a specific asset ordered by software name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:** Count, assetId, and software array with all AssetSoftware records for the asset, ordered alphabetically by softwareName.

---

### search_software

Search for software installations across all assets by software name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query for software name |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated results with count, page info, and results array. Each result includes full AssetSoftware record plus hardwareAsset details (id, assetTag, name). Useful for finding all instances of specific software across the infrastructure.

---

## Capacity Management Tools

### get_capacity_records

Get capacity monitoring records for an asset ordered by most recent first.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |
| limit | number | No | 50 | Number of records to return (max 200) |

**Returns:** Count, assetId, and records array with CapacityRecord entries ordered by recordedAt descending. Records include CPU/memory/storage/network utilization percentages and timestamps.

---

### list_capacity_plans

List capacity plans with filtering by status and asset.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by capacity plan status |
| assetId | string | No | - | Filter by asset UUID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated results with count, page info, and results array. Each plan includes full CapacityPlan record plus asset details (assetTag, name) and createdBy user details (id, email, firstName, lastName). Ordered by createdAt descending.

---

### get_capacity_plan

Get detailed capacity plan information by ID including asset and creator details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Capacity plan UUID |

**Returns:** Complete CapacityPlan record with asset details and createdBy user details. Returns error object if plan not found.

---

### get_capacity_alerts

Get all assets with capacity warnings, critical alerts, or exhausted status including current utilization and thresholds.

**No parameters.**

**Returns:** Count and assets array with all assets where capacityStatus is WARNING, CRITICAL, or EXHAUSTED. Each asset includes assetTag, name, assetType, capacityStatus, current utilization percentages (CPU/memory/storage), threshold percentages, and projectedExhaustionDate. Ordered by capacityStatus descending (most critical first), then assetTag ascending.

---

## Change Management Tools

### list_changes

List changes with filtering by type, category, status, security impact, requester, and date range.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| changeType | string | No | - | Filter by change type |
| category | string | No | - | Filter by change category |
| status | string | No | - | Filter by change status |
| securityImpact | string | No | - | Filter by security impact |
| requesterId | string | No | - | Filter by requester user UUID |
| dateFrom | string | No | - | Filter by planned start date from (ISO 8601) |
| dateTo | string | No | - | Filter by planned start date to (ISO 8601) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated results with count, page info, and results array. Each change includes full Change record with requester user details (id, email, firstName, lastName), department details (id, name), and counts of approvals and assetLinks. Ordered by createdAt descending.

---

### get_change

Get detailed change information by ID including requester, implementer, approvals, linked assets, history, and parent/child changes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Change UUID |

**Returns:** Complete Change record with requester/implementer user details, department, vendor, approvals array (with approver details), assetLinks array (with asset details), history array (up to 20 most recent entries with changedBy user), childChanges array (id, changeRef, title, status), and parentChange details (id, changeRef, title). Returns error object if change not found.

---

### search_changes

Search changes by text query across title, description, and change reference.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query text |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated search results with same structure as list_changes. Case-insensitive search across title, description, and changeRef fields.

---

## Change Approval Tools

### get_change_approvals

Get all approval records for a specific change including approver details and approval status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| changeId | string | Yes | - | Change UUID |

**Returns:** Count, changeId, and approvals array with ChangeApproval records ordered by createdAt ascending. Each approval includes full approval record plus approver user details (id, email, firstName, lastName).

---

### get_pending_change_approvals

Get all pending change approvals across the system with change and approver details. Useful for approval workflow management.

**No parameters.**

**Returns:** Count and pendingApprovals array with all ChangeApproval records where status is PENDING. Each approval includes change summary (id, changeRef, title, changeType, securityImpact) and approver user details. Ordered by createdAt ascending. Limited to 100 results.

---

### get_change_history

Get complete change history for a change including all field modifications and the user who made each change.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| changeId | string | Yes | - | Change UUID |

**Returns:** Count, changeId, and history array with all ChangeHistory records ordered by createdAt ascending. Each history entry includes full ChangeHistory record plus changedBy user details (id, email, firstName, lastName). Shows field-level audit trail.

---

## Change Template Tools

### list_change_templates

List change templates with filtering by category and active status. Templates provide standardized change procedures.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | No | - | Filter by change category |
| isActive | boolean | No | - | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 100) |

**Returns:** Paginated results with count, page info, and results array of ChangeTemplate records ordered by name ascending. Templates include standardized procedures, implementation steps, backout plans, and approval requirements.

---

### get_change_template

Get detailed change template information by ID including all instructions, plans, and approval requirements.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Change template UUID |

**Returns:** Complete ChangeTemplate record with all template details. Returns error object if template not found.

---

## Analysis Tools

### get_itsm_stats

Get comprehensive ITSM statistics including asset counts by type/status/criticality, change counts by type/status, and security metrics.

**No parameters.**

**Returns:** Object with three sections: assets (total, byType array, byStatus array, byCriticality array with group counts), changes (total, byType array, byStatus array), and security (assetsWithCriticalVulns, assetsWithHighVulns, assetsOutOfIsmsScope counts). Useful for dashboard summaries and trend analysis.

---

### get_itsm_dashboard

Get ITSM dashboard summary including active asset count, assets needing attention (capacity/warranty/vulnerabilities), open changes, and pending approvals.

**No parameters.**

**Returns:** Object with assets section (active count, needingAttention breakdown for capacityWarnings/expiringWarranties/criticalVulnerabilities), changes section (open count, byStatus array), and approvals section (pending count). Focuses on actionable items requiring attention. Expiring warranties means warrantyExpiry within next 30 days.

---

### get_asset_risk_summary

Get top 20 assets by risk score including vulnerability counts, compliance scores, and capacity status. Useful for risk prioritization.

**No parameters.**

**Returns:** Count and topRiskyAssets array with top 20 assets ordered by riskScore descending. Each asset includes assetTag, name, assetType, riskScore, complianceScore, openVulnsCritical, openVulnsHigh, and capacityStatus. Only includes assets with non-null riskScore.

---

## Mutation Tools

All mutation tools follow a proposal pattern: they create pending actions in the approval queue rather than directly modifying data. Each tool returns an actionId and status: "PENDING". Human reviewers approve or reject these actions through the web UI.

### propose_asset

Propose registering a new asset in the CMDB.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assetTag | string | Yes | - | Asset tag (e.g. AST-SRV-001) |
| name | string | Yes | - | Asset name |
| assetType | string | Yes | - | Asset type: SERVER, WORKSTATION, LAPTOP, MOBILE_DEVICE, NETWORK_DEVICE, STORAGE_DEVICE, SECURITY_APPLIANCE, IOT_DEVICE, PRINTER, OTHER_HARDWARE, OPERATING_SYSTEM, APPLICATION, DATABASE, MIDDLEWARE, CLOUD_VM, CLOUD_CONTAINER, CLOUD_DATABASE, CLOUD_STORAGE, CLOUD_NETWORK, CLOUD_SERVERLESS, CLOUD_KUBERNETES, INTERNAL_SERVICE, EXTERNAL_SERVICE |
| businessCriticality | string | No | MEDIUM | Business criticality: CRITICAL, HIGH, MEDIUM, LOW |
| description | string | No | - | Asset description |
| reason | string | No | - | Explain WHY this asset should be added (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission, actionId, and status: "PENDING". Returns error if organisation not found or assetTag already exists.

---

### propose_asset_update

Propose updating an existing asset.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assetId | string | Yes | - | Asset UUID to update |
| fields | object | Yes | - | Fields to update as key-value pairs |
| reason | string | No | - | Explain WHY this update is needed (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission, actionId, status: "PENDING", and fieldsToUpdate list. Returns error if organisation or asset not found.

---

### propose_change

Propose creating a new change request.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| changeRef | string | Yes | - | Change reference number (e.g. CHG-2024-001) |
| title | string | Yes | - | Change title |
| description | string | Yes | - | Detailed change description |
| changeType | string | Yes | - | Change type: STANDARD, NORMAL, or EMERGENCY |
| category | string | Yes | - | Change category |
| securityImpact | string | No | - | Security impact level |
| reason | string | No | - | Explain WHY this change is needed (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission, actionId, and status: "PENDING". Returns error if organisation not found.

---

### propose_asset_relationship

Propose creating a relationship between two assets (e.g. DEPENDS_ON, RUNS_ON, CONNECTS_TO).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| fromAssetId | string | Yes | - | Source asset UUID |
| toAssetId | string | Yes | - | Target asset UUID |
| relationshipType | string | Yes | - | Relationship type: DEPENDS_ON, RUNS_ON, HOSTED_ON, DEPLOYED_TO, CONNECTS_TO, STORES_DATA_ON, READS_FROM, WRITES_TO, REPLICATES_TO, MANAGED_BY, MONITORED_BY, BACKED_UP_TO, FAILS_OVER_TO, PROTECTED_BY, AUTHENTICATES_VIA |
| isCritical | boolean | No | false | Is this a critical dependency? |
| description | string | No | - | Relationship description |
| reason | string | No | - | Explain WHY these assets are related (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission with relationship details, actionId, and status: "PENDING". Returns error if organisation or either asset not found.

---

### propose_link_asset_control

Propose linking an asset to a control (e.g. firewall protects server).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assetId | string | Yes | - | Asset UUID |
| controlId | string | Yes | - | Control UUID |
| status | string | No | planned | Implementation status: planned, in_progress, implemented, verified, not_applicable |
| implementationNotes | string | No | - | Notes on how the control applies to this asset |
| reason | string | No | - | Explain WHY this link should exist (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission with asset and control details, actionId, and status: "PENDING". Returns error if organisation, asset, or control not found.

---

### propose_link_asset_risk

Propose linking an asset to a risk (asset is exposed to this risk).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assetId | string | Yes | - | Asset UUID |
| riskId | string | Yes | - | Risk UUID |
| impactLevel | string | No | - | Impact if this asset is compromised: critical, high, medium, low |
| notes | string | No | - | Notes on the risk exposure |
| reason | string | No | - | Explain WHY this asset is exposed to this risk (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission with asset and risk details, actionId, and status: "PENDING". Returns error if organisation, asset, or risk not found.

---

### propose_capacity_plan

Propose creating a capacity plan for an asset or asset group.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assetId | string | No | - | Asset UUID (optional if using assetGroup) |
| assetGroup | string | No | - | Asset group name (optional if using assetId) |
| title | string | Yes | - | Capacity plan title |
| description | string | No | - | Plan description |
| currentCapacity | string | Yes | - | Current capacity description |
| currentUtilizationPercent | number | No | - | Current utilization % (0-100) |
| projectedGrowthPercent | number | No | - | Projected growth % |
| projectionPeriodMonths | number | No | - | Projection period in months |
| recommendedAction | string | No | - | Recommended action |
| reason | string | No | - | Explain WHY this plan is needed (shown to human reviewers) |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** Message confirming proposal submission with target (asset or group) and title, actionId, and status: "PENDING". Returns error if organisation not found or if assetId specified but not found.

---
