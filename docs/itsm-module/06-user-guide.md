# ITSM Module - User Guide

## Getting Started

The ITSM module helps you manage your IT assets and control changes to your environment. This guide walks you through common tasks.

## Navigation

Access the ITSM module from the main sidebar. The ITSM secondary sidebar provides:

**Overview**
- Dashboard - Main overview page
- Data Quality - Asset data completeness metrics

**Asset Management**
- Asset Register - View all assets
- New Asset - Register a new asset
- Critical Assets - Filter to critical assets only
- Capacity Alerts - Assets with capacity warnings

**Cloud & Compliance**
- Cloud Dashboard - Cloud resource overview
- DORA Report - DORA compliance status

**Change Management**
- Change Register - View all changes
- New Change - Create a change request
- Change Calendar - Visual schedule
- CAB Dashboard - Change Advisory Board
- Pending Approval - Changes awaiting approval

---

## Asset Management

### Viewing the Asset Register

1. Navigate to **ITSM → Asset Register**
2. Use filters at the top to narrow down:
   - Asset Type (Server, Database, Cloud VM, etc.)
   - Status (Active, Retired, etc.)
   - Criticality (Critical, High, Medium, Low)
   - Department
3. Use the search box to find specific assets
4. Click on an asset row to view details

### Creating a New Asset

1. Navigate to **ITSM → New Asset**
2. The form is organized into sections:

#### Step 1: Select Asset Category & Type
At the top, click a category button:
- **Hardware** - Servers, Workstations, Network Devices, etc.
- **Software** - Applications, Databases, Middleware
- **Cloud** - Cloud VMs, Containers, Serverless, etc.
- **Services** - SaaS, Internal/External Services, APIs
- **Other** - Anything else

Then select the specific type within that category.

#### Step 2: Identification (Required)
- **Asset Tag** - Auto-generated based on type (e.g., `SRV-001`)
- **Name** - Descriptive name (e.g., "Production Database Server")
- **Description** - Purpose and function of the asset
- **Status** - Current lifecycle status

#### Step 3: Ownership & Classification (Required)
- **Asset Owner** - Person accountable for the asset
- **Custodian** - Person responsible for day-to-day management
- **Department** - Owning department
- **Business Criticality** - How critical is this to operations?
  - Critical (< 1 hour RTO)
  - High (< 4 hours RTO)
  - Medium (< 24 hours RTO)
  - Low (< 72 hours RTO)
- **Data Classification** - Sensitivity of data processed
  - Restricted (PII, financial, health data)
  - Confidential (internal sensitive)
  - Internal (internal use only)
  - Public (can be shared)
- **Data Handling Flags** - Toggle which data types are handled
- **Compliance Scope** - Which frameworks apply (ISMS, GDPR, DORA, etc.)

#### Step 4: Location & Environment (Optional)
Depends on asset category:
- **Hardware**: Physical location, Datacenter, Rack, Position
- **Cloud**: Provider, Region, Account ID, Resource ID
- **Software**: Deployment location, Environment
- **Services**: Provider, Data residency

#### Step 5: Technical Details (Optional)
Depends on asset type:
- **Hardware**: FQDN, IP, Manufacturer, Model, Serial, OS
- **Cloud VMs**: Instance type, vCPUs, Memory, OS
- **Databases**: Engine, Version, Port, Clustering
- **Services**: URL, Authentication method, Protocol

Plus **type-specific fields** that appear based on asset type.

#### Step 6: Security & Backup (Optional)
- Encryption at rest/in transit
- Backup enabled with frequency and retention
- Monitoring enabled

#### Step 7: Lifecycle & Financial (Optional)
- Purchase/Contract dates
- End of life/License expiry
- Costs (varies by category)
- Support contracts (for hardware/software)

#### Step 8: Resilience & Capacity (Optional)
- RTO/RPO targets
- Availability percentage
- Redundancy settings
- Capacity metrics (CPU, Memory, Storage, Network)

3. Click **Create Asset** when complete

### Editing an Asset

1. Find the asset in the Asset Register
2. Click to view details
3. Click **Edit** button
4. Make changes in the form
5. Click **Update Asset**

### Asset Lifecycle Management

Assets progress through these statuses:

```
PLANNED → PROCUREMENT → DEVELOPMENT → STAGING → ACTIVE → MAINTENANCE → RETIRING → DISPOSED
```

To change status:
1. Edit the asset
2. Change the Status field
3. Save

---

## Change Management

### Viewing Changes

1. Navigate to **ITSM → Change Register**
2. Filter by:
   - Change Type (Standard, Normal, Emergency)
   - Status (Drafted, Submitted, Approved, etc.)
   - Priority
   - Date range
3. Click a change to view details

### Creating a Change Request

1. Navigate to **ITSM → New Change**
2. Fill out the tabs:

#### Basic Information Tab
- **Title** - Brief description of the change
- **Description** - Detailed explanation
- **Change Type**:
  - Standard - Pre-approved, low-risk
  - Normal - Requires approval
  - Emergency - Urgent, expedited approval
- **Category** - Type of change (Infrastructure, Application, etc.)
- **Priority** - Urgency level
- **Security Impact** - Impact on security posture
- **Department** - Responsible department
- **Business Justification** - Why is this needed?

#### Impact Tab
- **Impacted Assets** - Select assets affected by this change
  1. Choose an asset from the dropdown
  2. Select impact type (Direct, Indirect, Dependency, Testing)
  3. Click Add
  4. Repeat for all affected assets
- **Impacted Business Processes** - Select processes affected

#### Planning & Risk Tab
- **Impact Assessment** - What will be affected?
- **User Impact** - How will users be affected?
- **Risk Level** - Overall risk of the change
- **Risk Assessment** - Detailed risk analysis
- **Test Plan** - How will you test?
- **Backout Plan** - How to rollback if it fails?
- **Rollback Time** - Estimated time to rollback
- **Success Criteria** - How will you know it worked?

#### Schedule Tab
- **Planned Start** - When will implementation begin?
- **Planned End** - When will it be complete?
- **Estimated Downtime** - Expected service outage (if any)
- **Maintenance Window** - Is this during a scheduled window?
- **Outage Required** - Will there be an outage?

#### Approval Tab
- **CAB Required** - Does this need CAB approval?
- **PIR Required** - Is post-implementation review needed?

3. Click **Save Change**

### Change Workflow

```
DRAFTED → SUBMITTED → PENDING_APPROVAL → APPROVED → SCHEDULED → IMPLEMENTING → COMPLETED
                   ↓                  ↓
               REJECTED           CANCELLED
                                      ↓
                               ROLLED_BACK → FAILED
```

1. **Draft** - Initial creation, can be edited
2. **Submit** - Send for review/approval
3. **Review** - Approvers evaluate the change
4. **Approve/Reject** - Decision made
5. **Schedule** - Set implementation time
6. **Implement** - Execute the change
7. **Complete** - Mark as done

### Change Calendar

1. Navigate to **ITSM → Change Calendar**
2. View scheduled changes on a calendar
3. Click a change to view details
4. Use month/week/day views

### CAB Dashboard

1. Navigate to **ITSM → CAB Dashboard**
2. View:
   - Pending approvals
   - Recent decisions
   - Upcoming CAB meetings
3. Click a change to review and approve/reject

---

## Data Quality

### Viewing Data Quality Metrics

1. Navigate to **ITSM → Data Quality**
2. See:
   - Overall data quality score
   - Completeness percentages:
     - Assets with owners
     - Assets with descriptions
     - Assets with classifications
     - Assets with RTO/RPO defined
   - Data quality issues:
     - Critical assets without owners (High severity)
     - Active assets without location (Medium)
     - Assets without description (Low)
     - Assets without RTO (Medium - NIS2 requirement)

### Improving Data Quality

1. Review the issues list
2. Click on issue counts to see affected assets
3. Edit assets to add missing information
4. Focus on high-severity issues first

---

## Dashboards

### ITSM Dashboard

The main dashboard shows:
- **Summary Stats**: Total assets, Active assets, Pending changes, Completed changes
- **Asset Distribution**: By type, status, criticality
- **Recent Changes**: Latest change activity
- **Quick Actions**: Shortcuts to common tasks

### Cloud Dashboard

Shows cloud-specific information:
- Cloud assets by provider
- Cloud assets by type
- Resource distribution across regions
- Cloud compliance status

### DORA Compliance Report

Shows DORA-specific compliance:
- ICT asset inventory completeness
- Third-party service register
- Change management metrics
- Incident response readiness

---

## Best Practices

### Asset Management
1. **Assign owners** - Every asset should have a clear owner
2. **Classify data** - Always specify what data the asset handles
3. **Define criticality** - Know what's most important
4. **Map dependencies** - Understand what relies on what
5. **Regular reviews** - Quarterly verification of asset data

### Change Management
1. **Plan thoroughly** - Include backout plans for all changes
2. **Document impact** - Link all affected assets
3. **Test first** - Always have a test plan
4. **Communicate** - Ensure stakeholders are informed
5. **Review results** - Complete PIR for significant changes

### Compliance
1. **Set scope flags** - Mark assets that are in regulatory scope
2. **Track RTO/RPO** - Required for NIS2 compliance
3. **Document controls** - Link assets to protecting controls
4. **Maintain accuracy** - Keep data quality score above 80%

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `n` | New asset (on Asset Register) |
| `Esc` | Close dialog/modal |

---

## Troubleshooting

### Asset tag not generating
- Ensure you've selected an asset type
- The tag is generated automatically based on type

### Can't find an asset
- Check filters are not hiding it
- Try searching by name or asset tag
- Check if it's in "Disposed" status

### Change stuck in pending
- Check who the approvers are
- Verify all required approvals are complete
- Check if CAB approval is required

### Data quality score low
- Review the issues list
- Prioritize critical assets first
- Add missing owners and classifications
