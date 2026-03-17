# 🧪 Testing Nonconformity Auto-Creation

## ✅ What Was Fixed

**Problem**: Backend server was running old code without the `AuditsModule` loaded.

**Solution**: Restarted the backend server to load the latest code with nonconformity auto-creation.

---

## 🧪 How to Test

### Step 1: Navigate to a Test Page
Go to any effectiveness test page, for example:
```
http://localhost:5173/controls/{controlId}/capabilities/{capabilityId}/tests/{testId}
```

Or use your test:
```
http://localhost:5173/controls/cmj7b9xac000beocjymbyiym2/capabilities/cmj7b9y0v0075eocjaruont1p/tests/cmj9rx7lj005ttqb6ninlopsz
```

### Step 2: Record a FAIL Result

1. Click the **"Record Result"** button
2. Fill in the form:
   - **Test Result**: Select "Fail" ❌
   - **Tester**: Enter your name (e.g., "Daniel")
   - **Test Date**: Select today's date
   - **Findings**: Enter what went wrong (e.g., "Access controls not configured properly")
   - **Recommendations**: Enter how to fix it (e.g., "Configure MFA and review access policies")
   - **Evidence Location**: Enter where evidence is (e.g., "Azure AD logs")

3. Click **"Save"**

### Step 3: Check the Audits Dashboard

1. Navigate to **Audits** module (in the main nav)
2. Look at the dashboard cards:
   - **"Open Nonconformities"** count should have increased
   - **"Overdue"** may show the new NC if it's past due date

3. Click **"View All"** or go to **Nonconformity Register**

### Step 4: Verify the Auto-Created NC

You should see a NEW nonconformity with:

✅ **Auto-Generated ID**: `NC-2025-XXX` (sequential)
✅ **Source**: "Effectiveness Test"
✅ **Severity**: 
   - `MAJOR` (red) if it was an **Operating** test
   - `MINOR` (amber) if it was **Design** or **Implementation** test
✅ **Status**: `OPEN`
✅ **Title**: "{Test Type} Test Failed: {Capability Name}"
✅ **Linked to**:
   - The control
   - The capability
   - The specific test that failed
✅ **Findings**: Your findings from the test
✅ **Corrective Action**: Your recommendations from the test
✅ **Raised By**: You (the person who updated the test)

### Step 5: View NC Details

Click on the nonconformity to see the detail page with:
- Full description
- Links back to the control and capability
- Timeline showing when it was raised
- Related items section
- CAP (Corrective Action Plan) section
- Verification section

---

## 🔍 Troubleshooting

### If NC Still Doesn't Get Created:

1. **Check Browser Console** (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed API calls

2. **Check Backend Logs**
   - Look in the terminal running the backend server
   - Search for "Failed to auto-create nonconformity" errors

3. **Verify Test Status Changed**
   - The NC is only created when a test **changes FROM** non-FAIL **TO** FAIL
   - If the test was already FAIL, updating it again won't create another NC
   - Try a different test or change to PASS first, then back to FAIL

4. **Check Database**
   ```bash
   psql -d riskready -U danielminda -c "SELECT * FROM \"Nonconformity\" ORDER BY \"createdAt\" DESC LIMIT 5;"
   ```

---

## 📊 Expected Behavior

### What Triggers Auto-Creation:
✅ Test result changes from `NOT_TESTED`, `PASS`, `PARTIAL`, or `NOT_APPLICABLE` → **`FAIL`**

### What DOESN'T Trigger:
❌ Test already FAIL → updating fields (no status change)
❌ Test changes from FAIL → PASS (closing, not creating)
❌ Test changes to PARTIAL (not a full failure)

---

## 🎯 Next Test Scenarios

Try these to see different severities:

### Test 1: Design Test Failure (MINOR)
- Navigate to a **DESIGN** test
- Set result to **FAIL**
- Expected: NC created with **MINOR** severity (🟡 amber badge)

### Test 2: Implementation Test Failure (MINOR)
- Navigate to an **IMPLEMENTATION** test
- Set result to **FAIL**
- Expected: NC created with **MINOR** severity (🟡 amber badge)

### Test 3: Operating Test Failure (MAJOR)
- Navigate to an **OPERATING** test
- Set result to **FAIL**
- Expected: NC created with **MAJOR** severity (🔴 red badge)

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ Test page shows "Failed" status after save
2. ✅ Audits dashboard "Open NCs" count increases
3. ✅ Nonconformity appears in the register
4. ✅ NC details page shows test link
5. ✅ No errors in browser console
6. ✅ No errors in backend logs

---

## 📝 Notes

- Each test can only create ONE nonconformity
- Re-failing an already-failed test won't create duplicates
- The system tracks the previous state to avoid duplication
- NCs can be manually created from the Audits module as well
- The auto-created NC serves as the "incident record" for the test failure

---

**Status**: ✅ Ready to Test
**Last Updated**: 2025-12-17 14:08












