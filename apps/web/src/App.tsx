import { Suspense, useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate, useRoutes } from "react-router-dom";
import { Toaster } from "sonner";

import AppShell from "@/components/app-shell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getMe, login, logout } from "@/lib/api";
import { buildAuthenticatedRoutes, buildUnauthenticatedRoutes, loadingFallback } from "./routes";

type User = { id: string; email: string };

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const routeConfig = user
    ? buildAuthenticatedRoutes()
    : buildUnauthenticatedRoutes({
        from: location.pathname,
        onLogin: async (email, password) => {
          const res = await login(email, password);
          setUser(res.user);
          const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
          navigate(from, { replace: true });
        },
      });

  const routes = useRoutes(routeConfig);

  if (loading) {
    return loadingFallback;
  }

  return (
    <Suspense fallback={loadingFallback}>
      {user ? (
        <AppShell
          user={user}
          onLogout={async () => {
            await logout();
            setUser(null);
            navigate("/login", { replace: true });
          }}
        >
          {routes}
        </AppShell>
      ) : (
        routes
      )}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <AppInner />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
