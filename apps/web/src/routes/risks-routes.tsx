import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const RisksDashboardPage = lazyNamed(() => import("@/pages/risks"), "RisksDashboardPage");
const RiskRegisterPage = lazyNamed(() => import("@/pages/risks"), "RiskRegisterPage");
const RiskDetailPage = lazyNamed(() => import("@/pages/risks"), "RiskDetailPage");
const RiskScenarioDetailPage = lazyNamed(() => import("@/pages/risks"), "RiskScenarioDetailPage");
const TreatmentPlanListPage = lazyNamed(() => import("@/pages/risks"), "TreatmentPlanListPage");
const TreatmentPlanDetailPage = lazyNamed(() => import("@/pages/risks"), "TreatmentPlanDetailPage");
const RTSListPage = lazyNamed(() => import("@/pages/risks"), "RTSListPage");
const RTSDetailPage = lazyNamed(() => import("@/pages/risks"), "RTSDetailPage");
const RiskCreatePage = lazyNamed(() => import("@/pages/risks"), "RiskCreatePage");
const RTSCreatePage = lazyNamed(() => import("@/pages/risks"), "RTSCreatePage");
const TreatmentPlanCreatePage = lazyNamed(() => import("@/pages/risks"), "TreatmentPlanCreatePage");
const ScenarioCreatePage = lazyNamed(() => import("@/pages/risks"), "ScenarioCreatePage");

export const risksRoutes: RouteObject[] = [
  { path: "/risks", element: routeElement(RisksDashboardPage) },
  { path: "/risks/register", element: routeElement(RiskRegisterPage) },
  { path: "/risks/register/new", element: routeElement(RiskCreatePage) },
  { path: "/risks/tolerance", element: routeElement(RTSListPage) },
  { path: "/risks/tolerance/new", element: routeElement(RTSCreatePage) },
  { path: "/risks/tolerance/:id", element: routeElement(RTSDetailPage) },
  { path: "/risks/treatments", element: routeElement(TreatmentPlanListPage) },
  { path: "/risks/treatments/new", element: routeElement(TreatmentPlanCreatePage) },
  { path: "/risks/treatments/:id", element: routeElement(TreatmentPlanDetailPage) },
  { path: "/risks/scenarios/new", element: routeElement(ScenarioCreatePage) },
  { path: "/risks/scenarios/:id", element: routeElement(RiskScenarioDetailPage) },
  { path: "/risks/:id", element: routeElement(RiskDetailPage) },
];
