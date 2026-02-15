# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-02-15

### Added

- Risk Management: risk register, risk scenarios, key risk indicators, tolerance statements, treatment plans
- Controls Framework: control library, four-layer assurance model, Statement of Applicability, gap analysis
- Policy Management: document lifecycle, version control, change requests, reviews, exceptions
- Incident Management: incident tracking, classification, response workflows
- Audit Management: internal audit planning, nonconformity tracking, corrective actions
- Evidence Management: evidence collection with S3-compatible storage
- ITSM / Asset Management: IT asset register, configuration items, business process mapping
- Organisation Management: organisational structure, departments, locations, key personnel, compliance surveys
- Docker Compose deployment with Caddy reverse proxy
- PostgreSQL 16 with Prisma ORM
- Redis for caching and background jobs
- MinIO for S3-compatible object storage
- JWT-based authentication with refresh sessions
- Rate limiting with @nestjs/throttler
- Audit logging for all significant actions
