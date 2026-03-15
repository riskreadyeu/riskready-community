import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const IncidentsDashboardPage = lazyNamed(() => import("@/pages/incidents"), "IncidentsDashboardPage");
const IncidentRegisterPage = lazyNamed(() => import("@/pages/incidents"), "IncidentRegisterPage");
const IncidentDetailPage = lazyNamed(() => import("@/pages/incidents"), "IncidentDetailPage");
const IncidentFormPage = lazyNamed(() => import("@/pages/incidents"), "IncidentFormPage");
const IncidentLessonsPage = lazyNamed(() => import("@/pages/incidents"), "IncidentLessonsPage");

export const incidentsRoutes: RouteObject[] = [
  { path: "/incidents", element: routeElement(IncidentsDashboardPage) },
  { path: "/incidents/register", element: routeElement(IncidentRegisterPage) },
  { path: "/incidents/new", element: routeElement(IncidentFormPage) },
  { path: "/incidents/lessons", element: routeElement(IncidentLessonsPage) },
  { path: "/incidents/:id", element: routeElement(IncidentDetailPage) },
  { path: "/incidents/:id/edit", element: routeElement(IncidentFormPage) },
];
