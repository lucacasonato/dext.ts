import { h, hydrate } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import { useEffect, useMemo, useState } from "../../deps/preact/hooks.ts";
import type { AppProps, PageProps } from "./type.ts";
import { Router } from "./router/router.ts";
import { useLocation } from "./router/location.ts";

type Route = [
  route: string,
  data: RouteData,
];

type RouteData = [
  component: () => Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
];

export async function start(routes: Route[], app: ComponentType<AppProps>) {
  const router = new Router<RouteData>(routes);
  const path = location.pathname;
  const [route] = router.getRoute(path);
  if (!route) throw new Error("Failed to match inital route.");

  const initialPage = await loadComponent(route[1][0](), route[1][1], path);

  hydrate(
    <Dext router={router} app={app} initialPage={initialPage} />,
    document.getElementById("__dext")!,
  );
}

type PageComponent = ComponentType<{
  route: Record<string, string | string[]>;
}>;

function Dext(props: {
  router: Router<RouteData>;
  app: ComponentType<AppProps>;
  initialPage: PageComponent;
}) {
  const [path] = useLocation();
  const [route, match] = useMemo(
    () => props.router.getRoute(path),
    [props.router, path],
  );

  const [[Page], setPage] = useState<[PageComponent | null]>([
    props.initialPage,
  ]);

  useEffect(() => {
    let cancelled = false;

    () => cancelled = true;
  }, [route]);

  const App = props.app;
  return <div>
    <App>
      {Page === null ? <Error404 /> : <Page route={match!} />}
    </App>
  </div>;
}

async function loadComponent(
  componentPromise: Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
  path: string,
): Promise<PageComponent> {
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
  return (props: { route: Record<string, string | string[]> }) => {
    if (hasStaticData && data === undefined) return <Error404 />;
    return <Component route={props.route} data={data} />;
  };
}

function Error404() {
  return <div>404 not found</div>;
}
