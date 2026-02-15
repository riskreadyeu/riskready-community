# ITSM MCP Server

**Server name**: `riskready-itsm`
**Package**: `apps/mcp-server-itsm`
**Version**: 0.1.0

Manages the Configuration Management Database (CMDB), change management, and capacity planning.

## Query Tools (25)

### Assets (4)

| Tool | Description |
|------|-------------|
| `list_assets` | List CMDB assets with filters: assetType, status, businessCriticality, dataClassification, departmentId, inIsmsScope. |
| `get_asset` | Single asset with relationships, controls, risks, installed software, capacity records. |
| `search_assets` | Search by name, asset tag, or FQDN. |
| `get_asset_security_posture` | Encryption, backup, monitoring, vulnerabilities, SCA score, risk score. |

### Asset Relationships (4)

| Tool | Description |
|------|-------------|
| `get_asset_relationships` | Asset relationships with direction filter (outgoing/incoming/all). |
| `get_asset_controls` | Control linkages for an asset with implementation status. |
| `get_asset_risks` | Risk linkages for an asset with impact levels. |
| `get_asset_business_processes` | Business process linkages for an asset. |

### Software (2)

| Tool | Description |
|------|-------------|
| `list_asset_software` | Software installed on an asset with license and approval status. |
| `search_software` | Search software by name across all assets. |

### Capacity (5)

| Tool | Description |
|------|-------------|
| `get_capacity_records` | Capacity utilization records for an asset with date range filter. |
| `list_capacity_plans` | Capacity plans with status and asset filters. |
| `get_capacity_plan` | Single capacity plan with full details. |
| `get_capacity_alerts` | Assets where utilization exceeds thresholds (CPU/memory/storage). |

### Changes (3)

| Tool | Description |
|------|-------------|
| `list_changes` | Change requests with filters: status, changeType, category, priority, securityImpact. |
| `get_change` | Single change with approvals, affected assets, history, related changes. |
| `search_changes` | Search by title, changeRef, or description. |

### Change Support (4)

| Tool | Description |
|------|-------------|
| `get_change_approvals` | Approvals for a change request. |
| `get_pending_change_approvals` | All pending approvals across all changes. |
| `get_change_history` | Audit history for a change request. |
| `list_change_templates` | Change templates for standard/pre-approved changes. |
| `get_change_template` | Single change template with instructions, backout plan, test plan. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_itsm_stats` | Aggregate stats: asset counts by type/status/criticality, change counts, capacity plan counts. |
| `get_itsm_dashboard` | Comprehensive dashboard: asset/change counts, capacity alerts, security posture summary. |
| `get_asset_risk_summary` | Per-criticality asset counts and average risk scores. |

## Mutation Tools (15)

All mutations create pending actions requiring human approval.

### Asset Mutations (6)

| Tool | Description |
|------|-------------|
| `propose_asset` | Create a new CMDB asset. See [parameter details](#propose_asset-parameters) below. |
| `propose_asset_update` | Update an existing asset. Accepts assetId + all fields from `propose_asset` (all optional). |
| `propose_delete_asset` | Delete/dispose an asset: assetId, disposalReason |
| `propose_asset_relationship` | Link two assets: fromAssetId, toAssetId, relationshipType, isCritical, description, notes |
| `propose_link_asset_control` | Link asset to control: assetId, controlId, status, implementationNotes, implementedDate, evidenceUrl, lastVerified |
| `propose_link_asset_risk` | Link asset to risk: assetId, riskId, impactLevel, notes |

#### `propose_asset` parameters

**Required**: `name`, `assetTag`, `assetType`

| Category | Parameters |
|----------|------------|
| General | displayName, assetSubtype, status, description, businessCriticality, dataClassification |
| Ownership | ownerId, custodianId, departmentId, locationId |
| Cloud | fqdn, cloudProvider, cloudRegion, cloudAccountId, cloudResourceId |
| ISMS & compliance scope | inIsmsScope, inPciScope, inDoraScope, inGdprScope, inNis2Scope, inSoc2Scope, scopeNotes |
| Data handling | handlesPersonalData, handlesFinancialData, handlesHealthData, handlesConfidentialData |
| Physical location | datacenter, rack, rackPosition |
| Lifecycle dates | purchaseDate, deploymentDate, warrantyExpiry, endOfLife, endOfSupport, disposalDate, lifecycleNotes |
| Technical | ipAddresses (JSON), macAddresses (JSON), operatingSystem, osVersion, version, patchLevel |
| Vendor | manufacturer, model, serialNumber, supportContract, supportExpiry, supportTier, vendorId |
| Financial | purchaseCost, costCurrency, annualCost, costCenter |
| Security posture | encryptionAtRest, encryptionInTransit, encryptionMethod, backupEnabled, backupFrequency, backupRetention, monitoringEnabled, loggingEnabled |
| Capacity | cpuCapacity, memoryCapacityGB, storageCapacityGB, networkBandwidthMbps, cpuThresholdPercent, memoryThresholdPercent, storageThresholdPercent, capacityNotes |
| Resilience | rtoMinutes, rpoMinutes, mtpdMinutes, targetAvailability, hasRedundancy, redundancyType, failoverAssetId |
| Metadata | typeAttributes (JSON), tags (JSON), discoverySource |

### Change Mutations (7)

| Tool | Description |
|------|-------------|
| `propose_change` | Create a change request. See [parameter details](#propose_change-parameters) below. |
| `propose_update_change` | Update a change request. Accepts changeId + all fields from `propose_change` (all optional), plus: status, actualStart, actualEnd, implementationNotes |
| `propose_approve_change` | Approve a change: changeId, comments |
| `propose_reject_change` | Reject a change: changeId, rejectionReason |
| `propose_implement_change` | Mark change as implementing: changeId, implementationNotes, actualStart |
| `propose_complete_change` | Complete a change: changeId, successful, completionNotes, testResults, lessonsLearned, pirRequired, pirNotes |
| `propose_cancel_change` | Cancel a change: changeId, cancellationReason |

#### `propose_change` parameters

**Required**: `title`, `description`, `changeType`, `category`

| Category | Parameters |
|----------|------------|
| Classification | priority, securityImpact, businessJustification |
| Planning | plannedStart, plannedEnd, backoutPlan, testPlan, maintenanceWindow |
| Impact analysis | impactAssessment, affectedServices, userImpact, riskLevel, riskAssessment |
| Execution | rollbackTime, outageRequired, estimatedDowntime, successCriteria |
| CAB | cabRequired, cabMeetingDate |
| Relationships | parentChangeId, incidentId, implementerId, departmentId, vendorId |

### Capacity Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_capacity_plan` | title, assetId, assetGroup, description, currentCapacity, currentUtilizationPercent, projectedGrowthPercent, projectionPeriodMonths, recommendedAction, estimatedCost, projectedExhaustionDate, recommendedDate, costCurrency, reviewDate |
| `propose_update_capacity_plan` | capacityPlanId, title, description, status, currentCapacity, currentUtilizationPercent, projectedGrowthPercent, projectionPeriodMonths, projectedExhaustionDate, recommendedAction, estimatedCost, costCurrency, reviewDate |

## Resources (4)

| URI | Description |
|-----|-------------|
| `itsm://reference/cmdb-classification` | CMDB asset classification taxonomy |
| `itsm://process/change-management` | Change management process reference |
| `itsm://process/capacity-management` | Capacity management process (NIS2 compliance) |
| `itsm://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `asset-risk-assessment` | Comprehensive security and risk assessment of a specific asset |
| `change-impact-analysis` | Analyze potential impact of a change across affected assets and dependencies |
| `capacity-planning-review` | Review capacity status across infrastructure and identify assets needing attention |
