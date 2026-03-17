# RiskReady Application Architecture

Welcome to the RiskReady application architecture documentation. This guide provides a comprehensive overview of the system design, technology stack, and implementation patterns.

## Documentation Structure

| Document | Description |
|----------|-------------|
| [01-system-overview.md](./01-system-overview.md) | High-level architecture, tech stack, and design principles |
| [02-frontend-architecture.md](./02-frontend-architecture.md) | React application structure, components, and patterns |
| [03-backend-architecture.md](./03-backend-architecture.md) | NestJS server, modules, and API design |
| [04-database-schema.md](./04-database-schema.md) | Prisma schema, data models, and relationships |
| [05-authentication.md](./05-authentication.md) | Authentication flow, JWT, and session management |
| [06-api-design.md](./06-api-design.md) | RESTful API conventions and endpoint patterns |
| [07-deployment.md](./07-deployment.md) | Deployment architecture and infrastructure |
| [08-risk-treatment-system.md](./08-risk-treatment-system.md) | Risk treatment planning, ROI calculations, notifications, history, templates, and dependencies |

## Quick Reference

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **UI Components** | Radix UI, shadcn/ui patterns, Lucide icons |
| **Backend** | NestJS 10, Express, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | Passport.js, JWT tokens |
| **Charts** | Recharts |

### Project Structure

```
riskready-community/
├── apps/
│   ├── server/          # NestJS backend application
│   │   ├── src/
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── organisation/ # Organisation module
│   │   │   ├── health/      # Health check endpoints
│   │   │   └── prisma/      # Prisma service
│   │   └── prisma/
│   │       └── schema/      # Prisma schema files
│   └── web/             # React frontend application
│       └── src/
│           ├── components/  # UI components
│           ├── pages/       # Page components
│           └── lib/         # Utilities and API clients
└── docs/                # Documentation
    ├── architecture/    # This documentation
    └── organisation-module/
```

## Architecture Principles

1. **Monorepo Structure** - Single repository with separate apps for frontend and backend
2. **Module-Based Design** - Backend organised into feature modules
3. **Type Safety** - Full TypeScript across the stack
4. **Component-Driven UI** - Reusable UI components with shadcn/ui patterns
5. **RESTful APIs** - Standard REST conventions for all endpoints
6. **Audit Trail** - All entities track creation and modification metadata

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Development Setup

```bash
# Install dependencies
cd apps/server && npm install
cd apps/web && npm install

# Setup database
cd apps/server
npm run prisma:migrate
npm run prisma:seed

# Start development servers
# Terminal 1 - Backend
cd apps/server && npm run dev

# Terminal 2 - Frontend
cd apps/web && npm run dev
```

### Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (NestJS) | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | - |

## Version Information

- **Application Version:** 0.1.0
- **Documentation Version:** 1.1
- **Last Updated:** January 2025
