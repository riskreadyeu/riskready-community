# 🎨 RiskReady Design System

## Overview

This document defines the standardized design patterns, components, and guidelines for building consistent UI/UX across all modules (Controls, Risks, Organisation, Audits, etc.).

---

## 📦 Core Principles

1. **Component Reuse** - Use shared components from `/components/common/` and `/components/ui/`
2. **Consistent Patterns** - Follow established patterns for lists, details, dashboards
3. **Responsive Design** - Mobile-first with desktop enhancements
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Performance** - Lazy loading, pagination, optimized renders

---

## 🧩 Shared Component Library

### Location Structure
```
apps/web/src/components/
├── ui/                          # shadcn/ui primitives (Button, Card, Badge, etc.)
├── common/                      # Shared cross-module components
│   ├── data-table.tsx          # ✅ USE THIS for all data tables
│   └── detail-page-layout.tsx  # Page layout with tabs
├── controls/detail-components/  # Detail page components (can be used by any module)
│   ├── detail-hero.tsx         # ✅ USE THIS for detail page headers
│   └── detail-stat-card.tsx    # ✅ USE THIS for stat cards
└── [module]/                    # Module-specific components only
    └── [module]-sidebar.tsx    # Module navigation sidebar
```

---

## 📋 Page Patterns

### 1. **List/Register Pages** (e.g., NC Register, Risk Register, Control Library)

#### ✅ **Required Structure:**
```typescript
export default function [Entity]RegisterPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Entity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({...});

  // Load data with pagination & filters
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, filters]);

  // Define columns with 'header' property (NOT 'label')
  const columns = [
    {
      key: "id",
      header: "ID",  // ✅ Use 'header', not 'label'
      render: (item) => <span>{item.id}</span>,
    },
    // ... more columns
  ];

  // Define row actions
  const rowActions = (item: Entity) => [
    {
      label: "View Details",
      onClick: () => navigate(`/path/${item.id}`),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">[Entity] Register</h1>
          <p className="text-muted-foreground mt-1">Description</p>
        </div>
        <Button onClick={() => navigate("/path/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Stats Cards (optional) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Use Card + CardContent for stats */}
        </div>
      )}

      {/* Data Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>[Entity] List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(item) => item.id}
            rowActions={rowActions}
            emptyMessage="No items found"
            loading={loading}
            searchPlaceholder="Search..."
            searchFilter={(item, query) => {
              // Client-side search logic
            }}
            filterSlot={
              // Filter dropdowns using Select components
            }
            pagination={{
              page: currentPage,
              pageSize: pageSize,
              total: totalCount,
              onPageChange: setCurrentPage,
              onPageSizeChange: setPageSize,
              pageSizeOptions: [10, 25, 50, 100],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 🎯 **Key Points:**
- ✅ Always use `DataTable` component from `/components/common/data-table.tsx`
- ✅ Use `header` property in columns (not `label`)
- ✅ Use `glass-card` className for cards
- ✅ Use `space-y-6 pb-8` for page container
- ✅ Define `rowActions` as a function: `(item) => [...]`
- ✅ Include pagination with standard options: `[10, 25, 50, 100]`

---

### 2. **Detail Pages** (e.g., NC Detail, Control Detail, Risk Detail)

#### ✅ **Required Structure:**
```typescript
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { DetailStatCard } from "@/components/controls/detail-components/detail-stat-card";

export default function [Entity]DetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState<Entity | null>(null);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header - ALWAYS use DetailHero */}
      <DetailHero
        backLink="/path/to/list"
        backLabel="Back to List"
        icon={<Icon className="w-6 h-6 text-primary" />}
        badge={
          <>
            <Badge variant="outline">Status</Badge>
            <Badge variant="secondary">Type</Badge>
          </>
        }
        title={entity.title}
        subtitle={entity.code}  // e.g., NC-2025-001, R-01
        description={entity.description}
        metadata={[
          { 
            label: "Created", 
            value: format(new Date(entity.createdAt), "dd MMM yyyy"),
            icon: <Calendar className="w-3 h-3" />
          },
          // ... more metadata
        ]}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="default" size="sm">
              Action
            </Button>
          </>
        }
        statusColor="success" | "warning" | "destructive" | "primary" | "muted"
      />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content with Separator between sections */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Field Label
                </Label>
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {entity.field}
                </p>
              </div>
              
              <Separator />
              
              <div>
                {/* Next section */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailStatCard
                icon={<Icon className="w-4 h-4 text-primary" />}
                label="Label"
                value="Value"
                status="success" | "warning" | "destructive" | "muted"
              />
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Related Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to="/path"
                className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium font-mono truncate">Code</p>
                      <p className="text-xs text-muted-foreground truncate">Name</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### 🎯 **Key Points:**
- ✅ **ALWAYS** use `DetailHero` for page header
- ✅ **ALWAYS** use `DetailStatCard` for stat displays
- ✅ Use 2-column layout: `lg:col-span-2` (main) + sidebar
- ✅ Use `space-y-6` for vertical spacing
- ✅ Use `glass-card` className for cards
- ✅ Use `Separator` between content sections
- ✅ Related items should be clickable `Link` components with `ExternalLink` icon

---

### 3. **Dashboard Pages** (e.g., Controls Dashboard, Audits Dashboard)

#### ✅ **Required Structure:**
```typescript
export default function [Module]DashboardPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">[Module] Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Description</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="glass-card lg:col-span-8">
          <CardHeader>
            <CardTitle>Main Content</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs or main content */}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary or quick actions */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🎨 Component API Reference

### **DataTable**
```typescript
<DataTable<T>
  columns={[
    {
      key: string;              // Unique column key
      header: string | ReactNode; // ✅ Use 'header', not 'label'
      render: (item: T) => ReactNode;
      sortable?: boolean;
      headerClassName?: string;
    }
  ]}
  data={T[]}                    // Array of items to display
  keyExtractor={(item) => item.id}
  rowActions={(item: T) => [    // ✅ Function, not array
    {
      label: string;
      onClick: () => void;
      icon?: ReactNode;
      variant?: "default" | "destructive";
      href?: (item: T) => string;
      hidden?: (item: T) => boolean;
      separator?: boolean;
    }
  ]}
  emptyMessage="No items found"
  loading={boolean}
  searchPlaceholder="Search..."
  searchFilter={(item: T, query: string) => boolean}
  filterSlot={ReactNode}        // Filter dropdowns
  headerActions={ReactNode}     // Top-right actions
  pagination={{
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions: [10, 25, 50, 100];
  }}
/>
```

### **DetailHero**
```typescript
<DetailHero
  backLink="/path"              // ✅ Required
  backLabel="Back"              // Optional, defaults to "Back"
  icon={<Icon />}               // Optional icon
  iconBg="bg-primary/10"        // Optional icon background
  badge={<Badge />}             // Optional badges
  title="Title"                 // ✅ Required
  subtitle="Subtitle"           // Optional (e.g., ID, Code)
  description="Description"     // Optional
  metadata={[                   // Optional metadata row
    {
      label: "Label",
      value: "Value",
      icon: <Icon />,
    }
  ]}
  actions={                     // Optional action buttons
    <>
      <Button>Action</Button>
    </>
  }
  statusColor="success" | "warning" | "destructive" | "primary" | "muted"
/>
```

### **DetailStatCard**
```typescript
<DetailStatCard
  icon={<Icon className="w-4 h-4" />}
  iconBg="bg-primary/10"        // Optional
  label="Label"
  value="Value"
  subValue="Sub-value"          // Optional
  trend={{                      // Optional
    direction: "up" | "down" | "stable",
    value: "+10%"
  }}
  status="success" | "warning" | "destructive" | "muted"
  onClick={() => {}}            // Optional
  className="custom-class"      // Optional
/>
```

---

## 🎯 Design Tokens

### **Spacing Scale**
```typescript
space-y-1  // 4px   - Tight spacing (within cards)
space-y-2  // 8px   - Close elements
space-y-3  // 12px  - Card internal sections
space-y-4  // 16px  - Form fields
space-y-6  // 24px  - Page sections ✅ STANDARD
space-y-8  // 32px  - Major sections

pb-8       // Page bottom padding ✅ ALWAYS USE
```

### **Grid Layouts**
```typescript
// Stats cards
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

// Main content + sidebar
grid grid-cols-1 lg:grid-cols-3 gap-6
  lg:col-span-2  // Main content
  lg:col-span-1  // Sidebar

// Dashboard layout
grid grid-cols-1 lg:grid-cols-12 gap-6
  lg:col-span-8  // Main
  lg:col-span-4  // Sidebar
```

### **Card Styling**
```typescript
<Card className="glass-card">  // ✅ ALWAYS use glass-card
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>  // Optional
  </CardHeader>
  <CardContent className="space-y-6">  // ✅ space-y-6 for sections
    {/* Content */}
  </CardContent>
</Card>
```

### **Badge Variants**
```typescript
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom colored badges
<Badge variant="outline" className="bg-success/10 text-success border-success/20">
  Success
</Badge>
```

### **Button Patterns**
```typescript
// Primary action
<Button variant="default">Action</Button>

// Secondary actions
<Button variant="outline" size="sm">
  <Icon className="w-4 h-4 mr-2" />
  Action
</Button>

// Destructive actions
<Button variant="destructive" size="sm">
  <Trash className="w-4 h-4 mr-2" />
  Delete
</Button>

// Icon-only
<Button variant="ghost" size="icon">
  <Icon className="w-4 h-4" />
</Button>
```

---

## 📐 Layout Patterns

### **Page Container**
```typescript
<div className="space-y-6 pb-8">  // ✅ ALWAYS
  {/* Page content */}
</div>
```

### **Responsive Images/Icons**
```typescript
// Icons
<Icon className="w-4 h-4" />      // Small (inline)
<Icon className="w-5 h-5" />      // Medium (buttons)
<Icon className="w-6 h-6" />      // Large (hero)
<Icon className="w-8 h-8" />      // Extra large (stats)

// With color
<Icon className="w-4 h-4 text-primary" />
<Icon className="w-4 h-4 text-muted-foreground" />
```

### **Text Hierarchy**
```typescript
// Page title
<h1 className="text-3xl font-bold tracking-tight">Title</h1>

// Section title
<h2 className="text-xl font-semibold">Section</h2>

// Card title
<CardTitle>Card Title</CardTitle>

// Field label
<Label className="text-sm font-semibold text-muted-foreground">Label</Label>

// Body text
<p className="text-sm">Body text</p>

// Muted text
<p className="text-sm text-muted-foreground">Muted text</p>

// Code/ID
<span className="font-mono text-sm">CODE-001</span>
```

---

## ✅ Checklist for New Pages

### **Before Creating a New Page:**
- [ ] Check if a similar page exists in another module
- [ ] Identify the pattern: List, Detail, or Dashboard
- [ ] Use shared components (`DataTable`, `DetailHero`, `DetailStatCard`)
- [ ] Follow spacing conventions (`space-y-6`, `pb-8`)
- [ ] Use `glass-card` for all cards
- [ ] Use correct column API (`header`, not `label`)
- [ ] Define `rowActions` as a function
- [ ] Include pagination with standard options
- [ ] Use consistent icon sizing
- [ ] Match text hierarchy patterns

### **Code Review Checklist:**
- [ ] Uses shared components (not custom implementations)
- [ ] Follows established patterns
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error handling present
- [ ] Accessible (keyboard navigation, ARIA labels)

---

## 📚 Examples by Module

### **Controls Module** ✅ Reference Implementation
- List: `/pages/controls/operations/EffectivenessTestsPage.tsx`
- Detail: `/pages/controls/capability/CapabilityTestPage.tsx`
- Uses: `DetailHero`, `DetailStatCard`, `DataTable`

### **Risks Module** ✅ Reference Implementation
- List: `/pages/risks/RiskRegisterPage.tsx`
- Uses: `DataTable` with pagination

### **Organisation Module** ✅ Reference Implementation
- List: `/pages/organisation/DepartmentsPage.tsx`
- Detail: `/pages/organisation/DepartmentDetailPage.tsx`
- Uses: Standard patterns

### **Audits Module** ✅ Updated to Standards
- List: `/pages/audits/NonconformityRegisterPage.tsx`
- Detail: `/pages/audits/NonconformityDetailPage.tsx`
- Uses: `DetailHero`, `DetailStatCard`, `DataTable`

---

## 🚫 Anti-Patterns (DO NOT DO)

### ❌ **Custom Table Implementations**
```typescript
// DON'T create custom tables
<table>
  <thead>
    <tr><th>Header</th></tr>
  </thead>
  ...
</table>

// DO use DataTable
<DataTable columns={...} data={...} />
```

### ❌ **Custom Header Components**
```typescript
// DON'T create custom headers
<div className="custom-header">
  <h1>{title}</h1>
  ...
</div>

// DO use DetailHero
<DetailHero title={title} ... />
```

### ❌ **Inconsistent Spacing**
```typescript
// DON'T use random spacing
<div className="space-y-5 pb-10">

// DO use standard spacing
<div className="space-y-6 pb-8">
```

### ❌ **Wrong Column API**
```typescript
// DON'T use 'label'
{ key: "id", label: "ID" }

// DO use 'header'
{ key: "id", header: "ID" }
```

### ❌ **Non-Function rowActions**
```typescript
// DON'T pass array directly
rowActions={[{ label: "View" }]}

// DO use function
rowActions={(item) => [{ label: "View", onClick: () => {} }]}
```

---

## 🔄 Migration Guide

### **Updating Existing Pages to Standards:**

1. **Identify Pattern**: List, Detail, or Dashboard
2. **Replace Custom Components**:
   - Custom table → `DataTable`
   - Custom header → `DetailHero`
   - Custom stat cards → `DetailStatCard`
3. **Update Column Definitions**: `label` → `header`
4. **Update Spacing**: Use `space-y-6 pb-8`
5. **Update Card Classes**: Add `glass-card`
6. **Test Responsive Behavior**

---

## 📖 Further Reading

- **shadcn/ui Docs**: https://ui.shadcn.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com/

---

## 🎯 Summary

### **Golden Rules:**
1. ✅ **Always use `DataTable`** for tables
2. ✅ **Always use `DetailHero`** for detail page headers
3. ✅ **Always use `DetailStatCard`** for stats
4. ✅ Use `header` in columns (not `label`)
5. ✅ Use `space-y-6 pb-8` for pages
6. ✅ Use `glass-card` for cards
7. ✅ Use `rowActions` as a function
8. ✅ Include pagination with `[10, 25, 50, 100]`

**When in doubt, copy from Controls module examples!** 🎨
