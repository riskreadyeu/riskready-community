import { PrismaService } from '../../prisma/prisma.service';
import { ExecutorMap } from './types';

export interface AgentOpsExecutorServices {
  prismaService: PrismaService;
}

export function registerAgentOpsExecutors(executors: ExecutorMap, services: AgentOpsExecutorServices): void {
  const { prismaService } = services;

  executors.set('CREATE_AGENT_TASK', async (p, _userId, organisationId) => {
    const task = await prismaService.agentTask.create({
      data: {
        organisationId: organisationId as string,
        title: p['title'] as string,
        instruction: p['instruction'] as string,
        parentTaskId: p['parentTaskId'] as string | undefined,
        workflowId: p['workflowId'] as string | undefined,
        stepIndex: p['stepIndex'] as number | undefined,
        status: 'PENDING',
        trigger: p['parentTaskId'] ? 'WORKFLOW_STEP' : 'USER_REQUEST',
      },
    });
    return { taskId: task.id, title: task.title, status: task.status };
  });

  executors.set('UPDATE_AGENT_TASK', async (p) => {
    const existing = await prismaService.agentTask.findUniqueOrThrow({ where: { id: p['taskId'] as string } });
    const data: Record<string, unknown> = {};
    if (p['status']) data['status'] = p['status'];
    if (p['result']) data['result'] = (p['result'] as string).slice(0, 10000);
    if (p['errorMessage']) data['errorMessage'] = p['errorMessage'];
    if (p['status'] === 'COMPLETED' || p['status'] === 'FAILED') data['completedAt'] = new Date();
    if (Array.isArray(p['actionIds']) && p['actionIds'].length > 0) {
      data['actionIds'] = [...existing.actionIds, ...(p['actionIds'] as string[])];
    }
    const task = await prismaService.agentTask.update({ where: { id: p['taskId'] as string }, data });
    return { taskId: task.id, status: task.status };
  });
}
