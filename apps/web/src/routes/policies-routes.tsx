import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const PoliciesDashboardPage = lazyNamed(() => import("@/pages/policies"), "PoliciesDashboardPage");
const PolicyDocumentListPage = lazyNamed(() => import("@/pages/policies"), "PolicyDocumentListPage");
const PolicyDocumentDetailPage = lazyNamed(() => import("@/pages/policies"), "PolicyDocumentDetailPage");
const DocumentEditorPage = lazyNamed(() => import("@/pages/policies"), "DocumentEditorPage");
const ChangeRequestsPage = lazyNamed(() => import("@/pages/policies"), "ChangeRequestsPage");
const ExceptionsPage = lazyNamed(() => import("@/pages/policies"), "ExceptionsPage");
const AcknowledgmentsPage = lazyNamed(() => import("@/pages/policies"), "AcknowledgmentsPage");
const DocumentHierarchyPage = lazyNamed(() => import("@/pages/policies"), "DocumentHierarchyPage");
const VersionHistoryPage = lazyNamed(() => import("@/pages/policies"), "VersionHistoryPage");
const ApprovalsPage = lazyNamed(() => import("@/pages/policies"), "ApprovalsPage");
const ReviewsPage = lazyNamed(() => import("@/pages/policies"), "ReviewsPage");
const ControlMappingsPage = lazyNamed(() => import("@/pages/policies"), "ControlMappingsPage");

export const policiesRoutes: RouteObject[] = [
  { path: "/policies", element: routeElement(PoliciesDashboardPage) },
  { path: "/policies/documents", element: routeElement(PolicyDocumentListPage) },
  { path: "/policies/documents/new", element: routeElement(DocumentEditorPage) },
  { path: "/policies/documents/:id/edit", element: routeElement(DocumentEditorPage) },
  { path: "/policies/documents/:id", element: routeElement(PolicyDocumentDetailPage) },
  { path: "/policies/hierarchy", element: routeElement(DocumentHierarchyPage) },
  { path: "/policies/versions", element: routeElement(VersionHistoryPage) },
  { path: "/policies/approvals", element: routeElement(ApprovalsPage) },
  { path: "/policies/changes", element: routeElement(ChangeRequestsPage) },
  { path: "/policies/exceptions", element: routeElement(ExceptionsPage) },
  { path: "/policies/acknowledgments", element: routeElement(AcknowledgmentsPage) },
  { path: "/policies/reviews", element: routeElement(ReviewsPage) },
  { path: "/policies/mappings", element: routeElement(ControlMappingsPage) },
];
