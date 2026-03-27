// Prompt sanitization helpers — copied from @riskready/mcp-shared to avoid
// cross-package dependency that breaks in Docker (mcp-shared has no dist/).

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value) || CUID_REGEX.test(value);
}

export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '[TRUNCATED]';
}

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
