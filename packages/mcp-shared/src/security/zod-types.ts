import { z } from 'zod';

// Matches UUID v4 and Prisma cuid
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^c[a-z0-9]{24,}$/i;

export const zId = z.string().max(100).regex(ID_PATTERN, 'Must be a valid UUID or CUID');
export const zSessionId = z.string().max(200).optional().describe('MCP session identifier for tracking');
export const zOrgId = z.string().max(100).regex(ID_PATTERN).optional().describe('Organisation UUID (uses default if omitted)');
export const zReason = z.string().max(1000).optional().describe('Explain WHY this change is proposed — shown to human reviewers');
