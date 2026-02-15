import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';

export function registerGovernanceTools(server: McpServer) {
  server.tool(
    'list_committees',
    'List security committees with optional filters.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      committeeType: z.string().optional().describe('Filter by committee type'),
    },
    async (params) => {
      const where: any = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.committeeType) where.committeeType = params.committeeType;

      const committees = await prisma.securityCommittee.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          committeeType: true,
          description: true,
          meetingFrequency: true,
          nextMeetingDate: true,
          isActive: true,
          establishedDate: true,
          chair: { select: { id: true, name: true } },
          _count: { select: { memberships: true, meetings: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ committees, count: committees.length }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'get_committee',
    'Get a single committee with full details including members.',
    {
      id: z.string().describe('SecurityCommittee UUID'),
    },
    async ({ id }) => {
      const committee = await prisma.securityCommittee.findUnique({
        where: { id },
        include: {
          chair: { select: { id: true, name: true, email: true } },
          memberships: {
            where: { isActive: true },
            select: {
              id: true,
              role: true,
              votingRights: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { meetings: true } },
        },
      });

      if (!committee) {
        return { content: [{ type: 'text' as const, text: `Committee ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(committee, null, 2),
        }],
      };
    },
  );

  server.tool(
    'list_committee_meetings',
    'List meetings for a committee with optional status filter.',
    {
      committeeId: z.string().describe('SecurityCommittee UUID'),
      status: z.string().optional().describe('Filter by meeting status'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(50).default(20).optional().describe('Page size (max 50)'),
    },
    async (params) => {
      const where: any = { committeeId: params.committeeId };
      if (params.status) where.status = params.status;

      const [meetings, total] = await Promise.all([
        prisma.committeeMeeting.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 20,
          orderBy: { meetingDate: 'desc' },
          select: {
            id: true,
            meetingNumber: true,
            title: true,
            meetingType: true,
            meetingDate: true,
            startTime: true,
            endTime: true,
            locationType: true,
            status: true,
            quorumAchieved: true,
            actualAttendeesCount: true,
            chair: { select: { id: true, name: true } },
            _count: { select: { decisions: true, actionItems: true } },
          },
        }),
        prisma.committeeMeeting.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ meetings, total, skip: params.skip || 0, take: params.take || 20 }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'get_committee_meeting',
    'Get a single committee meeting with full details including attendees, decisions, and action items.',
    {
      id: z.string().describe('CommitteeMeeting UUID'),
    },
    async ({ id }) => {
      const meeting = await prisma.committeeMeeting.findUnique({
        where: { id },
        include: {
          committee: { select: { id: true, name: true } },
          chair: { select: { id: true, name: true } },
          secretary: { select: { id: true, name: true } },
          attendances: {
            select: {
              attendanceStatus: true,
              member: { select: { id: true, name: true } },
            },
          },
          decisions: {
            select: {
              id: true,
              decisionNumber: true,
              title: true,
              decisionType: true,
              votesFor: true,
              votesAgainst: true,
              implemented: true,
            },
          },
          actionItems: {
            select: {
              id: true,
              actionNumber: true,
              title: true,
              priority: true,
              status: true,
              dueDate: true,
              assignedTo: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      });

      if (!meeting) {
        return { content: [{ type: 'text' as const, text: `Meeting ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(meeting, null, 2),
        }],
      };
    },
  );

  server.tool(
    'list_meeting_action_items',
    'List action items across all committee meetings with optional status filter.',
    {
      status: z.string().optional().describe('Filter by action item status (e.g. "open", "completed", "overdue")'),
      assignedToId: z.string().optional().describe('Filter by assigned user UUID'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    async (params) => {
      const where: any = {};
      if (params.status) where.status = params.status;
      if (params.assignedToId) where.assignedToId = params.assignedToId;

      const [items, total] = await Promise.all([
        prisma.meetingActionItem.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            actionNumber: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
            progressPercentage: true,
            assignedTo: { select: { id: true, name: true } },
            meeting: {
              select: {
                id: true,
                title: true,
                meetingDate: true,
                committee: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.meetingActionItem.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ actionItems: items, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    },
  );
}
