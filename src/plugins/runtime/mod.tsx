import { h, hydrate } from "../../../deps/preact/mod.ts";
import type { ComponentType } from "../../../deps/preact/mod.ts";
import { Router, Route } from "../../../deps/preact-router/mod.ts";
import AsyncRoute from "../../../deps/preact-async-router/mod.js";
import type { PageProps } from "../../type.ts";

export function wrap(Component: ComponentType<PageProps>) {
  return (route: Record<string, string>) => (
    <Component route={route} data={{}} isFallback={false} />
  );
}

export function Error404() {
  return <div>404 not found</div>;
}

export { h, hydrate, Router, Route, AsyncRoute };
export type { ComponentType };
