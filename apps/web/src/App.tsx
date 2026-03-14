import { Suspense } from "react";
import { BrowserRouter, useLocation, useNavigate, useRoutes } from "react-router-dom";
import { Toaster } from "sonner";

import AppShell from "@/components/app-shell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { buildAuthenticatedRoutes, buildUnauthenticatedRoutes, loadingFallback } from "./routes";

function AppInner() {
  const { user, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const routeConfig = user
    ? buildAuthenticatedRoutes()
    : buildUnauthenticatedRoutes({
        from: location.pathname,
        onLogin: async (email, password) => {
          await login(email, password);
          const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
          navigate(from, { replace: true });
        },
      });

  const routes = useRoutes(routeConfig);

  if (isLoading) {
    return loadingFallback;
  }

  return (
    <Suspense fallback={loadingFallback}>
      {user ? (
        <AppShell
          user={user}
          onLogout={async () => {
            await logout();
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
