# System Overview

This document provides a high-level overview of the RiskReady application architecture, technology choices, and design principles.

---

## Table of Contents

1. [Application Purpose](#application-purpose)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Design Principles](#design-principles)
5. [System Components](#system-components)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)

---

## Application Purpose

RiskReady is an **Information Security Management System (ISMS)** platform designed to help organisations achieve and maintain ISO 27001:2022 compliance. The application provides:

- **Organisation Management** - Define organisational context, structure, and governance
- **Risk Management** - Identify, assess, and treat information security risks
- **Control Management** - Implement and monitor security controls
- **Policy Management** - Create, distribute, and track security policies
- **Audit Management** - Plan and conduct internal audits
- **Incident Management** - Record and respond to security incidents
- **Compliance Tracking** - Monitor compliance with multiple frameworks

---

## Architecture Overview

RiskReady follows a **modern web application architecture** with clear separation between frontend and backend:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     React SPA (Single Page Application)                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Pages     │  │ Components  │  │    Hooks    │  │  API Client │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/REST
                                      │ JSON
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        NestJS Application                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Modules   │  │ Controllers │  │  Services   │  │   Guards    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Prisma ORM
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         PostgreSQL Database                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │    Auth     │  │Organisation │  │    Risk     │  │   Control   │   │  │
│  │  │   Tables    │  │   Tables    │  │   Tables    │  │   Tables    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Style

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Application Type** | Single Page Application (SPA) | Rich interactivity, fast navigation |
| **API Style** | RESTful | Standard, well-understood, tooling support |
| **Database** | Relational (PostgreSQL) | Complex relationships, ACID compliance |
| **Deployment** | Monorepo | Shared types, coordinated releases |

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI library |
| **TypeScript** | 5.5 | Type safety |
| **Vite** | 5.4 | Build tool and dev server |
| **React Router** | 6.28 | Client-side routing |
| **TailwindCSS** | 3.4 | Utility-first CSS |
| **Radix UI** | Latest | Accessible UI primitives |
| **Lucide React** | 0.469 | Icon library |
| **Recharts** | 2.15 | Data visualisation |
| **Sonner** | 2.0 | Toast notifications |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.3 | Server framework |
| **Express** | 4.19 | HTTP server |
| **TypeScript** | 5.5 | Type safety |
| **Prisma** | 5.19 | Database ORM |
| **Passport** | 0.7 | Authentication |
| **JWT** | 10.2 | Token-based auth |
| **Zod** | 3.23 | Runtime validation |
| **bcryptjs** | 2.4 | Password hashing |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 14+ | Primary database |
| **Prisma Client** | 5.19 | Type-safe database client |

### Development Tools

| Tool | Purpose |
|------|---------|
| **tsx** | TypeScript execution for development |
| **ts-node** | TypeScript execution for scripts |
| **PostCSS** | CSS processing |
| **Autoprefixer** | CSS vendor prefixes |

---

## Design Principles

### 1. Type Safety First

- Full TypeScript across frontend and backend
- Prisma generates type-safe database client
- Zod for runtime validation
- Shared type definitions where possible

### 2. Module-Based Architecture

Backend organised into feature modules:
```
src/
├── auth/           # Authentication & authorisation
├── organisation/   # Organisation management
├── health/         # Health checks
└── prisma/         # Database service
```

### 3. Component-Driven UI

Frontend uses composable components:
```
components/
├── ui/            # Base UI primitives (Button, Card, etc.)
├── common/        # Shared business components
├── dashboard/     # Dashboard-specific components
├── organisation/  # Organisation module components
├── controls/      # Controls module components
└── risks/         # Risk module components
```

### 4. Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| **Pages** | Route handling, data fetching, layout |
| **Components** | UI rendering, user interaction |
| **API Client** | HTTP communication, response handling |
| **Controllers** | Request handling, validation |
| **Services** | Business logic, data access |
| **Prisma** | Database operations |

### 5. Audit Trail

All entities include audit fields:
```typescript
{
  id: string;          // Unique identifier (CUID)
  createdAt: DateTime; // Creation timestamp
  updatedAt: DateTime; // Last update timestamp
  createdById: string; // User who created
  updatedById: string; // User who last updated
}
```

---

## System Components

### Frontend Application (`apps/web`)

```
apps/web/
├── src/
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   ├── styles.css           # Global styles
│   ├── components/
│   │   ├── app-shell.tsx    # Main layout with navigation
│   │   ├── ui/              # shadcn/ui components
│   │   ├── common/          # Shared components
│   │   └── [module]/        # Module-specific components
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── organisation/    # Organisation module pages
│   │   └── [module]/        # Other module pages
│   └── lib/
│       ├── utils.ts         # Utility functions
│       ├── request.ts       # HTTP client
│       └── organisation-api.ts  # Organisation API client
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

### Backend Application (`apps/server`)

```
apps/server/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── organisation/
│   │   ├── organisation.module.ts
│   │   ├── organisation.controller.ts
│   │   └── organisation.service.ts
│   ├── health/
│   │   └── health.controller.ts
│   └── prisma/
│       └── prisma.service.ts
├── prisma/
│   ├── schema/              # Prisma schema files
│   │   ├── base.prisma      # Datasource configuration
│   │   ├── auth.prisma      # Auth models
│   │   └── organisation.prisma  # Organisation models
│   └── seed.ts              # Database seeding
└── tsconfig.json            # TypeScript configuration
```

---

## Data Flow

### Request Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  React   │───▶│   API    │───▶│Controller│───▶│ Service  │───▶│  Prisma  │
│Component │    │  Client  │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     │  User Action  │  HTTP POST    │  Validate    │  Business     │  SQL
     │               │  /api/...     │  & Parse     │  Logic        │  Query
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Update  │◀───│  Parse   │◀───│  Return  │◀───│  Return  │◀───│  Return  │
│   UI     │    │ Response │    │   DTO    │    │  Entity  │    │  Record  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LOGIN                                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Login   │───▶│  POST    │───▶│ Validate │───▶│  Issue   │               │
│  │  Form    │    │ /auth/   │    │ Password │    │   JWT    │               │
│  │          │    │  login   │    │          │    │          │               │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘               │
│                                                       │                      │
│                                                       ▼                      │
│  2. STORE TOKEN                              ┌──────────────┐                │
│                                              │ HTTP-Only    │                │
│                                              │   Cookie     │                │
│                                              └──────────────┘                │
│                                                       │                      │
│  3. AUTHENTICATED REQUEST                            │                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐       │                      │
│  │  API     │───▶│  Include │───▶│  JWT     │◀──────┘                      │
│  │ Request  │    │  Cookie  │    │  Guard   │                               │
│  └──────────┘    └──────────┘    └──────────┘                               │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌──────────────┐                                │
│                              │   Validate   │                                │
│                              │   & Decode   │                                │
│                              │     JWT      │                                │
│                              └──────────────┘                                │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌──────────────┐                                │
│                              │   Attach     │                                │
│                              │    User      │                                │
│                              │  to Request  │                                │
│                              └──────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication

| Mechanism | Implementation |
|-----------|----------------|
| **Password Storage** | bcrypt with salt rounds |
| **Token Type** | JWT (JSON Web Token) |
| **Token Storage** | HTTP-only cookie |
| **Token Expiry** | Configurable (default: 24h) |

### Authorisation

| Level | Implementation |
|-------|----------------|
| **Route Protection** | JWT Auth Guard |
| **Role-Based Access** | User roles in JWT payload |
| **Resource Access** | Service-level checks |

### Data Protection

| Aspect | Implementation |
|--------|----------------|
| **Transport** | HTTPS in production |
| **Input Validation** | Zod schemas |
| **SQL Injection** | Prisma parameterised queries |
| **XSS Prevention** | React's built-in escaping |

### Audit Trail

All data modifications are tracked:
- **Who** - `createdById`, `updatedById`
- **When** - `createdAt`, `updatedAt`
- **What** - Full record state in database

---

## Performance Considerations

### Frontend

| Technique | Implementation |
|-----------|----------------|
| **Code Splitting** | React.lazy for route-based splitting |
| **Bundle Optimisation** | Vite's tree-shaking and minification |
| **Caching** | Browser caching for static assets |

### Backend

| Technique | Implementation |
|-----------|----------------|
| **Connection Pooling** | Prisma connection pool |
| **Query Optimisation** | Prisma's query engine |
| **Response Compression** | Express compression middleware |

### Database

| Technique | Implementation |
|-----------|----------------|
| **Indexing** | Strategic indexes on frequently queried fields |
| **Pagination** | Limit/offset for list queries |
| **Selective Loading** | Prisma select/include for minimal data |

---

## Scalability

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │   Server    │   │   Server    │   │   Server    │
    │  Instance 1 │   │  Instance 2 │   │  Instance 3 │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Primary)     │
                    └─────────────────┘
```

### Considerations for Scale

| Component | Scaling Strategy |
|-----------|------------------|
| **Frontend** | CDN distribution, static hosting |
| **Backend** | Horizontal scaling behind load balancer |
| **Database** | Read replicas, connection pooling |
| **Sessions** | Stateless JWT (no session store needed) |
