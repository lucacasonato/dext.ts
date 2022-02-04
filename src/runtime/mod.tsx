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
import { memo } from "./memo.js";

type Route = [route: string, data: RouteData];
type RouteData = [
  component: () => Promise<{ default: ComponentType<PageProps> }>,
  hasStaticData: boolean,
];

export async function start(routes: Route[], app: ComponentType<AppProps>) {
  const router = new Router<RouteData>(routes);
  const path = window.location.pathname;
  const [route] = router.getRoute(path);
  if (!route) throw new Error("Failed to match inital route.");

  const initialPage = await loadComponent(route[1][0](), route[1][1], path);

  hydrate(
    <Dext router={router} app={app} initialPage={initialPage} />,
    window.document.getElementById("__dext")!,
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
    [props.router, desiredPath],
  );

  const navigate = useCallback(
    (to: string) => {
      window.history.pushState(null, "", to);
      setDesiredPath(new URL(to, location.href).pathname);
    },
    [setDesiredPath],
  );

  useEffect(() => {
    // sets up event listeners on <a> elements
    initRouter(props.router, navigate);

    self.addEventListener("popstate", (event) => {
      setDesiredPath(window.location.pathname);
    });
  }, [props.router, navigate]);

  const [page, setPage] = useState<
    [
      PageComponent | null,
      string,
      string | null,
      Record<string, string | string[]>,
    ]
  >([props.initialPage, desiredPath, desiredRoute?.[0] ?? null, desiredMatch]);

  useEffect(() => {
    let cancelled = false;
    if (desiredRoute) {
      loadComponent(desiredRoute[1][0](), desiredRoute[1][1], desiredPath)
        .then((page) => {
          if (!cancelled) {
            setPage([page, desiredPath, desiredRoute[0], desiredMatch]);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error(err);
            window.location.pathname = desiredPath;
          }
        });
    } else {
      setPage([null, desiredPath, desiredRoute, desiredMatch]);
    }
    (() => (cancelled = true));
  }, [desiredRoute, desiredPath, desiredMatch]);

  return <DextPage App={props.app} page={page} navigate={navigate} />;
}

const DextPage = memo(
  (props: {
    App: ComponentType<AppProps>;
    page: [
      PageComponent | null,
      string,
      string | null,
      Record<string, string | string[]>,
    ];
    navigate: (to: string) => void;
  }) => {
    const { App, page, navigate } = props;
    const [Page, path, pattern, match] = page;
    return (
      <locationCtx.Provider value={[path, navigate, pattern]}>
        <div>
          <App>
            {Page === null
              ? <Error404 />
              : <Page route={match!} />}
          </App>
        </div>
      </locationCtx.Provider>
    );
  },
);

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
