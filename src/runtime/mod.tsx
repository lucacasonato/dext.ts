import { h, hydrate } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "../../deps/preact/hooks.ts";
import type { AppProps, PageProps } from "./type.ts";
import { Router } from "./router/router.ts";
import { initRouter } from "./router/interceptor.ts";
import { locationCtx } from "./router/location.ts";

type Route = [route: string, data: RouteData];
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
  const [desiredPath, setDesiredPath] = useState(window.location.pathname);
  const [desiredRoute, desiredMatch] = useMemo(
    () => props.router.getRoute(desiredPath),
    [
      props.router,
      desiredPath,
    ],
  );

  const navigate = useCallback((to: string) => {
    history.pushState(null, "", to);
    setDesiredPath(to);
  }, [setDesiredPath]);

  useEffect(() => {
    // sets up event listeners on <a> elements
    initRouter(props.router, navigate);

    window.addEventListener("popstate", (event) => {
      setDesiredPath(location.pathname);
    });
  }, [props.router, navigate]);

  const [[Page, path, match], setPage] = useState<
    [PageComponent | null, string, Record<string, string | string[]>]
  >([
    props.initialPage,
    desiredPath,
    desiredMatch,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (desiredRoute) {
      loadComponent(desiredRoute[1][0](), desiredRoute[1][1], desiredPath).then(
        (page) => {
          if (!cancelled) {
            setPage([page, desiredPath, desiredMatch]);
          }
        },
      );
    } else {
      setPage([null, desiredPath, desiredMatch]);
    }
    () => (cancelled = true);
  }, [desiredRoute, desiredPath, desiredMatch]);

  const App = props.app;
  return (
    <locationCtx.Provider value={[path, navigate]}>
      <div>
        <App>{Page === null ? <Error404 /> : <Page route={match!} />}</App>
      </div>
    </locationCtx.Provider>
  );
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
