import { path, Plugin } from "../../deps/mod.ts";
import type { Page } from "../util.ts";

export function dextjsPlugin(
  pages: Record<string, Page>,
  options: { tsconfigPath: string },
): Plugin {
  const runtimeURL = new URL("./runtime/mod.tsx", import.meta.url)
    .toString();

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
        const bundle =
          `import { h, hydrate, Router, Route, AsyncRoute, Error404, wrap } from "${runtimeURL}";

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
            options,
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
  options: { tsconfigPath: string },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const prerenderHostURL = new URL("./runtime/prerender_host.tsx", import.meta.url);
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "--no-check",
      "-c",
      options.tsconfigPath,
      prerenderHostURL.toString(),
      "file://" + resolvedComponent,
    ],
    stdout: "piped",
    stderr: "inherit",
  });
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
