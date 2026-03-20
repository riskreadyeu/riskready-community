# RiskReady Community Edition -- Deployment Guide

This guide covers deploying RiskReady Community Edition using Docker Compose for both
evaluation and production use.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Environment Variables](#environment-variables)
- [Port Mappings](#port-mappings)
- [Volumes and Data Persistence](#volumes-and-data-persistence)
- [Production Configuration](#production-configuration)
- [AI Features Setup](#ai-features-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement       | Minimum            | Recommended        |
|-------------------|--------------------|--------------------|
| Docker            | >= 24.0            | Latest stable      |
| Docker Compose    | v2                 | Latest stable      |
| RAM               | 2 GB               | 4 GB               |
| Domain name       | localhost (eval)   | Custom domain (production) |

Verify your Docker installation before proceeding:

```bash
docker --version        # Should report 24.x or later
docker compose version  # Should report v2.x
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/riskreadyeu/riskready-community.git
cd riskready-community

# 2. Create your environment file
cp .env.example .env

# 3. Start all services
docker compose up -d
```

Once the services are healthy, open **http://localhost:9380** in your browser and log in
with the default credentials: **`admin@riskready.local`** / **`admin123456`**.

> Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file before deploying to production.

---

## Architecture Overview

RiskReady Community Edition runs six containers orchestrated by Docker Compose:

```
                          +------------------+
                          |   caddy          |
                          |  (reverse proxy) |
                          |  :9380 / :443    |
                          +--------+---------+
                                   |
                      +------------+------------+
                      |                         |
               +------+------+          +-------+------+
               |   server    |          |     web      |
               | (NestJS API)|          | (React/nginx)|
               |   :3000     |          +-------+------+
               +------+------+
                      |
               +------+------+
               |   gateway   |
               | (AI Gateway)|
               |   :3100     |
               +-------------+

        +----------+       +-----------+
        |    db    | ----> |  migrate  |
        | (Pg 16)  |       | (one-shot)|
        +----------+       +-----------+
```

**Startup dependency chain:**

1. **db** (PostgreSQL 16) -- starts first; other services wait for its health check.
2. **migrate** -- one-shot container that pushes the database schema, then exits.
3. **server** (NestJS API, port 3000) -- starts after migrate completes successfully.
4. **gateway** (AI Gateway, port 3100) -- starts after the server is healthy.
5. **web** (React/nginx) -- serves the frontend; no upstream dependencies.
6. **caddy** (reverse proxy, port 9380 by default) -- starts after both server and web are ready.

---

## Environment Variables

The table below documents every variable from `.env.example`. Variables marked
**REQUIRED** must be set before first startup.

| Variable                      | Required | Default                                          | Description                                                |
|-------------------------------|----------|--------------------------------------------------|------------------------------------------------------------|
| `POSTGRES_USER`               | No       | `riskready`                                      | PostgreSQL username.                                       |
| `POSTGRES_PASSWORD`           | **Yes**  | --                                               | PostgreSQL password. Change from any default value.        |
| `POSTGRES_DB`                 | No       | `riskready`                                      | PostgreSQL database name.                                  |
| `JWT_SECRET`                  | **Yes**  | --                                               | Signing key for JWTs. Minimum 32 characters.               |
| `ADMIN_EMAIL`                 | No       | `admin@riskready.local`                          | Email address for the initial admin account.               |
| `ADMIN_PASSWORD`              | No       | `admin123456`                                    | Password for the initial admin account. Change in production. |
| `ACCESS_TOKEN_TTL_SECONDS`    | No       | `900`                                            | Access token lifetime in seconds (15 minutes).             |
| `REFRESH_SESSION_TTL_DAYS`    | No       | `14`                                             | Refresh session lifetime in days.                          |
| `CORS_ORIGIN`                 | No       | `http://localhost:9380`                          | Comma-separated list of allowed CORS origins.              |
| `COOKIE_DOMAIN`               | No       | *(empty)*                                        | Cookie domain. Leave empty for localhost.                  |
| `COOKIE_SECURE`               | No       | `false`                                          | Set to `true` when serving over HTTPS in production.       |
| `HOST_PORT`                   | No       | `9380`                                           | Host port for the web UI.                                  |
| `APP_DOMAIN`                  | No       | `localhost`                                      | The domain Caddy uses for TLS and routing.                 |

**Generating a strong JWT secret:**

```bash
openssl rand -base64 32
```

Copy the output into the `JWT_SECRET` field of your `.env` file.

---

## Port Mappings

| Host Port | Container Port | Service    | Notes                                               |
|-----------|----------------|------------|-----------------------------------------------------|
| 9380      | 80             | caddy      | HTTP entry point (reverse proxy). Configurable via `HOST_PORT`. |

> Internal services (`db`, `server`, `gateway`) are not exposed to the host by default.
> They communicate over the Docker `backend` network.

> **Note:** In production, only ports 80 and 443 should be exposed to the public
> internet. See [Production Configuration](#production-configuration) for details.

---

## Volumes and Data Persistence

| Volume          | Purpose                         | Backup Priority |
|-----------------|---------------------------------|-----------------|
| `postgres_data` | All application data            | **CRITICAL**    |
| `evidence_data` | Uploaded evidence files         | **CRITICAL**    |
| `caddy_data`    | TLS certificates                | Low (auto-regenerated) |
| `caddy_config`  | Caddy runtime cache             | Low (auto-regenerated) |

**Back up `postgres_data` and `evidence_data` regularly.** These volumes contain all
user data, control configurations, assessments, and uploaded evidence. Losing them
means losing your GRC data.

A basic PostgreSQL backup can be taken while the stack is running:

```bash
docker compose exec db pg_dump -U riskready riskready > backup_$(date +%Y%m%d).sql
```

---

## Production Configuration

### Custom Domain with Automatic HTTPS

To deploy RiskReady on a public domain with automatic TLS certificates from
Let's Encrypt:

1. **Set the application domain** in `.env`:

   ```
   APP_DOMAIN=yourdomain.com
   ```

2. **Update Caddy port mappings** in `docker-compose.yml` to bind to standard
   HTTP/HTTPS ports:

   ```yaml
   caddy:
     ports:
       - "80:80"
       - "443:443"
   ```

3. **Remove the internal TLS directive** from `infra/caddy/Caddyfile`:

   Remove or comment out the `tls internal` line so Caddy uses Let's Encrypt
   for certificate provisioning.

4. **Update cookie and CORS settings** in `.env`:

   ```
   COOKIE_DOMAIN=yourdomain.com
   COOKIE_SECURE=true
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Firewall internal service ports** to prevent public access:

   Block inbound traffic on ports `3000`, `3100`, and `5434`. Only ports `80`
   and `443` should be reachable from the internet.

6. **Restart the stack:**

   ```bash
   docker compose down && docker compose up -d
   ```

### Deploying Behind a Load Balancer

If RiskReady sits behind an external load balancer or reverse proxy that
terminates TLS:

- Keep the internal port mappings as-is (no need to bind to 80/443).
- Terminate TLS at the load balancer.
- Set `COOKIE_SECURE=true` in `.env`.
- Configure the load balancer to forward traffic to `http://<host>:9380`.
- Ensure `X-Forwarded-For` and `X-Forwarded-Proto` headers are passed through.

---

## AI Features Setup

RiskReady Community Edition exposes 9 MCP (Model Context Protocol) servers with
254 tools for GRC-specific intelligence. These servers are designed to be used with
**Claude Code** or **Claude Desktop** -- the AI runs on your side, not inside the
application.

See the [AI Assistant Guide](AI_ASSISTANT.md) for instructions on connecting the
MCP servers to your preferred Claude client.

---

## Verification

After running `docker compose up -d`, verify the deployment with these checks:

**1. Confirm all services are running:**

```bash
docker compose ps
```

All services should show a status of `running` or `healthy`. The `migrate`
container will show `exited (0)` -- this is expected, as it is a one-shot job.

**2. Check server health:**

```bash
curl http://localhost:9380/api/health
```

A successful response confirms the NestJS API is operational.

**3. Check gateway health:**

```bash
curl http://localhost:3100/health
```

A successful response confirms the AI gateway is operational.

**4. Open the web interface:**

Navigate to **http://localhost:9380** in your browser. The login page should load.

**5. Log in:**

Log in with **`admin@riskready.local`** / **`admin123456`** (or the custom values you set in `.env`).

---

## Troubleshooting

### Migration fails on startup

- Verify that `POSTGRES_PASSWORD` in `.env` matches across all services.
- Check that the `db` container is healthy: `docker compose ps db`
- Inspect migration logs: `docker compose logs migrate`

### Server fails to start

- Ensure `JWT_SECRET` is set and is at least 32 characters.
- Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are both set.
- Inspect server logs: `docker compose logs server`

### Gateway health check fails

- The gateway depends on the server. Confirm the server is healthy first:
  `docker compose ps server`
- Inspect gateway logs: `docker compose logs gateway`

### Web interface does not load

- Confirm Caddy is running: `docker compose ps caddy`
- Check that port 9380 is not in use by another process (or change `HOST_PORT` in `.env`).
- Inspect Caddy logs: `docker compose logs caddy`

### General debugging

View real-time logs for any service:

```bash
docker compose logs -f <service>
```

Where `<service>` is one of: `db`, `migrate`, `server`, `gateway`, `web`, `caddy`.

View logs for the entire stack:

```bash
docker compose logs -f
```

---

## Stopping and Restarting

**Stop all services** (data is preserved in volumes):

```bash
docker compose down
```

**Stop and remove all data** (destructive -- removes volumes):

```bash
docker compose down -v
```

**Restart a single service:**

```bash
docker compose restart <service>
```

**Pull updated images and redeploy:**

```bash
git pull
docker compose pull
docker compose up -d
```
