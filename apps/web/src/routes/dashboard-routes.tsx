import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { routeElement } from "./lazy";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));

export const dashboardRoutes: RouteObject[] = [
  { path: "/dashboard", element: routeElement(DashboardPage) },
];
