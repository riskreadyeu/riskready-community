import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROCEDURE_CONTENT = `
## 1. PURPOSE

This procedure establishes the framework for creating, reviewing, approving, communicating, and maintaining all policy documents within the organisation. It ensures consistent document management practices aligned with ISO 27001 requirements.

## 2. SCOPE

This procedure applies to all policy documents including:
- Policies (POL-XXX)
- Standards (STD-XXX)
- Procedures (PRO-XXX)
- Guidelines (GUI-XXX)
- Work Instructions (WI-XXX)

## 3. ROLES AND RESPONSIBILITIES

### 3.1 Document Owner
- Accountable for document content accuracy
- Initiates reviews and updates
- Ensures stakeholder consultation

### 3.2 Document Author
- Drafts and updates document content
- Incorporates review feedback
- Maintains version history

### 3.3 Approvers
- Review documents for completeness and accuracy
- Approve documents per authority matrix
- Ensure alignment with organisational objectives

### 3.4 Information Security Team
- Maintains document repository
- Monitors compliance with this procedure
- Provides guidance on document classification

## 4. DOCUMENT CREATION

### 4.1 Initiation
1. Identify need for new document or document update
2. Obtain approval from relevant stakeholder to proceed
3. Assign document owner and author

### 4.2 Document ID Assignment
| Document Type | Format | Example |
|--------------|--------|---------|
| Policy | POL-NNN | POL-001 |
| Standard | STD-NNN-NN | STD-001-01 |
| Procedure | PRO-NNN-NN | PRO-001-01 |
| Guideline | GUI-NNN | GUI-001 |

### 4.3 Drafting Requirements
- Use approved templates
- Include all mandatory sections
- Apply appropriate classification level
- Define scope and applicability clearly

## 5. REVIEW AND APPROVAL

### 5.1 Review Process
1. Author submits document for review
2. Reviewers assess content within 5 business days
3. Author incorporates feedback
4. Final version submitted for approval

### 5.2 Approval Authority Matrix
| Document Type | Approval Authority |
|--------------|-------------------|
| Policy | Executive Management / Board |
| Standard | Senior Management |
| Procedure | Department Head |
| Guideline | Team Lead / Process Owner |

### 5.3 Approval Workflow
1. Document submitted to approval workflow
2. Each approver reviews and provides decision
3. Rejected documents returned to author with comments
4. Approved documents proceed to publication

## 6. PUBLICATION AND COMMUNICATION

### 6.1 Publication
1. Approved documents are marked as PUBLISHED
2. Effective date is set
3. Document is made available in policy repository

### 6.2 Communication Requirements
| Document Type | Communication Method | Acknowledgment Required |
|--------------|---------------------|------------------------|
| Policy | All Staff Email + Intranet | Yes - All Staff |
| Standard | Relevant Teams Email | Yes - Affected Teams |
| Procedure | Team Notification | Yes - Process Participants |
| Guideline | Repository Publication | No |

### 6.3 Acknowledgment Process
1. System generates acknowledgment requests
2. Recipients have 14 days to acknowledge
3. Reminders sent at 7 days and 1 day before deadline
4. Non-compliance escalated to line manager

## 7. REVIEW CYCLE

### 7.1 Review Frequency
| Document Type | Standard Review Cycle | Trigger Events |
|--------------|----------------------|----------------|
| Policy | Annual | Regulatory change, Incident |
| Standard | Annual | Technology change, Audit finding |
| Procedure | Semi-annual | Process change, Nonconformity |
| Guideline | Biennial | As needed |

### 7.2 Review Process
1. System notifies owner 30 days before review due
2. Owner assesses if changes needed
3. If changes needed, follow Section 8 (Change Management)
4. If no changes, document review date and extend cycle
5. Update next review date

### 7.3 Review Outcomes
- **NO_CHANGES** - Document remains current, update review date
- **MINOR_CHANGES** - Administrative updates, no re-approval needed
- **MAJOR_CHANGES** - Substantive changes, full approval required
- **RETIRE** - Document no longer needed, initiate retirement

## 8. CHANGE MANAGEMENT

### 8.1 Change Request Process
1. Submit change request with justification
2. Change request reviewed by document owner
3. Approved changes implemented
4. Follow approval workflow for major changes

### 8.2 Version Numbering
- **Major version (X.0)** - Significant content changes, new requirements
- **Minor version (X.Y)** - Clarifications, formatting, minor updates

### 8.3 Change Documentation
All changes must be documented with:
- Description of change
- Justification
- Impact assessment
- Approval record

## 9. DOCUMENT RETIREMENT

### 9.1 Retirement Criteria
- Document superseded by new version
- Regulatory requirement removed
- Process no longer applicable
- Organisation restructure

### 9.2 Retirement Process
1. Owner submits retirement request
2. Approval from original approval authority
3. Document marked as RETIRED
4. Retained in archive per retention schedule
5. Stakeholders notified

## 10. RECORDS AND EVIDENCE

### 10.1 Required Records
The following records must be maintained:
- Document version history
- Approval workflow records
- Acknowledgment records
- Review records
- Change request records

### 10.2 Retention Period
- Active documents: Indefinite while current
- Retired documents: 7 years from retirement
- Audit logs: 7 years

## 11. COMPLIANCE MONITORING

### 11.1 Metrics
| Metric | Target | Frequency |
|--------|--------|-----------|
| Documents reviewed on time | 95% | Monthly |
| Acknowledgments completed on time | 90% | Monthly |
| Approval cycle time | < 10 days | Monthly |
| Documents past review date | 0 | Weekly |

### 11.2 Reporting
Monthly compliance report to Information Security Committee including:
- Review status summary
- Overdue documents
- Acknowledgment compliance rate
- Change request backlog

## 12. RELATED DOCUMENTS

- POL-001: Information Security Policy
- STD-001: Document Classification Standard
- Information Security Management System Manual

## 13. REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${new Date().toISOString().split('T')[0]} | System | Initial release |
`;

export async function seedDocumentLifecycleProcedure() {
  console.log('Seeding Document Lifecycle Procedure...');

  // Get organisation profile
  const org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.error('No organisation profile found. Please seed organisation first.');
    return;
  }

  // Get a user for ownership
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found. Please seed users first.');
    return;
  }

  // Check if already exists
  const existing = await prisma.policyDocument.findFirst({
    where: { documentId: 'PRO-001-01' }
  });

  if (existing) {
    console.log('PRO-001-01 already exists, skipping...');
    return existing;
  }

  // Create the procedure
  const procedure = await prisma.policyDocument.create({
    data: {
      documentId: 'PRO-001-01',
      title: 'Policy and Document Management Procedure',
      shortTitle: 'Document Lifecycle',
      documentType: 'PROCEDURE',
      classification: 'INTERNAL',

      purpose: 'This procedure establishes the framework for creating, reviewing, approving, communicating, and maintaining all policy documents within the organisation.',
      scope: 'This procedure applies to all policy documents including Policies, Standards, Procedures, Guidelines, and Work Instructions.',
      content: PROCEDURE_CONTENT,
      summary: 'Defines the complete document lifecycle from creation through approval, communication, review, and retirement.',

      status: 'PUBLISHED',
      effectiveDate: new Date(),

      documentOwner: 'Information Security Team',
      documentOwnerId: user.id,
      author: 'Information Security Team',
      authorId: user.id,

      approvalLevel: 'SENIOR_MANAGEMENT',
      approvedBy: 'CISO',
      approverId: user.id,
      approvalDate: new Date(),

      reviewFrequency: 'ANNUAL',
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),

      organisationId: org.id,
    }
  });

  console.log(`Created: ${procedure.documentId} - ${procedure.title}`);

  // Create audit log entry
  await prisma.policyDocumentAuditLog.create({
    data: {
      document: { connect: { id: procedure.id } },
      action: 'CREATED',
      description: 'Document created and published',
      performedBy: { connect: { id: user.id } },
    }
  });

  return procedure;
}

// Run if called directly
if (require.main === module) {
  seedDocumentLifecycleProcedure()
    .then(() => console.log('Done'))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
