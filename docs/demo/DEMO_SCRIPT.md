# RiskReady Platform Demo Script

**Duration**: 25-30 minutes  
**Last Updated**: January 8, 2026

---

## Pre-Demo Checklist

- [ ] Database seeded with demo data (`npm run seed:demo`)
- [ ] Backend server running on port 4000 (`npm run dev` in apps/server)
- [ ] Frontend running on port 5173 (`npm run dev` in apps/web)
- [ ] Test login works with demo credentials
- [ ] Browser cache cleared
- [ ] Screen sharing ready

## Demo Credentials

```
Email: admin@riskready.com
Password: <your-admin-password>
```

---

## Demo Flow

### 1. Login & Dashboard (2 min)

**Navigate to**: `http://localhost:5173/login`

**Actions**:
1. Enter demo credentials
2. Click Login
3. Observe dashboard loading

**Talking Points**:
- Modern, clean interface built with React and TailwindCSS
- Real-time security posture overview
- Quick access to all GRC modules

---

### 2. Organisation Setup (3 min)

**Navigate to**: `/organisation/profiles`

**Actions**:
1. Show existing organisation profile
2. Highlight ISMS scope definition
3. Show DORA/NIS2 applicability flags
4. Navigate to `/organisation/departments` to show structure

**Talking Points**:
- Comprehensive organisational context management
- Regulatory scope configuration (DORA, NIS2)
- Department hierarchy for risk ownership
- Multi-framework compliance support

---

### 3. Risk Management - The Core (5 min)

**Navigate to**: `/risks/register`

**Actions**:
1. Show risk register with filtering options
2. Click into a risk to show detail page
3. Demonstrate the 25-state workflow visualization
4. Navigate to `/risks/birt` for BIRT methodology config
5. Show the threshold matrix

**Talking Points**:
- Enterprise-grade BIRT (Business Impact Reference Table) methodology
- 4-category impact assessment: Financial, Legal/Regulatory, Reputation, Operational
- 6-factor likelihood model for accurate risk scoring
- 25-state workflow from Draft to Archived
- Configurable tolerance thresholds per organisation

**Key Features to Highlight**:
- Risk scenarios linked to parent risks
- Inherent vs Residual score tracking
- Treatment plan management
- KRI (Key Risk Indicator) monitoring

---

### 4. Controls & Compliance (5 min)

**Navigate to**: `/controls/compliance/iso27001`

**Actions**:
1. Show ISO 27001:2022 control coverage percentages
2. Filter by theme/category
3. Navigate to `/controls/assessments`
4. Show capability maturity levels (L1-L5)
5. Navigate to `/controls/soa` for Statement of Applicability

**Talking Points**:
- Full ISO 27001:2022 control framework
- L1-L5 maturity model for each capability
- Gap analysis with visual indicators
- SOA generation with version control
- Approval workflow for SOA changes

**Key Features to Highlight**:
- Control effectiveness testing
- Evidence linking to controls
- Cross-reference to other frameworks

---

### 5. Vendor Management (3 min)

**Navigate to**: `/supply-chain/vendors`

**Actions**:
1. Show vendor register with tier classification
2. Filter by DORA scope
3. Click into a vendor detail page
4. Show DORA Article 30 checklist
5. Demonstrate assessment questionnaire

**Talking Points**:
- Third-party risk management
- DORA ICT provider classification
- Tiered vendor approach (Critical, High, Medium, Low)
- Contract compliance tracking
- Assessment questionnaire with scoring

---

### 6. Incident Management (3 min)

**Navigate to**: `/incidents`

**Actions**:
1. Show incident list with status filters
2. Click into an incident detail page
3. Show NIS2/DORA classification badges
4. Navigate to Timeline tab
5. Show evidence collection

**Talking Points**:
- Full incident lifecycle management
- Automatic NIS2 significance assessment
- DORA 7-criteria major incident classification
- Timeline tracking with audit trail
- Evidence collection and chain of custody

---

### 7. Evidence Repository (2 min)

**Navigate to**: `/evidence`

**Actions**:
1. Show evidence list with classification
2. Demonstrate the link dialog
3. Show evidence validity tracking
4. Show approval workflow

**Talking Points**:
- Central evidence repository
- Multi-entity linking (controls, incidents, vendors)
- Classification levels (Public, Internal, Confidential, Restricted)
- Validity period tracking
- Approval workflow

---

### 8. BCM Module (2 min)

**Navigate to**: `/bcm/programs`

**Actions**:
1. Show BCM program overview
2. Navigate to `/bcm/continuity-plans`
3. Show BIA questionnaire
4. Demonstrate test exercise tracking

**Talking Points**:
- Business Continuity Management
- BIA (Business Impact Analysis) questionnaire
- Continuity plan management
- Test exercise scheduling and tracking
- Plan activation workflow

---

## Pages to AVOID

These pages are incomplete or show placeholder content:

| Page | Issue |
|------|-------|
| `/incidents/nis2` | Shows "Coming soon" |
| `/incidents/dora` | Shows "Coming soon" |
| `/incidents/clocks` | Shows "Coming soon" |
| `/supply-chain/exit-plans` | Uses mock data |
| `/supply-chain/sla` | Uses mock data |

**Workaround**: If asked about NIS2/DORA incident dashboards, explain that the classification is shown on individual incident detail pages and demonstrate there.

---

## Q&A Preparation

### Common Questions

**Q: How does the BIRT methodology work?**
A: BIRT uses a 4-category impact assessment (Financial, Legal/Regulatory, Reputation, Operational) combined with a 6-factor likelihood model. Each category has configurable thresholds based on organisation size and risk appetite.

**Q: Is this DORA compliant?**
A: Yes, the platform supports DORA requirements including:
- ICT third-party risk management (Article 28-30)
- Major incident classification (7 criteria from RTS)
- ICT risk management framework alignment

**Q: How does NIS2 integration work?**
A: Incidents are automatically assessed against NIS2 significance criteria:
- Severe operational disruption
- Financial loss (€100k threshold)
- Affected persons (100 threshold)
- Material damage
- Service availability (25% threshold)

**Q: Can we integrate with existing tools?**
A: The platform has a RESTful API with 796 endpoints. Integration points include:
- SIEM/SOAR for incident ingestion
- ITSM tools for asset synchronization
- GRC tools for control mapping

**Q: What about multi-tenancy?**
A: The platform supports organisation-level data isolation with role-based access control.

---

## Demo Recovery Tips

**If login fails**:
- Check backend is running on port 4000
- Verify database is seeded
- Try clearing browser cookies

**If data looks empty**:
- Run `npm run seed:demo` to populate demo data
- Refresh the page

**If API errors appear**:
- Check backend console for errors
- Verify Prisma migrations are up to date

---

## Post-Demo Follow-up

1. Share demo recording if applicable
2. Provide access to sandbox environment
3. Schedule technical deep-dive if requested
4. Share documentation links

---

*Demo script generated January 8, 2026*
