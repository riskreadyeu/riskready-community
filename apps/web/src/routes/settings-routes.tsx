import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { routeElement } from "./lazy";

const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const McpApprovalsPage = lazy(() => import("@/pages/McpApprovalsPage"));

export const settingsRoutes: RouteObject[] = [
  { path: "/settings", element: routeElement(SettingsPage) },
  { path: "/settings/mcp-approvals", element: routeElement(McpApprovalsPage) },
];
