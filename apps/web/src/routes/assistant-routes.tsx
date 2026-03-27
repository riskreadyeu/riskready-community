import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const AssistantPage = lazyNamed(() => import("@/pages/AssistantPage"), "default");

export const assistantRoutes: RouteObject[] = [
  { path: "/assistant", element: routeElement(AssistantPage) },
];
