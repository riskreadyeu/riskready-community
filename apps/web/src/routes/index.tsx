import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

import LoginPage from "@/pages/LoginPage";

import { assistantRoutes } from "./assistant-routes";
import { auditsRoutes } from "./audits-routes";
import { controlsRoutes } from "./controls-routes";
import { dashboardRoutes } from "./dashboard-routes";
import { evidenceRoutes } from "./evidence-routes";
import { incidentsRoutes } from "./incidents-routes";
import { itsmRoutes } from "./itsm-routes";
import { organisationRoutes } from "./organisation-routes";
import { policiesRoutes } from "./policies-routes";
import { risksRoutes } from "./risks-routes";
import { settingsRoutes } from "./settings-routes";

export const loadingFallback = <div className="p-6">Loading...</div>;

export function buildUnauthenticatedRoutes(props: {
  from: string;
  onLogin: (email: string, password: string) => Promise<void>;
}): RouteObject[] {
  return [
    {
      path: "/login",
      element: (
        <LoginPage
          onLogin={props.onLogin}
        />
      ),
    },
    {
      path: "*",
      element: <Navigate to="/login" replace state={{ from: props.from }} />,
    },
  ];
}

export function buildAuthenticatedRoutes(): RouteObject[] {
  return [
    ...dashboardRoutes,
    ...assistantRoutes,
    ...risksRoutes,
    ...controlsRoutes,
    ...policiesRoutes,
    ...auditsRoutes,
    ...incidentsRoutes,
    ...evidenceRoutes,
    ...itsmRoutes,
    ...settingsRoutes,
    ...organisationRoutes,
    {
      path: "/assets",
      element: <Navigate to="/itsm/assets" replace />,
    },
    {
      path: "*",
      element: <Navigate to="/dashboard" replace />,
    },
  ];
}
