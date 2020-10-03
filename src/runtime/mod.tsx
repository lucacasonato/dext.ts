import { h, hydrate } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import { Route, Router } from "../../deps/preact-router/mod.ts";
import AsyncRoute from "../../deps/preact-async-router/mod.js";
import type { AppProps, PageProps } from "./type.ts";

export { h, hydrate };
export type { ComponentType };

export interface DextProps {
  routes: DextRoute[];
  app: ComponentType<AppProps>;
}

export type DextRoute = [
  route: string,
  component: () => Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
];

export function Dext(props: DextProps) {
  const App = props.app;
  return <div>
    <App>
      <Router>
        {props.routes.map((routes) => {
          return <AsyncRoute
            path={routes[0]}
            getComponent={(path) => loadComponent(routes[1](), routes[2], path)}
          />;
        })}
        <Route default component={Error404} />
      </Router>
    </App>
  </div>;
}

export async function loadComponent(
  componentPromise: Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
  path: string,
) {
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
        return req.json();
      }
      return undefined;
    })(),
  ]);
  return (route: Record<string, string>) => {
    if (hasStaticData && data === undefined) return <Error404 />;
    return <Component route={route} data={data} />;
  };
}

function Error404() {
  return <div>404 not found</div>;
}
