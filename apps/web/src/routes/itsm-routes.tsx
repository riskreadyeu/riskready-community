import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const ITSMDashboardPage = lazyNamed(() => import("@/pages/itsm"), "ITSMDashboardPage");
const AssetRegisterPage = lazyNamed(() => import("@/pages/itsm"), "AssetRegisterPage");
const AssetDetailPage = lazyNamed(() => import("@/pages/itsm"), "AssetDetailPage");
const AssetFormPage = lazyNamed(() => import("@/pages/itsm"), "AssetFormPage");
const ChangeRegisterPage = lazyNamed(() => import("@/pages/itsm"), "ChangeRegisterPage");
const ChangeDetailPage = lazyNamed(() => import("@/pages/itsm"), "ChangeDetailPage");
const ChangeFormPage = lazyNamed(() => import("@/pages/itsm"), "ChangeFormPage");
const ChangeCalendarPage = lazyNamed(() => import("@/pages/itsm"), "ChangeCalendarPage");
const CABDashboardPage = lazyNamed(() => import("@/pages/itsm"), "CABDashboardPage");
const DataQualityPage = lazyNamed(() => import("@/pages/itsm"), "DataQualityPage");
const CapacityPlanListPage = lazyNamed(() => import("@/pages/itsm"), "CapacityPlanListPage");
const CapacityPlanDetailPage = lazyNamed(() => import("@/pages/itsm"), "CapacityPlanDetailPage");
const CapacityPlanCreatePage = lazyNamed(() => import("@/pages/itsm"), "CapacityPlanCreatePage");
const ChangeTemplateListPage = lazyNamed(() => import("@/pages/itsm"), "ChangeTemplateListPage");
const ChangeTemplateDetailPage = lazyNamed(() => import("@/pages/itsm"), "ChangeTemplateDetailPage");
const ChangeTemplateCreatePage = lazyNamed(() => import("@/pages/itsm"), "ChangeTemplateCreatePage");

export const itsmRoutes: RouteObject[] = [
  { path: "/itsm", element: routeElement(ITSMDashboardPage) },
  { path: "/itsm/assets", element: routeElement(AssetRegisterPage) },
  { path: "/itsm/assets/new", element: routeElement(AssetFormPage) },
  { path: "/itsm/assets/:id", element: routeElement(AssetDetailPage) },
  { path: "/itsm/assets/:id/edit", element: routeElement(AssetFormPage) },
  { path: "/itsm/data-quality", element: routeElement(DataQualityPage) },
  { path: "/itsm/changes", element: routeElement(ChangeRegisterPage) },
  { path: "/itsm/changes/calendar", element: routeElement(ChangeCalendarPage) },
  { path: "/itsm/changes/cab", element: routeElement(CABDashboardPage) },
  { path: "/itsm/changes/new", element: routeElement(ChangeFormPage) },
  { path: "/itsm/changes/:id", element: routeElement(ChangeDetailPage) },
  { path: "/itsm/changes/:id/edit", element: routeElement(ChangeFormPage) },
  { path: "/itsm/capacity-plans", element: routeElement(CapacityPlanListPage) },
  { path: "/itsm/capacity-plans/new", element: routeElement(CapacityPlanCreatePage) },
  { path: "/itsm/capacity-plans/:id", element: routeElement(CapacityPlanDetailPage) },
  { path: "/itsm/change-templates", element: routeElement(ChangeTemplateListPage) },
  { path: "/itsm/change-templates/new", element: routeElement(ChangeTemplateCreatePage) },
  { path: "/itsm/change-templates/:id", element: routeElement(ChangeTemplateDetailPage) },
];
