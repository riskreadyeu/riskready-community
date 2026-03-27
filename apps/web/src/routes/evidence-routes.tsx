import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const EvidenceDashboardPage = lazyNamed(() => import("@/pages/evidence"), "EvidenceDashboardPage");
const EvidenceRepositoryPage = lazyNamed(() => import("@/pages/evidence"), "EvidenceRepositoryPage");
const EvidenceRequestsPage = lazyNamed(() => import("@/pages/evidence"), "EvidenceRequestsPage");
const EvidenceDetailPage = lazyNamed(() => import("@/pages/evidence"), "EvidenceDetailPage");

export const evidenceRoutes: RouteObject[] = [
  { path: "/evidence", element: routeElement(EvidenceDashboardPage) },
  { path: "/evidence/repository", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/requests", element: routeElement(EvidenceRequestsPage) },
  { path: "/evidence/requests/:id", element: routeElement(EvidenceDetailPage) },
  { path: "/evidence/pending", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/approved", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/expiring", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/search", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/links", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/coverage", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/archive", element: routeElement(EvidenceRepositoryPage) },
  { path: "/evidence/:id", element: routeElement(EvidenceDetailPage) },
];
