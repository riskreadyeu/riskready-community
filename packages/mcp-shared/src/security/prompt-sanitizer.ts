import { truncateString } from './validators.js';

interface MemoryItem {
  type: string;
  content: string;
}

interface TaskItem {
  id: string;
  title: string;
  instruction: string;
  status: string;
  trigger: string;
}

const MEMORY_ITEM_MAX = 1000;
const TASK_INSTRUCTION_MAX = 2000;
const COUNCIL_QUESTION_MAX = 5000;
const COUNCIL_FINDINGS_MAX = 50000;
const TOOL_DATA_MAX = 50000;

export function wrapMemoryContext(memories: MemoryItem[]): string {
  if (memories.length === 0) return '';
  const items = memories
    .map((m) => `<MEMORY type="${m.type}">${truncateString(m.content, MEMORY_ITEM_MAX)}</MEMORY>`)
    .join('\n');
  return `<RECALLED_MEMORIES>\n${items}\n</RECALLED_MEMORIES>`;
}

export function wrapTaskContext(task: TaskItem): string {
  const instruction = truncateString(task.instruction, TASK_INSTRUCTION_MAX);
  return `<TASK_CONTEXT>\nID: ${task.id}\nTitle: ${task.title}\nInstruction: ${instruction}\nStatus: ${task.status}\nTrigger: ${task.trigger}\n</TASK_CONTEXT>`;
}

export function wrapCouncilQuestion(question: string): string {
  return `<USER_QUESTION>\n${truncateString(question, COUNCIL_QUESTION_MAX)}\n</USER_QUESTION>`;
}

export function wrapCouncilFindings(findings: string): string {
  return `<COUNCIL_FINDINGS>\n${truncateString(findings, COUNCIL_FINDINGS_MAX)}\n</COUNCIL_FINDINGS>`;
}

export function wrapToolData(toolName: string, content: string): string {
  return `<TOOL_DATA tool="${toolName}">\n${truncateString(content, TOOL_DATA_MAX)}\n</TOOL_DATA>`;
}
