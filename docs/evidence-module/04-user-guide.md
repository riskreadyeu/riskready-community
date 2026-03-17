# Evidence Module - User Guide

This guide provides step-by-step instructions for common workflows in the Evidence module.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Evidence](#managing-evidence)
3. [Evidence Requests](#evidence-requests)
4. [Linking Evidence](#linking-evidence)
5. [Evidence Review & Approval](#evidence-review--approval)
6. [Reporting & Monitoring](#reporting--monitoring)
7. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Module

Navigate to the Evidence module from the main navigation:

1. Click **Evidence** in the main menu
2. You'll land on the **Dashboard** showing key metrics

### Dashboard Overview

The dashboard provides at-a-glance visibility into:

| Section | Information |
|---------|-------------|
| **Evidence Summary** | Total evidence by status and type |
| **Expiring Soon** | Evidence expiring within 30 days |
| **Pending Review** | Evidence awaiting approval |
| **Open Requests** | Evidence requests needing attention |
| **Recent Activity** | Latest uploads and changes |

### Navigation Sidebar

The left sidebar organizes features by category:

- **Overview**: Dashboard, Statistics
- **Evidence Management**: Repository, Upload, Expiring
- **Requests**: All Requests, My Requests, Create Request
- **Reports**: Coverage, Compliance

---

## Managing Evidence

### Uploading New Evidence

1. Navigate to **Evidence > Repository**
2. Click **Upload Evidence** button
3. Fill in the evidence information:

**Basic Information:**
- Title (required)
- Description
- Evidence Type (Document, Certificate, Report, etc.)
- Classification (Public, Internal, Confidential, Restricted)
- Category and Subcategory (optional)
- Tags (for filtering)

**File Information:**
- Upload file or provide URL
- File is automatically hashed (SHA-256, MD5)

**Validity:**
- Valid From date
- Valid Until date (for certificates, reports)
- Retention Until date

**Source:**
- Source Type (Manual Upload, Automated, Vendor Provided)
- Collection Method
- Collector (defaults to you)

4. Click **Upload**
5. Evidence is created with status `PENDING`

### Viewing Evidence Details

1. Navigate to **Evidence > Repository**
2. Click on an evidence title
3. The detail page shows:
   - **Overview tab**: Basic info, file details, validity
   - **Links tab**: Connected controls, incidents, vendors, etc.
   - **History tab**: Version history and audit trail
   - **Actions**: Review, approve, archive, create new version

### Updating Evidence

1. Open evidence detail page
2. Click **Edit**
3. Update the desired fields
4. Click **Save**

Note: Changes are tracked in the audit trail.

### Creating a New Version

When evidence needs to be updated (e.g., annual certificate renewal):

1. Open the existing evidence detail page
2. Click **Create New Version**
3. Upload the new file
4. Update validity dates
5. Click **Create Version**

The new version:
- Gets a new evidence reference (EVD-YYYY-NNNN)
- Links to the previous version
- Previous version is automatically archived

### Archiving Evidence

To archive evidence that's no longer active but needs retention:

1. Open evidence detail page
2. Click **Archive**
3. Confirm the action

Archived evidence:
- Remains searchable
- Links are preserved
- Cannot be modified

### Deleting Evidence

⚠️ **Warning**: Deletion is permanent and removes all links.

1. Open evidence detail page
2. Click **Delete**
3. Confirm by typing the evidence reference
4. Click **Confirm Delete**

---

## Evidence Requests

### Creating an Evidence Request

When you need evidence from someone else:

1. Navigate to **Evidence > Requests**
2. Click **Create Request**
3. Fill in the request details:

**Request Details:**
- Title (required)
- Description (what evidence is needed)
- Evidence Type (optional, specify if known)
- Required Format (PDF, screenshot, etc.)
- Acceptance Criteria (what makes it acceptable)

**Assignment:**
- Assign to User (specific person)
- OR Assign to Department (any team member)

**Context (what is this for):**
- Context Type: Control, Audit, Incident, Risk, etc.
- Context Reference: e.g., "A.9.2.5", "NC-2025-001"

**Timeline:**
- Priority: Low, Medium, High, Critical
- Due Date (required)

4. Click **Create Request**
5. Assignee is notified

### Fulfilling an Evidence Request

When you receive an evidence request:

1. Navigate to **Evidence > Requests > My Requests**
2. Click on the request to view details
3. Click **Start Progress** to indicate you're working on it
4. Gather the required evidence:
   - Upload new evidence, OR
   - Link existing evidence
5. Click **Submit Evidence**
6. Select the evidence to submit
7. Add any notes
8. Click **Submit**

### Reviewing Submitted Evidence

As the requester, when evidence is submitted:

1. Navigate to **Evidence > Requests**
2. Find requests with status `SUBMITTED`
3. Click to view the request
4. Review the submitted evidence:
   - Click on evidence to view details
   - Verify it meets acceptance criteria
5. Choose action:
   - **Accept**: Evidence is satisfactory
   - **Reject**: Evidence doesn't meet criteria (provide reason)

### Request Workflow

```
OPEN → IN_PROGRESS → SUBMITTED → ACCEPTED
                         ↓
                     REJECTED → (back to IN_PROGRESS)
```

---

## Linking Evidence

### Linking Evidence to a Control

To demonstrate control effectiveness:

1. Open evidence detail page
2. Go to **Links** tab
3. Click **Add Link**
4. Select **Control** as entity type
5. Search and select the control
6. Choose link type:
   - **design**: Evidence of control design
   - **implementation**: Evidence of implementation
   - **operating**: Evidence of ongoing operation
   - **general**: General supporting evidence
7. Add notes (optional)
8. Click **Link**

### Linking Evidence to an Incident

For forensic evidence or incident documentation:

1. Open evidence detail page
2. Go to **Links** tab
3. Click **Add Link**
4. Select **Incident** as entity type
5. Search and select the incident
6. Choose link type:
   - **forensic**: Forensic investigation evidence
   - **communication**: Internal/external communications
   - **notification**: Regulatory notifications
   - **lessons_learned**: Post-incident review
7. Add notes
8. Click **Link**

### Linking Evidence to a Vendor

For vendor certifications and assessments:

1. Open evidence detail page
2. Go to **Links** tab
3. Click **Add Link**
4. Select **Vendor** as entity type
5. Search and select the vendor
6. Choose link type:
   - **certification**: ISO 27001, SOC 2 certificates
   - **soc_report**: SOC 2 Type II reports
   - **assessment**: Questionnaire responses
   - **contract**: Contract documents
7. Add notes
8. Click **Link**

### Viewing All Links

To see everything an evidence is linked to:

1. Open evidence detail page
2. Go to **Links** tab
3. View links grouped by entity type

### Removing a Link

1. Open evidence detail page
2. Go to **Links** tab
3. Find the link to remove
4. Click the **X** or **Unlink** button
5. Confirm the action

---

## Evidence Review & Approval

### Submitting Evidence for Review

After uploading evidence:

1. Open evidence detail page
2. Verify all information is correct
3. Click **Submit for Review**
4. Evidence status changes to `UNDER_REVIEW`

### Reviewing Evidence

As a reviewer:

1. Navigate to **Evidence > Repository**
2. Filter by status: `UNDER_REVIEW`
3. Click on evidence to review
4. Check:
   - Title and description are accurate
   - Classification is appropriate
   - File is correct and complete
   - Integrity hashes are present (for forensic evidence)
   - Validity dates are correct
5. Add review notes
6. Choose action:
   - **Approve**: Evidence is acceptable
   - **Reject**: Evidence needs correction (provide reason)

### Approval Workflow

```
PENDING → UNDER_REVIEW → APPROVED
               ↓
           REJECTED → (uploader corrects) → PENDING
```

### Handling Rejections

If your evidence is rejected:

1. View the rejection reason
2. Correct the issues:
   - Re-upload correct file
   - Update metadata
   - Provide additional information
3. Re-submit for review

---

## Reporting & Monitoring

### Evidence Coverage Report

To check evidence coverage across controls:

1. Navigate to **Evidence > Reports > Coverage**
2. View controls with/without evidence
3. Filter by:
   - Control framework
   - Evidence type required
   - Department

### Expiring Evidence

To monitor expiring certificates and reports:

1. Navigate to **Evidence > Expiring**
2. View evidence expiring within:
   - 7 days (critical)
   - 30 days (warning)
   - 90 days (upcoming)
3. Click to view details
4. Create new version or request renewal

### Evidence Statistics

For management reporting:

1. Navigate to **Evidence > Dashboard**
2. View:
   - Total evidence by status
   - Evidence by type
   - Evidence by classification
   - Trend over time
3. Export data for reporting

---

## Best Practices

### For Evidence Collection

1. ✓ Use descriptive titles that identify the evidence
2. ✓ Add detailed descriptions for context
3. ✓ Set appropriate classification levels
4. ✓ Include validity dates for time-sensitive evidence
5. ✓ Use consistent categories and tags
6. ✓ Capture chain of custody for forensic evidence

### For Evidence Requests

1. ✓ Be specific about what evidence is needed
2. ✓ Provide clear acceptance criteria
3. ✓ Set realistic due dates
4. ✓ Include context (what it's for)
5. ✓ Follow up on overdue requests

### For Evidence Linking

1. ✓ Link evidence to all relevant entities
2. ✓ Use appropriate link types
3. ✓ Add notes explaining the relationship
4. ✓ Review links when evidence is updated

### For Evidence Review

1. ✓ Review evidence promptly
2. ✓ Verify file integrity for forensic evidence
3. ✓ Check classification is appropriate
4. ✓ Provide clear rejection reasons
5. ✓ Document approval rationale

### For Compliance

1. ✓ Maintain evidence for all controls
2. ✓ Renew expiring certificates proactively
3. ✓ Archive (don't delete) old evidence
4. ✓ Maintain chain of custody for incidents
5. ✓ Regular evidence coverage reviews

---

## Troubleshooting

### Common Issues

**"Cannot upload file"**
- Check file size (max 50MB)
- Verify file type is allowed
- Ensure you have upload permissions

**"Cannot submit for review"**
- Ensure all required fields are filled
- Check evidence is in PENDING status

**"Cannot approve evidence"**
- Verify you have reviewer permissions
- Check evidence is in UNDER_REVIEW status

**"Cannot link evidence"**
- Ensure evidence is not archived
- Verify you have permission to the target entity
- Check link doesn't already exist

**"Evidence not appearing in search"**
- Check status filter (archived evidence may be hidden)
- Verify classification allows you to view

### Getting Help

For additional support:
- Review this documentation
- Contact your administrator
- Check system logs for error details







