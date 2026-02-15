# RiskReady Community Edition -- Administration Guide

This guide is for system administrators responsible for operating, maintaining, and
securing a RiskReady Community Edition deployment. It assumes the application has
already been deployed using the instructions in the [Deployment Guide](DEPLOYMENT.md).

---

## Table of Contents

- [Backup and Recovery](#backup-and-recovery)
- [Monitoring](#monitoring)
- [Updating](#updating)
- [User Management](#user-management)
- [Security Hardening](#security-hardening)
- [Database Management](#database-management)
- [Logs and Debugging](#logs-and-debugging)
- [Performance Tuning](#performance-tuning)

---

## Backup and Recovery

### Database Backup

The PostgreSQL database stored in the `postgres_data` Docker volume contains ALL
application data: controls, assessments, risk registers, policies, incidents, audit
records, and user accounts. Back it up regularly.

**Manual backup:**

```bash
# Create a SQL dump
docker compose exec db pg_dump -U riskready riskready > backup_$(date +%Y%m%d).sql

# Restore from a backup
docker compose exec -T db psql -U riskready riskready < backup_20260222.sql
```

**Scheduled daily backups with cron:**

```bash
0 2 * * * cd /path/to/riskready-community && docker compose exec -T db pg_dump -U riskready riskready | gzip > /backups/riskready_$(date +\%Y\%m\%d).sql.gz
```

Adjust the path, schedule, and retention policy to match your organisation's
requirements. Consider keeping at least 7 daily backups and 4 weekly backups.

### Evidence Files Backup

The `evidence_data` Docker volume (mounted at `/app/data` inside the server container)
stores uploaded evidence files. Back up this volume alongside the database.

```bash
# Copy evidence files out of the container
docker compose cp server:/app/data ./evidence_backup_$(date +%Y%m%d)
```

Alternatively, if you have direct access to Docker volumes on the host, back up
the volume directory directly.

### Full Disaster Recovery

To restore from a complete loss:

1. Deploy a fresh stack (do not start the application yet):
   ```bash
   docker compose up -d db
   ```
2. Wait for the database to become healthy, then restore the SQL backup:
   ```bash
   docker compose exec -T db psql -U riskready riskready < backup_20260222.sql
   ```
3. Restore the evidence volume:
   ```bash
   docker compose cp ./evidence_backup_20260222/. server:/app/data
   ```
4. Start the remaining services:
   ```bash
   docker compose up -d
   ```

Always test your recovery procedure periodically. A backup that has never been
restored is not a backup.

---

## Monitoring

### Health Checks

Each core service has a built-in Docker health check:

| Service    | Endpoint                          | Interval | Notes                                     |
|------------|-----------------------------------|----------|--------------------------------------------|
| **db**     | `pg_isready -U riskready`        | 5s       | PostgreSQL readiness check.               |
| **server** | `GET /api/health`                 | 10s      | Returns `{ ok: true }` when healthy.      |
| **gateway**| `GET /health` on port 3100        | 30s      | Confirms AI gateway is operational.       |

### Checking Service Status

```bash
# View all services with their current health status
docker compose ps

# Follow server logs in real time
docker compose logs -f server

# Follow gateway logs in real time
docker compose logs -f gateway

# View the last 100 lines of server logs
docker compose logs --tail 100 server

# View logs for all services simultaneously
docker compose logs -f
```

### Key Metrics to Monitor

**Database disk usage:**

```bash
docker compose exec db psql -U riskready -c "SELECT pg_size_pretty(pg_database_size('riskready'));"
```

**Container resource usage (CPU, memory, network):**

```bash
docker stats
```

**Evidence storage volume size:**

```bash
docker compose exec server du -sh /app/data
```

For production deployments, consider integrating these checks into your existing
monitoring stack (Prometheus, Datadog, Nagios, etc.) by polling the health
endpoints and collecting Docker metrics.

---

## Updating

### Pulling Updates

```bash
# 1. Back up the database before updating
docker compose exec -T db pg_dump -U riskready riskready | gzip > /backups/pre_update_$(date +%Y%m%d).sql.gz

# 2. Pull the latest code
git pull origin main

# 3. Rebuild container images
docker compose build

# 4. Restart with updated images
docker compose up -d
```

The `migrate` service automatically runs `prisma db push` on startup, applying any
schema changes to the database. No manual migration step is required.

### Rolling Back

If an update causes issues, revert to the previous version:

```bash
git checkout <previous-commit>
docker compose build
docker compose up -d
```

**Always back up the database before updating.** Schema changes applied by
`prisma db push` may not be reversible without a database restore.

---

## User Management

### Initial Admin Account

The first administrator account is created automatically on first startup using the
`ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`. This seed operation runs only
once, when the `users` table is empty.

### Managing Users

Users are currently managed through the API:

```bash
# List all users
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/users
```

Additional users can be created through the seed scripts or direct database access.

### Password Reset

There is no self-service password reset in Community Edition. To reset a password,
update it directly in the database. The password must be bcrypt-hashed:

```bash
# Generate a bcrypt hash (requires the htpasswd utility or similar)
docker compose exec server node -e "const bcrypt = require('bcrypt'); bcrypt.hash('newpassword', 10).then(h => console.log(h));"

# Update the password in PostgreSQL
docker compose exec db psql -U riskready riskready -c \
  "UPDATE \"User\" SET \"passwordHash\" = '<bcrypt-hash>' WHERE email = 'user@example.com';"
```

---

## Security Hardening

### Production Checklist

Before exposing RiskReady to users, verify each of the following:

- [ ] Set a strong `POSTGRES_PASSWORD` (not the default `change-me`)
- [ ] Generate a random `JWT_SECRET` of at least 32 characters:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set `COOKIE_SECURE=true` (requires HTTPS)
- [ ] Set `COOKIE_DOMAIN` to your production domain
- [ ] Firewall ports `3000`, `3100`, and `5433` from public access -- only expose ports `80` and `443` via Caddy
- [ ] Use a real domain with Caddy automatic HTTPS (remove `tls internal` from the Caddyfile)
- [ ] Set `CORS_ORIGIN` to your production domain only (e.g. `https://yourdomain.com`)
- [ ] Optionally set a dedicated `ENCRYPTION_KEY` for stored credential encryption (defaults to `JWT_SECRET` if not set)
- [ ] Review and change default seed passwords if seed scripts were run

### Network Security

In production, **only Caddy (ports 80/443) should be exposed to the internet.** All
other services communicate over the Docker internal network and should be firewalled
from external access.

The recommended architecture:

```
Internet --> Caddy (:80/:443) --> server (:3000) / web (:80)
                                  |
                                  gateway (:3100) --> db (:5432)
```

Ports `3000`, `3100`, and `5433` are exposed on the host for local development
convenience. In production, either remove those port mappings from
`docker-compose.yml` or block them with firewall rules.

### Credential Encryption

The Anthropic API key stored in the database is encrypted with AES-256-GCM. The
encryption key is derived from `ENCRYPTION_KEY` (or `JWT_SECRET` as fallback) using
the scrypt key derivation function.

For maximum security, set `ENCRYPTION_KEY` to a separate value from `JWT_SECRET`:

```bash
# Generate a dedicated encryption key
openssl rand -base64 32
```

Add it to `.env`:

```
ENCRYPTION_KEY=<generated-value>
```

**Important:** Changing `ENCRYPTION_KEY` (or `JWT_SECRET` if no dedicated key is set)
after credentials have been stored will make existing encrypted credentials
unreadable. Re-enter the API key through the web interface after changing
the encryption key.

### Session Configuration

| Variable                   | Default | Description                              |
|----------------------------|---------|------------------------------------------|
| `ACCESS_TOKEN_TTL_SECONDS` | `900`   | Access token lifetime (15 minutes).      |
| `REFRESH_SESSION_TTL_DAYS` | `14`    | Refresh session lifetime (14 days).      |

Reduce these values for higher-security environments.

---

## Database Management

### Prisma Schema Push

The `migrate` service runs `npx prisma db push` automatically on every startup. For
manual schema operations:

```bash
docker compose run --rm migrate sh -c "npx prisma db push"
```

### Seeding Demo Data

For evaluation and testing environments only:

```bash
# From the apps/server directory
npm run prisma:seed          # Basic seed data
npm run seed:nexusguard      # Full demo company (NexusGuard Technologies)
```

Do not run seed scripts in production, as they create accounts with known passwords.

### Direct Database Access

```bash
# Interactive psql shell
docker compose exec db psql -U riskready riskready

# Useful queries
# Check table sizes
docker compose exec db psql -U riskready riskready -c "
  SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size
  FROM pg_catalog.pg_statio_user_tables
  ORDER BY pg_total_relation_size(relid) DESC
  LIMIT 10;
"

# Count records in key tables
docker compose exec db psql -U riskready riskready -c "
  SELECT 'Users' AS entity, count(*) FROM \"User\"
  UNION ALL SELECT 'Controls', count(*) FROM \"ControlRecord\"
  UNION ALL SELECT 'Assessments', count(*) FROM \"Assessment\"
  UNION ALL SELECT 'Risks', count(*) FROM \"Risk\";
"
```

**Prisma Studio** (development only -- run from `apps/server`):

```bash
npx prisma studio --schema=prisma/schema
```

---

## Logs and Debugging

### Log Locations

All services log to stdout/stderr, accessible through `docker compose logs`. There
are no log files to rotate inside the containers.

Configure Docker's logging driver if you need log persistence, rotation, or
forwarding to a centralized logging system.

### Common Issues

| Symptom                        | Likely Cause                      | Resolution                                                      |
|--------------------------------|------------------------------------|-----------------------------------------------------------------|
| `migrate` exits with error     | Database not ready                | Check db health: `docker compose ps db`                         |
| Server won't start             | Missing `JWT_SECRET`              | Set `JWT_SECRET` in `.env` (minimum 32 characters)              |
| Server won't start             | Missing `ADMIN_EMAIL`/`PASSWORD`  | Set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`           |
| Gateway unhealthy              | Server not healthy yet            | Wait for server health check to pass; check `docker compose ps` |
| `ECONNREFUSED` in gateway logs | Database connection failure       | Verify `DATABASE_URL` and that the `db` service is running      |
| Web UI shows blank page        | Caddy cannot reach web service    | Check that the `web` container is running                       |
| 502 Bad Gateway                | Backend service is down           | Check server logs: `docker compose logs server`                 |
| Encrypted credentials fail     | `ENCRYPTION_KEY` was changed      | Re-enter the API key via Settings after key rotation            |

### Debugging Steps

1. Check overall status: `docker compose ps`
2. Look for unhealthy services and inspect their logs.
3. Verify environment variables are set correctly in `.env`.
4. Test database connectivity: `docker compose exec db pg_isready -U riskready`
5. Test API health: `curl http://localhost:3000/api/health`
6. Test gateway health: `curl http://localhost:3100/health`

### Resetting Everything

To destroy all data and start fresh:

```bash
docker compose down -v   # WARNING: permanently deletes ALL data including the database
docker compose up -d     # Fresh start with empty database
```

This removes all Docker volumes, including `postgres_data` and `evidence_data`.
This action is irreversible.

---

## Performance Tuning

### PostgreSQL

For larger deployments, tune PostgreSQL by passing configuration flags in
`docker-compose.yml`:

```yaml
db:
  command: >-
    postgres
    -c shared_buffers=256MB
    -c effective_cache_size=768MB
    -c max_connections=100
    -c work_mem=4MB
    -c maintenance_work_mem=64MB
```

As a general guideline, set `shared_buffers` to approximately 25% of available
RAM and `effective_cache_size` to approximately 75%.

### AI Gateway

The gateway has several tuning parameters, set via environment variables:

| Variable           | Default   | Description                                           |
|--------------------|-----------|-------------------------------------------------------|
| `QUEUE_MAX_DEPTH`  | `5`       | Maximum queued AI jobs per user.                      |
| `QUEUE_TIMEOUT_MS` | `300000`  | AI job timeout in milliseconds (5 minutes).           |
| `SKILL_IDLE_MS`    | `600000`  | MCP server idle timeout in milliseconds (10 minutes). |
| `LOG_LEVEL`        | `info`    | Gateway log verbosity (`debug`, `info`, `warn`, `error`). |

To modify these, add them to the `gateway` environment section in
`docker-compose.yml` or set them in `.env`.

### Token Lifetimes

Adjust authentication token lifetimes based on your security requirements:

| Variable                   | Default | Description                          |
|----------------------------|---------|--------------------------------------|
| `ACCESS_TOKEN_TTL_SECONDS` | `900`   | Short-lived access token (15 min).   |
| `REFRESH_SESSION_TTL_DAYS` | `14`    | Refresh session lifetime (14 days).  |

Shorter access token lifetimes improve security but increase token refresh
frequency. Shorter refresh session lifetimes force users to re-authenticate
more often.

---

## Service Architecture Reference

For quick reference, the following services make up a RiskReady deployment:

| Service     | Image / Build Context | Port  | Purpose                                    |
|-------------|----------------------|-------|--------------------------------------------|
| `db`        | `postgres:16-alpine` | 5432  | PostgreSQL database.                       |
| `migrate`   | `./apps/server`      | --    | One-shot schema migration (exits on completion). |
| `server`    | `./apps/server`      | 3000  | NestJS API server.                         |
| `gateway`   | `./gateway`          | 3100  | AI gateway with 8 MCP servers.             |
| `web`       | `./apps/web`         | 80    | React frontend (served by nginx).          |
| `caddy`     | `caddy:2-alpine`     | 80/443| Reverse proxy with automatic HTTPS.        |

| Volume          | Contents                   | Backup Priority |
|-----------------|----------------------------|-----------------|
| `postgres_data` | All application data       | **Critical**    |
| `evidence_data` | Uploaded evidence files    | **Critical**    |
| `caddy_data`    | TLS certificates           | Low             |
| `caddy_config`  | Caddy runtime configuration| Low             |
