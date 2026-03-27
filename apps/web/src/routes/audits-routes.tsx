import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { routeElement } from "./lazy";

const AuditsPage = lazy(() => import("@/pages/AuditsPage"));
const NonconformityRegisterPage = lazy(() => import("@/pages/audits/NonconformityRegisterPage"));
const NonconformityDetailPage = lazy(() => import("@/pages/audits/NonconformityDetailPage"));

export const auditsRoutes: RouteObject[] = [
  { path: "/audits", element: routeElement(AuditsPage) },
  { path: "/audits/nonconformities", element: routeElement(NonconformityRegisterPage) },
  { path: "/audits/nonconformities/:id", element: routeElement(NonconformityDetailPage) },
];
