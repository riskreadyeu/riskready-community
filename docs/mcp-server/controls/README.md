# Controls MCP Server

Enterprise-grade control management server exposing the RiskReady Controls module via Model Context Protocol. Provides comprehensive tools for managing control libraries, four-layer assurance framework, assessments, testing, metrics, Statement of Applicability (SOA), cross-framework references, gap analysis, and protection scoring.

## Key Numbers

| Category | Count |
|----------|-------|
| Query Tools | 31 |
| Mutation Tools | 7 |
| Resources | 4 |
| Prompts | 4 |
| **Total Tools** | **38** |

## Core Design Principle

The Controls MCP server follows a **read-mostly architecture with safe mutation proposals**. All query tools provide immediate access to control data, test results, assessments, and analytics. Mutation tools (creating assessments, recording test results, proposing remediations) generate proposals that are queued for human approval via `McpPendingAction` records. This design ensures LLM agents can safely explore and analyze control posture while requiring human oversight for any data modifications.

The approval queue pattern enables:
- Confident LLM analysis without risk of unintended data changes
- Human-in-the-loop verification for all critical control operations
- Full audit trail of AI-proposed actions with acceptance/rejection tracking
- Safe delegation of control assessment workflows to AI agents

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — server overview and quick start |
| [tool-reference.md](./tool-reference.md) | Complete reference for all 38 tools |
| [resources-prompts.md](./resources-prompts.md) | Resources and prompt templates |

## Quick Start

```bash
# Navigate to the server directory
cd apps/mcp-server-controls

# Install dependencies
npm install

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/riskready"

# Start the server (stdio transport)
npm start
```

The server will connect via stdio transport and is ready to receive MCP requests from Claude Desktop, Cursor, or other MCP clients.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js + tsx |
| Protocol SDK | @modelcontextprotocol/sdk |
| Transport | stdio (StdioServerTransport) |
| Database | Prisma Client |
| Validation | Zod |
| Language | TypeScript |

## Architecture Overview

The server exposes nine tool domains:

1. **Control Tools** — Browse and search the control library (ISO, SOC2, NIS2, DORA)
2. **Layer Tools** — Manage four-layer assurance framework (Governance, Platform, Consumption, Oversight)
3. **Assessment Tools** — Create and track control assessments with test assignments
4. **Test Tools** — Execute tests, record results, and maintain test procedures
5. **Metric Tools** — Track operational metrics with RAG status and trends
6. **SOA Tools** — Manage Statement of Applicability for compliance frameworks
7. **Cross-Reference Tools** — Map controls across multiple frameworks
8. **Analysis Tools** — Gap analysis, protection scores, overdue tests
9. **Mutation Tools** — Propose changes via approval queue (assessments, test results, remediations)

## Four-Layer Assurance Framework

RiskReady implements a comprehensive four-layer model for control assessment:

- **Layer 1: GOVERNANCE** — Policies, standards, procedures, RACI matrices, control design
- **Layer 2: PLATFORM** — Technical controls, configuration, automation, logging
- **Layer 3: CONSUMPTION** — User compliance, training, operational execution
- **Layer 4: OVERSIGHT** — Monitoring, metrics, reviews, exception management

Each control can have tests across all four layers, with protection scores calculated per layer and aggregated to provide an overall control effectiveness rating.

## Protection Scoring

Protection scores provide quantitative assessment of control effectiveness:

- **PASS** = 100 points
- **PARTIAL** = 50 points
- **FAIL** = 0 points
- **NOT_TESTED** / **NOT_APPLICABLE** = excluded from calculation

Scores are calculated at:
- **Test level** — Individual test results
- **Activity level** — Tests grouped within an activity
- **Layer level** — All tests within a layer
- **Control level** — Average across all layers
- **Organisation level** — Average across all controls

Status thresholds:
- **COMPLETE** (>= 90) — Fully effective
- **GOOD** (70-89) — Mostly effective, minor gaps
- **PARTIAL** (50-69) — Significant gaps
- **ATTENTION** (< 50) — Urgent attention required
- **NOT_TESTED** (null) — No test results available

## Use Cases

**Control Posture Assessment**
- Query organisation-wide protection scores
- Identify controls in ATTENTION status
- Find overdue tests and testing gaps
- Analyse weakest layers and controls

**Gap Analysis and Remediation**
- Extract FAIL and PARTIAL test results
- Group gaps by control and root cause
- Propose remediation actions with effort estimates
- Track remediation to closure

**Assessment Management**
- List in-progress and completed assessments
- Track test completion rates
- Assign tests to testers
- Record test results with findings and recommendations

**SOA Compliance**
- Generate Statement of Applicability for ISO 27001
- Track applicability decisions and justifications
- Monitor implementation status
- Identify missing or unjustified exclusions

**Cross-Framework Mapping**
- Map ISO 27001 controls to SOC2 criteria
- Identify NIS2 and DORA requirements
- Find equivalent controls across frameworks
- Generate domain coverage matrix

## Related Servers

- **mcp-server-organisation** — Organisation context, departments, locations, interested parties
- **mcp-server-policies** — Policy management, external requirements, compliance obligations
- **mcp-server-risk** — Risk scenarios, treatment plans, risk calculations
- **mcp-server-audits** — Internal audits, nonconformities, corrective actions
- **mcp-server-evidence** — Evidence repository, document management, evidence links

## Support

For issues, questions, or contributions, see the main RiskReady documentation at `/docs/`.
