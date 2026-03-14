import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";

type AnyComponent = ComponentType<any>;
type RouteComponent = AnyComponent | LazyExoticComponent<AnyComponent>;

export function lazyNamed<
  TModule extends Record<string, AnyComponent>,
  TKey extends keyof TModule,
>(loader: () => Promise<TModule>, key: TKey): LazyExoticComponent<TModule[TKey]> {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] };
  });
}

export function routeElement(Component: RouteComponent) {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
}
