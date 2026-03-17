# RiskReady Platform - Complete Setup

## ✅ Installation Complete

Both the backend API and frontend web application have been successfully installed and are running!

---

## 🎯 System Overview

### Architecture

```
┌─────────────────────────────────────────────┐
│           Nginx Reverse Proxy               │
│              (Port 80)                      │
└────────┬────────────────────────┬───────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│  Frontend (Vite)│    │  Backend API (NestJS)│
│   Port 5173     │    │     Port 4000        │
└─────────────────┘    └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │  PostgreSQL Database │
                       │     Port 5432        │
                       └──────────────────────┘
```

### Services Running

| Service | Port | Status | Auto-start |
|---------|------|--------|------------|
| Nginx | 80 | ✓ Running | Yes |
| Backend API | 4000 | ✓ Running | Yes |
| Frontend | 5173 | ✓ Running | Yes |
| PostgreSQL | 5432 | ✓ Running | Yes |

---

## 🌐 Access URLs

### Primary Access (via Nginx)
- **Frontend:** http://localhost
- **API:** http://localhost/api
- **Health Check:** http://localhost/api/health

### Direct Access (for development)
- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000/api

---

## 🔐 Login Credentials

```
Email: admin@local.test
Password: <your-password>
```

Additional test users created (all with password `<your-password>`):
- admin@riskready.com
- john.smith@riskready.com
- sarah.jones@riskready.com
- mike.wilson@riskready.com
- emma.brown@riskready.com

---

## 🛠️ Service Management

### Backend Server

```bash
# Status
sudo systemctl status riskready-server

# Start/Stop/Restart
sudo systemctl start riskready-server
sudo systemctl stop riskready-server
sudo systemctl restart riskready-server

# Logs
sudo journalctl -u riskready-server -f
```

### Frontend

```bash
# Status
sudo systemctl status riskready-web

# Start/Stop/Restart
sudo systemctl start riskready-web
sudo systemctl stop riskready-web
sudo systemctl restart riskready-web

# Logs
sudo journalctl -u riskready-web -f
```

### Nginx

```bash
# Status
sudo systemctl status nginx

# Reload (no downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Test configuration
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/riskready-access.log
sudo tail -f /var/log/nginx/riskready-error.log
```

### PostgreSQL

```bash
# Status
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# Connect to database
psql postgresql://riskready:your-database-password-here@localhost:5432/riskready
```

---

## 🚀 Development Workflow

### Backend Development

```bash
cd /path/to/riskready-community/apps/server

# Use correct Node version
source ~/.nvm/nvm.sh && nvm use

# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Database operations
npm run prisma:generate     # Generate Prisma client
npm run prisma:seed         # Seed database
npm run db:reset            # Reset and reseed (destructive)
npx prisma studio --schema=prisma/schema  # Database GUI
```

### Frontend Development

```bash
cd /path/to/riskready-community/apps/web

# Use correct Node version
source ~/.nvm/nvm.sh && nvm use

# Development mode
npm run dev

# Production build
npm run build

# E2E tests
npm run test:e2e
npm run test:e2e:ui
```

### Full Stack Restart

```bash
# Restart everything
sudo systemctl restart riskready-server
sudo systemctl restart riskready-web
sudo systemctl reload nginx
```

---

## 📦 Technology Stack

### Backend (`/apps/server`)
- **Framework:** NestJS
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT (cookie-based)
- **Node:** v20.19.6 LTS
- **Build:** SWC
- **Testing:** Jest

### Frontend (`/apps/web`)
- **Framework:** React 18.3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Router:** React Router v6
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Forms:** React Hook Form
- **Node:** v20.19.6 LTS
- **Testing:** Playwright

---

## 📊 Database

### Configuration
- **Type:** PostgreSQL 16
- **Database:** riskready
- **User:** riskready
- **Password:** your-database-password-here
- **Host:** localhost:5432

### Seeded Data
The database has been seeded with comprehensive demo data:
- ✓ 6 test users
- ✓ Organization profile (Acme Corporation)
- ✓ 3 locations, 8 departments
- ✓ 18 risks with 7 scenarios
- ✓ 6 Key Risk Indicators (KRIs)
- ✓ 62 threats (FS-ISAC + DBIR 2025)
- ✓ 223 supply chain assessment questions
- ✓ Complete governance framework (RACI, escalation)
- ✓ BIRT configuration (4 impact categories)
- ✓ 34 incident types, 20 attack vectors
- ✓ 29 regulatory authorities

---

## 🔧 Configuration Files

### Backend
- `.env` - Environment variables
- `.nvmrc` - Node.js version (v20)
- `prisma/schema/` - Database schema (multi-file)
- `WARP.md` - Development guide
- `INSTALLATION.md` - Setup guide
- `deploy.sh` - Deployment script

### Frontend
- `.nvmrc` - Node.js version (v20)
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS config
- `components.json` - shadcn/ui config

### System
- `/etc/nginx/sites-available/riskready-server` - Nginx config
- `/etc/systemd/system/riskready-server.service` - Backend service
- `/etc/systemd/system/riskready-web.service` - Frontend service

---

## 📝 Important Notes

### Port Configuration
The system uses these ports:
- **80** - Nginx (public access)
- **4000** - Backend API (proxied via Nginx)
- **5173** - Frontend Vite dev server (proxied via Nginx)
- **5432** - PostgreSQL database

### CORS Configuration
The backend allows CORS from `http://localhost:5173` by default (set in `.env`).

### Hot Module Replacement (HMR)
Vite's HMR is fully working through the Nginx proxy with WebSocket support.

---

## 🔄 Deployment Script

A deployment script is available for the backend:

```bash
cd /path/to/riskready-community/apps/server
./deploy.sh
```

This will:
1. Load correct Node.js version
2. Install dependencies
3. Generate Prisma client
4. Run migrations
5. Build application
6. Restart service

---

## 🐛 Troubleshooting

### Frontend Won't Load

1. Check frontend service:
   ```bash
   sudo systemctl status riskready-web
   ```

2. Check Vite logs:
   ```bash
   sudo journalctl -u riskready-web -n 50
   ```

3. Try direct access:
   ```bash
   curl http://localhost:5173
   ```

### Backend API Errors

1. Check backend service:
   ```bash
   sudo systemctl status riskready-server
   ```

2. Check backend logs:
   ```bash
   sudo journalctl -u riskready-server -n 50
   ```

3. Verify database connection:
   ```bash
   psql postgresql://riskready:your-database-password-here@localhost:5432/riskready -c "SELECT 1"
   ```

### Nginx Issues

1. Test configuration:
   ```bash
   sudo nginx -t
   ```

2. Check error logs:
   ```bash
   sudo tail -50 /var/log/nginx/riskready-error.log
   ```

3. Verify ports are listening:
   ```bash
   sudo ss -tulpn | grep -E ':(80|4000|5173)'
   ```

### Database Connection Failed

1. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check database exists:
   ```bash
   sudo -u postgres psql -l | grep riskready
   ```

3. Reset database (destructive):
   ```bash
   cd /path/to/riskready-community/apps/server
   source ~/.nvm/nvm.sh && nvm use
   npm run db:reset
   ```

---

## 🔒 Security Recommendations

### For Production Deployment

1. **Change Database Password**
   ```sql
   ALTER USER riskready WITH PASSWORD 'strong-random-password';
   ```
   Update in `.env`: `DATABASE_URL=postgresql://riskready:NEW_PASSWORD@localhost:5432/riskready`

2. **Update JWT Secret**
   ```bash
   openssl rand -base64 64
   ```
   Update in `.env`: `JWT_SECRET=generated-secret`

3. **Configure Firewall**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 4000/tcp
   sudo ufw deny 5173/tcp
   sudo ufw enable
   ```

4. **Enable HTTPS**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Update CORS Origin**
   Update in `.env`: `CORS_ORIGIN=https://yourdomain.com`

6. **Change Default Passwords**
   All seeded users use `<your-password>` - change them in production!

---

## 📚 Documentation

- **Backend:** `/apps/server/WARP.md`, `/apps/server/INSTALLATION.md`
- **API Documentation:** Available through the running API
- **Codebase:** Well-documented with TypeScript types

---

## ✨ Features Available

The RiskReady platform includes these modules:

1. **Risk Management** - Comprehensive GRC workflows
2. **Controls Management** - ISO 27001, SOC 2, NIST frameworks
3. **Incident Management** - NIS2 & DORA compliance
4. **Business Continuity** - BIA, continuity plans, testing
5. **Supply Chain Risk** - Vendor assessments, SLA tracking
6. **ITSM Integration** - Asset & change management
7. **Policy Management** - Document control, approvals
8. **Audit Management** - Internal audits, nonconformities
9. **Evidence Repository** - Compliance evidence tracking
10. **Applications Security** - ISRA assessments
11. **Organization Management** - Structure, committees, governance

---

## 🎉 Next Steps

1. **Open the application:** http://localhost
2. **Login** with `admin@local.test` / `<your-password>`
3. **Explore the platform** - all modules have demo data
4. **Read the docs** - Check `WARP.md` for development guidelines
5. **Start developing** - Both frontend and backend have hot reload

---

**Setup completed:** 2026-01-11
**Node.js:** v20.19.6 LTS
**PostgreSQL:** 16
**All services:** Running ✓
