# Archer GRC Design Layout Reference

> Research compiled from official Archer documentation and industry resources.
> This document serves as a UI/UX reference for RiskReady development.

---

## Table of Contents

1. [Overview](#overview)
2. [Global Navigation Structure](#global-navigation-structure)
3. [Workspace Organization](#workspace-organization)
4. [Record Detail Page Layout](#record-detail-page-layout)
5. [Dashboard Design](#dashboard-design)
6. [Field Design Patterns](#field-design-patterns)
7. [Record List & Search Results](#record-list--search-results)
8. [Enhanced UX Features](#enhanced-ux-features)
9. [Example Layouts](#example-layouts)
10. [Design Limits & Best Practices](#design-limits--best-practices)
11. [Sources](#sources)

---

## Overview

Archer GRC (now Archer IRM - Integrated Risk Management) is an enterprise-grade governance, risk, and compliance platform. Key characteristics:

- **Highly configurable** - Non-technical users can build custom applications via point-and-click
- **Data-driven architecture** - Applications, fields, layouts are all configurable
- **Workspace-based navigation** - Logical grouping of related modules
- **Widget-based dashboards** - Reusable dashboard components across workspaces
- **Role-based UX** - Interface adapts based on user permissions

### Platform Editions

- **Classic Experience** - Legacy interface (pre-6.x)
- **Next Generation Experience** - Modern UI (2024.09+) with improved styling and interactions

---

## Global Navigation Structure

### Top Menu Bar

| Component | Description |
|-----------|-------------|
| **Logo/Home** | Returns to default home page/dashboard |
| **Global Search** | Search across all content with "All Files" filtering |
| **Account Settings** | User profile, preferences, language selection |
| **Notifications** | System alerts and task notifications |
| **Help** | Documentation and support links |
| **Logout** | Session termination |

### Breadcrumb Navigation

- Always visible at top of content area
- Format: `Home > Workspace > Application > Record Name`
- "You are here" indicator for orientation
- Clickable segments for quick navigation up the hierarchy

### Navigation Menu

The Navigation menu displays beneath the menu bar at the top of every page:

- Enables single-click access to reports
- Navigate solutions and applications within workspaces
- Workspace buttons provide direct access
- Workspace menus (arrow expansion) show nested content

---

## Workspace Organization

### Workspace Hierarchy

```
Workspace (e.g., "Risk Management")
├── Solution (e.g., "Enterprise Risk")
│   ├── Application (e.g., "Risk Register")
│   │   ├── Records (individual risk items)
│   │   └── Reports/Dashboards
│   └── Application (e.g., "Risk Assessments")
├── Solution (e.g., "IT Risk")
│   └── Applications...
└── Questionnaires
```

### Workspace Navigation Pattern

**Left Vertical Navigation:**

1. Click workspace name to go directly to workspace landing
2. Click arrow beside workspace to expand menu
3. Submenus display solutions and applications
4. Click application name to view record list

### Standard Workspaces (Typical Implementation)

| Workspace | Purpose |
|-----------|---------|
| **Risk Management** | Risk registers, assessments, treatments |
| **Compliance Management** | Regulatory requirements, assessments |
| **Audit Management** | Audit planning, findings, remediation |
| **Policy Management** | Policy lifecycle, attestations, exceptions |
| **Vendor Risk** | Third-party assessments, monitoring |
| **IT & Security Risk** | Vulnerabilities, security incidents |
| **Business Continuity** | BIA, recovery planning |

---

## Record Detail Page Layout

### Structural Hierarchy

```
Record Page
├── Header Bar
│   ├── Breadcrumb
│   ├── Record Title / Key Field
│   └── Action Buttons (Edit, Save, Save & Close, Delete)
│
├── Tab Set (container)
│   ├── Tab 1 (e.g., "General")
│   │   ├── Section 1 (e.g., "Basic Information")
│   │   │   ├── Field 1
│   │   │   ├── Field 2
│   │   │   └── Field N
│   │   └── Section 2 (e.g., "Details")
│   │       └── Fields...
│   │
│   ├── Tab 2 (e.g., "Assessment")
│   │   └── Sections & Fields...
│   │
│   ├── Tab 3 (e.g., "Related Records")
│   │   └── Cross-reference grids
│   │
│   └── Tab N (e.g., "History")
│       └── History Log Field
│
└── Footer (optional)
    └── Related actions, workflow buttons
```

### Tab Sets

- **Purpose**: Group related tabs and fields for quick navigation
- **Behavior**:
  - Tabs without accessible fields are hidden from user
  - Data-driven events can dynamically show/hide tabs
  - Nested tabs supported
  - Configurable default tab
- **Styling**:
  - ALL CAPS headers
  - Active tab highlighted in blue
  - No gray backgrounds (modern theme)

### Sections

- **Purpose**: Group related fields within a tab
- **Visual Style**:
  - White background
  - Rounded borders
  - Section header/title
  - Collapsible (optional)
  - Maximum width: 1600px

### Layout Configuration

| Property | Options |
|----------|---------|
| **Columns** | 1-column or 2-column layouts |
| **Column Spanning** | Fields/objects can span multiple columns |
| **Row Height** | Minimum 60px |
| **Field Label Position** | Above field value (not inline) |
| **Indentation** | 5px for field content |

### Layout Objects

| Object Type | Description |
|-------------|-------------|
| **Fields** | Data entry/display elements |
| **Sections** | Grouped headings for related fields |
| **Tab Sets** | Container for multiple tabs |
| **Text Boxes** | Guidance/supplementary information |
| **Placeholders** | Spacing elements between objects |
| **Custom Objects** | HTML/JavaScript components, buttons |
| **Trending Charts** | Historical data visualization |
| **Report Objects** | Embedded reports with filters |
| **Progress Trackers** | Status visualization via values lists |

### Record Actions

| Action | Location | Description |
|--------|----------|-------------|
| **Edit** | Top header | Enter edit mode |
| **Save** | Top header | Save and continue editing |
| **Save & Close** | Top header | Save and return to list |
| **Delete** | Ellipsis menu | Remove record |
| **Copy** | Ellipsis menu | Duplicate record |
| **Print** | Ellipsis menu | Print-friendly view |
| **History** | Tab or link | View audit trail |

---

## Dashboard Design

### Dashboard Architecture

- Dashboards are **groups of widgets** with related content
- **Reusable** across multiple workspaces
- **Configured per user group** needs
- Can be set as **home page** (default landing)

### Widget Types

| Widget Type | Description | Use Case |
|-------------|-------------|----------|
| **Report/Chart** | Tables, charts from saved reports | KPIs, metrics, data views |
| **Multi-Chart** | Up to 15 reports/charts in one widget | Consolidated views with menu switching |
| **Links** | Navigation to URLs, reports, pages | Quick access shortcuts |
| **Progress Trackers** | Status visualization | Workflow stage tracking |
| **Trending Charts** | Historical data for numeric/values fields | Trend analysis |
| **Report Objects** | Embedded reports with filters | Detailed data views |
| **iGraphics** | Visual process diagrams | Process flows, status maps |

### Dashboard Controls

| Control | Function |
|---------|----------|
| **Dashboard Selector** | Dropdown to switch between dashboards |
| **Ellipsis Menu** | Add, edit, set as home page |
| **Export** | PDF and PowerPoint (WYSIWYG) |
| **Page Link Copy** | Share dashboard URL |
| **Refresh** | Update widget data |

### Dashboard Layout Patterns

**Executive Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│  [Risk Summary]      [Compliance Status]   [Open Items] │
│  ┌─────────────┐    ┌─────────────┐      ┌───────────┐ │
│  │ Risk Heat   │    │ Compliance  │      │ Tasks: 24 │ │
│  │    Map      │    │   Gauge     │      │ Issues: 8 │ │
│  └─────────────┘    └─────────────┘      │ Reviews: 3│ │
│                                          └───────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Top Risks Table]                 [Trend Chart]        │
│  ┌────────────────────────┐       ┌──────────────────┐ │
│  │ ID  | Name | Rating    │       │     ___/\___     │ │
│  │ R01 | ...  | High      │       │ ___/       \__   │ │
│  │ R02 | ...  | Critical  │       │/               \  │ │
│  └────────────────────────┘       └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Task-Driven Landing Page:**
- Personal task list
- Items requiring attention
- Recent activity
- Quick action buttons

---

## Field Design Patterns

### Field Types

| Field Type | Description | UI Control |
|------------|-------------|------------|
| **Text** | Single/multi-line text | Input / Textarea |
| **Numeric** | Numbers with optional prefix/suffix | Number input |
| **Date** | Date/time values | Date picker |
| **Values List** | Predefined options | Radio/Checkbox/Dropdown |
| **Cross-Reference** | Link to other records | Lookup popup / Grid |
| **Attachment** | File uploads | File picker |
| **Image** | Image uploads | Image viewer |
| **User/Group** | User/group selection | User lookup |
| **Calculated** | Formula-based values | Read-only display |
| **History Log** | Audit trail | Expandable list |
| **Rich Text** | Formatted text | WYSIWYG editor |
| **IP Address** | IP addresses | Specialized input |
| **External Links** | URL references | Link display |
| **Matrix** | Multi-dimensional ratings | Matrix grid |

### Values List UI Patterns

| # of Options | Recommended UI Control |
|--------------|----------------------|
| 2-4 values | Radio buttons (single-select) or Checkboxes (multi-select) |
| 5-10 values | Dropdown menu |
| 10+ values | Dropdown with type-ahead filter |

### Field Display Configuration

| Property | Description |
|----------|-------------|
| **Required** | Field must have value |
| **Read-only** | Display only, no editing |
| **Conditional Display** | Show/hide based on other field values |
| **Conditional Required** | Required based on conditions |
| **Default Value** | Pre-populated value |
| **Help Text** | Tooltip with additional guidance |
| **Placeholder** | Input hint text |

### Field Label Styling (Modern Theme)

```
Label:    Light gray, positioned above value
Font:     Lato, 14px for labels
Content:  16px Medium weight
Help:     Gray circle with "?" to right of label
Spacing:  5px indentation for field content
```

### Cross-Reference Field Patterns

**Single Reference:**
- Lookup popup with search
- Display selected record's key field

**Multiple References (Grid Display):**
- Embedded grid showing related records
- Default 5 records visible
- Key field as first column
- Add/Remove buttons

**Multiple References (10-20+ records):**
- Use Report Object instead of cross-reference grid
- Better performance and filtering

---

## Record List & Search Results

### List View Components

| Component | Description |
|-----------|-------------|
| **Column Headers** | Sortable, configurable columns |
| **Filters** | Advanced filtering panel |
| **Search** | Quick search within results |
| **Pagination** | Navigate large result sets |
| **Row Actions** | Edit, view, delete per row |
| **Bulk Actions** | Select multiple for batch operations |
| **Export** | Export results to various formats |
| **Sum/Total Row** | Aggregations at bottom |

### List Configuration

- Configurable columns per application
- Column reordering via drag-and-drop
- Column width adjustment
- Saved views/filters
- Sort by multiple columns

### Record Creation

1. Click ellipsis menu in upper right
2. Select "New Record"
3. Blank form displays
4. Click "Edit" to enter edit mode
5. Complete required fields
6. Click "Save" or "Save & Close"

### Record Lookup Popup

Used when selecting related records:
- Search field at top
- Results grid with key fields
- Select single or multiple (based on config)
- Recently selected items
- Create new option (if permitted)

---

## Enhanced UX Features

### Modern Theme (Next Generation Experience)

| Element | Specification |
|---------|--------------|
| **Font Family** | Lato |
| **Field Content Size** | 16px Medium |
| **Label Color** | Light gray |
| **Label Position** | Above field value |
| **Field Indentation** | 5px |
| **Minimum Row Height** | 60px |
| **Section Max Width** | 1600px |
| **Section Background** | White |
| **Field Borders** | Rounded |
| **Help Icons** | Gray circle with "?" |
| **Tab Headers** | ALL CAPS |
| **Active Tab** | Blue highlight |
| **Grid/Table Background** | No gray backgrounds |

### Accessibility Features

- Keyboard navigation support
- Focus management systems
- Screen reader compatibility
- ARIA attributes on interactive elements

### Responsive Design

- Adapts to desktop and tablet viewports
- Mobile-ready applications (configurable)
- Touch-friendly controls for mobile

### Data-Driven Events (DDEs)

Dynamic UI behavior based on record state:

| Action | Description |
|--------|-------------|
| **Show/Hide Fields** | Conditional field visibility |
| **Show/Hide Sections** | Conditional section visibility |
| **Show/Hide Tabs** | Conditional tab visibility |
| **Set Required** | Dynamic required field status |
| **Set Read-Only** | Dynamic read-only status |
| **Set Values** | Auto-populate based on conditions |

---

## Example Layouts

### Risk Record Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Home > Risk Management > Risk Register > RISK-2024-001          │
├─────────────────────────────────────────────────────────────────┤
│                                        [Edit] [⋮ More Actions]  │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│ ┌─ GENERAL ─┬─ ASSESSMENT ─┬─ CONTROLS ─┬─ TREATMENT ─┬─ HISTORY ─┐
│ │                                                                  │
│ │  BASIC INFORMATION                                               │
│ │  ┌────────────────────────┬────────────────────────┐            │
│ │  │ Risk ID                │ Status                 │            │
│ │  │ RISK-2024-001          │ ● Open                 │            │
│ │  ├────────────────────────┼────────────────────────┤            │
│ │  │ Risk Name              │ Risk Owner         ?   │            │
│ │  │ Data Breach Risk       │ John Smith             │            │
│ │  ├────────────────────────┴────────────────────────┤            │
│ │  │ Description                                      │            │
│ │  │ [Rich text area spanning full width]             │            │
│ │  │ Risk of unauthorized access to customer PII...   │            │
│ │  └─────────────────────────────────────────────────┘            │
│ │                                                                  │
│ │  CLASSIFICATION                                                  │
│ │  ┌────────────────────────┬────────────────────────┐            │
│ │  │ Category               │ Subcategory            │            │
│ │  │ [▼ Operational]        │ [▼ Information Security]│           │
│ │  ├────────────────────────┼────────────────────────┤            │
│ │  │ Risk Source            │ Business Unit          │            │
│ │  │ ☐ Internal ☑ External  │ [▼ IT Department]      │            │
│ │  └────────────────────────┴────────────────────────┘            │
│ │                                                                  │
│ └──────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

### Assessment Tab Layout

```
│ ┌─ GENERAL ─┬─ ASSESSMENT ─┬─ CONTROLS ─┬─ TREATMENT ─┬─ HISTORY ─┐
│ │                                                                  │
│ │  INHERENT RISK                                                   │
│ │  ┌────────────────────────┬────────────────────────┐            │
│ │  │ Likelihood             │ Impact                 │            │
│ │  │ ○ 1 ○ 2 ○ 3 ● 4 ○ 5   │ ○ 1 ○ 2 ● 3 ○ 4 ○ 5   │            │
│ │  ├────────────────────────┼────────────────────────┤            │
│ │  │ Inherent Risk Score    │ Inherent Risk Rating   │            │
│ │  │ 12                     │ ██████ HIGH            │            │
│ │  └────────────────────────┴────────────────────────┘            │
│ │                                                                  │
│ │  RESIDUAL RISK                                                   │
│ │  ┌────────────────────────┬────────────────────────┐            │
│ │  │ Control Effectiveness  │ Residual Likelihood    │            │
│ │  │ ████████░░ 75%         │ ○ 1 ● 2 ○ 3 ○ 4 ○ 5   │            │
│ │  ├────────────────────────┼────────────────────────┤            │
│ │  │ Residual Risk Score    │ Residual Risk Rating   │            │
│ │  │ 6                      │ ███░░░ MEDIUM          │            │
│ │  └────────────────────────┴────────────────────────┘            │
│ │                                                                  │
│ └──────────────────────────────────────────────────────────────────┘
```

### Controls Tab Layout (Cross-Reference Grid)

```
│ ┌─ GENERAL ─┬─ ASSESSMENT ─┬─ CONTROLS ─┬─ TREATMENT ─┬─ HISTORY ─┐
│ │                                                                  │
│ │  LINKED CONTROLS                              [+ Add] [Remove]   │
│ │  ┌──────────┬────────────────────┬──────────┬─────────────────┐ │
│ │  │ Ctrl ID  │ Control Name       │ Type     │ Effectiveness   │ │
│ │  ├──────────┼────────────────────┼──────────┼─────────────────┤ │
│ │  │ CTL-001  │ Access Control     │ Preventive│ ████████ 85%   │ │
│ │  │ CTL-015  │ Encryption         │ Preventive│ ███████░ 70%   │ │
│ │  │ CTL-023  │ Monitoring         │ Detective │ ██████░░ 60%   │ │
│ │  │ CTL-044  │ Incident Response  │ Corrective│ █████░░░ 50%   │ │
│ │  └──────────┴────────────────────┴──────────┴─────────────────┘ │
│ │  Showing 4 of 4 records                                          │
│ │                                                                  │
│ └──────────────────────────────────────────────────────────────────┘
```

### Dashboard Layout Example

```
┌─────────────────────────────────────────────────────────────────────┐
│ Risk Management Dashboard            [Dashboard ▼] [⋮] [Export]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │ TOTAL RISKS      │ │ HIGH/CRITICAL    │ │ OVERDUE REVIEWS  │    │
│  │                  │ │                  │ │                  │    │
│  │      127         │ │       23         │ │       8          │    │
│  │   ▲ 5 from last  │ │   ▼ 2 from last  │ │   ▲ 3 from last  │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────┐ ┌────────────────────────────┐ │
│  │ RISK HEAT MAP                  │ │ RISKS BY CATEGORY          │ │
│  │                                │ │                            │ │
│  │     1   2   3   4   5         │ │ ████████████ Operational 45│ │
│  │   ┌───┬───┬───┬───┬───┐      │ │ █████████ Strategic    32  │ │
│  │ 5 │   │   │ 2 │ 5 │ 3 │      │ │ ███████ Financial      28  │ │
│  │ 4 │   │ 4 │ 8 │ 6 │ 1 │      │ │ █████ Compliance       22  │ │
│  │ 3 │ 2 │ 12│ 15│ 4 │   │      │ │                            │ │
│  │ 2 │ 8 │ 18│ 9 │ 2 │   │      │ └────────────────────────────┘ │
│  │ 1 │ 15│ 10│ 2 │   │   │      │                                │
│  │   └───┴───┴───┴───┴───┘      │ ┌────────────────────────────┐ │
│  │      Impact →                 │ │ RISK TREND (6 months)      │ │
│  └────────────────────────────────┘ │      ___                   │ │
│                                     │   __/   \___    ___       │ │
│                                     │ _/          \__/   \__    │ │
│                                     │/                      \   │ │
│                                     └────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ TOP 10 RISKS BY SCORE                              [View All] │  │
│  ├────────┬──────────────────────────┬────────┬────────┬────────┤  │
│  │ ID     │ Risk Name                │ Score  │ Rating │ Owner  │  │
│  ├────────┼──────────────────────────┼────────┼────────┼────────┤  │
│  │ R-001  │ Data Breach              │ 20     │ CRIT   │ J.Smith│  │
│  │ R-015  │ Ransomware Attack        │ 18     │ HIGH   │ M.Jones│  │
│  │ R-023  │ Vendor Failure           │ 16     │ HIGH   │ S.Lee  │  │
│  └────────┴──────────────────────────┴────────┴────────┴────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Design Limits & Best Practices

### Field Limits

| Element | Recommended Limit |
|---------|------------------|
| Fields per layout | < 70 |
| Cross-reference fields per layout | < 20 |
| Total cross-references per layout | < 500 |
| Questions per questionnaire | < 300 |
| Reports/charts per multi-chart widget | ≤ 15 |

### Performance Best Practices

1. **Limit displayed fields** - Only show essential fields on layouts
2. **Use Report Objects** - For 10+ linked records instead of cross-reference grids
3. **Optimize calculations** - Set to "As Needed" except for date functions
4. **Split large questionnaires** - Use multiple tabs or separate questionnaires
5. **Restrict Global Value Lists** - Only for multiple references in same application

### UX Best Practices

1. **Field labels** - Keep to 1-2 words
2. **Help text** - Only supplement labels with critical information
3. **Tooltips** - 1-2 sentences maximum, position to avoid blocking content
4. **Required fields** - Mark clearly, use conditional required when appropriate
5. **Default values** - Pre-populate when sensible to reduce user effort
6. **Logical grouping** - Organize fields into meaningful sections
7. **Progressive disclosure** - Use tabs to manage complexity
8. **History log** - Include in every application, position at layout bottom

### Conditional Layout Actions

Use Data-Driven Events to create dynamic interfaces:

- **Show/Hide by role** - Different users see different fields
- **Show/Hide by status** - Fields appear based on workflow stage
- **Required by context** - Fields become required based on selections
- **Read-only after approval** - Lock fields post-workflow completion

---

## Sources

### Official Archer Documentation

- [Archer UI Basics](https://help.archerirm.cloud/platform_2025_04/en-us/content/platform/ui/ui_basics.htm)
- [Dashboard Management](https://help.archerirm.cloud/platform_2024_11/en-us/content/platform/workspacesdashboards/dashboards_creating_managing.htm)
- [Field Design Best Practices](https://help.archerirm.cloud/platform_2024_11/en-us/content/design_bp/fields.htm)
- [Layout Objects](https://help.archerirm.cloud/platform_2025_04/en-us/content/platform/layouts/app_layout_objects_adding.htm)
- [Enhanced User Experience](https://help.archerirm.cloud/exchange/content/exchange/tools_utilities/enhanced_user_experience.htm)
- [Application Building](https://help.archerirm.cloud/platform_2024_09/en-us/content/platform/applications/app_building.htm)
- [Platform 2024.09 Release Notes](https://help.archerirm.cloud/platform_2024_09/en-us/content/rnhome/2024_09_ngrx_upgrade_saas.htm)

### Third-Party Resources

- [G2 Archer Reviews](https://www.g2.com/products/rsa-security-archer/reviews)
- [Gartner Peer Insights - Archer](https://www.gartner.com/reviews/market/integrated-risk-management/vendor/archer/product/archer)
- [Virginia IT Agency Archer User Guide 2025](https://www.vita.virginia.gov/media/vitavirginiagov/commonwealth-security/pdf/Archer-User-Guide-2025.pdf)

### Training Resources

- [InfosecTrain RSA Archer Training](https://www.infosectrain.com/courses/rsa-archer-training)
- [RSA Archer in Action Demo](https://www.classcentral.com/course/youtube-rsa-archer-in-action-live-demo-expert-career-tips-443384)

---

## Notes for RiskReady Implementation

### Patterns to Consider Adopting

1. **Workspace-based navigation** - Group related modules logically
2. **Tab-based record layouts** - Organize complex records into tabs
3. **Section grouping** - Group related fields with clear headers
4. **Dashboard widgets** - Reusable chart/data components
5. **Cross-reference patterns** - Lookup popups and embedded grids
6. **Conditional layouts** - Dynamic field visibility based on context
7. **Field design standards** - Consistent control selection based on option count

### Potential Differentiators

1. **Modern tech stack** - React/TypeScript vs Archer's older architecture
2. **Better mobile experience** - Responsive design from the start
3. **Simpler configuration** - Less complexity than Archer's full flexibility
4. **Faster performance** - Modern frontend frameworks and optimizations
5. **Better UX out-of-box** - Pre-designed layouts vs blank canvas approach

---

*Document created: 2026-01-30*
*Last updated: 2026-01-30*
