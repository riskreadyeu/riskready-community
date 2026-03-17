

Policy Module - User Guide

**Version**: 2.0  
**Last Updated**: December 2024

---

## 1. Getting Started

### 1.1 Accessing the Policy Module

1. Log in to the RiskReady platform
2. Click **Policies** in the main navigation sidebar
3. The secondary sidebar provides access to all policy management features

### 1.2 Navigation Overview

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Overview statistics and quick actions |
| **Documents** | Browse and manage all documents |
| **Approvals** | View and process pending approvals |
| **Reviews** | Manage document reviews |
| **Hierarchy** | Visual document hierarchy tree |
| **Change Requests** | Track change requests |
| **Exceptions** | Manage policy exceptions |
| **Acknowledgments** | Track user acknowledgments |
| **Control Mappings** | ISO 27001 control mappings |
| **Gap Analysis** | Compliance gap analysis |

---

## 2. Managing Documents

### 2.1 Viewing Documents

**Document List Page:**
1. Navigate to **Policies** → **Documents**
2. Use filters to narrow results:
   - Document Type (Policy, Standard, Procedure)
   - Status (Draft, Published, etc.)
   - Classification Level
3. Search by title, ID, or keywords
4. Click a row to view document details

**Document Detail Page:**
- **Structured Tab**: Formatted document view with sections
- **Raw Tab**: Original markdown content
- **Versions Tab**: Version history with diffs
- **Reviews Tab**: Review history
- **Mappings Tab**: Control and risk mappings
- **Acknowledgments Tab**: User acknowledgment status

### 2.2 Creating a New Document

1. Click **+ New Document** button
2. Fill in required fields:
   - **Document ID**: Unique identifier (e.g., POL-015)
   - **Title**: Full document title
   - **Document Type**: Policy, Standard, Procedure, etc.
   - **Classification**: Public, Internal, Confidential, Restricted
3. Add optional metadata:
   - Short title
   - Distribution list
   - Tags and keywords
   - Parent document (for hierarchy)
4. Write content using the structured editor or markdown
5. Click **Save as Draft**

### 2.3 Editing Documents

1. Open the document
2. Click **Edit** button
3. Modify content or metadata
4. Save changes
5. Optionally add version notes

**Note**: Only documents in DRAFT or UNDER_REVISION status can be edited.

### 2.4 Document Status Workflow

```
DRAFT → Submit for Approval → PENDING_APPROVAL → Approved → PUBLISHED
```

**Changing Status:**
- From document detail page, use status actions
- Some status changes require approval workflow

---

## 3. Approval Workflows

### 3.1 Submitting for Approval

1. Open a document with status **DRAFT** or **UNDER_REVISION**
2. Click **Submit for Approval** button
3. Configure approval workflow:
   - Add approval steps (Manager → CISO → Executive)
   - Set approver roles or specific users
   - Set optional due dates
   - Add comments for context
4. Click **Submit for Approval**
5. Document status changes to **PENDING_APPROVAL**

### 3.2 Approval Step Configuration

| Field | Description |
|-------|-------------|
| **Step Name** | Descriptive name (e.g., "Manager Review") |
| **Approver Role** | Role-based assignment (Management, CISO, Executive) |
| **Approver** | Or select specific user |
| **Due Date** | Optional deadline |

### 3.3 Processing Approvals

1. Navigate to **Policies** → **Approvals**
2. Find documents awaiting your approval
3. Click to review the document
4. Make a decision:
   - **Approve**: Move to next step
   - **Reject**: Return to draft
   - **Request Changes**: Send back for modifications
   - **Delegate**: Assign to another user
5. Add comments and optional digital signature
6. Submit decision

### 3.4 Approval Status Tracking

Track workflow progress in the Approvals page:
- See which step is current
- View completed steps with decisions
- Monitor due dates and overdue items

---

## 4. Document Reviews

### 4.1 Scheduled Reviews

Documents are automatically flagged for review based on their review frequency setting:
- Monthly, Quarterly, Semi-Annual, Annual, etc.

**Review Dashboard** shows:
- Documents due for review
- Overdue reviews
- Upcoming reviews (next 30 days)

### 4.2 Conducting a Review

1. Navigate to **Policies** → **Reviews**
2. Select a document due for review
3. Click **Start Review**
4. Complete the review:
   - **Outcome**: No Changes, Minor Changes, Major Changes, Supersede, Retire
   - **Findings**: Document review findings
   - **Recommendations**: Suggested actions
5. Submit the review
6. If changes required, document moves to revision workflow

### 4.3 Review Outcomes

| Outcome | Action |
|---------|--------|
| **No Changes** | Document remains current, next review scheduled |
| **Minor Changes** | Editorial updates, quick revision |
| **Major Changes** | Significant revision required, new approval needed |
| **Supersede** | Replace with new document |
| **Retire** | Mark document as retired |

---

## 5. Document Hierarchy

### 5.1 Understanding the Hierarchy

```
POLICY (POL-002)
├── STANDARD (STD-002-01)
│   ├── PROCEDURE (PRO-002-01)
│   └── PROCEDURE (PRO-002-02)
├── STANDARD (STD-002-02)
└── STANDARD (STD-002-03)
```

### 5.2 Viewing Hierarchy

1. Navigate to **Policies** → **Hierarchy**
2. Expand/collapse nodes to explore
3. Click any document to view details
4. Use search to find specific documents

### 5.3 Setting Parent Documents

1. Edit the document
2. Select **Parent Document** from dropdown
3. Save changes

---

## 6. Acknowledgments

### 6.1 Requesting Acknowledgments

1. Open the document
2. Go to **Acknowledgments** tab
3. Click **Request Acknowledgments**
4. Select users or groups
5. Set due date
6. Send request

### 6.2 Acknowledging Documents

**As a user receiving an acknowledgment request:**
1. You'll receive a notification
2. Open the document
3. Read the content
4. Click **Acknowledge**
5. Your acknowledgment is recorded

### 6.3 Tracking Acknowledgments

View acknowledgment status:
- Total requested
- Completed acknowledgments
- Pending acknowledgments
- Overdue acknowledgments

Send reminders to users who haven't acknowledged.

---

## 7. Policy Exceptions

### 7.1 Requesting an Exception

1. Navigate to **Policies** → **Exceptions**
2. Click **New Exception**
3. Fill in exception details:
   - **Policy**: Select the policy
   - **Title**: Exception title
   - **Description**: What is being excepted
   - **Justification**: Why exception is needed
   - **Risk Assessment**: Risk of the exception
   - **Compensating Controls**: Mitigations in place
   - **Duration**: Start and end dates
4. Submit for approval

### 7.2 Exception Lifecycle

```
REQUESTED → UNDER_REVIEW → APPROVED/REJECTED → ACTIVE → EXPIRED
```

### 7.3 Managing Exceptions

- View all exceptions in the exceptions register
- Track active vs. expired exceptions
- Renew exceptions before expiration
- Close exceptions early if no longer needed

---

## 8. Change Requests

### 8.1 Creating a Change Request

1. Navigate to **Policies** → **Change Requests**
2. Click **New Change Request**
3. Fill in details:
   - **Document**: Select document to change
   - **Title**: Change request title
   - **Description**: What needs to change
   - **Justification**: Why the change is needed
   - **Change Type**: Content, Structure, Policy, Correction
   - **Priority**: Low, Medium, High, Critical
   - **Impact Assessment**: What else is affected
4. Submit for approval

### 8.2 Change Request Workflow

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → IMPLEMENTED
```

### 8.3 Tracking Changes

- View all change requests by status
- Add comments to change requests
- Track implementation progress
- Link change requests to document versions

---

## 9. Control Mappings

### 9.1 Viewing Control Coverage

1. Navigate to **Policies** → **Control Mappings**
2. View ISO 27001 controls and their document coverage
3. Filter by control domain
4. Identify gaps (controls without documents)

### 9.2 Creating Mappings

1. Open a document
2. Go to **Mappings** tab
3. Click **Add Control Mapping**
4. Select the ISO 27001 control
5. Set mapping type:
   - **Primary**: Document is primary implementation
   - **Supporting**: Document supports the control
   - **Reference**: Document references the control
6. Set coverage level (Full, Partial, Minimal)
7. Add notes
8. Save mapping

### 9.3 Gap Analysis

1. Navigate to **Policies** → **Gap Analysis**
2. View coverage statistics:
   - Controls with full coverage
   - Controls with partial coverage
   - Controls with no coverage
3. Identify documentation gaps
4. Plan remediation actions

---

## 10. Version Control

### 10.1 Viewing Version History

1. Open a document
2. Go to **Versions** tab
3. See all versions with:
   - Version number
   - Change type
   - Change description
   - Author
   - Date

### 10.2 Comparing Versions

1. In the Versions tab
2. Select two versions to compare
3. View side-by-side diff
4. Additions shown in green
5. Deletions shown in red

### 10.3 Creating a New Version

When editing a published document:
1. Edit creates a new draft version
2. Complete the approval workflow
3. Upon approval, new version becomes current
4. Previous version preserved in history

---

## 11. Dashboard

### 11.1 Overview Statistics

The dashboard shows:
- **Total Documents**: Count by type and status
- **Reviews Due**: Documents requiring review
- **Pending Approvals**: Awaiting your action
- **Pending Acknowledgments**: Your pending acknowledgments
- **Active Exceptions**: Current policy exceptions

### 11.2 Quick Actions

From the dashboard:
- View overdue reviews
- Access pending approvals
- See recent changes
- Jump to frequently accessed documents

---

## 12. Best Practices

### 12.1 Document Naming

| Type | Pattern | Example |
|------|---------|---------|
| Policy | POL-XXX | POL-002 |
| Standard | STD-XXX-YY | STD-002-01 |
| Procedure | PRO-XXX-YY-Name | PRO-002-01-Risk-Assessment |
| Work Instruction | WI-XXX-YY-ZZ | WI-002-01-01 |

### 12.2 Review Frequency

| Document Type | Recommended Frequency |
|--------------|----------------------|
| Policies | Annual |
| Standards | Annual or on change |
| Procedures | Semi-annual |
| Work Instructions | As needed |

### 12.3 Classification Guidelines

| Level | Use For |
|-------|---------|
| **Public** | External distribution OK |
| **Internal** | General business information |
| **Confidential** | Sensitive business data |
| **Restricted** | Need-to-know only |

### 12.4 Approval Levels

| Document Type | Typical Approvers |
|--------------|-------------------|
| Policy | Executive, Board |
| Standard | CISO, Senior Management |
| Procedure | Department Manager |
| Work Instruction | Team Lead |

---

## 13. Troubleshooting

### Common Issues

**Q: I can't edit a document**
A: Check the document status. Only DRAFT or UNDER_REVISION documents can be edited.

**Q: My approval isn't showing**
A: Ensure you have the correct role/permissions. Check if the workflow step is assigned to you.

**Q: Document won't publish**
A: All approval steps must be completed before publishing.

**Q: Review reminder not received**
A: Check notification settings. Ensure email is configured correctly.

---

*Next: [05-document-templates.md](./05-document-templates.md) - Document structure templates*








