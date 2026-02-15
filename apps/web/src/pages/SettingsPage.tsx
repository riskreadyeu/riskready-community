import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Sliders } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Workspace and profile settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg bg-transparent" onClick={() => toast.info("Export coming soon")}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Profile</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Active</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Role", value: "Admin" },
              { label: "Sessions", value: "1" },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-lg bg-transparent" onClick={() => toast.info("Profile management coming soon")}>
              Manage profile
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Policy updated", "Risk created", "Control modified"].map((t) => (
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
