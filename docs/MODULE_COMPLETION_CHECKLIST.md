# Module Completion Checklist

**Standard for 100% module coverage in RiskReady Community Edition.**

Reference implementation: **Controls module** (`apps/server/src/controls/`, `apps/web/src/pages/controls/`, `apps/mcp-server-controls/`).

---

## 1. Prisma Schema

Every module starts with its data model. The schema is the source of truth.

- [ ] All models defined in `apps/server/prisma/schema/<module>.prisma`
- [ ] All enums defined for status fields, categories, and types
- [ ] Audit fields on every model: `createdAt`, `updatedAt`, `createdById`, `updatedById`
- [ ] Organisation scoping: `organisationId` foreign key where applicable
- [ ] Unique constraints defined (e.g. `[controlId, organisationId]`)
- [ ] Indexes on frequently queried fields (status, foreign keys, dates)
- [ ] Relations fully defined (both sides of every relation)

---

## 2. Backend — DTOs

DTOs validate all incoming data at the API boundary. One DTO file per entity.

- [ ] DTO directory: `apps/server/src/<module>/dto/`
- [ ] `Create<Entity>Dto` class with `class-validator` decorators for every create endpoint
- [ ] `Update<Entity>Dto` class with all fields optional (`@IsOptional()`) for every update endpoint
- [ ] Enum fields use `@IsEnum()` with the Prisma-generated enum
- [ ] String format validation where applicable (`@Matches()`, `@IsUUID()`, `@IsEmail()`)
- [ ] Array fields use `@IsArray()` + `@ArrayMinSize()` where needed
- [ ] No raw `any` types — every field is explicitly typed

---

## 3. Backend — Services

Services contain all business logic. One service per entity or logical grouping.

- [ ] Service directory: `apps/server/src/<module>/services/`
- [ ] `findAll(params)` — paginated list with filtering via Prisma `where` clauses
- [ ] `findOne(id)` — single record with all necessary `include`/`select` relations
- [ ] `create(data, userId)` — create with audit fields (`createdById`, `updatedById`)
- [ ] `update(id, data, userId)` — update with `updatedById` set
- [ ] `delete(id)` — hard delete or soft delete as appropriate
- [ ] Lifecycle transitions (if entity has status workflow): validate current state before transition
- [ ] Aggregate/stats methods: `getStats()`, reporting queries
- [ ] All Prisma queries use `select` or `include` explicitly — no implicit full-model fetches
- [ ] Batch operations where appropriate (e.g. `findByIds`, `bulkUpdate`)
- [ ] Services are exported from the module for cross-module use

---

## 4. Backend — Controllers

Controllers handle HTTP routing, request validation, and response shaping. One controller per entity or logical grouping.

- [ ] Controller directory: `apps/server/src/<module>/controllers/`
- [ ] RESTful route structure:
  - `GET /api/<entities>` — list with query params for filtering and pagination
  - `GET /api/<entities>/stats` — aggregate statistics
  - `GET /api/<entities>/:id` — single entity detail
  - `POST /api/<entities>` — create
  - `PATCH /api/<entities>/:id` or `PUT /api/<entities>/:id` — update
  - `DELETE /api/<entities>/:id` — delete
- [ ] Lifecycle endpoints as `POST /api/<entities>/:id/<action>` (e.g. `/start`, `/approve`)
- [ ] Query parameters for all list endpoints: `skip`, `take`, `status`, entity-specific filters
- [ ] DTO classes used as request body types
- [ ] Proper HTTP status codes (201 for create, 204 for delete)
- [ ] Guards/decorators for authentication and authorisation

---

## 5. Frontend — API Layer

One API file per module. Contains fetch wrappers, TypeScript types, and all API calls.

- [ ] API file: `apps/web/src/lib/<module>-api.ts`
- [ ] TypeScript interfaces for every entity matching the backend response shape
- [ ] Enum types mirroring Prisma enums (e.g. `type ControlTheme = 'ORGANISATIONAL' | 'PEOPLE' | ...`)
- [ ] Typed functions for every backend endpoint:
  - `fetch<Entities>(params)` — list
  - `fetch<Entity>(id)` — get single
  - `create<Entity>(data)` — create
  - `update<Entity>(id, data)` — update
  - `delete<Entity>(id)` — delete
  - Lifecycle actions: `start<Entity>(id)`, `approve<Entity>(id)`, etc.
- [ ] Stat/aggregate types: `<Entity>Stats`, `<Entity>Dashboard`
- [ ] Reusable `request<T>(path, init)` wrapper with error handling
- [ ] All response types are explicit — no `any`

---

## 6. Frontend — Pages

Every entity needs dedicated pages. **No modals for CRUD operations** — use full pages with proper routes.

### Required pages per entity:

- [ ] **List page** — `<Entity>ListPage.tsx` or `<Entity>LibraryPage.tsx`
  - Table/list with pagination
  - Filter controls (status, type, date range as applicable)
  - Search input
  - "Create new" button linking to the create page
  - Row click navigates to detail page
- [ ] **Detail page** — `<Entity>DetailPage.tsx`
  - Hero/header section with entity name, ID, status badge
  - Tabbed interface for different aspects (see Component section below)
  - Edit actions in-page (not in modals)
  - Breadcrumb navigation back to list
- [ ] **Create page** — `<Entity>CreatePage.tsx`
  - Full-page form with all required fields
  - Validation feedback inline
  - Cancel button returns to list
  - Submit creates entity and navigates to detail page

### Page file location:
```
apps/web/src/pages/<module>/
  <entity>/
    <Entity>ListPage.tsx
    <Entity>DetailPage.tsx
    <Entity>CreatePage.tsx
```

### Barrel export:
- [ ] `apps/web/src/pages/<module>/index.ts` exports all pages

---

## 7. Frontend — Routing

All pages must be registered in the app router.

- [ ] Routes defined in `apps/web/src/App.tsx`
- [ ] Route pattern:
  ```
  /<module>                    → Command center / dashboard
  /<module>/dashboard          → Dashboard page
  /<module>/<entity>           → List page
  /<module>/<entity>/new       → Create page
  /<module>/<entity>/:id       → Detail page
  ```
- [ ] Nested routes use React Router `<Outlet />` where appropriate
- [ ] All routes are lazy-loaded for performance

---

## 8. Frontend — Components

Reusable components live in the components directory, organised by module.

### Required components:

- [ ] **Sidebar** — `<module>-sidebar.tsx`
  - Navigation links to all pages within the module
  - Grouped by logical section (e.g. "Management", "Compliance")
  - Active state highlighting for current route
- [ ] **Detail tabs** — `tabs/<entity>/`
  - One tab component per aspect of the entity
  - Minimum tabs: Overview/General, related entities, history/audit trail
  - Tabs render as full content areas (not modals or popovers)
- [ ] **Shared components** — `shared/`
  - Status badges, stat cards, filter bars reusable across the module

### Component file location:
```
apps/web/src/components/<module>/
  <module>-sidebar.tsx
  tabs/
    <entity>/
      <entity>-general-tab.tsx
      <entity>-<aspect>-tab.tsx
      ...
  shared/
    ...
```

---

## 9. Frontend — Field Coverage

**Every field in the Prisma schema must be visible and editable (where applicable) in the frontend UI.**

- [ ] **Audit**: Run a field-by-field comparison between the Prisma model and the frontend:
  - Every user-facing field appears in the detail page (read)
  - Every editable field appears in the create/edit form (write)
  - Enum fields render as select/dropdown with all options
  - Date fields use date pickers
  - Boolean fields use toggles or checkboxes
  - Text fields use appropriately sized inputs (single-line vs textarea)
  - UUID/system fields (id, createdAt, updatedAt, organisationId) are read-only or hidden
- [ ] **Relations**: Related entities are shown as links or embedded tables (e.g. control metrics as a tab)
- [ ] **Counts**: `_count` fields from Prisma are displayed where meaningful (e.g. "3 assessments", "5 metrics")
- [ ] **No missing fields**: If a field exists in the database, it must be surfaced in the UI. No silent omissions.

---

## 10. MCP Server

The MCP server provides AI access to the module's data. It follows the controls MCP server pattern.

### Structure:
```
apps/mcp-server-<module>/
  src/
    index.ts              — Server setup with instructions
    prisma.ts             — Prisma client instance
    tools/
      <entity>-tools.ts   — Read-only query tools
      analysis-tools.ts   — Aggregation and reporting tools
      mutation-tools.ts   — Proposal-based write tools
    resources/
      index.ts            — Reference documentation resources
    prompts/
      index.ts            — Guided workflow prompts
  package.json
  tsconfig.json
```

### 10a. Server Setup (`index.ts`)

- [ ] `McpServer` constructor with `name` and `version`
- [ ] `instructions` field in `ServerOptions` with anti-hallucination rules:
  1. Never fabricate data
  2. Cite tool results
  3. Distinguish absence from error
  4. No invented identifiers
  5. When uncertain, query again
  6. Zero is a valid answer
- [ ] All tool files registered
- [ ] Resources and prompts registered
- [ ] `StdioServerTransport` connection

### 10b. Read-Only Tools (`tools/<entity>-tools.ts`)

For every entity in the module:

- [ ] `list_<entities>` — Paginated list with filters (`skip`, `take`, status/type filters)
- [ ] `get_<entity>` — Single entity by UUID with full `include` relations
- [ ] `search_<entities>` — Text search by name/identifier (where applicable)
- [ ] `get_<entity>_stats` — Aggregate statistics (counts by status, by type)
- [ ] `find_<entities>_by_ids` — Bulk lookup by UUID array (where useful)

Tool conventions:
- [ ] Use `z.describe()` on every parameter for clear documentation
- [ ] Return structured JSON via `JSON.stringify(response, null, 2)`
- [ ] `isError: true` for not-found responses with descriptive message
- [ ] Pagination defaults: `skip = 0`, `take = 50`, max `200`

### 10c. Analysis Tools (`tools/analysis-tools.ts`)

- [ ] Gap analysis / compliance reporting
- [ ] Overdue items / SLA breaches
- [ ] Workload distribution
- [ ] Coverage matrix / health overview
- [ ] Completion summaries

### 10d. Mutation Tools (`tools/mutation-tools.ts`)

All write operations use the **proposal pattern** — no direct database writes.

- [ ] `propose_create_<entity>` — Propose creating a new entity
- [ ] `propose_update_<entity>` — Propose updating an entity
- [ ] `propose_delete_<entity>` — Propose deleting an entity
- [ ] Lifecycle proposals: `propose_start_<entity>`, `propose_approve_<entity>`, etc.
- [ ] Every proposal includes:
  - `reason` parameter (required) — explains why the change is proposed
  - `mcpSessionId` parameter (optional) — for tracking
  - Validation of current entity state before creating the proposal
  - Pending action created via `createPendingAction()` for human review
- [ ] Descriptive response confirming the proposal was queued

### 10e. Anti-Hallucination Guards

**Layer 1 — Server Instructions** (in `index.ts`):
- [ ] `instructions` field set on `ServerOptions` with the 6 rules listed above

**Layer 2 — Empty-State Notes** (in every tool file):
- [ ] Every list/search/aggregation tool checks for empty results
- [ ] When `count === 0` or `results.length === 0`, add a `note` field to the response
- [ ] Note messages are specific and actionable:
  - `"No <entities> found matching the specified filters."`
  - `"No <entities> matched the search query '<query>'."`
  - `"No <entities> assigned to this user."`

Pattern:
```typescript
const response: any = { results, total: count, skip, take };
if (count === 0) {
  response.note = 'No <entities> found matching the specified filters.';
}
return {
  content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
};
```

**Layer 3 — Data Integrity Resource** (in `resources/index.ts`):
- [ ] Resource at `<module>://data-integrity` with guidance on:
  - Source of truth (PostgreSQL via Prisma)
  - Empty results meaning (data doesn't exist yet, not hidden)
  - Identifier rules (UUIDs are system-generated, never guess)
  - Counts of 0 are valid states
  - Error vs. absence distinction
  - Prohibited actions (no fabrication, no guessing relationships)

### 10f. Resources (`resources/index.ts`)

- [ ] Framework/domain reference documentation (e.g. ISO 27001 structure)
- [ ] Methodology documentation (e.g. scoring, assessment workflow)
- [ ] Workflow guidance (e.g. lifecycle transitions, approval processes)
- [ ] Data integrity resource (Layer 3 guard — see above)
- [ ] All resources use `mimeType: 'text/markdown'`

### 10g. Prompts (`prompts/index.ts`)

- [ ] At least 3-4 guided workflow prompts relevant to the module
- [ ] Each prompt includes:
  - `name` and `description`
  - Structured messages guiding the AI through a multi-step analysis
  - References to which tools to use at each step

### 10h. Compilation

- [ ] `npx tsc --noEmit` passes with zero errors in the MCP server directory

---

## 11. No Modals Rule

**All CRUD operations must use full pages, not modal dialogs.**

- [ ] Create operations → dedicated `/new` page with form
- [ ] Edit operations → inline editing on the detail page, or a dedicated edit page
- [ ] Delete operations → confirmation inline (e.g. button with "Are you sure?" text) — not a modal
- [ ] Detail views → full page with tabs, not a modal overlay
- [ ] The only acceptable overlays are:
  - Toast notifications for success/error feedback
  - Dropdown menus for actions
  - Tooltip/popover for field help text

---

## 12. Module Registration

- [ ] Backend module registered in `apps/server/src/app.module.ts`
- [ ] Frontend routes registered in `apps/web/src/App.tsx`
- [ ] Sidebar navigation added to the app shell
- [ ] MCP server listed in project root configuration (if applicable)

---

## Completion Verification

Before marking a module as 100% complete, verify:

1. **Schema ↔ Backend**: Every Prisma model has a service with full CRUD
2. **Backend ↔ API**: Every service method is exposed via a controller endpoint
3. **API ↔ Frontend**: Every endpoint has a typed API function in the frontend
4. **Frontend ↔ UI**: Every API function is used by a page or component
5. **Schema ↔ UI**: Every user-facing database field is visible in the frontend
6. **Schema ↔ MCP**: Every entity has read tools; every write operation has a proposal tool
7. **MCP Guards**: All three anti-hallucination layers are in place
8. **No Modals**: All CRUD uses full pages
9. **TypeScript**: `tsc --noEmit` passes in all packages (server, web, MCP)
10. **Routing**: All pages are reachable via URL and sidebar navigation
