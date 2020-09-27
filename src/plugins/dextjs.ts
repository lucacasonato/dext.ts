import { resolve, Plugin } from "../../deps/mod.ts";

export interface Page {
  name: string;
  route: string;
}

export function dextjsPlugin(pages: Record<string, Page>): Plugin {
  const preactURL = new URL("../../deps/preact/mod.ts", import.meta.url)
    .toString();
  const preactRouterURL = new URL(
    "../../deps/preact-router/mod.ts",
    import.meta.url,
  ).toString();
  const preactAsyncRouterURL = new URL(
    "../../deps/preact-async-router/mod.js",
    import.meta.url,
  ).toString();

  return {
    name: "dext.ts",
    buildStart() {
      const implicitlyLoadedAfterOneOf = [];
      for (const component in pages) {
        implicitlyLoadedAfterOneOf.push(component);
        this.emitFile({
          id: component,
          name: pages[component].name.replace("/", "-"),
          type: "chunk",
        });
      }
      this.emitFile({
        id: "dextjs:///main.js",
        type: "chunk",
        implicitlyLoadedAfterOneOf,
      });
    },
    resolveId(source, referrer) {
      if (referrer === "dextjs:///main.js") return source;
      return null;
    },
    load(id) {
      if (id == "dextjs:///main.js") {
        const bundle = `import { h, hydrate } from "${preactURL}";
import { Router, Route } from "${preactRouterURL}";
import AsyncRoute from "${preactAsyncRouterURL}";

function App() {
  return (
    <div>
      <Router>
        ${
          Object.entries(pages).map(([id, page]) =>
            `<AsyncRoute path="${page.route}" getComponent={() => import("${id}").then((module) => wrap(module.default))} />`
          ).join("\n        ")
        }
        <Route default component={Error404} />
      </Router>
    </div>
  );
}

function wrap(Component) {
  return (params) => <Component params={params} />;
}

function Error404() {
  return <div>404 not found</div>;
}

hydrate(<App />, document.getElementById("__dext")!);`;
        return bundle;
      }
    },
    async generateBundle(_options, bundle) {
      for (const name in bundle) {
        const file = bundle[name];
        if (file.type === "chunk" && file.isEntry) {
          const component = file.facadeModuleId!;
          const page = pages[component];

          const imports = [
            file.fileName,
            ...file.imports,
            ...file.implicitlyLoadedBefore,
          ];

          const source = await generatePrerenderedHTML(
            component,
            imports,
          );

          this.emitFile({
            type: "asset",
            source,
            name: "denopack HTML Asset",
            fileName: `${page.name}.html`,
          });
        }
      }
    },
  };
}

async function generatePrerenderedHTML(
  component: string,
  imports: string[],
) {
  const resolvedComponent = resolve(Deno.cwd(), component);

  const prerenderHostURL = new URL("./prerenderHost.jsx", import.meta.url);
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "--allow-read",
      "--allow-net",
      "-c",
      "./tsconfig.json",
      prerenderHostURL.toString(),
      resolvedComponent,
    ],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) throw new Error("Failed to prerender page");
  const body = new TextDecoder().decode(out);

  const preloads = imports
    .map((name) => `<link rel="modulepreload" href="/${name}" as="script">`)
    .join("");
  const scripts = imports
    .map((name) => `<script src="/${name}" type="module"></script>`).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${preloads}</head><body><noscript>This page requires JavaScript to function.</noscript><div id="__dext">${body}</div>${scripts}</body></html>`;
}
