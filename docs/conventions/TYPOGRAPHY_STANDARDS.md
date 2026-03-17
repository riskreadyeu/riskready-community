# Typography Standards Guide

This document provides instructions for standardizing typography across all modules in the RiskReady application.

## Typography Scale Reference

Based on the sidebar reference (`text-sm` = 14px as body text), use this 6-level scale:

| Level | Class | Size | Weight | Use Case |
|-------|-------|------|--------|----------|
| Page Title | `text-page-title` | 24px | bold | Main page headers only |
| Section Title | `text-section-title` | 18px | semibold | Major sections within a page |
| Card Title | `text-card-title` | 16px | semibold | Card headers, subsections |
| Body | `text-sm` / `text-body` | 14px | normal | Primary content (REFERENCE) |
| Caption | `text-caption` | 12px | normal | Secondary text, labels, descriptions |
| Micro | `text-micro` | 10px | medium | Badges, tiny labels, hints |

### CSS Classes (defined in `styles.css`)

```css
.text-page-title    { @apply text-2xl font-bold tracking-tight text-foreground; }
.text-section-title { @apply text-lg font-semibold text-foreground; }
.text-card-title    { @apply text-base font-semibold text-foreground; }
.text-body          { @apply text-sm text-foreground; }
.text-caption       { @apply text-xs text-muted-foreground; }
.text-micro         { @apply text-[10px] font-medium text-muted-foreground; }
```

---

## STYLES Pattern

For complex pages, define a STYLES constant at the top of the file for consistency:

```tsx
// ============================================
// STANDARDIZED DESIGN TOKENS
// Typography Scale (from styles.css):
// - text-page-title: 24px bold - Main page headers
// - text-section-title: 18px semibold - Major sections
// - text-card-title: 16px semibold - Card headers
// - text-body / text-sm: 14px - Primary content (REFERENCE)
// - text-caption: 12px - Secondary text, descriptions
// - text-micro: 10px - Badges, tiny labels
// ============================================

const STYLES = {
  // Section headers with icons
  sectionTitle: "text-card-title flex items-center gap-2",
  sectionIcon: "w-5 h-5",
  sectionDescription: "text-caption mt-1",

  // Stat/metric displays (large numbers)
  statValue: "text-lg font-bold tabular-nums",
  statLabel: "text-caption",
  statCard: "p-4 rounded-lg text-center",

  // Form fields
  fieldLabel: "text-caption",
  fieldValue: "text-sm font-medium",

  // Inline metadata (key-value pairs)
  metaLabel: "text-caption",
  metaValue: "text-sm font-medium",

  // Banners and alerts
  banner: "p-4 rounded-lg border",
  bannerTitle: "text-sm font-semibold",
  bannerDescription: "text-sm",

  // Content spacing
  cardContent: "space-y-4",
  sectionSpacing: "space-y-6",
} as const;
```

---

## Common Patterns

### 1. Page Headers

```tsx
// Correct
<h1 className="text-page-title">Risk Register</h1>
<p className="text-caption mt-1">Manage organizational risks</p>

// Incorrect
<h1 className="text-3xl font-bold">Risk Register</h1>
<p className="text-muted">Manage organizational risks</p>
```

### 2. Card Headers

```tsx
// Correct - Using CardHeaderWithIcon
<CardHeaderWithIcon
  icon={<Shield className="w-5 h-5 text-primary" />}
  iconBgColor="bg-primary/10"
  title="Control Assessment"
  description="Evaluate control effectiveness"
/>

// Correct - Manual card header
<CardHeader>
  <CardTitle className="text-card-title flex items-center gap-2">
    <Shield className="w-5 h-5 text-primary" />
    Control Assessment
  </CardTitle>
</CardHeader>

// Incorrect
<CardHeader>
  <CardTitle className="text-lg font-bold">Control Assessment</CardTitle>
</CardHeader>
```

### 3. Form Labels

```tsx
// Correct
<Label className="text-caption">Likelihood</Label>
<Label className={STYLES.fieldLabel}>Impact Category</Label>

// Incorrect
<Label className="text-muted">Likelihood</Label>
<Label className="text-sm text-gray-500">Impact Category</Label>
```

### 4. Metric/Score Displays

```tsx
// Correct - Large score values
<div className="text-lg font-bold tabular-nums text-primary">
  {score}
</div>
<div className="text-caption">Inherent Score</div>

// Using STYLES
<div className={cn(STYLES.statValue, "text-primary")}>{score}</div>
<div className={STYLES.statLabel}>Inherent Score</div>

// Incorrect
<div className="text-2xl font-bold">{score}</div>
<div className="text-muted">Inherent Score</div>
```

### 5. Inline Metadata (Key-Value Pairs)

```tsx
// Correct
<div className="flex justify-between items-center">
  <span className="text-caption">Status</span>
  <span className="text-sm font-medium">Active</span>
</div>

// Using STYLES
<div className="flex justify-between items-center">
  <span className={STYLES.metaLabel}>Status</span>
  <span className={STYLES.metaValue}>Active</span>
</div>

// Incorrect
<div className="flex justify-between items-center">
  <span className="text-muted">Status</span>
  <span className="font-medium">Active</span>
</div>
```

### 6. Body Text and Descriptions

```tsx
// Correct
<p className="text-sm text-muted-foreground">{description}</p>
<p className="text-caption">{secondaryInfo}</p>

// Incorrect
<p className="text-body">{description}</p>  // Avoid text-body, use text-sm
<p className="text-muted">{secondaryInfo}</p>  // Deprecated
```

### 7. Empty States

```tsx
// Correct
<div className="text-center py-8">
  <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
  <h3 className="text-card-title">No Items Found</h3>
  <p className="text-caption mt-2">Add your first item to get started</p>
</div>

// Incorrect
<div className="text-center py-8">
  <h3 className="text-lg font-bold">No Items Found</h3>
  <p className="text-muted mt-2">Add your first item to get started</p>
</div>
```

### 8. Tooltips

```tsx
// Correct
<TooltipContent>
  <p className="text-caption font-medium">{title}</p>
  <p className="text-caption">{description}</p>
</TooltipContent>

// Incorrect
<TooltipContent>
  <p className="font-bold">{title}</p>
  <p className="text-sm">{description}</p>
</TooltipContent>
```

---

## Deprecated Patterns to Replace

| Deprecated | Replace With |
|------------|--------------|
| `text-muted` | `text-caption` or `text-sm text-muted-foreground` |
| `text-subsection-title` | `text-card-title` |
| `text-body` | `text-sm` |
| `text-body-large` | `text-base` or `text-card-title` |
| `font-medium` (alone) | `text-sm font-medium` |
| `text-xl` for scores | `text-lg font-bold` |
| `text-2xl` for inline metrics | `text-lg font-bold` |

---

## Migration Checklist

When standardizing a module, follow these steps:

### 1. Search for Deprecated Patterns

```bash
# Find deprecated classes
grep -n "text-muted[^-]" src/pages/your-module/*.tsx
grep -n "text-subsection" src/pages/your-module/*.tsx
grep -n "text-body" src/pages/your-module/*.tsx
grep -n '"font-medium"' src/pages/your-module/*.tsx
```

### 2. Add STYLES Constant

Copy the STYLES constant template to the top of your page file, after imports.

### 3. Update Typography Classes

Work through each section:

- [ ] Page title uses `text-page-title`
- [ ] Section headers use `text-section-title` or `text-card-title`
- [ ] Card titles use `text-card-title` or `CardHeaderWithIcon`
- [ ] Labels use `text-caption` or `STYLES.fieldLabel`
- [ ] Body text uses `text-sm` or `text-sm text-muted-foreground`
- [ ] Metric values use `STYLES.statValue` (text-lg font-bold)
- [ ] Empty states use `text-caption` for descriptions
- [ ] Tooltips use `text-caption`

### 4. Verify Visual Consistency

- [ ] Card headers are 16px semibold
- [ ] Body text matches sidebar (14px)
- [ ] Labels are smaller than body (12px)
- [ ] Score/metric values are prominent (18px bold)
- [ ] No text appears too large or too small relative to surroundings

---

## Size Reference Quick Guide

```
24px (text-2xl)  - Page titles only
18px (text-lg)   - Section titles, large metric values
16px (text-base) - Card titles, subsection headers
14px (text-sm)   - Body text, field values (REFERENCE SIZE)
12px (text-xs)   - Captions, labels, secondary info
10px (text-[10px]) - Badges, micro labels, hints
```

---

## Module-Specific Notes

### Risk Module
- Score displays use `STYLES.statValue` with color classes
- Factor scores (F1-F6) use `text-base font-bold` for values
- Likelihood/Impact labels use `text-caption`

### Audit Module
- NC severity badges use `text-xs`
- CAP timeline uses `text-caption` for dates
- Dialog labels use `text-xs text-muted-foreground`

### Controls Module
- Effectiveness percentages use `text-lg font-bold`
- Control IDs use `font-mono text-caption`
- Assessment results use `text-sm`

### Incident Module
- Timeline entries use `text-caption` for timestamps
- Status badges use `text-xs`
- Description fields use `text-sm text-muted-foreground`

---

## Questions?

If unsure about typography choices:

1. **Reference the sidebar** - Body text should match sidebar items (14px)
2. **Check hierarchy** - Larger = more important, smaller = secondary
3. **Use STYLES constants** - They enforce consistency
4. **Avoid mixing** - Don't use more than 3 sizes in one card

---

*Last updated: January 2026*
*Reference implementation: `RiskScenarioDetailPage.tsx`*
