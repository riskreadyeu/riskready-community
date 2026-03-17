# Manual Testing Guide - Risk Management Module

This guide provides predefined test scenarios with **business logic validation** for manually testing the Risk Management module.

## Prerequisites

1. **Start the application:**
   ```bash
   ./scripts/start-dev.sh
   ```
   Or manually:
   ```bash
   # Terminal 1: Backend
   cd apps/server && npm run dev
   
   # Terminal 2: Frontend
   cd apps/web && npm run dev
   ```

2. **Login credentials:**
   - Email: `admin@riskready.com`
   - Password: `password123`

3. **Open Browser DevTools (F12):**
   - Console tab: Check for JavaScript errors
   - Network tab: Monitor API calls

---

## Business Logic Reference

### Risk Score Calculation
```
Risk Score = Likelihood × Impact
```

| Likelihood | Value | | Impact | Value |
|------------|-------|-|--------|-------|
| Rare | 1 | | Negligible | 1 |
| Unlikely | 2 | | Minor | 2 |
| Possible | 3 | | Moderate | 3 |
| Likely | 4 | | Major | 4 |
| Almost Certain | 5 | | Severe | 5 |

### Risk Level Thresholds
| Level | Score Range | Color | Treatment Deadline |
|-------|-------------|-------|-------------------|
| **LOW** | 1-7 | 🟢 Green | Optional |
| **MEDIUM** | 8-14 | 🟡 Yellow | 90 days |
| **HIGH** | 15-19 | 🟠 Orange | 30 days |
| **CRITICAL** | 20-25 | 🔴 Red | Immediate |

### Risk Status Lifecycle
```
IDENTIFIED → ASSESSED → TREATING → ACCEPTED/CLOSED
```

### KRI RAG Status Rules
- 🟢 **GREEN**: Value ≥ green threshold
- 🟡 **AMBER**: Value between thresholds
- 🔴 **RED**: Value < red threshold
- ⚪ **NOT_MEASURED**: No data recorded

---

## Test Scenario 1: Login & Authentication

**URL:** `/login`

### Functional Tests:
- [ ] Login form displays with email/password fields
- [ ] Demo credentials are pre-filled or displayed
- [ ] "Sign in" button is visible and clickable

### Business Logic Tests:

**Test 1.1: Valid Login**
1. Enter: `admin@riskready.com` / `password123`
2. Click "Sign in"
3. **Expected:** Redirects to `/dashboard`, user profile shows in header

**Test 1.2: Invalid Credentials**
1. Enter: `admin@riskready.com` / `wrongpassword`
2. Click "Sign in"
3. **Expected:** Error message "Invalid credentials" or similar

**Test 1.3: Session Persistence**
1. Login successfully
2. Refresh the page (F5)
3. **Expected:** User remains logged in, not redirected to login

---

## Test Scenario 2: Risk Dashboard

**URL:** `/risks`

### Content Display Tests:
- [ ] Page title "Risk Management" visible
- [ ] Sidebar navigation present
- [ ] Statistics cards displayed

### Business Logic Tests:

**Test 2.1: Statistics Accuracy**
1. View Total Risks count on dashboard
2. Navigate to Risk Register
3. Count total risks in table
4. **Expected:** Counts match (e.g., Dashboard shows 15, Register has 15 rows)

**Test 2.2: Risk Heatmap Accuracy**
1. View heatmap on dashboard
2. Click on a cell (e.g., "High Likelihood, Major Impact")
3. **Expected:** Filters to show only risks in that quadrant

**Test 2.3: Top Risks Ranking**
1. View "Top Risks" section
2. **Expected:** Risks are ordered by score (highest first)
3. **Expected:** Shows risks with scores 15+ (HIGH/CRITICAL)

**Test 2.4: KRI Health Summary**
1. View KRI health indicators
2. Count GREEN/AMBER/RED KRIs
3. Navigate to KRI list page
4. **Expected:** Counts match actual KRI statuses

---

## Test Scenario 3: Risk Register - CRUD Operations

**URL:** `/risks/register`

### Display Tests:
- [ ] Table headers: Risk ID, Title, Tier, Status, Framework
- [ ] Risk data populates correctly
- [ ] Risk IDs are clickable links

### Business Logic Tests:

**Test 3.1: Create Risk with Score Calculation**
1. Click "Add Risk" button
2. Fill in:
   - Risk ID: `TEST-001`
   - Title: `Test Risk - Score Calculation`
   - Tier: `Core`
   - Framework: `ISO 27001`
   - Likelihood: `Possible` (value=3)
   - Impact: `Major` (value=4)
3. Click "Create Risk"
4. **Expected:** 
   - Risk created successfully
   - Inherent Score = 3 × 4 = **12** (MEDIUM)
   - Risk appears in table with yellow badge

**Test 3.2: Create CRITICAL Risk**
1. Create risk with:
   - Likelihood: `Almost Certain` (5)
   - Impact: `Severe` (5)
2. **Expected:**
   - Inherent Score = 5 × 5 = **25** (CRITICAL)
   - Red badge displayed
   - Treatment deadline should indicate "Immediate"

**Test 3.3: Create LOW Risk**
1. Create risk with:
   - Likelihood: `Rare` (1)
   - Impact: `Minor` (2)
2. **Expected:**
   - Inherent Score = 1 × 2 = **2** (LOW)
   - Green badge displayed

**Test 3.4: Required Field Validation**
1. Open create dialog
2. Leave Risk ID empty, fill Title
3. Click Create
4. **Expected:** Error "Risk ID is required"
5. Leave Title empty, fill Risk ID
6. **Expected:** Error "Title is required"

**Test 3.5: Duplicate Risk ID Validation**
1. Try to create risk with existing Risk ID (e.g., "R-01")
2. **Expected:** Error "Risk ID already exists" or prevents creation

---

## Test Scenario 4: Risk Detail & Edit

**URL:** `/risks/{id}`

### Display Tests:
- [ ] Risk title displayed as H1
- [ ] All risk fields visible (ID, Tier, Status, Framework)
- [ ] Likelihood, Impact, and Score displayed

### Business Logic Tests:

**Test 4.1: Score Recalculation on Edit**
1. Open a risk with Likelihood=Possible (3), Impact=Minor (2) → Score=6
2. Click Edit
3. Change Impact to `Major` (4)
4. Save
5. **Expected:** Score updates to 3 × 4 = **12** (MEDIUM)

**Test 4.2: Status Transition - IDENTIFIED to ASSESSED**
1. Open risk with status `IDENTIFIED`
2. Set Likelihood and Impact values
3. Change status to `ASSESSED`
4. **Expected:** Status changes, score is now calculated

**Test 4.3: Status Transition - ASSESSED to TREATING**
1. Open risk with status `ASSESSED`
2. Change status to `TREATING`
3. **Expected:** Status changes
4. **Expected:** Should prompt for or link to Treatment Plan

**Test 4.4: Status Transition - TREATING to ACCEPTED**
1. Open risk with status `TREATING` and active treatment plan
2. Change status to `ACCEPTED`
3. **Expected:** Should validate acceptance criteria or prompt for justification

**Test 4.5: Risk Level Color Coding**
1. Create/edit risks with different scores:
   - Score 5 → Should show GREEN
   - Score 10 → Should show YELLOW
   - Score 16 → Should show ORANGE
   - Score 22 → Should show RED
2. **Expected:** Colors match thresholds

---

## Test Scenario 5: Risk Scenarios & Score Aggregation

**URL:** `/risks/{id}` → Scenarios tab

### Business Logic Tests:

**Test 5.1: Scenario Score Calculation**
1. Open a risk detail page
2. Add new scenario:
   - Cause: "Phishing email received"
   - Event: "User clicks malicious link"
   - Consequence: "Credential theft"
   - Likelihood: `Likely` (4)
   - Impact: `Moderate` (3)
3. **Expected:** Scenario score = 4 × 3 = **12**

**Test 5.2: Parent Risk Score Aggregation (MAX)**
1. Create a risk with two scenarios:
   - Scenario A: Likelihood=Possible (3), Impact=Minor (2) → Score=6
   - Scenario B: Likelihood=Likely (4), Impact=Major (4) → Score=16
2. **Expected:** Parent risk inherent score = MAX(6, 16) = **16** (HIGH)

**Test 5.3: Scenario Deletion Updates Parent Score**
1. Using risk from Test 5.2, delete Scenario B (score=16)
2. **Expected:** Parent risk score recalculates to **6** (from remaining Scenario A)

**Test 5.4: Residual Score Calculation**
1. Open a scenario
2. Set inherent: Likelihood=Likely (4), Impact=Major (4) → Score=16
3. Set residual: Likelihood=Unlikely (2), Impact=Minor (2) → Score=4
4. **Expected:**
   - Inherent Score: 16 (HIGH)
   - Residual Score: 4 (LOW)
   - Risk Reduction: (16-4)/16 × 100 = **75%**

---

## Test Scenario 6: Risk Assessment Matrix

**URL:** `/risks/assessment`

### Display Tests:
- [ ] 5×5 matrix grid visible
- [ ] Cells color-coded (green/yellow/orange/red)
- [ ] Risk counts in each cell

### Business Logic Tests:

**Test 6.1: Matrix Position Accuracy**
1. Create a risk with Likelihood=`Likely` (4), Impact=`Major` (4) → Score=16
2. Navigate to Risk Assessment Matrix
3. **Expected:** Risk appears in cell at row 4 (Likely), column 4 (Major)
4. **Expected:** Cell is colored ORANGE (15-19 = HIGH)

**Test 6.2: Cell Click Filtering**
1. Click on a matrix cell (e.g., Likelihood=3, Impact=3)
2. **Expected:** Shows only risks with that exact L/I combination
3. **Expected:** All shown risks have Score = 9

**Test 6.3: Inherent vs Residual Matrix**
1. Switch between "Inherent Risk Matrix" and "Residual Risk Matrix"
2. **Expected:** Positions change based on inherent vs residual scores
3. **Expected:** Residual matrix should generally show risks in lower cells

**Test 6.4: Summary Statistics Match**
1. Count risks in each level from matrix
2. Compare to summary statistics (Critical: X, High: Y, etc.)
3. **Expected:** Counts match exactly

---

## Test Scenario 7: Key Risk Indicators (KRIs)

**URL:** `/risks/kris`

### Display Tests:
- [ ] KRI table with columns: ID, Name, Risk, Status, Value, Trend
- [ ] RAG status badges colored correctly

### Business Logic Tests:

**Test 7.1: Create KRI with Thresholds**
1. Click "Add KRI"
2. Fill in:
   - KRI ID: `KRI-TEST-001`
   - Name: `Patch Compliance Rate`
   - Unit: `%`
   - Threshold Green: `≥95%`
   - Threshold Amber: `80-94%`
   - Threshold Red: `<80%`
   - Associated Risk: Select a risk
3. **Expected:** KRI created with status `NOT_MEASURED` (no value yet)

**Test 7.2: Record GREEN Value**
1. Open KRI-TEST-001
2. Click "Record Value"
3. Enter value: `97`
4. **Expected:**
   - Status changes to 🟢 GREEN (97 ≥ 95)
   - Value displays as "97%"

**Test 7.3: Record AMBER Value**
1. Record new value: `88`
2. **Expected:**
   - Status changes to 🟡 AMBER (88 is between 80-94)
   - Previous value (97) moves to history

**Test 7.4: Record RED Value**
1. Record new value: `72`
2. **Expected:**
   - Status changes to 🔴 RED (72 < 80)
   - Trend shows ↓ DECLINING (from 88 to 72)

**Test 7.5: Trend Calculation**
1. Record sequence: 90 → 92 → 94
2. **Expected:** Trend shows ↑ IMPROVING
3. Record: 94 → 94 → 93
4. **Expected:** Trend shows → STABLE or ↓ DECLINING

**Test 7.6: KRI History**
1. Open a KRI with multiple recorded values
2. View history section
3. **Expected:**
   - All historical values shown chronologically
   - Each entry shows value, status at time, date
   - Trend line or chart (if present) reflects history

---

## Test Scenario 8: Treatment Plans

**URL:** `/risks/treatments`

### Display Tests:
- [ ] Table with columns: ID, Title, Risk, Status, Target Date, Owner
- [ ] Status summary cards (Total, In Progress, Completed, Overdue)

### Business Logic Tests:

**Test 8.1: Create Treatment Plan**
1. Click "Add Treatment Plan"
2. Fill in:
   - Title: `Implement MFA`
   - Description: `Deploy multi-factor authentication`
   - Type: `Mitigate`
   - Priority: `High`
   - Associated Risk: Select a HIGH risk
   - Target Date: 30 days from now (for HIGH risk deadline)
3. **Expected:** Plan created with status `DRAFT`

**Test 8.2: Treatment Plan Workflow**
Test the full workflow:
1. Create plan → Status: `DRAFT`
2. Submit for approval → Status: `PROPOSED`
3. Approve → Status: `APPROVED`
4. Start work → Status: `IN_PROGRESS`
5. Complete all actions → Status: `COMPLETED`
6. **Expected:** Each transition works correctly

**Test 8.3: Treatment Type Validation**
Verify each treatment type is available:
- [ ] **Mitigate**: Reduce likelihood/impact
- [ ] **Transfer**: Shift to third party (insurance)
- [ ] **Accept**: Risk within tolerance
- [ ] **Avoid**: Eliminate the risk source
- [ ] **Share**: Distribute with partners

**Test 8.4: Overdue Detection**
1. Create treatment plan with target date in the past
2. **Expected:** 
   - Appears in "Overdue" count on dashboard
   - Shows overdue indicator on detail page

**Test 8.5: Progress Tracking**
1. Create treatment plan with 4 actions
2. Mark 2 actions as completed
3. **Expected:** Progress shows 50%
4. Mark all 4 as completed
5. **Expected:** Progress shows 100%, status auto-changes to `COMPLETED`

**Test 8.6: Treatment Reduces Residual Score**
1. Link treatment plan to a risk
2. Complete the treatment (controls implemented)
3. Update risk residual scores
4. **Expected:** Residual score is lower than inherent score

---

## Test Scenario 9: Risk Tolerance Statements (RTS)

**URL:** `/risks/tolerance`

### Display Tests:
- [ ] Table with columns: RTS ID, Title, Domain, Tolerance Level
- [ ] Tolerance levels properly displayed

### Business Logic Tests:

**Test 9.1: Create RTS with Tolerance Level**
1. Click "Add RTS"
2. Fill in:
   - RTS ID: `RTS-TEST-001`
   - Title: `Vulnerability Management Tolerance`
   - Domain: `Vulnerability Management`
   - Tolerance Level: `LOW` (risk-averse)
   - Proposed Statement: "Critical vulnerabilities must be patched within 7 days"
3. **Expected:** RTS created with status `DRAFT`

**Test 9.2: RTS Approval Workflow**
1. Create RTS in DRAFT
2. Submit for approval → Status: `PENDING_APPROVAL`
3. Approve → Status: `APPROVED`
4. **Expected:** Workflow progresses correctly

**Test 9.3: Tolerance Level Meaning**
Verify correct interpretation:
- [ ] **HIGH Tolerance** = Willing to accept significant risk
- [ ] **MEDIUM Tolerance** = Balanced approach
- [ ] **LOW Tolerance** = Risk-averse, minimal acceptance

**Test 9.4: Link RTS to Risks**
1. Open an RTS detail page
2. Link to applicable risks
3. **Expected:** Risks appear in "Linked Risks" section
4. **Expected:** Risk detail page shows linked RTS

**Test 9.5: Risk vs Tolerance Validation**
1. Have an RTS with LOW tolerance
2. Create a CRITICAL risk in that domain
3. **Expected:** Warning or indicator that risk exceeds tolerance

---

## Test Scenario 10: BIRT Configuration

**URL:** `/risks/birt`

### Display Tests:
- [ ] Four impact categories displayed
- [ ] Five severity levels per category
- [ ] Weight percentages shown

### Business Logic Tests:

**Test 10.1: Default Category Weights**
1. View BIRT configuration
2. **Expected:** Default weights are:
   - Financial: 25%
   - Legal/Regulatory: 25%
   - Reputation: 25%
   - Operational: 25%
   - **Total: 100%**

**Test 10.2: Weight Sum Validation**
1. Try to edit weights to sum > 100%:
   - Financial: 30%
   - Legal/Regulatory: 30%
   - Reputation: 30%
   - Operational: 30% (Total: 120%)
2. **Expected:** Error "Weights must sum to 100%"

**Test 10.3: Weighted Impact Calculation**
1. Create a scenario with BIRT assessment:
   - Financial: Major (4)
   - Legal/Regulatory: Moderate (3)
   - Reputation: Minor (2)
   - Operational: Moderate (3)
2. **Expected:** Weighted Impact = (4×25 + 3×25 + 2×25 + 3×25)/100 = **3** (MODERATE)

**Test 10.4: Custom Weights for Regulated Org**
1. Edit weights:
   - Financial: 20%
   - Legal/Regulatory: 40%
   - Reputation: 20%
   - Operational: 20%
2. Recalculate scenario from Test 10.3
3. **Expected:** Weighted Impact = (4×20 + 3×40 + 2×20 + 3×20)/100 = **3** (MODERATE)
   - But Legal/Regulatory (3) now contributes more: 120 vs 75 before

**Test 10.5: Threshold Descriptions**
1. View thresholds for each category
2. **Expected:** Each level (1-5) has:
   - Numeric value
   - Description (e.g., "Loss > $10M")
   - Rationale for the threshold

---

## Test Scenario 11: Risk Acceptance Rules

### Business Logic Tests:

**Test 11.1: Acceptance Period Limits**
| Risk Level | Max Initial Period |
|------------|-------------------|
| CRITICAL | 6 months |
| HIGH | 12 months |
| MEDIUM | 24 months |
| LOW | 36 months |

1. Try to accept a CRITICAL risk for 8 months
2. **Expected:** Error or warning that max is 6 months

**Test 11.2: Approval Authority**
| Risk Level | Primary Approver |
|------------|-----------------|
| CRITICAL | CEO |
| HIGH | CISO |
| MEDIUM | CISO |
| LOW | Risk Owner |

1. Attempt to accept a CRITICAL risk as non-CEO user
2. **Expected:** Approval workflow routes to CEO

**Test 11.3: Acceptance Documentation**
1. Accept a risk
2. **Expected:** Must provide:
   - Justification/rationale
   - Acceptance conditions
   - Expiry/review date
   - Link to RTS (if applicable)

---

## Test Scenario 12: Framework Filtering

### Business Logic Tests:

**Test 12.1: Filter by Framework**
1. Go to Risk Register
2. Filter by Framework: `ISO 27001`
3. **Expected:** Only ISO-tagged risks shown
4. Filter by Framework: `SOC 2`
5. **Expected:** Only SOC2-tagged risks shown

**Test 12.2: Framework-Specific Sidebar**
1. Click "By Framework" → "ISO 27001" in sidebar
2. **Expected:** Navigates to `/risks/register?framework=ISO`
3. **Expected:** Table pre-filtered to ISO risks only

**Test 12.3: Multi-Framework Support**
1. Create a risk tagged with `DORA` framework
2. **Expected:** Risk appears under DORA filter
3. **Expected:** Risk has DORA-specific fields (if any)

---

## Test Scenario 13: Data Integrity & Relationships

### Business Logic Tests:

**Test 13.1: Risk-Scenario Relationship**
1. Create Risk R-99 with 2 scenarios
2. Delete Risk R-99
3. **Expected:** Both scenarios are also deleted (cascade)

**Test 13.2: Risk-KRI Relationship**
1. Create KRI linked to Risk R-50
2. View Risk R-50 detail page
3. **Expected:** KRI appears in "Key Risk Indicators" section
4. Delete Risk R-50
5. **Expected:** KRI is also deleted (cascade)

**Test 13.3: Risk-Treatment Relationship**
1. Create Treatment Plan for Risk R-75
2. View Risk R-75 detail page
3. **Expected:** Treatment appears in "Treatment Plans" section

**Test 13.4: Framework Consistency**
1. Create KRI with Framework: `ISO`
2. Link to Risk with Framework: `SOC2`
3. **Expected:** Warning about framework mismatch OR automatic alignment

---

## Test Scenario 14: Error Handling & Edge Cases

### Business Logic Tests:

**Test 14.1: Concurrent Edit Handling**
1. Open Risk R-01 in two browser tabs
2. Edit title in Tab A, save
3. Edit title in Tab B (with stale data), save
4. **Expected:** Tab B shows error or prompts to refresh

**Test 14.2: Very Long Field Values**
1. Create risk with 5000-character description
2. **Expected:** Either accepts or shows max length error

**Test 14.3: Special Characters**
1. Create risk with title: `<script>alert('XSS')</script>`
2. **Expected:** Script is NOT executed (XSS prevented)
3. **Expected:** Title displays as plain text

**Test 14.4: Zero/Null Scores**
1. Create risk without setting Likelihood/Impact
2. **Expected:** Score shows as 0 or "Not Assessed"
3. **Expected:** Risk level shows as "NONE" or "Not Assessed"

**Test 14.5: Delete Confirmation**
1. Try to delete a risk
2. **Expected:** Confirmation dialog appears
3. **Expected:** Explains impact (e.g., "This will also delete X scenarios")

---

## Test Scenario 15: Performance & Usability

### Tests:

**Test 15.1: Large Data Set Handling**
1. With 100+ risks, load Risk Register
2. **Expected:** Page loads within 3 seconds
3. **Expected:** Pagination works correctly

**Test 15.2: Search Performance**
1. Search for a term in Risk Register
2. **Expected:** Results appear within 1 second

**Test 15.3: Form Submission Feedback**
1. Submit any create/edit form
2. **Expected:** Loading indicator while saving
3. **Expected:** Success toast/notification on completion

---

## Quick Reference: Expected Calculations

### Risk Score Examples
| Likelihood | Impact | Score | Level |
|------------|--------|-------|-------|
| Rare (1) | Negligible (1) | 1 | LOW |
| Unlikely (2) | Minor (2) | 4 | LOW |
| Possible (3) | Moderate (3) | 9 | MEDIUM |
| Likely (4) | Major (4) | 16 | HIGH |
| Almost Certain (5) | Severe (5) | 25 | CRITICAL |
| Possible (3) | Major (4) | 12 | MEDIUM |
| Likely (4) | Moderate (3) | 12 | MEDIUM |
| Almost Certain (5) | Minor (2) | 10 | MEDIUM |

### Risk Reduction Examples
| Inherent | Residual | Reduction |
|----------|----------|-----------|
| 20 | 8 | 60% |
| 16 | 4 | 75% |
| 12 | 6 | 50% |
| 25 | 10 | 60% |

---

## Test Results Template

```
Date: ___________
Tester: ___________
Module: Risk Management

Test Scenario: ___________
Business Logic Test: ___________

Input Values:
- Likelihood: ___
- Impact: ___
- Other: ___

Expected Result:
- Score: ___
- Level: ___
- Behavior: ___

Actual Result:
- Score: ___
- Level: ___
- Behavior: ___

Status: [ ] PASS [ ] FAIL

Issues Found:
1. 
2. 

Notes:
```

---

## Critical Business Logic Checklist

Before release, verify:

- [ ] **Risk scores calculate correctly** (L × I)
- [ ] **Risk levels map correctly** to score ranges
- [ ] **Status transitions** follow lifecycle
- [ ] **KRI RAG status** reflects thresholds
- [ ] **KRI trends** calculate from historical data
- [ ] **Treatment workflows** progress correctly
- [ ] **Parent risk scores** aggregate from scenarios (MAX)
- [ ] **BIRT weights** sum to 100%
- [ ] **Weighted impact** calculates correctly
- [ ] **Acceptance periods** respect limits per level
- [ ] **Framework filters** show correct data
- [ ] **Relationships cascade** correctly on delete
- [ ] **Audit trail** captures all changes

---

**End of Manual Testing Guide**
