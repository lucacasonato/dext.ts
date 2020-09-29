import { path, Plugin } from "../../deps/mod.ts";
import type { Page } from "../util.ts";

export function dextPlugin(
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

function App() {
  return (
    <div>
      <Router>
        ${
            Object.entries(pages).map(([id, page]) =>
              `<AsyncRoute path="${page.route}" getComponent={() => loadComponent(import("${id}"), ${
                page.hasGetStaticData ? `"${page.name}.json"` : `undefined`
              })} />`
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

          const staticData = await getStaticData(component, options);
          const data = staticData?.data;

          if (staticData !== undefined) {
            this.emitFile({
              type: "asset",
              source: JSON.stringify(data),
              name: "dext JSON data",
              fileName: `${page.name}.json`,
            });
          }

          const source = await generatePrerenderedHTML(
            component,
            imports,
            data,
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

async function getStaticData(
  component: string,
  options: { tsconfigPath: string },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const staticDataHostURL = new URL(
    "./runtime/static_data_host.ts",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "--no-check",
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
    throw new Error("Failed to prerender page");
  }
  if (out.length === 0) return undefined;
  const body = new TextDecoder().decode(out);
  return JSON.parse(body);
}

async function generatePrerenderedHTML(
  component: string,
  imports: string[],
  data: unknown,
  options: { tsconfigPath: string },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const prerenderHostURL = new URL(
    "./runtime/prerender_host.tsx",
    import.meta.url,
  );
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
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  await Deno.writeAll(
    proc.stdin,
    new TextEncoder().encode(JSON.stringify(data)),
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
