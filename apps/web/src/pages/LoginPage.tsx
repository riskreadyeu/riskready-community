import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_ACCOUNTS = [
  { email: "ciso@clearstream.ie", role: "CISO", name: "Siobhan O'Brien" },
  { email: "isms.manager@clearstream.ie", role: "ISMS Manager", name: "Roisin Kelly" },
  { email: "cto@clearstream.ie", role: "CTO", name: "Lars Becker" },
  { email: "risk.analyst@clearstream.ie", role: "Risk Analyst", name: "Cian Doyle" },
  { email: "compliance@clearstream.ie", role: "Compliance", name: "Sofia Ferreira" },
  { email: "dpo@clearstream.ie", role: "DPO", name: "Ana Costa" },
];

const MCP_SERVERS = [
  { name: "Controls", tools: 68, cmd: "controls" },
  { name: "ITSM", tools: 40, cmd: "itsm" },
  { name: "Risks", tools: 33, cmd: "risks" },
  { name: "Organisation", tools: 32, cmd: "organisation" },
  { name: "Policies", tools: 25, cmd: "policies" },
  { name: "Incidents", tools: 19, cmd: "incidents" },
  { name: "Evidence", tools: 16, cmd: "evidence" },
  { name: "Audits", tools: 15, cmd: "audits" },
  { name: "Agent Ops", tools: 7, cmd: "agent-ops" },
];

export default function LoginPage(props: {
  defaultEmail?: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(props.defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">RiskReady</CardTitle>
            <CardDescription>Community Edition — GRC Platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (submitting) return;
                setSubmitting(true);
                setError(null);
                try {
                  await props.onLogin(email, password);
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Login failed");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
              aria-describedby={error ? "login-error" : undefined}
            >
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error ? <div id="login-error" role="alert" className="text-sm text-destructive">{error}</div> : null}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Demo accounts (password: <code className="bg-muted px-1 rounded">password123</code>)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillCredentials(acc.email)}
                    className="text-left text-xs px-2 py-1.5 rounded border hover:bg-accent transition-colors"
                  >
                    <span className="font-medium">{acc.role}</span>
                    <span className="text-muted-foreground block truncate">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mcp" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="mcp" className="flex-1 text-xs">MCP Setup</TabsTrigger>
                <TabsTrigger value="about" className="flex-1 text-xs">About</TabsTrigger>
              </TabsList>

              <TabsContent value="mcp" className="space-y-3 mt-3">
                <p className="text-xs text-muted-foreground">
                  Connect Claude to your GRC data via 9 MCP servers (255 tools).
                  Every AI mutation requires human approval.
                </p>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium">Claude Code — quick connect:</div>
                  <div className="bg-muted rounded p-2 text-xs font-mono break-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground select-all">
                        claude mcp add riskready-controls -e DATABASE_URL=postgresql://riskready:riskready@localhost:5434/riskready -- npx ts-node apps/mcp-server-controls/src/index.ts
                      </span>
                      <button
                        onClick={() => copyToClipboard(
                          "claude mcp add riskready-controls -e DATABASE_URL=postgresql://riskready:riskready@localhost:5434/riskready -- npx ts-node apps/mcp-server-controls/src/index.ts",
                          "claude-code"
                        )}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {copied === "claude-code" ? "✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Repeat for each server: risks, policies, incidents, audits, evidence, itsm, organisation, agent-ops
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium">Available MCP servers:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {MCP_SERVERS.map((s) => (
                      <div key={s.cmd} className="text-xs px-1.5 py-1 rounded border bg-muted/50">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-1">{s.tools}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium">Claude Desktop — config snippet:</div>
                  <div className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto">
                    <pre className="text-[10px] leading-tight">{`{
  "mcpServers": {
    "riskready-controls": {
      "command": "npx",
      "args": ["ts-node", "apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready"
      }
    }
  }
}`}</pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-3 mt-3">
                <p className="text-sm text-muted-foreground">
                  RiskReady Community Edition is an open-source GRC platform with
                  autonomous AI agents. It covers risk management, controls, policies,
                  incidents, audits, evidence, ITSM, and organisation management.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">AI Agents Council</span>
                    <span>6 specialist agents</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">MCP Servers</span>
                    <span>9 servers, 255 tools</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Human-in-the-loop</span>
                    <span>Every mutation approved</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Workflows</span>
                    <span>4 autonomous workflows</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">License</span>
                    <span>AGPL-3.0</span>
                  </div>
                </div>
                <a
                  href="https://github.com/riskreadyeu/riskready-community"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  GitHub Repository →
                </a>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
