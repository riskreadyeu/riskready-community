# RiskReady Risk Module Assessment: Archer GRC Alignment

> Comprehensive assessment comparing RiskReady's current risk module against Archer GRC design patterns, with recommendations for alignment while preserving shadcn/ui design system.

---

## Executive Summary

RiskReady's risk module is a sophisticated, feature-rich implementation that **already exceeds Archer in several areas** (quantitative FAIR analysis, modern tech stack, responsive design). However, there are structural and UX patterns from Archer that could improve usability, navigation, and enterprise readiness.

### Overall Assessment: **Strong Foundation with Enhancement Opportunities**

| Area | Current State | Archer Alignment | Priority |
|------|---------------|------------------|----------|
| Navigation Structure | **Excellent** | **90%** | Low |
| Record Detail Pages | Excellent | 85% | Low |
| Dashboard Design | Excellent | 90% | Low |
| Field Design Patterns | Good | 75% | Medium |
| Workflow/Status | Excellent | 95% | Low |
| Cross-Reference Grids | Good | 70% | Medium |
| Conditional Layouts | Partial | 50% | High |
| Role-Based Views | Missing | 20% | High |
| Bulk Operations | Missing | 30% | Medium |
| Global Search | Missing | 25% | Medium |

---

## 1. Navigation Structure

### Current State (RiskReady)

**Sidebar Navigation** (`risks-sidebar.tsx`) - **Already Well-Organized**:

```
├── Overview
│   ├── Dashboard
│   └── Risk Register
├── Operations
│   ├── Key Risk Indicators
│   └── Treatment Plans
├── Appetite & Tolerance
│   ├── Appetite Overview
│   └── Tolerance Statements
├── Analysis
│   ├── Risk Assessment
│   ├── Analytics
│   └── Threat Catalog
├── Governance
│   └── RACI & Escalation
├── Configuration
│   ├── Impact Thresholds (BIRT)
│   └── Loss Magnitude
└── By Framework (ISO, SOC2, NIS2, DORA filters)
```

**Routing Structure**:
```
/risks
├── Dashboard (landing)
├── Risk Register (list)
├── Risk Detail → Tabs (Overview, Scenarios, KRIs, Treatments)
├── Scenario Detail → Stage-based tabs
├── KRI List/Detail
├── Treatment List/Detail
├── Tolerance Statements
├── Appetite Configuration
├── BIRT Configuration
└── Threat Catalog
```

### Archer Pattern

```
Workspace: Risk Management
├── Solution: Enterprise Risk
│   ├── Application: Risk Register → Records
│   ├── Application: Risk Assessments
│   └── Application: Risk Scenarios
├── Solution: Operational Risk
│   └── Applications...
└── Dashboards (configurable per workspace)
```

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Workspace/Group concept | **Yes - 7 groups** | Multi-workspace | **None** |
| Group labels | **Yes** | Yes | **None** |
| Collapsible groups | No | Yes | Small |
| Breadcrumb | Yes | Yes | None |
| Framework filters | **Yes (4 frameworks)** | Multiple dimensions | **None** |
| Favorites/Recent | Missing | Yes | Medium |
| Saved views | Missing | Yes | Medium |

**Assessment**: The sidebar is already **well-aligned with Archer patterns**. Only minor enhancements needed.

### Recommendations

#### 1.1 Add Collapsible Groups (Low Priority)

The current groups are always expanded. Add collapse functionality for users who want to hide sections:

```tsx
// Enhance NavGroup with collapsible state
interface NavGroup {
  label: string;
  items: NavItem[];
  defaultCollapsed?: boolean;
}

// Add Collapsible wrapper in render
<Collapsible defaultOpen={!group.defaultCollapsed}>
  <CollapsibleTrigger className="flex items-center justify-between w-full">
    <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {group.label}
    </span>
    <ChevronDown className="w-3 h-3 text-muted-foreground" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* existing items */}
  </CollapsibleContent>
</Collapsible>
```

#### 1.2 Add Favorites & Recent (Medium Priority)
```tsx
// Track user's frequently accessed items
interface RecentItem {
  type: 'risk' | 'scenario' | 'kri' | 'treatment';
  id: string;
  title: string;
  accessedAt: Date;
}

// Store in localStorage or user preferences API
const useRecentItems = () => {
  const [recent, setRecent] = useState<RecentItem[]>([]);

  const addRecent = (item: RecentItem) => {
    setRecent(prev => [item, ...prev.filter(i => i.id !== item.id)].slice(0, 10));
  };

  return { recent, addRecent };
};
```

#### 1.3 Add Saved Views/Filters (Medium Priority)
```tsx
// Allow users to save filter configurations
interface SavedView {
  id: string;
  name: string;
  filters: {
    tier?: RiskTier[];
    status?: RiskStatus[];
    framework?: ControlFramework[];
    owner?: string;
    scoreRange?: [number, number];
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 2. Record Detail Page Layout

### Current State (RiskReady)

**RiskDetailPage.tsx** (995 lines):
- DetailHero header with badges, metadata, actions
- Quick stats row (4 cards)
- Tolerance statement alert
- Tab-based content (Overview, Scenarios, KRIs, Treatments)

**RiskScenarioDetailPage.tsx** (1965 lines):
- DetailHero header
- Quick stats row (4 cards)
- Lifecycle stepper
- Assessment progress row
- Stage-based dynamic tabs
- Audit trail section

### Archer Pattern

```
Record Detail Page
├── Header Bar (breadcrumb, title, actions)
├── Tab Set (container)
│   ├── Tab 1: General (sections with fields)
│   ├── Tab 2: Assessment
│   ├── Tab 3: Related Records (cross-ref grids)
│   └── Tab N: History
└── Footer (audit trail)
```

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Header with actions | Excellent | Good | None (RR better) |
| Tab-based layout | Yes | Yes | None |
| Sections within tabs | Partial (Cards) | Formal sections | Small |
| Section collapse | Limited | Full support | Small |
| Field grouping | Good | Formal sections | Small |
| Inline editing | Yes | Yes | None |
| Cross-ref grids | Good | Better patterns | Small |
| Help tooltips | Limited | Extensive | Medium |

### Recommendations

#### 2.1 Standardize Section Component (Low Priority)

The current implementation uses Cards well, but could benefit from a consistent Section component:

```tsx
// components/ui/section.tsx
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({
  title,
  icon,
  description,
  collapsible = false,
  defaultCollapsed = false,
  actions,
  children
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="text-card-title font-semibold">{title}</h3>
            {description && (
              <p className="text-caption text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronDown /> : <ChevronUp />}
            </Button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
```

#### 2.2 Add Field-Level Help Tooltips (Medium Priority)

Archer has extensive help text on fields. Add this pattern:

```tsx
// components/ui/field-with-help.tsx
interface FieldWithHelpProps {
  label: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWithHelp({ label, helpText, required, children }: FieldWithHelpProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label>{label}</Label>
        {required && <span className="text-destructive">*</span>}
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}
```

---

## 3. Dashboard Design

### Current State (RiskReady)

**RisksDashboardPage.tsx** (1037 lines):
- 5 KPI stat cards (Total, Above Tolerance, KRIs in RED, Overdue, Avg Score)
- Full-width 5x5 risk heatmap with legend and stats sidebar
- Top 5 risks + Risk trend chart (2-column)
- Tolerance compliance + Treatment plans (2-column)
- Control effectiveness + KRI status (2-column)
- Risks by tier + Risks by framework (2-column)

### Archer Pattern

- Widget-based dashboards
- Multi-chart widgets (up to 15 charts)
- Links widgets
- Progress trackers
- Report objects
- Configurable per user group

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| KPI cards | Excellent | Good | None (RR better) |
| Heatmap | Excellent | Similar | None |
| Trend charts | Good | Good | None |
| Widget concept | Implicit | Explicit | Small |
| Dashboard selector | Missing | Yes | Medium |
| Widget configuration | Missing | Yes | Medium |
| Export to PDF/PPT | Missing | Yes | Medium |
| Multi-dashboard | Missing | Yes | Low |

### Recommendations

#### 3.1 Add Dashboard Configuration (Low Priority - Future)

This is a larger feature that could be added later:

```tsx
// Allow users to configure which widgets appear
interface DashboardWidget {
  id: string;
  type: 'stat-card' | 'heatmap' | 'trend-chart' | 'list' | 'progress';
  title: string;
  position: { row: number; col: number; colSpan?: number };
  config: Record<string, any>;
}

interface DashboardConfig {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
}
```

#### 3.2 Add Dashboard Export (Medium Priority)

```tsx
// Add export functionality
const exportDashboard = async (format: 'pdf' | 'png') => {
  const element = document.getElementById('dashboard-content');
  if (format === 'pdf') {
    // Use html2pdf or similar
    const pdf = await html2pdf(element, { filename: 'risk-dashboard.pdf' });
    pdf.save();
  } else {
    // Use html2canvas
    const canvas = await html2canvas(element);
    const link = document.createElement('a');
    link.download = 'risk-dashboard.png';
    link.href = canvas.toDataURL();
    link.click();
  }
};
```

---

## 4. Field Design Patterns

### Current State (RiskReady)

- Uses shadcn Select, Input, Textarea components
- Dropdowns for most selections
- Badge-based status displays
- Good color coding for risk levels

### Archer Pattern

| # of Options | Archer UI Control |
|--------------|-------------------|
| 2-4 values | Radio buttons (single) / Checkboxes (multi) |
| 5-10 values | Dropdown menu |
| 10+ values | Dropdown with type-ahead filter |

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Option control selection | Always dropdown | Context-aware | Medium |
| Type-ahead filter | Partial | Full | Small |
| Field limits per layout | Not enforced | < 70 | N/A (not relevant) |
| Cross-ref field limits | Not enforced | < 20 | N/A |

### Recommendations

#### 4.1 Use Radio Groups for Small Option Sets (Medium Priority)

Replace dropdowns with radio groups for 2-4 options:

```tsx
// Current (always dropdown)
<Select value={tier} onValueChange={setTier}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="CORE">Core</SelectItem>
    <SelectItem value="EXTENDED">Extended</SelectItem>
    <SelectItem value="ADVANCED">Advanced</SelectItem>
  </SelectContent>
</Select>

// Archer pattern (radio for 3 options)
<RadioGroup value={tier} onValueChange={setTier} className="flex gap-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="CORE" id="tier-core" />
    <Label htmlFor="tier-core">Core</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="EXTENDED" id="tier-extended" />
    <Label htmlFor="tier-extended">Extended</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="ADVANCED" id="tier-advanced" />
    <Label htmlFor="tier-advanced">Advanced</Label>
  </div>
</RadioGroup>
```

#### 4.2 Create Smart Field Component (Medium Priority)

```tsx
// Automatically choose UI control based on options count
interface SmartSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  multiSelect?: boolean;
}

export function SmartSelect({ value, onChange, options, multiSelect }: SmartSelectProps) {
  // 2-4 options: radio/checkbox
  if (options.length <= 4) {
    if (multiSelect) {
      return (
        <div className="flex flex-wrap gap-3">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <Checkbox checked={value.includes(opt.value)} />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
        {options.map(opt => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={opt.value} />
            <Label htmlFor={opt.value}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // 5-10 options: dropdown
  if (options.length <= 10) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // 10+ options: combobox with search
  return (
    <Combobox value={value} onChange={onChange} options={options} />
  );
}
```

---

## 5. Cross-Reference Grids (Related Records)

### Current State (RiskReady)

- ScenarioCoverageMatrix for scenario × control mapping
- Inline KRI cards with bulk entry
- Treatment plan list with progress bars
- Control links in ScenarioControlEffectiveness

### Archer Pattern

- Formal cross-reference fields with lookup popup
- Grid display with add/remove buttons
- Key field as first column
- Default 5 records visible
- Report objects for 10+ records

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Lookup popup | Basic | Full-featured | Medium |
| Add/Remove UI | Inline | Dedicated buttons | Small |
| Grid pagination | No (show all) | Yes (5 default) | Small |
| Link to detail | Yes | Yes | None |
| Create from grid | Missing | Yes | Medium |

### Recommendations

#### 5.1 Create Standard Related Records Grid (Medium Priority)

```tsx
// components/risks/RelatedRecordsGrid.tsx
interface RelatedRecordsGridProps<T> {
  title: string;
  records: T[];
  columns: ColumnDef<T>[];
  onAdd: () => void;
  onRemove: (ids: string[]) => void;
  onCreate?: () => void;
  defaultPageSize?: number;
  maxHeight?: string;
}

export function RelatedRecordsGrid<T extends { id: string }>({
  title,
  records,
  columns,
  onAdd,
  onRemove,
  onCreate,
  defaultPageSize = 5,
  maxHeight = "300px"
}: RelatedRecordsGridProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          <Badge variant="secondary">{records.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(selectedIds)}
            >
              Remove ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
          {onCreate && (
            <Button variant="outline" size="sm" onClick={onCreate}>
              <PlusCircle className="w-4 h-4 mr-1" /> Create New
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxHeight }} className="overflow-auto">
        <DataTable
          columns={[
            {
              id: "select",
              header: ({ table }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
              ),
            },
            ...columns
          ]}
          data={records}
          pageSize={pageSize}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Footer with pagination */}
      {records.length > defaultPageSize && (
        <div className="flex items-center justify-between p-2 border-t text-sm text-muted-foreground">
          <span>Showing {Math.min(pageSize, records.length)} of {records.length}</span>
          {records.length > pageSize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageSize(records.length)}
            >
              Show all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 5.2 Create Lookup Popup Component (Medium Priority)

```tsx
// components/ui/lookup-dialog.tsx
interface LookupDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  searchPlaceholder?: string;
  columns: ColumnDef<T>[];
  fetchRecords: (search: string) => Promise<T[]>;
  onSelect: (records: T[]) => void;
  multiSelect?: boolean;
  recentItems?: T[];
}

export function LookupDialog<T extends { id: string }>({
  open,
  onOpenChange,
  title,
  searchPlaceholder = "Search...",
  columns,
  fetchRecords,
  onSelect,
  multiSelect = false,
  recentItems = []
}: LookupDialogProps<T>) {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<T[]>([]);
  const [selected, setSelected] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && search.length >= 2) {
      setLoading(true);
      fetchRecords(search)
        .then(setRecords)
        .finally(() => setLoading(false));
    }
  }, [open, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Recent Items */}
        {recentItems.length > 0 && search.length < 2 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recent</h4>
            {/* Recent items list */}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              onRowClick={(row) => {
                if (multiSelect) {
                  setSelected(prev =>
                    prev.find(r => r.id === row.id)
                      ? prev.filter(r => r.id !== row.id)
                      : [...prev, row]
                  );
                } else {
                  onSelect([row]);
                  onOpenChange(false);
                }
              }}
            />
          )}
        </div>

        {/* Footer */}
        {multiSelect && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => { onSelect(selected); onOpenChange(false); }}>
              Select ({selected.length})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Conditional Layouts (Data-Driven Events)

### Current State (RiskReady)

- ScenarioLifecycleStepper shows different tabs based on stage
- Some conditional rendering based on status
- No formal conditional field visibility system

### Archer Pattern

- Apply Conditional Layout (ACL) actions
- Show/hide fields based on record state
- Make fields required based on conditions
- Make fields read-only after approval
- Role-based field visibility

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Stage-based tabs | Yes | Yes | None |
| Conditional fields | Partial | Full system | High |
| Dynamic required | Missing | Yes | High |
| Role-based visibility | Missing | Yes | High |
| Read-only after approval | Partial | Full | Medium |

### Recommendations

#### 6.1 Create Conditional Field System (High Priority)

```tsx
// lib/conditional-layout.ts
interface FieldCondition {
  field: string;
  condition: 'show' | 'hide' | 'required' | 'readonly';
  when: {
    field: string;
    operator: 'equals' | 'notEquals' | 'in' | 'greaterThan' | 'lessThan';
    value: any;
  }[];
  logic: 'and' | 'or';
}

interface LayoutConfig {
  entityType: 'risk' | 'scenario' | 'kri' | 'treatment';
  fields: FieldCondition[];
}

// Example configuration
const scenarioLayoutConfig: LayoutConfig = {
  entityType: 'scenario',
  fields: [
    {
      field: 'residualOverrideJustification',
      condition: 'required',
      when: [
        { field: 'residualOverridden', operator: 'equals', value: true }
      ],
      logic: 'and'
    },
    {
      field: 'treatmentPlanId',
      condition: 'show',
      when: [
        { field: 'status', operator: 'in', value: ['TREATING', 'TREATED'] }
      ],
      logic: 'and'
    },
    {
      field: 'acceptanceReason',
      condition: 'required',
      when: [
        { field: 'status', operator: 'equals', value: 'ACCEPTED' }
      ],
      logic: 'and'
    },
    // Lock fields after approval
    {
      field: 'likelihood',
      condition: 'readonly',
      when: [
        { field: 'status', operator: 'in', value: ['ACCEPTED', 'CLOSED', 'ARCHIVED'] }
      ],
      logic: 'and'
    }
  ]
};

// Hook to evaluate conditions
export function useConditionalLayout<T extends Record<string, any>>(
  config: LayoutConfig,
  data: T
) {
  const evaluateCondition = (condition: FieldCondition): boolean => {
    const results = condition.when.map(w => {
      const fieldValue = data[w.field];
      switch (w.operator) {
        case 'equals': return fieldValue === w.value;
        case 'notEquals': return fieldValue !== w.value;
        case 'in': return Array.isArray(w.value) && w.value.includes(fieldValue);
        case 'greaterThan': return fieldValue > w.value;
        case 'lessThan': return fieldValue < w.value;
        default: return false;
      }
    });

    return condition.logic === 'and'
      ? results.every(Boolean)
      : results.some(Boolean);
  };

  const getFieldState = (fieldName: string): {
    visible: boolean;
    required: boolean;
    readonly: boolean;
  } => {
    const conditions = config.fields.filter(f => f.field === fieldName);

    let visible = true;
    let required = false;
    let readonly = false;

    for (const condition of conditions) {
      if (evaluateCondition(condition)) {
        switch (condition.condition) {
          case 'show': visible = true; break;
          case 'hide': visible = false; break;
          case 'required': required = true; break;
          case 'readonly': readonly = true; break;
        }
      }
    }

    return { visible, required, readonly };
  };

  return { getFieldState };
}
```

#### 6.2 Create Conditional Form Wrapper (High Priority)

```tsx
// components/ui/conditional-field.tsx
interface ConditionalFieldProps {
  name: string;
  config: LayoutConfig;
  data: Record<string, any>;
  children: (state: { required: boolean; readonly: boolean }) => React.ReactNode;
}

export function ConditionalField({ name, config, data, children }: ConditionalFieldProps) {
  const { getFieldState } = useConditionalLayout(config, data);
  const state = getFieldState(name);

  if (!state.visible) {
    return null;
  }

  return <>{children({ required: state.required, readonly: state.readonly })}</>;
}

// Usage example
<ConditionalField name="residualOverrideJustification" config={scenarioConfig} data={scenario}>
  {({ required, readonly }) => (
    <FieldWithHelp
      label="Override Justification"
      required={required}
      helpText="Explain why the calculated residual is being overridden"
    >
      <Textarea
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        disabled={readonly}
        required={required}
      />
    </FieldWithHelp>
  )}
</ConditionalField>
```

---

## 7. Role-Based Views

### Current State (RiskReady)

- Single view for all users
- No field-level access control in UI
- Basic auth context available

### Archer Pattern

- Content Administrators: Full access
- Configuration Administrators: Field/layout editing
- Report Administrators: Report configuration
- Users see only fields they have access to
- Tabs hidden if no accessible fields

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Role context | Basic | Extensive | High |
| Field-level access | Missing | Yes | High |
| Tab visibility by role | Missing | Yes | High |
| Action permissions | Partial | Full | Medium |

### Recommendations

#### 7.1 Create Role-Based Access System (High Priority)

```tsx
// lib/rbac.ts
type Permission =
  | 'risk:read' | 'risk:create' | 'risk:update' | 'risk:delete'
  | 'scenario:read' | 'scenario:create' | 'scenario:update' | 'scenario:delete'
  | 'kri:read' | 'kri:create' | 'kri:update' | 'kri:record_value'
  | 'treatment:read' | 'treatment:create' | 'treatment:update' | 'treatment:approve'
  | 'config:birt' | 'config:appetite' | 'config:tolerance';

type Role = 'admin' | 'risk_manager' | 'risk_owner' | 'analyst' | 'viewer';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'], // All permissions
  risk_manager: [
    'risk:read', 'risk:create', 'risk:update',
    'scenario:read', 'scenario:create', 'scenario:update',
    'kri:read', 'kri:create', 'kri:update', 'kri:record_value',
    'treatment:read', 'treatment:create', 'treatment:update', 'treatment:approve',
    'config:birt', 'config:appetite', 'config:tolerance'
  ],
  risk_owner: [
    'risk:read', 'risk:update',
    'scenario:read', 'scenario:update',
    'kri:read', 'kri:record_value',
    'treatment:read', 'treatment:update'
  ],
  analyst: [
    'risk:read',
    'scenario:read', 'scenario:create', 'scenario:update',
    'kri:read', 'kri:record_value',
    'treatment:read'
  ],
  viewer: [
    'risk:read',
    'scenario:read',
    'kri:read',
    'treatment:read'
  ]
};

// Hook
export function usePermissions() {
  const { user } = useAuth();
  const role = (user?.role || 'viewer') as Role;

  const hasPermission = (permission: Permission): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    return perms.includes('*') || perms.includes(permission);
  };

  const can = {
    createRisk: hasPermission('risk:create'),
    updateRisk: hasPermission('risk:update'),
    deleteRisk: hasPermission('risk:delete'),
    createScenario: hasPermission('scenario:create'),
    approveTreatment: hasPermission('treatment:approve'),
    configureAppetite: hasPermission('config:appetite'),
    // ... etc
  };

  return { hasPermission, can };
}

// Permission-aware component
export function PermissionGate({
  permission,
  fallback = null,
  children
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

#### 7.2 Apply to UI Components (High Priority)

```tsx
// In RiskDetailPage.tsx
<PermissionGate permission="risk:update">
  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
    <Edit className="w-4 h-4 mr-2" />
    Edit
  </Button>
</PermissionGate>

<PermissionGate permission="treatment:create">
  <Button size="sm" asChild>
    <Link to={`/risks/treatments?riskId=${risk.id}`}>
      <Plus className="w-4 h-4 mr-2" />
      Add Treatment
    </Link>
  </Button>
</PermissionGate>

// Hide entire tabs based on role
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
    <PermissionGate permission="kri:read">
      <TabsTrigger value="kris">KRIs</TabsTrigger>
    </PermissionGate>
    <TabsTrigger value="treatments">Treatments</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 8. Bulk Operations

### Current State (RiskReady)

- DataTable with single-row actions
- No multi-select
- No bulk operations

### Archer Pattern

- Select multiple records
- Bulk edit fields
- Bulk status change
- Bulk delete
- Bulk export

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Multi-select | Missing | Yes | Medium |
| Bulk edit | Missing | Yes | Medium |
| Bulk status change | Missing | Yes | Medium |
| Bulk delete | Missing | Yes | Low |
| Export selected | Missing | Yes | Medium |

### Recommendations

#### 8.1 Add Multi-Select to DataTable (Medium Priority)

```tsx
// Enhance existing DataTable with selection
interface DataTableProps<T> {
  // ... existing props
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    action: (ids: string[]) => void;
    destructive?: boolean;
  }[];
}

// Bulk actions toolbar
{selectedIds.length > 0 && (
  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg mb-4">
    <span className="text-sm font-medium">{selectedIds.length} selected</span>
    <Separator orientation="vertical" className="h-4" />
    {bulkActions.map((action, i) => (
      <Button
        key={i}
        variant={action.destructive ? "destructive" : "outline"}
        size="sm"
        onClick={() => action.action(selectedIds)}
      >
        {action.icon}
        {action.label}
      </Button>
    ))}
    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
      Clear
    </Button>
  </div>
)}
```

#### 8.2 Implement Bulk Status Change (Medium Priority)

```tsx
// Bulk status change dialog
interface BulkStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  entityType: 'risk' | 'scenario' | 'treatment';
  onComplete: () => void;
}

export function BulkStatusChangeDialog({
  open,
  onOpenChange,
  selectedIds,
  entityType,
  onComplete
}: BulkStatusChangeDialogProps) {
  const [newStatus, setNewStatus] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApply = async () => {
    setProcessing(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          updateEntity(entityType, id, { status: newStatus })
        )
      );
      toast.success(`Updated ${selectedIds.length} ${entityType}s`);
      onComplete();
      onOpenChange(false);
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update status for {selectedIds.length} selected {entityType}s
          </DialogDescription>
        </DialogHeader>

        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
          <SelectContent>
            {/* Status options based on entityType */}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!newStatus || processing}>
            {processing ? 'Applying...' : `Apply to ${selectedIds.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 9. Global Search

### Current State (RiskReady)

- Per-page search in DataTables
- No global search across module

### Archer Pattern

- Global search bar in header
- Search across all applications
- Advanced filtering
- Saved searches

### Gap Analysis

| Aspect | RiskReady | Archer | Gap |
|--------|-----------|--------|-----|
| Page-level search | Yes | Yes | None |
| Global search | Missing | Yes | Medium |
| Search suggestions | Missing | Yes | Medium |
| Advanced filters | Basic | Extensive | Medium |

### Recommendations

#### 9.1 Add Global Search Command (Medium Priority)

Use shadcn's Command component (cmdk):

```tsx
// components/risks/GlobalSearch.tsx
export function GlobalRiskSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{
    risks: Risk[];
    scenarios: RiskScenario[];
    kris: KeyRiskIndicator[];
    treatments: TreatmentPlan[];
  }>({ risks: [], scenarios: [], kris: [], treatments: [] });

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search handler
  useEffect(() => {
    if (search.length >= 2) {
      globalSearch(search).then(setResults);
    }
  }, [search]);

  return (
    <>
      {/* Trigger button in header */}
      <Button
        variant="outline"
        className="relative w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search risks...
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search risks, scenarios, KRIs, treatments..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {results.risks.length > 0 && (
            <CommandGroup heading="Risks">
              {results.risks.map(risk => (
                <CommandItem key={risk.id} onSelect={() => navigate(`/risks/${risk.id}`)}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>{risk.riskId}</span>
                  <span className="ml-2 text-muted-foreground">{risk.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.scenarios.length > 0 && (
            <CommandGroup heading="Scenarios">
              {results.scenarios.map(scenario => (
                <CommandItem key={scenario.id} onSelect={() => navigate(`/risks/scenarios/${scenario.id}`)}>
                  <Target className="mr-2 h-4 w-4" />
                  <span>{scenario.scenarioId}</span>
                  <span className="ml-2 text-muted-foreground">{scenario.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Similar groups for KRIs and Treatments */}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

---

## 10. Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
1. **Field-level help tooltips** - Add FieldWithHelp component
2. **Smart field controls** - Radio groups for 2-4 options
3. **Section component** - Standardize collapsible sections
4. **Dashboard export** - PDF/PNG export

### Phase 2: Core Enhancements (2-4 weeks)
1. **Conditional layouts** - Field visibility/required system
2. **Related records grid** - Standardized cross-reference component
3. **Lookup dialog** - Searchable record picker
4. **Bulk operations** - Multi-select and bulk actions

### Phase 3: Role-Based Access (2-3 weeks)
1. **RBAC system** - Permission-based visibility
2. **Permission gates** - UI component wrappers
3. **Tab visibility** - Role-based tab hiding
4. **Field access** - Read-only by role

### Phase 4: Advanced Features (3-4 weeks)
1. **Global search** - Command palette search
2. **Favorites/Recent** - User personalization
3. **Saved views** - Persistent filter configurations
4. **Dashboard configuration** - Widget management

---

## Appendix: Component Checklist

### New Components to Create

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| `Section` | Low | Low | Standardize section UI |
| `FieldWithHelp` | Medium | Low | Add help tooltips |
| `SmartSelect` | Medium | Medium | Context-aware controls |
| `RelatedRecordsGrid` | Medium | Medium | Cross-reference grids |
| `LookupDialog` | Medium | Medium | Record picker |
| `ConditionalField` | High | High | Dynamic field visibility |
| `PermissionGate` | High | Medium | RBAC wrapper |
| `BulkActionsToolbar` | Medium | Medium | Multi-select actions |
| `GlobalRiskSearch` | Medium | Medium | Command palette |

### Existing Components to Enhance

| Component | Enhancement | Priority |
|-----------|-------------|----------|
| `risks-sidebar.tsx` | Add workspace groupings, favorites | Medium |
| `DataTable` | Add multi-select, bulk actions | Medium |
| `RiskDetailPage` | Add conditional layouts | High |
| `RiskScenarioDetailPage` | Add role-based field access | High |
| `RisksDashboardPage` | Add export functionality | Medium |

---

## Conclusion

RiskReady's risk module is already a sophisticated implementation that compares favorably to Archer in many areas. The recommended enhancements focus on:

1. **Conditional Layouts** - Most impactful improvement for enterprise readiness
2. **Role-Based Access** - Critical for multi-user deployments
3. **Standardized Patterns** - Consistency improvements
4. **Bulk Operations** - Efficiency for power users
5. **Global Search** - Discoverability across module

The shadcn/ui design system provides an excellent foundation that is more modern than Archer's interface. The focus should be on adopting Archer's *functional patterns* while maintaining RiskReady's superior visual design.

---

*Assessment completed: 2026-01-30*
*Author: Claude Code Assistant*
