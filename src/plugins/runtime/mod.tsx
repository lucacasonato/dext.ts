import { h, hydrate } from "../../../deps/preact/mod.ts";
import type { ComponentType } from "../../../deps/preact/mod.ts";
import { Router, Route } from "../../../deps/preact-router/mod.ts";
import AsyncRoute from "../../../deps/preact-async-router/mod.js";
import type { PageProps } from "../../type.ts";

export async function loadComponent(
  componentPromise: Promise<{ default: ComponentType<PageProps> }>,
  dataFile: string | undefined
) {
  const [Component, data]: [
    ComponentType<PageProps>,
    unknown
  ] = await Promise.all([
    componentPromise.then((m) => m.default),
    (async () => {
      if (dataFile) {
        const req = await fetch(dataFile, {
          headers: { accepts: "application/json" },
        });
        return await req.json();
      }
      return undefined;
    })(),
  ]);
  return (route: Record<string, string>) => {
    return <Component route={route} data={data} isFallback={false} />;
  };
}

export function Error404() {
  return <div>404 not found</div>;
}

export { h, hydrate, Router, Route, AsyncRoute };
export type { ComponentType };
