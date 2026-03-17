# Getting Started with the Organisation Module

This guide walks you through the initial setup of your organisation in RiskReady, establishing the foundation for your ISMS.

## Prerequisites

Before you begin, ensure you have:
- Administrator access to RiskReady
- Basic organisation information (legal name, structure, locations)
- Understanding of your ISMS scope requirements

## Setup Workflow

Follow this recommended sequence to set up your organisation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORGANISATION SETUP WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1                Step 2                Step 3                          │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                     │
│  │ Create   │────────▶│ Define   │────────▶│ Add      │                     │
│  │ Org      │         │ ISMS     │         │ Locations│                     │
│  │ Profile  │         │ Scope    │         │          │                     │
│  └──────────┘         └──────────┘         └──────────┘                     │
│       │                                          │                           │
│       ▼                                          ▼                           │
│  Step 4                Step 5                Step 6                          │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                     │
│  │ Create   │────────▶│ Assign   │────────▶│ Document │                     │
│  │ Depts    │         │ Key      │         │ Business │                     │
│  │          │         │ Personnel│         │ Processes│                     │
│  └──────────┘         └──────────┘         └──────────┘                     │
│       │                                          │                           │
│       ▼                                          ▼                           │
│  Step 7                Step 8                Step 9                          │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                     │
│  │ Identify │────────▶│ Document │────────▶│ Set Up   │                     │
│  │Interested│         │ Context  │         │ Security │                     │
│  │ Parties  │         │ Issues   │         │Committee │                     │
│  └──────────┘         └──────────┘         └──────────┘                     │
│                                                  │                           │
│                                                  ▼                           │
│                                            Step 10                           │
│                                            ┌──────────┐                     │
│                                            │ Track    │                     │
│                                            │Frameworks│                     │
│                                            │          │                     │
│                                            └──────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Organisation Profile

The Organisation Profile is the foundation of your ISMS. It contains core information about your organisation.

### Navigation
`Organisation → Organisation Profiles → Create New`

### Required Information

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Trading name | Acme Corporation |
| **Legal Name** | Registered legal name | Acme Corporation Ltd |
| **Employee Count** | Total employees | 500 |

### Recommended Information

| Field | Description | Why It Matters |
|-------|-------------|----------------|
| Industry Sector | Primary industry | Helps identify applicable regulations |
| Headquarters Address | Main office location | Defines primary jurisdiction |
| Registration Number | Company registration | Legal identification |
| Founded Year | Year established | Demonstrates organisational maturity |

### ISMS-Specific Fields

| Field | Description | ISO 27001 Reference |
|-------|-------------|---------------------|
| ISMS Scope | Scope statement | Clause 4.3 |
| ISMS Policy | Policy statement or reference | Clause 5.2 |
| ISMS Objectives | Security objectives | Clause 6.2 |
| Risk Appetite | Risk tolerance statement | Clause 6.1 |

### Example

```
Name: Acme Corporation
Legal Name: Acme Corporation Limited
Industry Sector: Technology
Employee Count: 500
Headquarters: 123 Tech Street, London, UK

ISMS Scope: "The ISMS covers all information processing activities 
related to the development, delivery, and support of cloud-based 
software services from our London and Singapore offices."

Risk Appetite: "Acme has a moderate risk appetite for operational 
risks and a low risk appetite for security and compliance risks."
```

---

## Step 2: Define ISMS Scope

Within the Organisation Profile, define what is included and excluded from your ISMS.

### Scope Elements

| Element | Description | How to Document |
|---------|-------------|-----------------|
| **Products/Services in Scope** | What you deliver | List all products/services covered |
| **Departments in Scope** | Which teams | List department names |
| **Locations in Scope** | Where you operate | List all locations |
| **Processes in Scope** | What you do | List key business processes |
| **Systems in Scope** | What technology | List critical systems |

### Exclusions

| Field | Description |
|-------|-------------|
| **Scope Exclusions** | What is explicitly excluded |
| **Exclusion Justification** | Why it's excluded (required for Annex A controls) |
| **Scope Boundaries** | Clear boundary statements |

### Best Practice

> **Tip:** Start with a focused scope and expand over time. It's easier to add to scope than to manage an overly broad ISMS.

---

## Step 3: Add Locations

Document all physical and virtual locations within your ISMS scope.

### Navigation
`Organisation → Locations → Add Location`

### Location Types

| Type | Description | Examples |
|------|-------------|----------|
| **Headquarters** | Main office | Corporate HQ |
| **Branch Office** | Regional offices | Sales office, Support center |
| **Data Center** | IT infrastructure | Primary DC, DR site |
| **Cloud Region** | Cloud infrastructure | AWS eu-west-1, Azure UK South |
| **Remote** | Remote work locations | Home offices (if in scope) |

### Key Fields

| Field | Purpose | ISO 27001 Relevance |
|-------|---------|---------------------|
| In ISMS Scope | Include in scope | Clause 4.3 |
| Physical Security Level | Security classification | Annex A.7 |
| Access Control Type | Entry control method | Annex A.7.2 |
| Is Data Center | Flags critical facilities | Annex A.7.5 |
| Backup Power | Resilience indicator | Annex A.7.11 |

---

## Step 4: Create Departments

Document your organisational structure.

### Navigation
`Organisation → Departments → Add Department`

### Department Hierarchy

Create departments in order:
1. Top-level departments first (Executive, IT, Finance, etc.)
2. Sub-departments linked to parents

### Key Fields

| Field | Purpose |
|-------|---------|
| Department Code | Unique identifier (e.g., IT, FIN, HR) |
| Department Head | Accountable person |
| Criticality Level | Business criticality |
| Handles Personal Data | GDPR relevance |
| Handles Financial Data | SOX/financial compliance |

### Example Structure

```
Executive Office (EXEC)
├── Information Technology (IT)
│   ├── Infrastructure (IT-INF)
│   ├── Development (IT-DEV)
│   └── Security (IT-SEC)
├── Finance (FIN)
│   ├── Accounting (FIN-ACC)
│   └── Treasury (FIN-TRS)
├── Human Resources (HR)
└── Operations (OPS)
```

---

## Step 5: Assign Key Personnel

Document individuals with ISMS responsibilities.

### Navigation
`Organisation → Key Personnel → Add Personnel`

### Essential ISMS Roles

| Role | Responsibility | ISO 27001 Reference |
|------|----------------|---------------------|
| **ISMS Manager** | Overall ISMS management | Clause 5.3 |
| **CISO** | Information security leadership | Clause 5.3 |
| **Risk Owner** | Risk management oversight | Clause 6.1 |
| **DPO** | Data protection (if applicable) | GDPR requirement |
| **Internal Auditor** | ISMS audit function | Clause 9.2 |
| **Management Representative** | Top management liaison | Clause 5.1 |

### Key Fields

| Field | Purpose |
|-------|---------|
| ISMS Role | Role classification |
| Security Responsibilities | Specific duties |
| Authority Level | Decision-making authority |
| Backup Person | Succession planning |
| Training Completed | Competence evidence |

---

## Step 6: Document Business Processes

Capture key business processes within ISMS scope.

### Navigation
`Organisation → Business Processes → Add Process`

### Process Categories

| Category | Examples |
|----------|----------|
| **Core** | Product development, Service delivery |
| **Support** | IT operations, HR management |
| **Management** | Strategic planning, Risk management |

### Key Fields

| Field | Purpose | ISO 27001 Relevance |
|-------|---------|---------------------|
| Process Owner | Accountability | Clause 5.3 |
| Criticality Level | Business impact | Clause 8.1 |
| RTO/RPO | Recovery objectives | Business continuity |
| Compliance Requirements | Regulatory needs | Clause 4.2 |

---

## Step 7: Identify Interested Parties

Document stakeholders and their security requirements.

### Navigation
`Organisation → Interested Parties → Add Party`

### Common Interested Parties

| Party Type | Examples | Typical Requirements |
|------------|----------|---------------------|
| **Customers** | Enterprise clients | Data protection, SLAs |
| **Employees** | Staff, contractors | Privacy, safe workplace |
| **Regulators** | ICO, FCA, SEC | Compliance, reporting |
| **Shareholders** | Investors, board | Governance, transparency |
| **Suppliers** | Vendors, partners | Contract compliance |

### Power/Interest Analysis

Use the Power/Interest matrix to prioritise engagement:

```
                    INTEREST
              Low            High
         ┌──────────┬──────────┐
    High │  Keep    │  Manage  │
POWER    │ Satisfied│  Closely │
         ├──────────┼──────────┤
    Low  │  Monitor │   Keep   │
         │          │ Informed │
         └──────────┴──────────┘
```

---

## Step 8: Document Context Issues

Capture internal and external issues affecting your ISMS.

### Navigation
`Organisation → Context Issues → Add Issue`

### Issue Types

| Type | Description | Examples |
|------|-------------|----------|
| **Internal** | Within organisation | Skills gaps, legacy systems, culture |
| **External** | Outside organisation | Regulations, threats, market changes |

### Categories

| Category | Examples |
|----------|----------|
| **Technological** | Cloud adoption, AI, legacy systems |
| **Regulatory** | New laws, compliance requirements |
| **Economic** | Budget constraints, market conditions |
| **Organisational** | Growth, restructuring, M&A |
| **Social** | Remote work, skills availability |

### Key Fields

| Field | Purpose |
|-------|---------|
| Impact Level | High/Medium/Low |
| Likelihood | Probability of impact |
| ISMS Relevance | How it affects security |
| Trend Direction | Improving/Stable/Worsening |
| Response Strategy | How you're addressing it |

---

## Step 9: Set Up Security Committee

Establish governance for ISMS oversight.

### Navigation
`Organisation → Security Committees → Add Committee`

### Recommended Committees

| Committee | Purpose | Meeting Frequency |
|-----------|---------|-------------------|
| **Information Security Steering Committee** | Strategic oversight | Monthly |
| **Security Operations Committee** | Tactical decisions | Weekly |
| **Risk Committee** | Risk oversight | Quarterly |

### Committee Setup

1. **Create the committee** with name, type, and chair
2. **Add members** with roles and voting rights
3. **Schedule first meeting**
4. **Define standard agenda items**

### Meeting Workflow

```
Schedule Meeting → Prepare Agenda → Conduct Meeting → Record Minutes
                                          │
                                          ▼
                            ┌─────────────────────────┐
                            │  Record Decisions       │
                            │  Create Action Items    │
                            │  Track Attendance       │
                            └─────────────────────────┘
```

---

## Step 10: Track Applicable Frameworks

Document all applicable standards and regulations.

### Navigation
`Organisation → Applicable Frameworks → Add Framework`

### Common Frameworks

| Framework | Type | Typical Applicability |
|-----------|------|----------------------|
| **ISO 27001** | Standard | All organisations seeking certification |
| **SOC 2** | Standard | SaaS providers, service organisations |
| **GDPR** | Regulation | Processing EU personal data |
| **PCI DSS** | Standard | Handling payment card data |
| **HIPAA** | Regulation | US healthcare data |
| **NIS2** | Regulation | EU essential/important entities |

### Key Fields

| Field | Purpose |
|-------|---------|
| Is Applicable | Whether framework applies |
| Applicability Reason | Why it applies |
| Compliance Status | Current state |
| Compliance Percentage | Progress metric |
| Certification Status | If certified |

---

## Verification Checklist

After completing setup, verify:

- [ ] Organisation Profile created with ISMS scope
- [ ] All locations documented with scope status
- [ ] Department structure reflects organisation
- [ ] Key ISMS personnel assigned
- [ ] Critical business processes documented
- [ ] Interested parties identified with requirements
- [ ] Context issues documented (internal and external)
- [ ] Security committee established
- [ ] Applicable frameworks identified

---

## Next Steps

Once your organisation is set up:

1. **Conduct initial risk assessment** - Use context issues as input
2. **Develop ISMS policies** - Based on scope and requirements
3. **Schedule management review** - First committee meeting
4. **Begin control implementation** - Based on risk treatment

See [User Guide](./04-user-guide.md) for ongoing operations.
