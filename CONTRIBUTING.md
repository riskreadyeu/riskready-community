# Contributing to RiskReady Community Edition

Thank you for your interest in contributing to RiskReady. This guide covers the development setup and contribution process.

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/riskready/riskready-community.git
cd riskready-community

# Start PostgreSQL
docker compose up db -d

# Set up the backend
cd apps/server
cp .env.example .env
# Edit .env: set DATABASE_URL to postgresql://riskready:your-password@localhost:5433/riskready
npm install
npx prisma db push --schema=prisma/schema
npm run prisma:seed
npm run dev

# In a separate terminal, set up the frontend
cd apps/web
npm install
npm run dev
```

The backend runs on `http://localhost:4000` and the frontend on `http://localhost:5173`.

## Code Style

### Backend (apps/server)

- TypeScript with NestJS conventions
- Modules, controllers, services pattern
- Prisma for database access
- Jest for unit tests

### Frontend (apps/web)

- TypeScript with React 18
- TailwindCSS for styling
- Radix UI for accessible components
- Vite for bundling

## Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Make your changes with clear, descriptive commit messages
3. Add or update tests as appropriate
4. Ensure `npm test` passes in `apps/server`
5. Ensure `npm run build` succeeds in both `apps/server` and `apps/web`
6. Open a pull request with a clear description of the changes

## Testing

### Backend

```bash
cd apps/server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

### E2E Tests

```bash
cd apps/web
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Interactive UI mode
```

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bug reports
- Include your environment details (OS, Node version, Docker version)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
