# Evidence MCP Server

Centralized evidence repository with cross-entity linking, request workflows, chain of custody tracking, and approval-based mutations for compliance and audit readiness.

## Key Numbers

| Metric | Count |
|--------|-------|
| Query Tools | 17 |
| Mutation Tools | 5 |
| Resources | 4 |
| Prompts | 3 |

## Core Design Principle

The Evidence module follows a **read-mostly, write-safe** pattern. All query operations provide real-time access to evidence records, cross-entity links, requests, and analytics. Mutation operations (create evidence, create request, link evidence, update status) generate **proposal records** that enter an approval queue for human review before execution. This ensures evidence integrity, maintains chain of custody, and prevents unauthorized data modification while enabling AI agents to suggest evidence management actions.

The module supports comprehensive evidence lifecycle management from collection through approval, linking to controls/risks/policies, versioning, expiration tracking, renewal workflows, and archival. Evidence maintains cryptographic hashes for integrity verification and chain of custody documentation for forensic soundness.

## Documentation Links

| Document | Description |
|----------|-------------|
| [Tool Reference](./tool-reference.md) | Complete reference for all 22 tools (17 query + 5 mutation) |
| [Resources & Prompts](./resources-prompts.md) | Static resources and AI prompt templates |

## Quick Start

```bash
cd apps/mcp-server-evidence
npm install
DATABASE_URL=postgresql://user:password@localhost:5432/riskready npm start
```

The server connects via stdio transport and registers with MCP clients automatically.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Model Context Protocol (MCP) SDK
- **Database**: PostgreSQL via Prisma ORM
- **Language**: TypeScript (compiled to JavaScript)
- **Transport**: stdio (standard input/output)

## Architecture

The server is organized into five tool domains:

1. **Evidence Repository Tools**: Core evidence CRUD and search operations
2. **Evidence Request Tools**: Evidence collection request workflows
3. **Cross-Entity Link Tools**: Junction table queries linking evidence to controls, risks, policies, incidents, assets, and more
4. **Analysis Tools**: Dashboard metrics, statistics, gap analysis, and coverage reporting
5. **Mutation Proposal Tools**: Safe mutation operations via approval queue

All tools use Prisma for database access with optimized select projections and relationship loading. Pagination is supported with configurable limits (default 50, max 100).

## Integration Points

The Evidence server integrates with:

- **Controls Module**: Evidence supports control implementation and testing
- **Risks Module**: Evidence documents risk assessments and treatments
- **Policies Module**: Evidence demonstrates policy compliance
- **Incidents Module**: Evidence collected during incident response
- **Assets Module**: Evidence links to specific information assets
- **Audits Module**: Evidence fulfills audit requirements and nonconformity remediation
- **BCM Module**: Evidence documents business continuity testing
- **Supply Chain Module**: Evidence for vendor assessments and contracts

## Evidence Types Supported

The module supports diverse evidence types organized by category:

**Documents**: DOCUMENT, CERTIFICATE, REPORT, POLICY, PROCEDURE

**Technical**: SCREENSHOT, LOG, CONFIGURATION

**Forensic**: NETWORK_CAPTURE, MEMORY_DUMP, DISK_IMAGE, MALWARE_SAMPLE

**Communication**: EMAIL, MEETING_NOTES

**Assessment**: APPROVAL_RECORD, AUDIT_REPORT, ASSESSMENT_RESULT, TEST_RESULT, SCAN_RESULT

**Media**: VIDEO, AUDIO

Each evidence type has specific handling requirements, retention policies, and collection methods documented in the `evidence-types` resource.

## Evidence Lifecycle

Evidence flows through six lifecycle states:

1. **PENDING**: Initial submission, awaiting review assignment
2. **UNDER_REVIEW**: Assigned to reviewer, validation in progress
3. **APPROVED**: Reviewed and approved, available for compliance use
4. **REJECTED**: Review failed, rejection reason documented
5. **EXPIRED**: Validity period ended, renewal required
6. **ARCHIVED**: Retained for records but no longer active

The `evidence-lifecycle` resource provides complete lifecycle documentation including transition criteria, typical durations, and automation opportunities.

## Chain of Custody

Evidence marked with `isForensicallySound = true` maintains strict chain of custody:

- **Collection Phase**: Collector ID, timestamp, source system, cryptographic hash (SHA-256)
- **Storage Phase**: Encrypted at rest, secure storage path, access controls
- **Access Phase**: All access logged via AuditLog (views, downloads, modifications)
- **Review Phase**: Reviewer ID, approval/rejection, decision timestamp
- **Transfer Phase**: Version linking, integrity verification, transfer documentation

The `chain-of-custody` resource provides forensic evidence handling procedures and hash verification workflows.

## Evidence Coverage Analysis

The server provides tools to analyze evidence coverage across controls:

- **get_evidence_coverage**: Identifies controls with and without supporting evidence
- **get_evidence_stats**: Overall evidence inventory metrics
- **get_evidence_dashboard**: Comprehensive dashboard with fulfillment rates
- **evidence-gap-analysis** (prompt): AI-guided gap analysis and remediation planning

Coverage analysis helps identify compliance gaps, prioritize evidence collection, and prepare for audits.

## Request Workflows

Evidence requests formalize evidence collection requirements:

- **list_evidence_requests**: Browse requests by status, priority, assignee
- **get_evidence_request**: Detailed request with fulfillment tracking
- **get_overdue_requests**: Identify delayed evidence collection
- **get_request_stats**: Request completion metrics and fulfillment rates
- **propose_evidence_request** (mutation): Create request via approval queue

Requests link to controls, risks, audits, or other contexts requiring evidence. Request fulfillments track submitted evidence and acceptance status.

## Version Management

Evidence supports version chains for renewals and updates:

- **previousVersionId**: Links to superseded version
- **newerVersions**: Forward links to updated versions
- **version**: Version identifier (e.g., "1.0", "2.0")
- **get_evidence_versions**: Retrieve complete version history

When evidence expires and is renewed, the new version links to the old via `previousVersionId`, maintaining the complete evidence chain for audit trails.

## Mutation Safety

All mutation operations create `McpPendingAction` records rather than directly modifying data:

- **propose_evidence**: Create new evidence record (pending approval)
- **propose_evidence_request**: Create evidence collection request (pending approval)
- **propose_evidence_status_update**: Update evidence status (pending approval)
- **propose_link_evidence_control**: Link evidence to control (pending approval)
- **propose_link_evidence_risk**: Link evidence to risk (pending approval)

Each proposal includes:
- **actionType**: Type of mutation (e.g., CREATE_EVIDENCE, LINK_EVIDENCE_CONTROL)
- **summary**: Human-readable description
- **reason**: AI explanation of WHY the action is needed
- **payload**: Complete mutation parameters
- **mcpSessionId**: Session tracking for audit correlation

Human reviewers approve or reject proposals via the RiskReady web UI. Approved actions are executed by backend services with full audit logging.

## Search and Discovery

Evidence discovery is supported through multiple access patterns:

- **list_evidence**: Filter by type, status, classification, category, source type
- **search_evidence**: Full-text search across title, description, reference, filename
- **get_expiring_evidence**: Proactive expiration management
- **get_evidence_links**: Discover all entities linked to specific evidence
- **get_control_evidence**: Find all evidence supporting a specific control
- **get_risk_evidence**: Find all evidence related to a specific risk
- **get_policy_evidence**: Find all evidence demonstrating policy compliance

All query tools support pagination and return structured JSON with metadata, relationships, and link counts.

## AI Prompt Templates

Three pre-built prompts guide AI agents through complex evidence workflows:

1. **evidence-gap-analysis**: Comprehensive gap analysis across controls with prioritized remediation recommendations
2. **evidence-review**: Detailed evidence record review for completeness, validity, and relevance
3. **audit-preparation**: Complete audit readiness assessment with action plan and risk analysis

These prompts provide step-by-step instructions, tool invocation sequences, and structured output formats for consistent AI-generated analysis.

## Related Documentation

- [Tool Reference](./tool-reference.md): Detailed parameter and return documentation for all tools
- [Resources & Prompts](./resources-prompts.md): Static resources and prompt template specifications
