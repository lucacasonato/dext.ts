import { compile, path, Plugin, pooledMap } from "../../deps/mod.ts";
import type { GetStaticDataContext, GetStaticPaths } from "../type.ts";
import type { Page, Pages } from "../util.ts";

export function dextPlugin(
  pages: Pages,
  options: {
    tsconfigPath: string;
    hotRefresh: boolean;
    hotRefreshHost?: string;
    typecheck: boolean;
    prerender: boolean;
    debug: boolean;
  },
): Plugin {
  const pageMap: Record<string, Page> = {};

  for (const page of pages.pages) {
    pageMap[page.path] = page;
  }

  const runtimeURL = new URL("../runtime/mod.tsx", import.meta.url).toString();
  const hotRefreshURL = new URL(
    "../runtime/hot_refresh.ts",
    import.meta.url,
  ).toString();
  const debugURL = new URL(
    "../../deps/preact/debug.ts",
    import.meta.url,
  ).toString();
  const documentURL = pages.document
    ? new URL(`file:///${pages.document.path}`).toString()
    : new URL("../runtime/default_document.tsx", import.meta.url).toString();
  const appURL = pages.app
    ? new URL(`file:///${pages.app.path}`).toString()
    : new URL("../runtime/default_app.tsx", import.meta.url).toString();

  return {
    name: "dext.ts",
    buildStart() {
      const implicitlyLoadedAfterOneOf = [];
      for (const component in pageMap) {
        implicitlyLoadedAfterOneOf.push(component);
        this.emitFile({
          name: pageMap[component].name.replace("/", "-"),
          id: "dext-page:///" + component,
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
      if (referrer?.startsWith("dext-page:///")) {
        return this.resolve(source, referrer.substring("dext-page:///".length));
      }
      return null;
    },
    load(id) {
      if (id.startsWith("dext-page:///")) {
        return `export { default } from "${
          id.substring(
            "dext-page:///".length,
          )
        }";`;
      }
      if (id == "dext:///main.js") {
        const routes = Object.entries(pageMap)
          .map(([id, page]) => {
            return `["${page.route}", [() => import("dext-page:///${id}"), ${
              page.hasGetStaticData ? "true" : "false"
            }]]`;
          })
          .join(",");
        const bundle = `${options.debug ? `import "${debugURL}";` : ""}
        import { start } from "${runtimeURL}";
import App from "${appURL}";
${
          options.hotRefresh
            ? `import hotRefresh from "${hotRefreshURL}"; hotRefresh(${
              options.hotRefreshHost
                ? JSON.stringify(options.hotRefreshHost)
                : ""
            });`
            : ``
        }

start([${routes}], App);`;
        return bundle;
      }
    },
    async generateBundle(_options, bundle) {
      const documentTemplate = await prerenderDocument(documentURL, options);

      const pages = pooledMap(10, Object.keys(bundle), async (name) => {
        const file = bundle[name];
        if (file.type === "chunk" && file.isEntry) {
          const component = file.facadeModuleId!.substring(
            "dext-page:///".length,
          );
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

          const pages = pooledMap(10, paths.pages, async (page_) => {
            const path = page.hasGetStaticPaths
              ? createPath(page_.route).slice(1)
              : page.name;

            const staticData = page.hasGetStaticData
              ? await getStaticData(component, { route: page_.route }, options)
              : undefined;
            const data = staticData?.data;

            if (staticData !== undefined) {
              this.emitFile({
                type: "asset",
                source: JSON.stringify(data),
                name: "dext JSON data",
                fileName: `_dext/${path}.json`,
              });
            }

            const body = options.prerender
              ? await prerenderPage(
                component,
                { data, route: page_.route, pattern: page.route },
                {
                  ...options,
                  appURL,
                  location: `https://dext-prerender.local/${path}`,
                },
              )
              : "";

            const source = buildHTMLPage({ imports, body, documentTemplate });

            this.emitFile({
              type: "asset",
              source,
              name: "denopack HTML Asset",
              fileName: `${path}.html`,
            });
          });

          for await (const _ of pages) {
            // do nothing :-)
          }
        }
      });

      for await (const _ of pages) {
        // do nothing :-)
      }
    },
  };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function noNewlineLog(str: string) {
  // deno-lint-ignore no-deprecated-deno-api
  await Deno.writeAll(Deno.stdout, encoder.encode(str));
}

async function getStaticPaths(
  component: string,
  options: { tsconfigPath: string; typecheck: boolean },
): Promise<GetStaticPaths | undefined> {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const staticDataHostURL = new URL(
    "../runtime/static_paths_host.ts",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      ...(options.typecheck ? [] : ["--no-check"]),
      staticDataHostURL.toString(),
      new URL(`file:///${resolvedComponent}`).toString(),
    ],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    throw new Error("Failed to get static paths");
  }
  if (out.length === 0) return undefined;
  const body = decoder.decode(out);
  return JSON.parse(body);
}

async function getStaticData(
  component: string,
  context: GetStaticDataContext,
  options: { tsconfigPath: string; typecheck: boolean },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);

  const staticDataHostURL = new URL(
    "../runtime/static_data_host.ts",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      ...(options.typecheck ? [] : ["--no-check"]),
      staticDataHostURL.toString(),
      new URL(`file:///${resolvedComponent}`).toString(),
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  // deno-lint-ignore no-deprecated-deno-api
  await Deno.writeAll(
    proc.stdin,
    new TextEncoder().encode(JSON.stringify(context)),
  );
  proc.stdin.close();
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    throw new Error("Failed to get static data");
  }
  if (out.length === 0) return undefined;
  const body = decoder.decode(out);
  return JSON.parse(body);
}

async function prerenderDocument(
  documentURL: string,
  options: { tsconfigPath: string; typecheck: boolean },
) {
  const prerenderHostURL = new URL(
    "../runtime/prerender_document_host.tsx",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      ...(options.typecheck ? [] : ["--no-check"]),
      prerenderHostURL.toString(),
      documentURL,
    ],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    throw new Error("Failed to prerender document");
  }
  const stdout = decoder.decode(out);
  const [start, documentAndEnd] = stdout.split("<!--dextstart-->", 2);
  const [document, end] = documentAndEnd.split("<!--dextend-->", 2);
  if (start) noNewlineLog(start);
  if (end) noNewlineLog(end);
  return `<!DOCTYPE html>${document}`;
}

async function prerenderPage(
  component: string,
  context: {
    data: unknown;
    route?: Record<string, string | string[]>;
    pattern: string | null;
  },
  options: {
    location: string;
    tsconfigPath: string;
    appURL: string;
    typecheck: boolean;
  },
) {
  const resolvedComponent = path.resolve(Deno.cwd(), component);
  const prerenderHostURL = new URL(
    "../runtime/prerender_page_host.tsx",
    import.meta.url,
  );
  const proc = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "-A",
      "-q",
      "-c",
      options.tsconfigPath,
      "--location",
      options.location,
      ...(options.typecheck ? [] : ["--no-check"]),
      prerenderHostURL.toString(),
      new URL(`file:///${resolvedComponent}`).toString(),
      options.appURL,
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  // deno-lint-ignore no-deprecated-deno-api
  await Deno.writeAll(
    proc.stdin,
    new TextEncoder().encode(JSON.stringify(context)),
  );
  proc.stdin.close();
  const out = await proc.output();
  const { success } = await proc.status();
  if (!success) {
    throw new Error("Failed to prerender page");
  }
  const stdout = decoder.decode(out);
  const [start, bodyAndEnd] = stdout.split("<!--dextstart-->", 2);
  const [body, end] = bodyAndEnd.split("<!--dextend-->", 2);
  if (start) noNewlineLog(start);
  if (end) noNewlineLog(end);
  return body;
}

function buildHTMLPage({
  imports,
  body,
  documentTemplate,
}: {
  imports: string[];
  body: string;
  documentTemplate: string;
}) {
  const preloads = imports
    .map((name) => `<link rel="modulepreload" href="/${name}" as="script">`)
    .join("");
  const scripts = imports
    .map((name) => `<script src="/${name}" type="module"></script>`)
    .join("");

  return documentTemplate
    .replace("</head>", `${preloads}</head>`)
    .replace("</body>", `<div id="__dext">${body}</div>${scripts}</body>`);
}
