# Resources and Prompts

## Resources

Resources provide reference documentation and process guides that LLM agents can access for context.

### cmdb-classification

**Name:** cmdb-classification

**URI:** itsm://reference/cmdb-classification

**Description:** Comprehensive CMDB asset classification guide covering asset types, business criticality levels, data classification, and asset status lifecycle.

**Content Includes:**

- **Asset Types:** Hardware (SERVER, WORKSTATION, LAPTOP, MOBILE_DEVICE, NETWORK_DEVICE, STORAGE_DEVICE, SECURITY_APPLIANCE, IOT_DEVICE, PRINTER, OTHER_HARDWARE), Software (OPERATING_SYSTEM, APPLICATION, DATABASE, MIDDLEWARE), Cloud (CLOUD_VM, CLOUD_CONTAINER, CLOUD_DATABASE, CLOUD_STORAGE, CLOUD_NETWORK, CLOUD_SERVERLESS, CLOUD_KUBERNETES), Service (INTERNAL_SERVICE, EXTERNAL_SERVICE, SAAS_APPLICATION, API_ENDPOINT), Data (DATA_STORE, DATA_FLOW)

- **Business Criticality Levels:** CRITICAL (maximum RTO 4 hours, RPO 1 hour), HIGH (maximum RTO 8 hours, RPO 4 hours), MEDIUM (maximum RTO 24 hours, RPO 8 hours), LOW (maximum RTO 72 hours, RPO 24 hours)

- **Data Classification:** HIGHLY_CONFIDENTIAL (encryption required, access logging required), CONFIDENTIAL (encryption recommended, access controls required), INTERNAL (basic access controls required), PUBLIC (no special controls)

- **Asset Status Lifecycle:** PLANNED, PROCUREMENT, DEVELOPMENT, STAGING, ACTIVE, MAINTENANCE, RETIRING, DISPOSED

---

### change-management-process

**Name:** change-management-process

**URI:** itsm://process/change-management

**Description:** Complete change management process guide including change types, categories, security impact levels, CAB procedures, approval requirements, implementation windows, and NIS2 compliance requirements.

**Content Includes:**

- **Change Types:** STANDARD (pre-approved, low-risk, can execute immediately), NORMAL (requires CAB review, minimum 5 business days timeline), EMERGENCY (expedited for critical incidents, ECAB approval, must be reviewed within 24 hours)

- **Change Categories:** ACCESS_CONTROL, CONFIGURATION, INFRASTRUCTURE, APPLICATION, DATABASE, SECURITY, NETWORK, BACKUP_DR, MONITORING, VENDOR, DOCUMENTATION, OTHER

- **Security Impact Levels:** CRITICAL (requires CISO approval), HIGH (requires Security Team review), MEDIUM (security consideration in CAB review), LOW (standard security review), NONE (no security impact)

- **CAB Structure:** Membership, schedule (weekly for NORMAL, ad-hoc for EMERGENCY), responsibilities, approval requirements

- **Implementation Windows:** Standard window (Saturday 22:00 - Sunday 06:00 UTC), Secondary window (Wednesday 22:00 - 02:00 UTC), Blackout periods (end of quarter, peak business periods, holidays)

- **Change Process Steps:** Request submission, initial review, impact assessment, CAB review, scheduling, communication, implementation, verification, documentation, PIR, closure

- **NIS2 Compliance Requirements:** Documentation of all changes to critical systems, change log retention (minimum 2 years), risk assessments for essential services, rollback procedures, incident reporting, cybersecurity impact assessment

---

### capacity-management

**Name:** capacity-management

**URI:** itsm://process/capacity-management

**Description:** Capacity management guide covering NIS2 requirements, capacity metrics, status levels, planning process, alerting and escalation procedures, and integration with ITSM processes.

**Content Includes:**

- **NIS2 Requirements:** Monitor capacity of critical ICT systems, implement early warning mechanisms, maintain capacity plans for essential services, document thresholds and escalation procedures, review plans annually

- **Capacity Metrics:** CPU (Normal < 70%, Warning 70-85%, Critical > 85%, Exhausted > 95%), Memory (Normal < 75%, Warning 75-85%, Critical > 85%, Exhausted > 90%), Storage (Normal < 70%, Warning 70-80%, Critical > 80%, Exhausted > 90%), Network (Normal < 60%, Warning 60-75%, Critical > 75%, Exhausted > 85%)

- **Capacity Status Levels:** NORMAL (continue monitoring), WARNING (proactive planning recommended, review within 30 days), CRITICAL (urgent action required, plan within 7 days, management notification), EXHAUSTED (immediate action, emergency change may be needed, executive escalation, daily reporting), UNKNOWN (monitoring failure, fix as priority)

- **Capacity Planning Process:** Data collection (minimum 30 days historical data), trend analysis, capacity planning (short/medium/long term), risk assessment, recommendation and approval, implementation and monitoring

- **Alerting and Escalation:** WARNING (daily digest, 30-day action timeline), CRITICAL (immediate notification, 7-day plan requirement, 14-day escalation), EXHAUSTED (immediate page, 4-hour updates, CTO/CIO escalation)

- **Best Practices:** Proactive monitoring, automation, documentation, regular reviews, threshold tuning, business alignment, cost optimization, cloud elasticity, decommissioning unused capacity, testing capacity limits

- **ITSM Integration:** Incident management (capacity issues trigger incidents), change management (capacity improvements follow change process), configuration management (CMDB tracks capacity specs), availability management (capacity affects SLA targets)

---

## Prompts

Prompts provide guided workflows for common analysis tasks, instructing the LLM on how to use multiple tools in sequence to achieve complex objectives.

### asset-risk-assessment

**Name:** asset-risk-assessment

**Description:** Perform a comprehensive risk assessment for a specific asset by analyzing its security posture, vulnerabilities, control mappings, and risk associations.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| assetId | string | Asset UUID to assess |

**Workflow Steps:**

1. **Get Asset Details** - Use get_asset to retrieve basic asset information, noting type, criticality, classification, and status

2. **Analyze Security Posture** - Use get_asset_security_posture to evaluate encryption status, backup configuration, monitoring/logging, vulnerability counts, SLA breaches, Wazuh agent status, SCA scores, risk/compliance scores, and capacity status

3. **Review Control Mappings** - Use get_asset_controls to see mapped controls, identify gaps or poor implementation status, note frameworks involved

4. **Identify Risk Associations** - Use get_asset_risks to see linked risks, review tiers/status/scores, identify highest-impact risks

5. **Assess Business Impact** - Use get_asset_business_processes to understand dependencies, note critical processes, evaluate BCP coverage

6. **Synthesize Assessment** - Provide comprehensive report including overall risk rating, key security concerns (top 3-5), vulnerability summary, control effectiveness, business impact, prioritized recommendations, and compliance considerations

**Output Format:** Professional assessment suitable for presentation to management or security teams.

---

### change-impact-analysis

**Name:** change-impact-analysis

**Description:** Analyze the potential impact of a change by examining linked assets, their relationships, dependencies, and associated business processes.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| changeId | string | Change UUID to analyze |

**Workflow Steps:**

1. **Get Change Details** - Use get_change to retrieve change request details, noting type, category, security impact, planned dates, description, requester, implementer, department, approval status, and directly linked assets

2. **Analyze Direct Asset Impact** - For each linked asset, use get_asset to get details (type, status, criticality, classification) and identify change impact type

3. **Map Asset Dependencies** - For each linked asset, use get_asset_relationships to identify upstream and downstream dependencies, note relationship types (RUNS_ON, CONNECTS_TO, etc.), flag critical relationships

4. **Assess Business Process Impact** - For each linked asset, use get_asset_business_processes to identify affected processes, note criticality levels, identify BCP-enabled processes, determine owners

5. **Evaluate Security Impact** - Review stated security impact level, use get_asset_security_posture to understand implications, identify if changes affect authentication/authorization, encryption, backups, monitoring, or compliance

6. **Review Change History** - Use get_change_history to see modifications and additional context

7. **Check Approval Status** - Use get_change_approvals to see workflow and any concerns raised

8. **Synthesize Impact Analysis** - Provide comprehensive analysis including change overview, direct impact, indirect impact, business process impact, risk assessment, blast radius, rollback complexity, communication requirements, recommended actions (testing/approvals/communication/monitoring/verification), and implementation considerations

**Output Format:** Clear, structured format suitable for CAB review or management decision-making.

---

### capacity-planning-review

**Name:** capacity-planning-review

**Description:** Review capacity status across the infrastructure, identify assets at risk of capacity exhaustion, and provide recommendations for capacity planning.

**Parameters:** None (system-wide analysis)

**Workflow Steps:**

1. **Get Capacity Alerts** - Use get_capacity_alerts to identify assets with issues, categorize by status (WARNING/CRITICAL/EXHAUSTED), note which resources are under stress

2. **Review Infrastructure Statistics** - Use get_itsm_stats to understand asset landscape, identify types and distribution, note counts by status and criticality

3. **Review Existing Capacity Plans** - Use list_capacity_plans to see existing plans, filter by status (DRAFT/PENDING_APPROVAL/APPROVED/IN_PROGRESS), identify coverage gaps

4. **Analyze Capacity Patterns** - For critical assets with issues, use get_capacity_records to retrieve historical data, look for trends (steady growth/spikes/cycles), identify concerning growth rates

5. **Assess Business Criticality** - Cross-reference capacity alerts with asset criticality, prioritize CRITICAL and HIGH assets, consider data classification and scope (ISMS/PCI/DORA)

6. **Review Asset Dependencies** - For capacity-constrained assets, use get_asset_relationships to identify dependencies, determine cascade potential, identify shared infrastructure bottlenecks

7. **Synthesize Capacity Review** - Provide comprehensive review including executive summary, critical alerts (with asset details/utilization/projected exhaustion/business impact), warning status assets, capacity trends, gap analysis (assets with issues but no plans), risk assessment by criticality, recommendations (immediate 0-30 days, short-term 30-90 days, medium-term 3-12 months), budget considerations, NIS2 compliance status

8. **Prioritization Matrix** - Create priority matrix based on business criticality, capacity status, time to exhaustion, and cost to remediate

**Output Format:** Management-ready review suitable for IT planning meetings or budget discussions with specific actionable recommendations and timeframes.

---
