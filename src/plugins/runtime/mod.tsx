import { h, hydrate } from "../../../deps/preact/mod.ts";
import type { ComponentType } from "../../../deps/preact/mod.ts";
import { Route, Router } from "../../../deps/preact-router/mod.ts";
import AsyncRoute from "../../../deps/preact-async-router/mod.js";
import type { PageProps } from "../../type.ts";

export async function loadComponent(
  componentPromise: Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
  path: string,
) {
  console.log(path);
  const [Component, data]: [
    ComponentType<PageProps>,
    unknown,
  ] = await Promise.all([
    componentPromise.then((m) => m.default),
    (async () => {
      if (hasStaticData) {
        const req = await fetch(`/_dext/${path.slice(1) || "index"}.json`, {
          headers: { accepts: "application/json" },
        });
        if (req.status === 404) return undefined;
        return await req.json();
      }
      return undefined;
    })(),
  ]);
  return (route: Record<string, string>) => {
    if (hasStaticData && data === undefined) return <Error404 />;
    return <Component route={route} data={data} isFallback={false} />;
  };
}

export function Error404() {
  return <div>404 not found</div>;
}

export { AsyncRoute, h, hydrate, Route, Router };
export type { ComponentType };
