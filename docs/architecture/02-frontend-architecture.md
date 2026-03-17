# Frontend Architecture

This document details the React frontend application architecture, component patterns, and development conventions.

---

## Table of Contents

1. [Application Structure](#application-structure)
2. [Routing](#routing)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Styling System](#styling-system)
6. [API Integration](#api-integration)
7. [UI Components](#ui-components)
8. [Page Patterns](#page-patterns)

---

## Application Structure

### Directory Layout

```
apps/web/src/
├── App.tsx                 # Root component with routing
├── main.tsx                # Application entry point
├── styles.css              # Global styles and Tailwind
├── vite-env.d.ts           # Vite type declarations
│
├── components/
│   ├── app-shell.tsx       # Main layout with sidebar navigation
│   ├── ui/                 # Base UI components (shadcn/ui style)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── common/             # Shared business components
│   │   ├── data-table.tsx
│   │   ├── form-dialog.tsx
│   │   ├── form-field.tsx
│   │   ├── page-header.tsx
│   │   ├── stat-card.tsx
│   │   └── status-badge.tsx
│   ├── dashboard/          # Dashboard-specific components
│   ├── organisation/       # Organisation module components
│   ├── controls/           # Controls module components
│   └── risks/              # Risk module components
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── SettingsPage.tsx
│   ├── organisation/       # Organisation module pages
│   │   ├── dashboard/
│   │   ├── departments/
│   │   ├── locations/
│   │   └── ...
│   └── [module]/           # Other module pages
│
└── lib/
    ├── utils.ts            # Utility functions (cn, etc.)
    ├── request.ts          # HTTP client wrapper
    └── organisation-api.ts # Organisation API client
```

### Entry Point

```typescript
// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Routing

### Router Configuration

The application uses React Router v6 with a nested route structure:

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes with AppShell layout */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Organisation module routes */}
          <Route path="/organisation" element={<OrganisationDashboardPage />} />
          <Route path="/organisation/departments" element={<DepartmentsPage />} />
          <Route path="/organisation/departments/:departmentId" element={<DepartmentDetailPage />} />
          {/* ... more routes */}
          
          {/* Other module routes */}
          <Route path="/risks" element={<RisksPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          {/* ... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Route Structure

| Path Pattern | Purpose |
|--------------|---------|
| `/login` | Authentication |
| `/dashboard` | Main dashboard |
| `/organisation` | Organisation module dashboard |
| `/organisation/[entity]` | Entity list page |
| `/organisation/[entity]/:id` | Entity detail page |
| `/[module]` | Other module pages |

### Navigation

Navigation is handled through the `AppShell` component which provides:
- Sidebar navigation with collapsible sections
- Breadcrumb navigation
- User menu

---

## Component Architecture

### Component Categories

#### 1. UI Components (`components/ui/`)

Base-level, unstyled or minimally styled components following shadcn/ui patterns:

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
```

#### 2. Common Components (`components/common/`)

Reusable business components used across modules:

```typescript
// components/common/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
```

#### 3. Module Components (`components/[module]/`)

Components specific to a feature module:

```typescript
// components/organisation/department-card.tsx
interface DepartmentCardProps {
  department: Department;
  onEdit: () => void;
  onDelete: () => void;
}

export function DepartmentCard({ department, onEdit, onDelete }: DepartmentCardProps) {
  // Department-specific rendering
}
```

#### 4. Page Components (`pages/`)

Top-level components that handle routing and data fetching:

```typescript
// pages/organisation/DepartmentsPage.tsx
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Departments" actions={<AddButton />} />
      <DataTable data={departments} columns={columns} loading={loading} />
    </div>
  );
}
```

### Component Patterns

#### Props Interface Pattern

```typescript
interface ComponentProps {
  // Required props
  data: DataType;
  
  // Optional props with defaults
  variant?: 'default' | 'compact';
  
  // Event handlers
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  
  // Children
  children?: React.ReactNode;
  
  // Style overrides
  className?: string;
}
```

#### Compound Component Pattern

```typescript
// Used for complex components like DataTable
<DataTable data={items}>
  <DataTable.Column field="name" header="Name" />
  <DataTable.Column field="status" header="Status" render={StatusBadge} />
  <DataTable.Actions>
    <DataTable.Action icon={Edit} onClick={handleEdit} />
    <DataTable.Action icon={Trash} onClick={handleDelete} />
  </DataTable.Actions>
</DataTable>
```

---

## State Management

### Local State

Most state is managed locally within components using React hooks:

```typescript
// Simple state
const [isOpen, setIsOpen] = useState(false);

// Complex state
const [formData, setFormData] = useState<FormData>({
  name: '',
  description: '',
  status: 'active',
});

// Loading states
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
```

### Data Fetching Pattern

```typescript
function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { departments, loading, error, reload: load };
}
```

### Form State Pattern

```typescript
function DepartmentForm({ department, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: department?.name ?? '',
    code: department?.code ?? '',
    description: department?.description ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        name="name"
        label="Name"
        value={formData.name}
        onChange={(value) => handleChange('name', value)}
      />
      {/* ... */}
    </form>
  );
}
```

---

## Styling System

### Tailwind CSS Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### CSS Variables

```css
/* styles.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}
```

### Utility Function

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Typography Classes

```css
/* Custom typography utilities */
@layer components {
  .text-page-title {
    @apply text-4xl font-bold tracking-tight text-foreground;
  }
  .text-section-title {
    @apply text-3xl font-semibold tracking-tight text-foreground;
  }
  .text-card-title {
    @apply text-2xl font-semibold tracking-tight text-foreground;
  }
  .text-body {
    @apply text-sm text-foreground;
  }
  .text-muted {
    @apply text-sm text-muted-foreground;
  }
  .text-label {
    @apply text-xs font-medium text-muted-foreground uppercase tracking-wide;
  }
}
```

---

## API Integration

### HTTP Client

```typescript
// lib/request.ts
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}
```

### API Client Pattern

```typescript
// lib/organisation-api.ts

// Types
export interface Department {
  id: string;
  name: string;
  departmentCode: string;
  description?: string;
  parentId?: string;
  departmentHeadId?: string;
  criticalityLevel?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  departmentCode: string;
  description?: string;
  parentId?: string;
  departmentHeadId?: string;
  criticalityLevel?: string;
}

// API Functions
const API_BASE = '/api/organisation';

export async function getDepartments(): Promise<Department[]> {
  return request<Department[]>(`${API_BASE}/departments`);
}

export async function getDepartment(id: string): Promise<Department> {
  return request<Department>(`${API_BASE}/departments/${id}`);
}

export async function createDepartment(data: CreateDepartmentInput): Promise<Department> {
  return request<Department>(`${API_BASE}/departments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(
  id: string,
  data: Partial<CreateDepartmentInput>
): Promise<Department> {
  return request<Department>(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  return request<void>(`${API_BASE}/departments/${id}`, {
    method: 'DELETE',
  });
}
```

---

## UI Components

### Core UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Button` | Action buttons with variants | `ui/button.tsx` |
| `Card` | Content containers | `ui/card.tsx` |
| `Dialog` | Modal dialogs | `ui/dialog.tsx` |
| `Input` | Text input fields | `ui/input.tsx` |
| `Select` | Dropdown selection | `ui/select.tsx` |
| `Table` | Data tables | `ui/table.tsx` |
| `Tabs` | Tabbed content | `ui/tabs.tsx` |
| `Badge` | Status indicators | `ui/badge.tsx` |
| `Skeleton` | Loading placeholders | `ui/skeleton.tsx` |
| `Tooltip` | Hover tooltips | `ui/tooltip.tsx` |

### Common Business Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `PageHeader` | Page title and actions | `common/page-header.tsx` |
| `DataTable` | Sortable, filterable tables | `common/data-table.tsx` |
| `FormDialog` | Modal forms | `common/form-dialog.tsx` |
| `FormField` | Form input wrapper | `common/form-field.tsx` |
| `FormRow` | Form layout helper | `common/form-row.tsx` |
| `StatCard` | Metric display cards | `common/stat-card.tsx` |
| `StatusBadge` | Status indicators | `common/status-badge.tsx` |
| `ConfirmDialog` | Confirmation modals | `common/confirm-dialog.tsx` |

---

## Page Patterns

### List Page Pattern

```typescript
export default function EntitiesPage() {
  // State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);

  // Load data
  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await getEntities();
      setEntities(data);
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers
  const handleCreate = async (data: CreateInput) => {
    await createEntity(data);
    setIsCreateOpen(false);
    loadEntities();
  };

  const handleUpdate = async (data: UpdateInput) => {
    if (!editingEntity) return;
    await updateEntity(editingEntity.id, data);
    setEditingEntity(null);
    loadEntities();
  };

  const handleDelete = async () => {
    if (!deletingEntity) return;
    await deleteEntity(deletingEntity.id);
    setDeletingEntity(null);
    loadEntities();
  };

  // Table configuration
  const columns = [...];
  const rowActions = [...];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entities"
        description="Manage your entities"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        }
      />

      <DataTable
        data={entities}
        columns={columns}
        rowActions={rowActions}
        loading={loading}
      />

      {/* Create Dialog */}
      <FormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Entity"
        onSubmit={handleCreate}
      >
        {/* Form fields */}
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={!!editingEntity}
        onOpenChange={() => setEditingEntity(null)}
        title="Edit Entity"
        onSubmit={handleUpdate}
      >
        {/* Form fields */}
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingEntity}
        onOpenChange={() => setDeletingEntity(null)}
        title="Delete Entity"
        description="Are you sure?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

### Detail Page Pattern

```typescript
export default function EntityDetailPage() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadEntity(entityId);
    }
  }, [entityId]);

  const loadEntity = async (id: string) => {
    setLoading(true);
    try {
      const data = await getEntity(id);
      setEntity(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!entity) {
    return <NotFound />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={entity.name}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            {/* Overview content */}
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            {/* Details content */}
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <Card>
            {/* Related entities */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Dashboard Page Pattern

```typescript
export default function ModuleDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, itemsData] = await Promise.all([
        getStats(),
        getRecentItems(),
      ]);
      setStats(statsData);
      setRecentItems(itemsData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Module Dashboard" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={stats?.total ?? 0}
          icon={<Package />}
        />
        <StatCard
          title="Active"
          value={stats?.active ?? 0}
          icon={<CheckCircle />}
        />
        {/* More stat cards */}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={stats?.trend} />
          </CardContent>
        </Card>
        {/* More charts */}
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={recentItems} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
```
