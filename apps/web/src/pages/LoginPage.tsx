import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage(props: {
  defaultEmail?: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(props.defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          <Button
            className="w-full"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setError(null);
              try {
                await props.onLogin(email, password);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Login failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
