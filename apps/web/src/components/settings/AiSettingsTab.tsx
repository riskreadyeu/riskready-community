import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Key, Bot, BarChart3, Check, AlertTriangle, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getGatewayConfig,
  updateGatewayConfig,
  getUsage,
  createMcpKey,
  listMcpKeys,
  revokeMcpKey,
  type GatewayConfig,
  type UsageResponse,
  type McpApiKey,
  type McpApiKeyCreated,
} from "@/lib/gateway-config-api";
import { listModels, type ChatModelOption } from "@/lib/chat-api";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "haiku-4-5": { input: 0.8, output: 4.0 },
  "sonnet-4-5": { input: 3.0, output: 15.0 },
  "sonnet-4-6": { input: 3.0, output: 15.0 },
  "opus-4-6": { input: 15.0, output: 75.0 },
};

function getPricing(model: string): { input: number; output: number } {
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(key)) return pricing;
  }
  return { input: 3.0, output: 15.0 };
}

function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = getPricing(model);
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

export function AiSettingsTab() {
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [models, setModels] = useState<ChatModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  // MCP API Keys state
  const [mcpKeys, setMcpKeys] = useState<McpApiKey[]>([]);
  const [mcpKeysLoading, setMcpKeysLoading] = useState(false);
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<McpApiKeyCreated | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["all"]);

  useEffect(() => {
    async function load() {
      try {
        const [configData, usageData, modelsData] = await Promise.all([
          getGatewayConfig(),
          getUsage(),
          listModels(),
        ]);
        setConfig(configData);
        setUsage(usageData);
        setModels(modelsData.results);
        setSelectedModel(configData.agentModel);
      } catch (err) {
        toast.error("Failed to load AI configuration");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    loadMcpKeys();
  }, []);

  async function loadMcpKeys() {
    setMcpKeysLoading(true);
    try {
      const keys = await listMcpKeys();
      setMcpKeys(keys);
    } catch (err) {
      console.error("Failed to load MCP API keys", err);
    } finally {
      setMcpKeysLoading(false);
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const scopesToSend = newKeyScopes.length === 0 ? ["all"] : newKeyScopes;
      const result = await createMcpKey(newKeyName.trim(), scopesToSend);
      setCreatedKey(result);
      setMcpKeys((prev) => [result, ...prev]);
      setNewKeyName("");
      setNewKeyScopes(["all"]);
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeMcpKey(id);
      setMcpKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke API key");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateKeyDialogOpen(false);
    setCreatedKey(null);
    setNewKeyName("");
    setNewKeyScopes(["all"]);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      const updated = await updateGatewayConfig({ anthropicApiKey: apiKey });
      setConfig(updated);
      setApiKey("");
      toast.success("API key updated successfully");
    } catch {
      toast.error("Failed to update API key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveModel = async () => {
    if (!selectedModel) return;
    setSavingModel(true);
    try {
      const updated = await updateGatewayConfig({ agentModel: selectedModel });
      setConfig(updated);
      toast.success("Default model updated successfully");
    } catch {
      toast.error("Failed to update default model");
    } finally {
      setSavingModel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalCost = usage
    ? usage.byModel.reduce(
        (sum, m) => sum + estimateCost(m.inputTokens, m.outputTokens, m.model),
        0,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle>API Key</CardTitle>
          </div>
          {config?.anthropicApiKeySet ? (
            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[10px]">
              <Check className="mr-1 h-3 w-3" />
              Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Not set
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.anthropicApiKeySet && (
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Current key</span>
                <span className="font-mono text-sm text-foreground">
                  {config.anthropicApiKey || "***"}
                </span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {config?.anthropicApiKeySet ? "Update API key" : "Set API key"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-background/40"
              />
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || savingKey}
                className="shrink-0"
              >
                {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Anthropic API key for Claude model access. The key is encrypted at rest.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Default Model Section */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Default Model</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <div className="flex gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-background/40">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSaveModel}
                disabled={selectedModel === config?.agentModel || savingModel}
                className="shrink-0"
              >
                {savingModel ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The default Claude model used for AI agent conversations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Section */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Usage This Month</CardTitle>
          </div>
          {usage && (
            <span className="text-xs text-muted-foreground">
              {new Date(usage.period.start).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-3 text-center">
              <div className="text-xs text-muted-foreground">Messages</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {usage ? formatNumber(usage.totals.messageCount) : "0"}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-3 text-center">
              <div className="text-xs text-muted-foreground">Input Tokens</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {usage ? formatNumber(usage.totals.inputTokens) : "0"}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-3 text-center">
              <div className="text-xs text-muted-foreground">Output Tokens</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {usage ? formatNumber(usage.totals.outputTokens) : "0"}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-3 text-center">
              <div className="text-xs text-muted-foreground">Est. Cost</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                ${totalCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Usage by model table */}
          {usage && usage.byModel.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-background/40">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Model
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Messages
                    </th>
                    <th className="hidden px-3 py-2 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                      Input
                    </th>
                    <th className="hidden px-3 py-2 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                      Output
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Est. Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.byModel.map((m) => {
                    const cost = estimateCost(m.inputTokens, m.outputTokens, m.model);
                    return (
                      <tr key={m.model} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-foreground">{m.model}</td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {m.messageCount.toLocaleString()}
                        </td>
                        <td className="hidden px-3 py-2 text-right text-foreground sm:table-cell">
                          {formatNumber(m.inputTokens)}
                        </td>
                        <td className="hidden px-3 py-2 text-right text-foreground sm:table-cell">
                          {formatNumber(m.outputTokens)}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">${cost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-6 text-center text-sm text-muted-foreground">
              No usage data for this month yet.
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Cost estimates are based on published Anthropic pricing and may not reflect discounts or
            credits.
          </p>
        </CardContent>
      </Card>

      {/* MCP API Keys Section */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle>MCP API Keys</CardTitle>
          </div>
          <Button size="sm" onClick={() => setCreateKeyDialogOpen(true)}>
            Create Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Use these keys to connect external MCP clients (e.g. Claude Desktop) to your RiskReady
            gateway.
          </p>

          {mcpKeysLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : mcpKeys.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-6 text-center text-sm text-muted-foreground">
              No API keys yet. Create one to connect an MCP client.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-background/40">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Key
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground md:table-cell">
                      Scopes
                    </th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                      Last used
                    </th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                      Created
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {mcpKeys.map((k) => (
                    <tr key={k.id} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-foreground">
                        {k.prefix}...
                      </td>
                      <td className="px-3 py-2 text-foreground">{k.name}</td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(k.scopes ?? ["all"]).map((scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                        {formatRelativeTime(k.lastUsedAt)}
                      </td>
                      <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={revokingId === k.id}
                          onClick={() => handleRevokeKey(k.id)}
                          title="Revoke key"
                        >
                          {revokingId === k.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={createKeyDialogOpen} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create MCP API Key</DialogTitle>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  This key will only be shown once. Copy it now.
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Your new API key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdKey.key}
                    className="font-mono text-xs bg-background/40"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKey.key);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Claude Desktop config</Label>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg border border-border/60 bg-background/40 p-3 text-xs font-mono text-foreground">
{JSON.stringify(
  {
    mcpServers: {
      riskready: {
        type: "url",
        url: "https://YOUR_SERVER/mcp",
        headers: { Authorization: `Bearer ${createdKey.key}` },
      },
    },
  },
  null,
  2,
)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 text-muted-foreground"
                    onClick={() => {
                      const config = JSON.stringify(
                        {
                          mcpServers: {
                            riskready: {
                              type: "url",
                              url: "https://YOUR_SERVER/mcp",
                              headers: { Authorization: `Bearer ${createdKey.key}` },
                            },
                          },
                        },
                        null,
                        2,
                      );
                      navigator.clipboard.writeText(config);
                      toast.success("Config copied to clipboard");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace <code className="font-mono">YOUR_SERVER</code> with your gateway URL.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreateDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. My Laptop"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-background/40"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to identify where this key is used.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "all", label: "All access" },
                    { id: "read", label: "Read only" },
                    { id: "write", label: "Write (propose changes)" },
                    { id: "risks", label: "Risks" },
                    { id: "controls", label: "Controls" },
                    { id: "policies", label: "Policies" },
                    { id: "evidence", label: "Evidence" },
                    { id: "incidents", label: "Incidents" },
                    { id: "audits", label: "Audits" },
                    { id: "itsm", label: "ITSM" },
                    { id: "organisation", label: "Organisation" },
                    { id: "agent-ops", label: "Agent Ops" },
                  ].map((scope) => (
                    <div key={scope.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`scope-${scope.id}`}
                        checked={newKeyScopes.includes(scope.id)}
                        disabled={scope.id !== "all" && newKeyScopes.includes("all")}
                        onCheckedChange={(checked) => {
                          if (scope.id === "all") {
                            setNewKeyScopes(checked ? ["all"] : []);
                          } else {
                            setNewKeyScopes((prev) =>
                              checked
                                ? [...prev.filter((s) => s !== "all"), scope.id]
                                : prev.filter((s) => s !== scope.id),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`scope-${scope.id}`}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {scope.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Restrict which tools this key can access. Scopes combine with OR logic.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreateDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || creatingKey}>
                  {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
