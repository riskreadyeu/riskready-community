import { useState, useEffect, useCallback } from "react";
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
import { Download, Plus, Sliders, Bot, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GatewayConfigResponse {
  anthropicApiKey: string | null;
  anthropicApiKeySet: boolean;
  agentModel: string;
  gatewayUrl: string;
  maxAgentTurns: number;
  updatedAt: string;
}

const ORG_ID = "default";

function AIAssistantCard() {
  const [config, setConfig] = useState<GatewayConfigResponse>({
    anthropicApiKey: null,
    anthropicApiKeySet: false,
    agentModel: "claude-haiku-4-5-20251001",
    gatewayUrl: "http://localhost:3100",
    maxAgentTurns: 25,
    updatedAt: "",
  });
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Local editable state (separate from server state)
  const [agentModel, setAgentModel] = useState("claude-haiku-4-5-20251001");
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:3100");
  const [maxAgentTurns, setMaxAgentTurns] = useState(25);

  const loadConfig = useCallback(async () => {
    try {
      const data = await api.get<GatewayConfigResponse>(
        `/gateway-config?organisationId=${ORG_ID}`
      );
      if (data) {
        setConfig(data);
        setAgentModel(data.agentModel);
        setGatewayUrl(data.gatewayUrl);
        setMaxAgentTurns(data.maxAgentTurns);
      }
    } catch {
      // Config not found — use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        agentModel,
        gatewayUrl,
        maxAgentTurns,
      };
      // Only send API key if user typed a new one
      if (apiKeyInput.trim()) {
        payload['anthropicApiKey'] = apiKeyInput.trim();
      }
      const updated = await api.put<GatewayConfigResponse>(
        `/gateway-config?organisationId=${ORG_ID}`,
        payload
      );
      if (updated) {
        setConfig(updated);
        setApiKeyInput("");
        toast.success("AI Assistant settings saved");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearApiKey = async () => {
    setSaving(true);
    try {
      const updated = await api.put<GatewayConfigResponse>(
        `/gateway-config?organisationId=${ORG_ID}`,
        {
          agentModel,
          gatewayUrl,
          maxAgentTurns,
          anthropicApiKey: null,
        }
      );
      if (updated) {
        setConfig(updated);
        setApiKeyInput("");
        toast.success("API key removed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear API key");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <Badge
          variant={config.anthropicApiKeySet ? "secondary" : "outline"}
          className="text-[10px]"
        >
          {config.anthropicApiKeySet ? "Configured" : "Not configured"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Anthropic API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">Anthropic API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder={
                  config.anthropicApiKeySet
                    ? config.anthropicApiKey || "Key is set"
                    : "sk-ant-..."
                }
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {config.anthropicApiKeySet && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg bg-transparent text-destructive hover:text-destructive"
                onClick={handleClearApiKey}
                disabled={saving}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {config.anthropicApiKeySet
              ? `Current key: ${config.anthropicApiKey}. Enter a new key to replace it.`
              : "Enter your Anthropic API key to enable the AI assistant."}
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={agentModel} onValueChange={setAgentModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-haiku-4-5-20251001">
                Claude Haiku 4.5 — fast, cost-effective
              </SelectItem>
              <SelectItem value="claude-sonnet-4-5-20250929">
                Claude Sonnet 4.5 — balanced
              </SelectItem>
              <SelectItem value="claude-opus-4-20250514">
                Claude Opus 4 — most capable
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The Claude model used by the AI assistant for GRC queries.
          </p>
        </div>

        {/* Gateway URL */}
        <div className="space-y-2">
          <Label htmlFor="gatewayUrl">Gateway URL</Label>
          <Input
            id="gatewayUrl"
            type="url"
            value={gatewayUrl}
            onChange={(e) => setGatewayUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            URL of the AI gateway service. Default: http://localhost:3100
          </p>
        </div>

        {/* Max Agent Turns */}
        <div className="space-y-2">
          <Label htmlFor="maxTurns">Max Agent Turns</Label>
          <Input
            id="maxTurns"
            type="number"
            min={1}
            max={100}
            value={maxAgentTurns}
            onChange={(e) => setMaxAgentTurns(parseInt(e.target.value) || 25)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum tool-use turns per request (1-100). Lower is faster and
            cheaper, higher allows more thorough analysis.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save AI Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Workspace, profile, and organization settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2 rounded-lg">
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="glass-card lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Profile</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Active</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Role", value: "Security Lead" },
              { label: "MFA", value: "Enabled" },
              { label: "Sessions", value: "2" },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-lg bg-transparent">
              Manage profile
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Organization</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Enterprise</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Team members", value: "18" },
              { name: "Workspaces", value: "1" },
              { name: "SSO", value: "Not configured" },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <Badge variant={m.value === "Not configured" ? "outline" : "secondary"} className="text-[10px]">
                  {m.value}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-lg bg-transparent">
              Manage organization
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Preferences</CardTitle>
            <Sliders className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Notifications", value: "On" },
              { name: "Weekly digest", value: "On" },
              { name: "Dark mode", value: "Auto" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div className="text-sm text-foreground">{p.name}</div>
                <Badge variant="secondary" className="text-[10px]">
                  {p.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AIAssistantCard />

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Jira", status: "Disconnected" },
              { name: "Slack", status: "Connected" },
              { name: "GitHub", status: "Connected" },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div className="text-sm font-medium text-foreground">{i.name}</div>
                <Button variant="outline" size="sm" className="h-8 rounded-lg bg-transparent">
                  {i.status === "Connected" ? "Manage" : "Connect"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["User invited", "Policy updated", "Risk created"].map((t) => (
              <div key={t} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
                {t}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
