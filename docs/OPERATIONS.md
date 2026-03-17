# RiskReady Operations Guide

## 🚀 Quick Commands

### Restart Services

```bash
# Restart Frontend
sudo systemctl restart riskready-web

# Restart Backend
sudo systemctl restart riskready-server

# Restart Both
sudo systemctl restart riskready-server riskready-web

# Restart Everything (including nginx)
sudo systemctl restart riskready-server riskready-web nginx
```

### Check Status

```bash
# Check All Services
sudo systemctl status riskready-server riskready-web nginx postgresql

# Check Backend Only
sudo systemctl status riskready-server

# Check Frontend Only
sudo systemctl status riskready-web
```

### View Logs

```bash
# Backend Logs (real-time)
sudo journalctl -u riskready-server -f

# Frontend Logs (real-time)
sudo journalctl -u riskready-web -f

# Both Logs (real-time)
sudo journalctl -u riskready-server -u riskready-web -f

# Last 50 Lines
sudo journalctl -u riskready-server -n 50
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Your Mac)                    │
│              http://your-server-ip                       │
└───────────────────────┬─────────────────────────────────┘
                        │ Tailscale VPN
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Ubuntu Server (192.168.1.50)                │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Nginx (Port 80) - Reverse Proxy         │   │
│  │  Routes: / → Frontend, /api → Backend           │   │
│  └────────┬──────────────────────────┬─────────────┘   │
│           │                          │                   │
│           ▼                          ▼                   │
│  ┌─────────────────┐      ┌──────────────────────┐     │
│  │   Frontend      │      │      Backend         │     │
│  │   Port 5173     │      │   Port 4000          │     │
│  │   React+Vite    │◄────►│   NestJS API         │     │
│  └─────────────────┘      └──────────┬───────────┘     │
│                                       │                  │
│                                       ▼                  │
│                            ┌──────────────────┐         │
│                            │  PostgreSQL 16    │         │
│                            │  Port 5432        │         │
│                            └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. Frontend (riskready-web)
- **Location:** `/path/to/riskready-community/apps/web`
- **Port:** 5173
- **Type:** React 18 + Vite dev server
- **Service:** `riskready-web.service`
- **Access:** http://your-server-ip (via nginx)

### 2. Backend (riskready-server)
- **Location:** `/path/to/riskready-community/apps/server`
- **Port:** 4000
- **Type:** NestJS API
- **Service:** `riskready-server.service`
- **Access:** http://your-server-ip/api (via nginx)

### 3. Nginx (nginx)
- **Port:** 80
- **Config:** `/etc/nginx/sites-available/riskready-server`
- **Service:** `nginx.service`

### 4. PostgreSQL (postgresql)
- **Port:** 5432
- **Database:** riskready
- **User:** riskready
- **Service:** `postgresql.service`

---

## 🔄 Common Operations

### After Code Changes

```bash
# Backend changes
cd /path/to/riskready-community/apps/server
source ~/.nvm/nvm.sh && nvm use
npm run build                    # Build TypeScript
sudo systemctl restart riskready-server

# Frontend changes (auto-reloads, but if needed)
sudo systemctl restart riskready-web

# Database schema changes
cd /path/to/riskready-community/apps/server
npx prisma generate --schema=prisma/schema
npx prisma migrate deploy --schema=prisma/schema
sudo systemctl restart riskready-server
```

### Start/Stop Services

```bash
# Stop Backend
sudo systemctl stop riskready-server

# Start Backend
sudo systemctl start riskready-server

# Stop Frontend
sudo systemctl stop riskready-web

# Start Frontend
sudo systemctl start riskready-web

# Stop All
sudo systemctl stop riskready-server riskready-web nginx

# Start All
sudo systemctl start riskready-server riskready-web nginx
```

### Enable/Disable Auto-Start

```bash
# Disable auto-start on boot
sudo systemctl disable riskready-server
sudo systemctl disable riskready-web

# Enable auto-start on boot
sudo systemctl enable riskready-server
sudo systemctl enable riskready-web
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check logs for errors
sudo journalctl -u riskready-server -n 50

# Common issues:
# 1. Port 4000 already in use
sudo lsof -i :4000

# 2. Database connection failed
sudo systemctl status postgresql
psql postgresql://riskready:your-database-password-here@localhost:5432/riskready -c "SELECT 1"

# 3. Environment variables missing
cat /path/to/riskready-community/apps/server/.env

# 4. Node modules missing
cd /path/to/riskready-community/apps/server
npm install
```

### Frontend Won't Start

```bash
# Check logs
sudo journalctl -u riskready-web -n 50

# Common issues:
# 1. Port 5173 already in use
sudo lsof -i :5173

# 2. Node modules missing
cd /path/to/riskready-community/apps/web
npm install

# 3. Vite config issues
cd /path/to/riskready-community/apps/web
source ~/.nvm/nvm.sh && nvm use
npm run dev  # Test manually
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -50 /var/log/nginx/riskready-error.log

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx
```

### CORS Errors from Mac
```bash
# Update CORS origins in backend
nano /path/to/riskready-community/apps/server/.env

# Should include:
# CORS_ORIGIN=http://localhost:5173,http://your-server-ip,http://your-server-ip:5173

# Restart backend
sudo systemctl restart riskready-server
```

### Remote Access & 401 Errors (Tailscale/VPN)

If you get `401 Unauthorized` errors when accessing via IP (e.g. `http://your-server-ip`), it's likely because the server is trying to set Secure cookies over HTTP.

```bash
# Edit server .env
nano /path/to/riskready-community/apps/server/.env

# Add or update:
COOKIE_SECURE=false

# Restart backend
sudo systemctl restart riskready-server
```

### Database Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
psql postgresql://riskready:your-database-password-here@localhost:5432/riskready

# Reset database (DESTRUCTIVE)
cd /path/to/riskready-community/apps/server
npm run db:reset

# View database GUI
cd /path/to/riskready-community/apps/server
npx prisma studio --schema=prisma/schema
# Opens at http://localhost:5555
```

---

## 📝 Configuration Files

### Backend Environment
**File:** `/path/to/riskready-community/apps/server/.env`
```env
JWT_SECRET=development-secret-key-for-local-testing-min-32-chars
DATABASE_URL=postgresql://riskready:your-database-password-here@localhost:5432/riskready
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://your-server-ip,http://your-server-ip:5173
ACCESS_TOKEN_TTL_SECONDS=900
```

### Systemd Services
- **Backend:** `/etc/systemd/system/riskready-server.service`
- **Frontend:** `/etc/systemd/system/riskready-web.service`

### Nginx Config
**File:** `/etc/nginx/sites-available/riskready-server`

---

## 🔍 Monitoring

### Check Service Status

```bash
# Quick status check
systemctl is-active riskready-server riskready-web nginx postgresql

# Detailed status
sudo systemctl status riskready-server --no-pager

# Check if services are enabled
systemctl is-enabled riskready-server riskready-web
```

### View Resource Usage

```bash
# Memory and CPU usage
sudo systemctl status riskready-server riskready-web | grep -E "(Memory|CPU)"

# Detailed process info
ps aux | grep -E "(node|nginx|postgres)"
```

### Test Endpoints

```bash
# Test backend health
curl http://localhost:4000/api/health

# Test frontend
curl http://localhost:5173

# Test via nginx
curl http://localhost/api/health
```

---

## 🌐 Access URLs

### From Your Mac (via Tailscale)

| Service | URL |
|---------|-----|
| **Frontend (via nginx)** | http://your-server-ip |
| **Backend API (via nginx)** | http://your-server-ip/api |
| **Frontend (direct)** | http://your-server-ip:5173 |
| **Backend (direct)** | http://your-server-ip:4000/api |

### From Ubuntu Server (localhost)

| Service | URL |
|---------|-----|
| **Frontend (via nginx)** | http://localhost |
| **Backend API (via nginx)** | http://localhost/api |
| **Frontend (direct)** | http://localhost:5173 |
| **Backend (direct)** | http://localhost:4000/api |
| **Prisma Studio** | http://localhost:5555 |

---

## 💻 Development

### Run Locally (Without systemd)

**Backend:**
```bash
cd /path/to/riskready-community/apps/server
source ~/.nvm/nvm.sh && nvm use
npm run dev  # Hot reload enabled
```

**Frontend:**
```bash
cd /path/to/riskready-community/apps/web
source ~/.nvm/nvm.sh && nvm use
npm run dev  # Hot reload enabled
```

### Build for Production

**Backend:**
```bash
cd /path/to/riskready-community/apps/server
npm run build
# Output: dist/
```

**Frontend:**
```bash
cd /path/to/riskready-community/apps/web
npm run build
# Output: dist/
```

### Database Operations

```bash
cd /path/to/riskready-community/apps/server

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Reset database (DESTRUCTIVE)
npm run db:reset

# Database GUI
npx prisma studio --schema=prisma/schema
```

---

## 📊 Health Check Script

Create a quick health check script:

```bash
#!/bin/bash
# Save as: ~/check-riskready.sh

echo "🔍 RiskReady Health Check"
echo "=========================="
echo ""

echo "📦 Services Status:"
systemctl is-active riskready-server && echo "✓ Backend running" || echo "✗ Backend stopped"
systemctl is-active riskready-web && echo "✓ Frontend running" || echo "✗ Frontend stopped"
systemctl is-active nginx && echo "✓ Nginx running" || echo "✗ Nginx stopped"
systemctl is-active postgresql && echo "✓ PostgreSQL running" || echo "✗ PostgreSQL stopped"
echo ""

echo "🌐 Endpoints:"
curl -s http://localhost:4000/api/health > /dev/null && echo "✓ Backend API responding" || echo "✗ Backend API not responding"
curl -s http://localhost:5173 > /dev/null && echo "✓ Frontend responding" || echo "✗ Frontend not responding"
curl -s http://localhost/api/health > /dev/null && echo "✓ Nginx proxy working" || echo "✗ Nginx proxy not working"
echo ""

echo "🔌 Ports:"
sudo lsof -i :4000 > /dev/null && echo "✓ Port 4000 (Backend) in use" || echo "✗ Port 4000 not in use"
sudo lsof -i :5173 > /dev/null && echo "✓ Port 5173 (Frontend) in use" || echo "✗ Port 5173 not in use"
sudo lsof -i :80 > /dev/null && echo "✓ Port 80 (Nginx) in use" || echo "✗ Port 80 not in use"
sudo lsof -i :5432 > /dev/null && echo "✓ Port 5432 (PostgreSQL) in use" || echo "✗ Port 5432 not in use"
```

**Usage:**
```bash
chmod +x ~/check-riskready.sh
~/check-riskready.sh
```

---

## 🆘 Emergency Commands

```bash
# Complete restart of everything
sudo systemctl restart riskready-server riskready-web nginx postgresql

# Stop everything
sudo systemctl stop riskready-server riskready-web nginx

# View all errors in logs
sudo journalctl -u riskready-server -u riskready-web -p err -n 100

# Check what's using ports
sudo lsof -i :80,4000,5173,5432

# Force reload nginx config
sudo nginx -s reload

# Restart just the services (not postgres or nginx)
sudo systemctl restart riskready-server riskready-web
```

---

## 📞 Quick Reference

| Need | Command |
|------|---------|
| Restart backend | `sudo systemctl restart riskready-server` |
| Restart frontend | `sudo systemctl restart riskready-web` |
| View backend logs | `sudo journalctl -u riskready-server -f` |
| View frontend logs | `sudo journalctl -u riskready-web -f` |
| Test backend | `curl http://localhost:4000/api/health` |
| Check all services | `sudo systemctl status riskready-server riskready-web nginx` |
| Reload nginx | `sudo systemctl reload nginx` |

---

**Last Updated:** 2026-01-11  
**Node Version:** v20.19.6 LTS  
**PostgreSQL:** 16  
**Tailscale IP:** your-server-ip
