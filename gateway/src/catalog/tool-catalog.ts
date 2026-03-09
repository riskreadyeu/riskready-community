export interface ToolEntry {
  toolName: string;
  description: string;
  args: string[];
  serverName: string;
  tokens: string[];
  nameTokens: string[];
}

export interface ServerToolSet {
  serverName: string;
  tools: Array<{ name: string; description: string; args: string[] }>;
}

export interface SearchResult {
  toolName: string;
  serverName: string;
  description: string;
  score: number;
}

const ALWAYS_INCLUDE = ['riskready-agent-ops'];
const K1 = 1.5;
const B = 0.75;
const NAME_BOOST = 2.0;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s_\-./]+/).filter(t => t.length > 1);
}

export class ToolCatalog {
  private entries: ToolEntry[] = [];
  private avgDocLen: number = 0;
  private docFreq: Map<string, number> = new Map();

  constructor(serverToolSets: ServerToolSet[]) {
    for (const server of serverToolSets) {
      for (const tool of server.tools) {
        const tokens = tokenize([tool.name, tool.description, ...tool.args].join(' '));
        const nameTokens = tokenize(tool.name);
        this.entries.push({
          toolName: tool.name,
          description: tool.description,
          args: tool.args,
          serverName: server.serverName,
          tokens,
          nameTokens,
        });
      }
    }

    const totalTokens = this.entries.reduce((sum, e) => sum + e.tokens.length, 0);
    this.avgDocLen = this.entries.length > 0 ? totalTokens / this.entries.length : 1;

    for (const entry of this.entries) {
      const uniqueTerms = new Set(entry.tokens);
      for (const term of uniqueTerms) {
        this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
      }
    }
  }

  search(query: string, maxResults = 10): SearchResult[] {
    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    const N = this.entries.length;
    const scored: SearchResult[] = [];

    for (const entry of this.entries) {
      let score = 0;

      for (const term of queryTerms) {
        const tf = entry.tokens.filter(t => t === term || t.includes(term)).length;
        if (tf === 0) continue;

        let partialDf = 0;
        for (const [docTerm, freq] of this.docFreq) {
          if (docTerm === term || docTerm.includes(term)) partialDf += freq;
        }
        const idf = Math.log((N - partialDf + 0.5) / (partialDf + 0.5) + 1);

        const docLen = entry.tokens.length;
        const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * docLen / this.avgDocLen));

        score += idf * tfNorm;

        const nameMatch = entry.nameTokens.some(t => t === term || t.includes(term));
        if (nameMatch) score += idf * NAME_BOOST;
      }

      if (score > 0) {
        scored.push({
          toolName: entry.toolName,
          serverName: entry.serverName,
          description: entry.description,
          score,
        });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  getServersForTools(results: SearchResult[]): string[] {
    const servers = new Set(results.map(r => r.serverName));
    for (const name of ALWAYS_INCLUDE) servers.add(name);
    return Array.from(servers);
  }

  getAllEntries(): ToolEntry[] {
    return this.entries;
  }
}
