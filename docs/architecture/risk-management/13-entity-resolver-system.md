# Scenario Entity Resolver System Architecture

## Overview

The Scenario Entity Resolver fetches relevant entities (assets, vendors, applications, controls, etc.) for risk scenario assessment. It provides the data foundation for factor calculations (F1-F6), impact assessments (I1-I5), and FAIR analysis by resolving linked entities and their security attributes.

---

## 1. Purpose

The Entity Resolver serves multiple functions:

1. **Factor Calculation Inputs**: Provides entity data for calculating F1-F6 factors
2. **Impact Assessment Data**: Supplies asset values, criticality for I1-I5
3. **FAIR Parameters**: Delivers loss magnitude inputs (asset costs, vendor values)
4. **Scenario Context**: Enriches scenario with linked entity details

---

## 2. ScenarioInputs Interface

### Complete Input Structure

```typescript
interface ScenarioInputs {
  assets: AssetInput[];
  vendors: VendorInput[];
  applications: ApplicationInput[];
  controls: ControlInput[];
  policies: PolicyInput[];
  businessProcesses?: BusinessProcessInput[];
  locations?: LocationInput[];
  keyPersonnel?: KeyPersonnelInput[];
  incidents?: IncidentInput[];
}
```

### Asset Input

```typescript
interface AssetInput {
  id: string;
  name: string;
  assetType?: string | null;              // SERVER, DATABASE, APPLICATION, etc.
  criticality?: string | null;            // Derived from businessCriticality
  businessCriticality?: string | null;    // LOW, MEDIUM, HIGH, CRITICAL
  dataClassification?: string | null;     // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
  handlesPersonalData?: boolean;
  handlesFinancialData?: boolean;
  handlesHealthData?: boolean;
  vulnerabilityCount?: number | null;     // Total vulnerabilities
  criticalVulnCount?: number | null;      // Critical severity
  highVulnCount?: number | null;          // High severity
  externalFacing?: boolean;               // Exposed to internet
  publiclyAccessible?: boolean;
  value?: number | null;                  // Monetary value (for FAIR)
}
```

### Vendor Input

```typescript
interface VendorInput {
  id: string;
  name: string;
  tier?: string | null;              // STRATEGIC, TACTICAL, COMMODITY
  status?: string | null;            // ACTIVE, UNDER_REVIEW, TERMINATED
  riskScore?: number | null;         // Vendor risk assessment score
  contractValue?: number | null;     // Annual contract value
  isStrategic?: boolean;
  publiclyVisible?: boolean;         // Vendor name visible to customers
  customerFacing?: boolean;          // Direct customer interaction
}
```

### Application Input

```typescript
interface ApplicationInput {
  id: string;
  name: string;
  criticality?: string | null;       // LOW, MEDIUM, HIGH, CRITICAL
  category?: string | null;          // CRM, ERP, CUSTOM, etc.
  subCategory?: string | null;
  hosting?: string | null;           // ON_PREMISE, CLOUD, HYBRID
  personalData?: boolean;
  handlesPersonalData?: boolean;     // Alias for personalData
  financialData?: boolean;
  handlesFinancialData?: boolean;
  healthData?: boolean;
  handlesHealthData?: boolean;
  dataClassification?: string | null;
  externalFacing?: boolean;
  customerFacing?: boolean;
}
```

### Control Input

```typescript
interface ControlInput {
  id: string;
  controlId: string;                 // e.g., "ISO-A.9.1.1"
  name: string;
  capabilities?: {
    effectivenessTests?: {
      testDate?: Date | null;
      testResult?: string | null;    // PASS, PARTIAL, FAIL
    }[];
  }[];
}
```

### Additional Inputs

```typescript
interface PolicyInput {
  id: string;
  title: string;
  status?: string | null;
  regulatoryFramework?: string | null;
  complianceStatus?: string | null;
  nextReviewDate?: Date | null;
}

interface BusinessProcessInput {
  id: string;
  name: string;
  criticality?: string | null;
  revenueImpact?: string | null;
  strategicImportance?: string | null;
  rtoHours?: number | null;          // Recovery Time Objective
  rpoHours?: number | null;          // Recovery Point Objective
}

interface LocationInput {
  id: string;
  name: string;
  tier?: string | null;              // PRIMARY, SECONDARY, DR_SITE
}

interface KeyPersonnelInput {
  id: string;
  name: string;
  role?: string | null;
  criticality?: string | null;
  backupPerson?: string | null;
}

interface IncidentInput {
  id: string;
  severity?: string | null;
  category?: string | null;
}
```

---

## 3. Resolution Process

### Main Resolution Flow

```typescript
async getScenarioEntities(scenario: RiskScenarioWithRisk): Promise<ScenarioInputs> {
  const riskId = scenario.risk.riskId;
  logger.debug(`Resolving entities for risk ${riskId} (scenario ${scenario.id})`);

  // Fetch all entity types for the scenario
  return this.getGenericInputs(scenario);
}
```

### Entity Fetching

```typescript
private async getGenericInputs(scenario: RiskScenarioWithRisk): Promise<ScenarioInputs> {
  // 1. Fetch scenario with all linked entities
  const fullScenario = await prisma.riskScenario.findUnique({
    where: { id: scenario.id },
    include: {
      assetLinks: { include: { asset: true } },
      vendorLinks: { include: { vendor: true } },
      applicationLinks: { include: { application: true } },
      controlLinks: {
        include: {
          control: {
            include: {
              capabilities: {
                include: {
                  effectivenessTests: {
                    orderBy: { testDate: 'desc' },
                    take: 1,  // Most recent test only
                  },
                },
              },
            },
          },
        },
      },
      risk: { include: { organisation: true } },
    },
  });

  if (!fullScenario) {
    return emptyInputs();
  }

  const organisationId = fullScenario.risk?.organisationId;

  // 2. Map linked entities to inputs
  const assets = mapAssets(fullScenario.assetLinks);
  const vendors = mapVendors(fullScenario.vendorLinks);
  const applications = mapApplications(fullScenario.applicationLinks);
  const controls = mapControls(fullScenario.controlLinks);

  // 3. Fetch additional org-wide entities
  const [policies, businessProcesses, locations, keyPersonnel, incidents] = await Promise.all([
    fetchPolicies(organisationId),
    fetchBusinessProcesses(),
    fetchLocations(),
    fetchKeyPersonnel(),
    fetchIncidents(organisationId),
  ]);

  return {
    assets,
    vendors,
    applications,
    controls,
    policies,
    businessProcesses,
    locations,
    keyPersonnel,
    incidents,
  };
}
```

---

## 4. Entity Mapping Functions

### Map Assets

```typescript
private mapAssets(assetLinks: any[]): AssetInput[] {
  return (assetLinks ?? []).map(link => ({
    id: link.asset.id,
    name: link.asset.name,
    assetType: link.asset.assetType,
    criticality: link.asset.businessCriticality,
    businessCriticality: link.asset.businessCriticality,
    dataClassification: link.asset.dataClassification,
    handlesPersonalData: link.asset.handlesPersonalData,
    handlesFinancialData: link.asset.handlesFinancialData,
    handlesHealthData: link.asset.handlesHealthData,
  }));
}
```

### Map Controls

```typescript
private mapControls(controlLinks: any[]): ControlInput[] {
  return (controlLinks ?? []).map(link => ({
    id: link.control.id,
    controlId: link.control.controlId,
    name: link.control.name,
    capabilities: link.control.capabilities.map(cap => ({
      effectivenessTests: cap.effectivenessTests.map(test => ({
        testDate: test.testDate,
        testResult: test.testResult,
      })),
    })),
  }));
}
```

---

## 5. Factor Calculation Usage

### F1 (Threat Frequency)

```typescript
// Uses linked threats (RiskScenarioThreat), not entity resolver
// But entity resolver provides context for threat applicability
const threatApplicability = assessThreatApplicability(
  inputs.assets,      // What assets are targeted
  inputs.applications // What applications are at risk
);
```

### F2 (Control Effectiveness)

```typescript
// Calculate from linked controls' test results
const controlEffectiveness = calculateF2(inputs.controls);

function calculateF2(controls: ControlInput[]): number {
  if (controls.length === 0) return 5; // No controls = maximum vulnerability

  const testResults = controls.flatMap(c =>
    c.capabilities?.flatMap(cap =>
      cap.effectivenessTests?.map(t => t.testResult) ?? []
    ) ?? []
  );

  const passCount = testResults.filter(r => r === 'PASS').length;
  const partialCount = testResults.filter(r => r === 'PARTIAL').length;
  const failCount = testResults.filter(r => r === 'FAIL').length;

  // Weighted effectiveness
  const totalTests = passCount + partialCount + failCount;
  if (totalTests === 0) return 3; // Not tested = moderate

  const effectivenessScore = (passCount * 100 + partialCount * 50 + failCount * 0) / totalTests;

  // Map to 1-5 scale (inverse: higher effectiveness = lower F2)
  if (effectivenessScore >= 90) return 1;
  if (effectivenessScore >= 70) return 2;
  if (effectivenessScore >= 50) return 3;
  if (effectivenessScore >= 30) return 4;
  return 5;
}
```

### F3 (Gap/Vulnerability)

```typescript
// Calculate from asset exposure
const gapVulnerability = calculateF3(inputs.assets, inputs.applications, inputs.vendors);

function calculateF3(
  assets: AssetInput[],
  applications: ApplicationInput[],
  vendors: VendorInput[]
): number {
  let exposureScore = 0;
  let factors = 0;

  // Asset exposure
  for (const asset of assets) {
    if (asset.externalFacing) exposureScore += 2;
    if (asset.publiclyAccessible) exposureScore += 2;
    if (asset.handlesPersonalData) exposureScore += 1;
    if (asset.handlesFinancialData) exposureScore += 1;
    if (asset.criticalVulnCount && asset.criticalVulnCount > 0) exposureScore += 2;
    factors += 5;
  }

  // Application exposure
  for (const app of applications) {
    if (app.externalFacing) exposureScore += 2;
    if (app.personalData) exposureScore += 1;
    if (app.criticality === 'CRITICAL') exposureScore += 1;
    factors += 3;
  }

  // Vendor exposure
  for (const vendor of vendors) {
    if (vendor.customerFacing) exposureScore += 1;
    if (vendor.tier === 'STRATEGIC') exposureScore += 1;
    factors += 2;
  }

  if (factors === 0) return 3; // Default

  const normalizedScore = (exposureScore / factors) * 5;
  return Math.min(5, Math.max(1, Math.round(normalizedScore)));
}
```

---

## 6. Impact Assessment Usage

### I1 (Financial Impact)

```typescript
function calculateI1(inputs: ScenarioInputs): number {
  const assetValues = inputs.assets
    .filter(a => a.value != null)
    .map(a => a.value!);

  const vendorValues = inputs.vendors
    .filter(v => v.contractValue != null)
    .map(v => v.contractValue!);

  const totalExposure = sum(assetValues) + sum(vendorValues);

  // Map to 1-5 based on org thresholds
  return mapToImpactLevel(totalExposure, financialThresholds);
}
```

### I2 (Operational Impact)

```typescript
function calculateI2(inputs: ScenarioInputs): number {
  // Based on business process criticality and RTO
  const criticalProcesses = inputs.businessProcesses?.filter(
    bp => bp.criticality === 'CRITICAL'
  ) ?? [];

  const minRTO = Math.min(
    ...criticalProcesses.map(bp => bp.rtoHours ?? 168)
  );

  // Shorter RTO = higher operational impact
  if (minRTO <= 4) return 5;  // SEVERE
  if (minRTO <= 24) return 4; // MAJOR
  if (minRTO <= 72) return 3; // MODERATE
  if (minRTO <= 168) return 2; // MINOR
  return 1; // NEGLIGIBLE
}
```

### I3 (Regulatory Impact)

```typescript
function calculateI3(inputs: ScenarioInputs): number {
  let regulatoryExposure = 0;

  // Data types that trigger regulations
  const hasPersonalData = inputs.assets.some(a => a.handlesPersonalData) ||
                          inputs.applications.some(a => a.personalData);
  const hasFinancialData = inputs.assets.some(a => a.handlesFinancialData);
  const hasHealthData = inputs.assets.some(a => a.handlesHealthData);

  if (hasPersonalData) regulatoryExposure += 2; // GDPR, CCPA
  if (hasFinancialData) regulatoryExposure += 2; // PCI-DSS, SOX
  if (hasHealthData) regulatoryExposure += 2; // HIPAA

  // Policy compliance status
  const nonCompliantPolicies = inputs.policies.filter(
    p => p.complianceStatus === 'NON_COMPLIANT'
  ).length;
  regulatoryExposure += nonCompliantPolicies;

  return Math.min(5, Math.max(1, Math.ceil(regulatoryExposure / 2)));
}
```

---

## 7. Junction Table Structure

### Scenario Links

```
RiskScenario
  ├── assetLinks: RiskScenarioAsset[]
  │     ├── scenarioId
  │     ├── assetId
  │     ├── isPrimaryTarget: boolean
  │     ├── feedsF3: boolean
  │     ├── feedsI1: boolean
  │     └── feedsI2: boolean
  │
  ├── vendorLinks: RiskScenarioVendor[]
  │     ├── scenarioId
  │     ├── vendorId
  │     ├── feedsF3: boolean
  │     ├── feedsI1: boolean
  │     └── feedsI4: boolean
  │
  ├── applicationLinks: RiskScenarioApplication[]
  │     ├── scenarioId
  │     ├── applicationId
  │     ├── isPrimaryTarget: boolean
  │     ├── feedsF3: boolean
  │     ├── feedsI1: boolean
  │     └── feedsI3: boolean
  │
  └── controlLinks: RiskScenarioControl[]
        ├── scenarioId
        ├── controlId
        ├── effectivenessWeight: Int (0-100)
        ├── isPrimaryControl: boolean
        └── notes: String?
```

---

## 8. API Integration

### Usage in Risk Calculation Service

```typescript
// In RiskCalculationService
async calculateScenario(scenarioId: string): Promise<CalculationResult> {
  const scenario = await prisma.riskScenario.findUnique({
    where: { id: scenarioId },
    include: { risk: true },
  });

  // Resolve entities
  const inputs = await entityResolver.getScenarioEntities(scenario);

  // Calculate factors using resolved entities
  const f2 = calculateF2(inputs.controls);
  const f3 = calculateF3(inputs.assets, inputs.applications, inputs.vendors);

  // Calculate impacts
  const i1 = calculateI1(inputs);
  const i2 = calculateI2(inputs);
  const i3 = calculateI3(inputs);

  // Continue with score calculation...
}
```

---

## 9. Empty Inputs

When scenario has no linked entities:

```typescript
private emptyInputs(): ScenarioInputs {
  return {
    assets: [],
    vendors: [],
    applications: [],
    controls: [],
    policies: [],
    businessProcesses: [],
    locations: [],
    keyPersonnel: [],
    incidents: [],
  };
}
```

---

## 10. Implementation Status

### Fully Implemented ✅
- Linked entity fetching (assets, vendors, applications, controls)
- Control effectiveness test retrieval
- Organisation-wide entity fetching (policies, processes, locations)
- Asset data mapping
- Control capabilities mapping

### Partially Implemented ⚠️
- Factor calculation from entities (basic implementation)
- Impact assessment from entities (basic implementation)

### Not Implemented ❌
- Risk-category-specific entity filtering (e.g., R-06 IAM-specific)
- Entity suggestion engine (recommend entities to link)
- Automatic entity discovery based on threat type
- Entity contribution scoring (which entities contribute most to risk)
- Historical entity state tracking

---

## 11. Key Files

| Component | File |
|-----------|------|
| Entity Resolver | `src/risks/services/scenario-entity-resolver.service.ts` |
| Risk Calculation | `src/risks/services/risk-calculation.service.ts` |
| Schema | `prisma/schema/controls.prisma` (RiskScenarioAsset, RiskScenarioVendor, etc.) |
