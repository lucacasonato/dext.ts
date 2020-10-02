import { compile, path, Plugin } from "../../deps/mod.ts";
import type { GetStaticDataContext, GetStaticPaths } from "../type.ts";
import type { Page, Pages } from "../util.ts";

export function dextPlugin(
  pages: Pages,
  options: { tsconfigPath: string; hotRefresh: boolean },
): Plugin {
  const pageMap: Record<string, Page> = {};

  for (const page of pages.pages) {
    pageMap[page.path] = page;
  }

  const runtimeURL = new URL("../runtime/mod.tsx", import.meta.url)
    .toString();
  const hotRefreshURL = new URL("../runtime/hot_refresh.ts", import.meta.url)
    .toString();
  const appURL = pages.app
    ? "file://" + pages.app.path
    : new URL("../runtime/default_app.tsx", import.meta.url)
      .toString();

  return {
    name: "dext.ts",
    buildStart() {
      const implicitlyLoadedAfterOneOf = [];
      for (const component in pageMap) {
        implicitlyLoadedAfterOneOf.push(component);
        this.emitFile({
          id: component,
          name: pageMap[component].name.replace("/", "-"),
          type: "chunk",
        });
      }
      this.emitFile({
        id: "dext:///main.js",
        type: "chunk",
        implicitlyLoadedAfterOneOf,
      });
    },
    resolveId(source, referrer) {
      if (referrer === "dext:///main.js") return source;
      return null;
    },
    load(id) {
      if (id == "dext:///main.js") {
        const bundle =
          `import { h, hydrate, Router, Route, AsyncRoute, Error404, loadComponent } from "${runtimeURL}";
import App from "${appURL}";
${options.hotRefresh ? `import "${hotRefreshURL}";` : ``}

function Dext() {
  return (
    <div>
      <App>
        <Router>
          ${
            Object.entries(pageMap).map(([id, page]) => {
              console.log(id);
              return `<AsyncRoute path="${page.route}" getComponent={(path) => loadComponent(import("${id}"), ${
                page.hasGetStaticData ? "true" : "false"
              }, path)} />`;
            }).join("\n        ")
          }
          <Route default component={Error404} />
        </Router>
      </App>
    </div>
  );
}

hydrate(<Dext />, document.getElementById("__dext")!);`;
        return bundle;
      }
    },
    async generateBundle(_options, bundle) {
      for (const name in bundle) {
        const file = bundle[name];
        if (file.type === "chunk" && file.isEntry) {
          const component = file.facadeModuleId!;
          const page = pageMap[component];

          const imports = [
            file.fileName,
            ...file.imports,
            ...file.implicitlyLoadedBefore,
          ];

          const paths = page.hasGetStaticPaths
            ? (await getStaticPaths(component, options))!
            : { pages: [{ route: {} }] };

          const createPath = compile(page.route);

          for (const page_ of paths.pages) {
            const path = page.hasGetStaticPaths
              ? createPath(page_.route).slice(1)
              : page.name;

            const staticData = await getStaticData(
              component,
              { route: page_.route },
              options,
            );
            const data = staticData?.data;

            if (staticData !== undefined) {
              this.emitFile({
                type: "asset",
                source: JSON.stringify(data),
                name: "dext JSON data",
                fileName: `_dext/${path}.json`,
              });
            }

            const source = await generatePrerenderedHTML(
              component,
              imports,
              { data, route: page_.route },
              { ...options, appURL },
            );

            this.emitFile({
              type: "asset",
              source,
              name: "denopack HTML Asset",
              fileName: `${path}.html`,
            });
          }
        }
      }
    },
  };
}

async function getStaticPaths(
  component: string,
  options: { tsconfigPath: string },
): Promise<GetStaticPaths | undefined> {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const staticDataHostURL = new URL(
    "../runtime/static_paths_host.ts",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      staticDataHostURL.toString(),
      "file://" + resolvedComponent,
    ],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    console.log(out);
    throw new Error("Failed to get static paths");
  }
  if (out.length === 0) return undefined;
  const body = new TextDecoder().decode(out);
  return JSON.parse(body);
}

async function getStaticData(
  component: string,
  context: GetStaticDataContext,
  options: { tsconfigPath: string },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const staticDataHostURL = new URL(
    "../runtime/static_data_host.ts",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      staticDataHostURL.toString(),
      "file://" + resolvedComponent,
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  await Deno.writeAll(
    proc.stdin,
    new TextEncoder().encode(JSON.stringify(context)),
  );
  proc.stdin.close();
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    console.log(out);
    throw new Error("Failed to prerender page");
  }
  if (out.length === 0) return undefined;
  const body = new TextDecoder().decode(out);
  return JSON.parse(body);
}

async function generatePrerenderedHTML(
  component: string,
  imports: string[],
  context: {
    data: unknown;
    route?: Record<string, string | string[]>;
  },
  options: { tsconfigPath: string; appURL: string },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const prerenderHostURL = new URL(
    "../runtime/prerender_host.tsx",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      prerenderHostURL.toString(),
      "file://" + resolvedComponent,
      options.appURL,
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  await Deno.writeAll(
    proc.stdin,
    new TextEncoder().encode(JSON.stringify(context)),
  );
  proc.stdin.close();
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    console.log(out);
    throw new Error("Failed to prerender page");
  }
  const body = new TextDecoder().decode(out);

  const preloads = imports
    .map((name) => `<link rel="modulepreload" href="/${name}" as="script">`)
    .join("");
  const scripts = imports
    .map((name) => `<script src="/${name}" type="module"></script>`).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${preloads}</head><body><noscript>This page requires JavaScript to function.</noscript><div id="__dext">${body}</div>${scripts}</body></html>`;
}
