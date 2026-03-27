import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const ControlsCommandCenterPage = lazyNamed(() => import("@/pages/controls"), "ControlsCommandCenterPage");
const ControlsDashboardPage = lazyNamed(() => import("@/pages/controls"), "ControlsDashboardPage");
const ControlsLibraryPage = lazyNamed(() => import("@/pages/controls"), "ControlsLibraryPage");
const ControlDetailPage = lazyNamed(() => import("@/pages/controls"), "ControlDetailPage");
const ControlCreatePage = lazyNamed(() => import("@/pages/controls"), "ControlCreatePage");
const AssessmentListPage = lazyNamed(() => import("@/pages/controls"), "AssessmentListPage");
const AssessmentCreatePage = lazyNamed(() => import("@/pages/controls"), "AssessmentCreatePage");
const AssessmentDetailPage = lazyNamed(() => import("@/pages/controls"), "AssessmentDetailPage");
const SOAListPage = lazy(() => import("@/pages/controls/soa/SOAListPage"));
const SOADetailPage = lazy(() => import("@/pages/controls/soa/SOADetailPage"));
const SOACreatePage = lazy(() => import("@/pages/controls/soa/SOACreatePage"));
const ScopeRegistryPage = lazy(() => import("@/pages/controls/scope/ScopeRegistryPage"));

export const controlsRoutes: RouteObject[] = [
  { path: "/controls", element: routeElement(ControlsCommandCenterPage) },
  { path: "/controls/dashboard", element: routeElement(ControlsDashboardPage) },
  { path: "/controls/library", element: routeElement(ControlsLibraryPage) },
  { path: "/controls/library/new", element: routeElement(ControlCreatePage) },
  { path: "/controls/assessments", element: routeElement(AssessmentListPage) },
  { path: "/controls/assessments/new", element: routeElement(AssessmentCreatePage) },
  { path: "/controls/assessments/:id", element: routeElement(AssessmentDetailPage) },
  { path: "/controls/:controlId", element: routeElement(ControlDetailPage) },
  { path: "/controls/soa", element: routeElement(SOAListPage) },
  { path: "/controls/soa/new", element: routeElement(SOACreatePage) },
  { path: "/controls/soa/:id", element: routeElement(SOADetailPage) },
  { path: "/controls/scope", element: routeElement(ScopeRegistryPage) },
];
