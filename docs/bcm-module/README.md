# BCM Module Documentation

The Business Continuity Management (BCM) module provides comprehensive capabilities for managing business continuity planning, impact analysis, resilience testing, and plan activation.

## Documentation Index

1. [Overview](./01-overview.md) - Module purpose, regulatory context, and key features
2. [Data Model](./02-data-model.md) - Entity relationships and field definitions
3. [BIA Workflow](./03-bia-workflow.md) - Business Impact Analysis workflow and status lifecycle
4. [API Reference](./04-api-reference.md) - Complete REST API documentation
5. [User Guide](./05-user-guide.md) - End-user guide for all BCM workflows

## Quick Start

### For Developers

1. **Schema**: BCM models are defined in `apps/server/prisma/schema/bcm.prisma`
2. **Backend**: Services and controllers in `apps/server/src/bcm/`
3. **Frontend**: Pages in `apps/web/src/pages/bcm/`
4. **Components**: BCM-specific components in `apps/web/src/components/bcm/`

### For Users

1. Start by completing BIA assessments for business processes
2. Create a BCM program to govern continuity activities
3. Create continuity plans linked to the program
4. Schedule and execute test exercises
5. Use the dashboard to monitor coverage and compliance

## Key Concepts

### BIA Status Flow
```
Process Created → Pending BIA → In Progress → Completed → BCP Eligible
```

### Plan Activation Flow
```
Incident Occurs → Activate Plan → Track Recovery → Deactivate → Review
```

### Test Exercise Flow
```
Schedule → Execute → Complete → Record Findings → Resolve/Link to NC
```

## Related Modules

- **Organisation**: Business processes with BIA fields
- **Incidents**: Plan activation from incidents
- **Audits**: Nonconformity linkage from test findings
- **Policies**: Policy document linkage for plans
- **Evidence**: Evidence attachment for tests

