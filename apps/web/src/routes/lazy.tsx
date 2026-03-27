import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";

type AnyComponent = ComponentType<any>;
type RouteComponent = AnyComponent | LazyExoticComponent<AnyComponent>;
type ComponentExportKey<TModule> = {
  [TKey in keyof TModule]: TModule[TKey] extends AnyComponent ? TKey : never;
}[keyof TModule];

export function lazyNamed<
  TModule,
  TKey extends ComponentExportKey<TModule>,
>(
  loader: () => Promise<TModule>,
  key: TKey,
): LazyExoticComponent<Extract<TModule[TKey], AnyComponent>> {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] as Extract<TModule[TKey], AnyComponent> };
  });
}

export function routeElement(Component: RouteComponent) {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
}
