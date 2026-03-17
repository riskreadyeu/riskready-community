# Supply Chain Module - User Guide

This guide provides step-by-step instructions for common workflows in the Supply Chain module.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Vendor Management](#vendor-management)
3. [Risk Assessments](#risk-assessments)
4. [Contract Management](#contract-management)
5. [Ongoing Monitoring](#ongoing-monitoring)
6. [Regulatory Reporting](#regulatory-reporting)

---

## Getting Started

### Accessing the Module

Navigate to the Supply Chain module from the main navigation:

1. Click **Supply Chain** in the main menu
2. You'll land on the **Dashboard** showing key metrics

### Dashboard Overview

The dashboard provides at-a-glance visibility into:

| Section | Information |
|---------|-------------|
| **Vendor Summary** | Total vendors by tier and status |
| **Assessments** | In-progress, due soon, overdue |
| **Contracts** | Expiring soon, requiring attention |
| **Alerts** | Critical actions required |
| **Recent Activity** | Latest changes and updates |

### Navigation Sidebar

The left sidebar organizes features by category:

- **Overview**: Dashboard, Concentration Risk
- **Vendor Management**: Register, New Vendor, Critical Vendors, DORA Scope
- **Risk Assessment**: Assessments, New Assessment, Findings
- **Contracts**: Register, Expiring Soon
- **Ongoing Monitoring**: Reviews, SLA Tracking, Incidents, Exit Plans
- **Regulatory**: DORA Report, Question Bank

---

## Vendor Management

### Adding a New Vendor

1. Navigate to **Vendor Management > New Vendor**
2. Fill in the vendor information:

**Basic Information:**
- Name (required)
- Legal Name
- Description
- Vendor Type (Service Provider, Software Vendor, etc.)

**Contact Information:**
- Primary Contact (Name, Email, Phone)
- Security Contact
- Legal Contact

**Regulatory Scope:**
- ☐ In DORA Scope
- ☐ In NIS2 Scope
- ☐ ICT Service Provider
- ☐ Critical ICT Provider
- ☐ Supports Essential Functions

**Certifications:**
- ☐ ISO 27001 Certified (with expiry date)
- ☐ SOC 2 Type II
- ☐ ISO 22301 (Business Continuity)

3. Click **Create Vendor**
4. The system generates a unique vendor code (e.g., VND-001)

### Viewing Vendor Details

1. Navigate to **Vendor Management > Vendor Register**
2. Click on a vendor name
3. The detail page shows:
   - Overview tab: Basic info, regulatory scope, certifications
   - Assessments tab: History of risk assessments
   - Contracts tab: Active and past contracts
   - Services tab: What services they provide
   - Documents tab: Uploaded evidence and certificates

### Updating Vendor Tier

The tier can be updated automatically or manually:

**Automatic Calculation:**
1. Complete a vendor assessment
2. Click **Calculate Tier** on the vendor detail page
3. Review the calculated tier and factors
4. Accept or override

**Manual Override:**
1. Go to vendor detail page
2. Click **Edit Tier**
3. Select new tier
4. Provide justification (required for audit trail)
5. Save

### Filtering Vendors

Use the filter options in the Vendor Register:

- **By Tier**: Critical, High, Medium, Low
- **By Status**: Active, Assessment, Prospect, etc.
- **By Scope**: DORA, NIS2, GDPR
- **Search**: By name or vendor code

Quick filters are available in the sidebar:
- **Critical Vendors**: Shows only CRITICAL tier
- **DORA Scope**: Shows vendors in DORA scope

---

## Risk Assessments

### Creating a New Assessment

1. Navigate to **Risk Assessment > New Assessment**
2. Select the vendor
3. Configure assessment scope:

**Assessment Type:**
- Initial (first-time assessment)
- Periodic (scheduled recurring)
- Ad-hoc (triggered by event)
- Reassessment (follow-up)
- Exit (during offboarding)

**Frameworks to Include:**
- ☐ ISO 27001 (baseline - always included)
- ☐ NIS2 (for NIS2-scope vendors)
- ☐ DORA (for DORA-scope vendors)

**Target Tier:**
- Determines which questions are included
- CRITICAL: All 223 questions
- HIGH: 211 questions
- MEDIUM/LOW: 176 questions

4. Set due date
5. Assign assessor
6. Click **Create Assessment**

### Completing an Assessment

1. Navigate to **Risk Assessment > Assessments**
2. Click on an IN_PROGRESS assessment
3. The assessment is organized by domain (16 domains)

**For each question:**
1. Read the question text
2. Review the guidance notes (click ℹ️)
3. Select a score (1-5 scale):
   - 1 = None (no control)
   - 2 = Informal (ad-hoc)
   - 3 = Developing (partial)
   - 4 = Defined (documented)
   - 5 = Optimized (mature)
   - 0 = N/A (not applicable)
4. Provide a response/notes
5. Add evidence (text or URL)
6. Click **Save** (auto-saves as you go)

**Progress Tracking:**
- Progress bar shows completion percentage
- Domain tabs show completion status
- Unanswered questions are highlighted

### Submitting for Review

1. Complete all required questions
2. Click **Submit for Review**
3. Assessment moves to PENDING_REVIEW status
4. Reviewer is notified

### Reviewing an Assessment

1. Navigate to assessment in PENDING_REVIEW status
2. Review each response:
   - Verify scores are appropriate
   - Check evidence is adequate
   - Add reviewer notes
3. Create findings for issues (see below)
4. Click **Complete Review**

### Creating Findings

When you identify issues during assessment:

1. Click **Add Finding**
2. Fill in:
   - Title
   - Description
   - Severity (Critical, High, Medium, Low, Informational)
   - Related domain
   - Related questions
   - Remediation plan
   - Due date
3. Click **Create Finding**

### Managing Findings

View all findings: **Risk Assessment > Open Findings**

**Finding Workflow:**
1. **OPEN**: Newly created
2. **IN_PROGRESS**: Remediation underway
3. **REMEDIATED**: Fixed, pending verification
4. **CLOSED**: Verified and closed
5. **ACCEPTED**: Risk accepted (requires justification)

To update a finding:
1. Open the finding
2. Update status
3. Add notes on progress
4. For closure: Verify remediation was effective

---

## Contract Management

### Creating a Contract

1. Navigate to **Contracts > Contract Register**
2. Click **New Contract**
3. Select the vendor
4. Fill in contract details:

**Basic Information:**
- Title (e.g., "Master Service Agreement")
- Contract Type (MSA, SOW, NDA, DPA, SLA)
- Description

**Dates:**
- Effective Date
- Expiry Date
- Signed Date

**Value:**
- Contract Value
- Currency
- Payment Terms

**Renewal Terms:**
- ☐ Auto Renewal
- Renewal Term (months)
- Notice Period (days)

5. If vendor is in DORA scope, additional fields appear for Article 30 compliance
6. Click **Create Contract**

### DORA Article 30 Compliance

For DORA-scope vendors, track contract clause compliance:

1. Open contract detail page
2. Go to **DORA Art.30** tab
3. Check each clause as you verify:
   - ☐ Full service description
   - ☐ Data processing locations
   - ☐ Location change notification
   - ☐ Availability & quality objectives
   - ☐ Incident assistance provisions
   - ☐ Full audit rights
   - ☐ Regulatory access rights
   - ☐ Termination rights
   - ☐ Exit/transition provisions
   - ☐ Subcontracting conditions
   - ☐ Data protection clauses

Progress is tracked and displayed as percentage complete.

### Contract Expiry Alerts

The system automatically tracks contract expiry:

- **Dashboard Alert**: Contracts expiring within 30 days
- **Expiring Soon Filter**: View all contracts expiring within 90 days
- **Email Notifications**: (if configured)

To renew a contract:
1. Open contract detail
2. Click **Renew**
3. Update dates and terms
4. Save

---

## Ongoing Monitoring

### Scheduling Reviews

Reviews are scheduled based on vendor tier:

| Tier | Frequency |
|------|-----------|
| CRITICAL | Quarterly |
| HIGH | Semi-annually |
| MEDIUM | Annually |
| LOW | Biennially |

**To schedule a review:**
1. Navigate to **Ongoing Monitoring > Reviews**
2. Click **Schedule Review**
3. Select vendor
4. Choose review type:
   - Periodic
   - Incident-triggered
   - Contract renewal
   - Performance
   - Compliance
5. Set scheduled date
6. Assign reviewer
7. Save

### Completing a Review

1. Open review in SCHEDULED or IN_PROGRESS status
2. Complete review sections:
   - Performance score (1-100)
   - SLA compliance percentage
   - Summary
   - Findings
   - Recommendations
   - Action items
3. Update tier if needed (with justification)
4. Click **Complete Review**

### SLA Tracking

Monitor vendor SLA performance:

1. Navigate to **Ongoing Monitoring > SLA Tracking**
2. View SLA metrics by vendor:
   - Target vs. Actual values
   - Status (Met, At Risk, Breached)
   - Trend over time
3. Filter by vendor or status
4. Add new SLA records as measurements come in

### Managing Incidents

When a vendor-related incident occurs:

1. Navigate to **Ongoing Monitoring > Incidents**
2. Click **Report Incident**
3. Fill in:
   - Title
   - Vendor
   - Description
   - Incident Type (Security Breach, Service Outage, etc.)
   - Severity
   - Detection Date/Time
4. Track NIS2 timeline:
   - 24-hour initial notification
   - 72-hour full report
   - 1-month final report
5. Update as incident progresses through resolution

### Exit Planning

For critical vendors, maintain exit plans (DORA requirement):

1. Navigate to **Ongoing Monitoring > Exit Plans**
2. Click **Create Exit Plan**
3. Fill in:
   - Vendor
   - Title
   - Description
   - Trigger scenarios covered:
     - ☐ Service interruptions
     - ☐ Provider failures
     - ☐ Contract termination
     - ☐ Provider insolvency
     - ☐ Regulatory-mandated exit
   - Transition period (days)
   - Alternative vendors identified
   - Data extraction plan
   - Service transition plan
4. Schedule regular testing
5. Document test results

**Testing Exit Plans:**
1. Open exit plan
2. Click **Record Test**
3. Document:
   - Test date
   - Test scenario
   - Results
   - Issues found
   - Remediation actions
4. Update status to TESTED

---

## Regulatory Reporting

### DORA ICT Register

Generate DORA Article 28 third-party register:

1. Navigate to **Regulatory > DORA Report**
2. View all DORA-scope vendors with:
   - Vendor details
   - LEI codes
   - Critical ICT provider flag
   - Data locations
   - Contract compliance status
   - Exit plan status
3. Click **Export** for CSV download

### Concentration Risk Analysis

Identify single points of failure:

1. Navigate to **Overview > Concentration Risk**
2. Review:
   - **By Service Type**: One vendor for critical services
   - **By Geography**: Vendor distribution by country
   - **Third-Country Exposure**: Data outside EU/EEA
3. Action items highlight risks requiring attention

### Question Bank

Explore and manage assessment questions:

1. Navigate to **Regulatory > Question Bank**
2. Browse 223 questions across 16 domains
3. Filter by:
   - Framework (ISO, NIS2, DORA)
   - Domain
   - Risk weight
   - Tier applicability
4. View question details:
   - Full question text
   - Regulatory reference
   - Expected evidence
   - Guidance notes

---

## Best Practices

### For Vendor Onboarding

1. ✓ Create vendor record as PROSPECT
2. ✓ Complete INITIAL assessment before contracting
3. ✓ Verify certifications (ISO 27001, SOC 2)
4. ✓ Ensure DORA Article 30 clauses in contract
5. ✓ Create exit plan for critical vendors
6. ✓ Schedule first periodic review

### For Assessment Management

1. ✓ Use appropriate frameworks for vendor scope
2. ✓ Request evidence for high-risk questions
3. ✓ Create findings for scores ≤ 2
4. ✓ Set realistic remediation deadlines
5. ✓ Follow up on open findings

### For Contract Management

1. ✓ Include all DORA Article 30 clauses
2. ✓ Set renewal alerts (90 days before expiry)
3. ✓ Review before auto-renewal
4. ✓ Document termination rights clearly

### For Ongoing Monitoring

1. ✓ Schedule reviews based on tier
2. ✓ Track SLA metrics monthly
3. ✓ Report incidents within 24 hours (NIS2)
4. ✓ Test exit plans annually for critical vendors
5. ✓ Update tier after each review

---

## Troubleshooting

### Common Issues

**"Cannot submit assessment"**
- Ensure all required questions are answered
- Check for validation errors

**"Vendor tier not calculating"**
- Complete at least one assessment
- Verify services are defined

**"DORA report missing vendors"**
- Check vendor has `inDoraScope = true`
- Verify vendor is ACTIVE status

**"Contract compliance incomplete"**
- Navigate to DORA Art.30 tab
- Check each applicable clause

### Getting Help

For additional support:
- Review this documentation
- Contact your administrator
- Check system logs for error details
