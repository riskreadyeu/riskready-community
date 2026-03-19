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
import { Loader2, Key, Bot, BarChart3, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getGatewayConfig,
  updateGatewayConfig,
  getUsage,
  type GatewayConfig,
  type UsageResponse,
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

export function AiSettingsTab() {
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [models, setModels] = useState<ChatModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

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
  }, []);

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
    </div>
  );
}
