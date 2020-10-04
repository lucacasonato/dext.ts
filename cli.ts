import {
  colors,
  Command,
  CompletionsCommand,
  debounce,
  deferred,
  fs,
  path,
  prettyBytes,
  RollupCache,
  Table,
} from "./deps/mod.ts";
import { bundle } from "./src/bundle.ts";
import { dependencyList } from "./src/dependency_graph.ts";
import { serve } from "./src/serve.ts";
import { findPages } from "./src/util.ts";

const VERSION = "0.5.0";

try {
  await new Command()
    .throwErrors()
    .name("dext")
    .version(VERSION)
    .description("The Preact Framework for Deno")
    .action(function () {
      console.log(this.getHelp());
    })
    .command("build [root]")
    .description("Build your application.")
    .action(build)
    .command("start [root]")
    .option(
      "-a --address <address>",
      "The address to listen on.",
      { default: ":3000" },
    )
    .option("--quiet", "If access logs should be printed.")
    .description("Start a built application.")
    .action(start)
    .command("dev [root]")
    .option(
      "-a --address <address>",
      "The address to listen on.",
      { default: ":3000" },
    )
    .option(
      "--hot-refresh [enabled:boolean]",
      "If hot refresh should be disabled.",
      { default: true },
    )
    .description("Start your application in development mode.")
    .action(dev)
    .command("create [root]")
    .description("Scaffold new application.")
    .action(create)
    .command("completions", new CompletionsCommand())
    .parse(Deno.args);
} catch (err) {
  console.log(colors.red(colors.bold("error: ")) + err.message);
}

async function build(_options: unknown, root?: string) {
  root = path.resolve(Deno.cwd(), root ?? "");

  const tsconfigPath = path.join(root, "tsconfig.json");
  if (!await fs.exists(tsconfigPath)) {
    console.log(colors.red(
      colors.bold("Error: ") +
        "Missing tsconfig.json file.",
    ));
    Deno.exit(1);
  }

  // Collect list of all pages
  const pagesDir = path.join(root, "pages");
  const pages = await findPages(pagesDir);

  // Create .dext folder and emit page map
  const dextDir = path.join(root, ".dext");
  await fs.ensureDir(dextDir);
  const pagemapPath = path.join(dextDir, "pagemap.json");
  await Deno.writeTextFile(
    pagemapPath,
    JSON.stringify(pages.pages.map((page) => ({
      name: page.name,
      route: page.route,
      hasGetStaticPaths: page.hasGetStaticPaths,
    }))),
  );

  // Do bundling
  const outDir = path.join(dextDir, "static");
  const { stats } = await bundle(
    pages,
    { rootDir: root, outDir, tsconfigPath, isDev: false, hotRefresh: false },
  );
  console.log(colors.green(colors.bold("Build success.\n")));

  if (stats) {
    const sharedKeys = Object.keys(stats.shared);

    new Table()
      .header([
        colors.bold("Page"),
        colors.bold("Size"),
        colors.bold("First Load JS"),
      ])
      .body(
        [
          ...stats.routes.map((route, i) => {
            const prefix = stats.routes.length === 1
              ? "-"
              : i === 0
              ? "┌"
              : i === stats.routes.length - 1
              ? "└"
              : "├";

            return [
              `${prefix} ${route.hasGetStaticData ? "●" : "○"} ${route.route}`,
              prettyBytes(route.size.brotli),
              prettyBytes(route.firstLoad.brotli),
            ];
          }),
          [],
          [
            "+ First Load JS shared by all",
            prettyBytes(stats.framework.brotli),
            "",
          ],
          ...sharedKeys.map((name, i) => {
            const size = stats.shared[name];
            const isLast = i === (sharedKeys.length - 1);
            return [
              `  ${isLast ? "└" : "├"} ${name}`,
              prettyBytes(size.brotli),
              "",
            ];
          }),
        ],
      ).padding(2).render();
    console.log();
    console.log("○  (Static)  automatically rendered as static HTML");
    console.log(
      "●  (SSG)     automatically generated as static HTML + JSON (uses getStaticData)",
    );
    console.log();
    console.log(
      colors.gray("File sizes are measured after brotli compression."),
    );
  }
}

async function start(
  options: { address: string; quiet: boolean },
  root?: string,
) {
  root = path.resolve(Deno.cwd(), root ?? "");

  const dextDir = path.join(root, ".dext");
  const pagemapPath = path.join(dextDir, "pagemap.json");
  if (!await fs.exists(pagemapPath)) {
    console.log(colors.red(
      colors.bold("Error: ") +
        "Page map does not exist. Did you build the project?",
    ));
    Deno.exit(1);
  }
  const pagemap = JSON.parse(await Deno.readTextFile(pagemapPath));

  const staticDir = path.join(dextDir, "static");

  await serve(
    pagemap,
    { staticDir, address: options.address, quiet: options.quiet },
  );
}

async function dev(
  options: { address: string; hotRefresh: boolean },
  maybeRoot?: string,
) {
  const root = path.resolve(Deno.cwd(), maybeRoot ?? "");

  const tsconfigPath = path.join(root, "tsconfig.json");
  if (!await fs.exists(tsconfigPath)) {
    console.log(colors.red(
      colors.bold("Error: ") +
        "Missing tsconfig.json file.",
    ));
    Deno.exit(1);
  }

  let cache: RollupCache = { modules: [] };

  // Collect list of all pages
  const pagesDir = path.join(root, "pages");
  const pages = await findPages(pagesDir);

  const dextDir = path.join(root, ".dext");
  await fs.ensureDir(dextDir);
  const outDir = path.join(dextDir, "static");

  let doHotRefresh = deferred();
  const hotRefresh = (async function* () {
    while (true) {
      await doHotRefresh;
      doHotRefresh = deferred();
      yield;
    }
  })();

  const run = debounce(async function () {
    const start = new Date();
    console.log(colors.cyan(colors.bold("Started build...")));

    try {
      const out = (await bundle(
        pages,
        {
          rootDir: root,
          outDir,
          tsconfigPath,
          cache,
          isDev: true,
          hotRefresh: options.hotRefresh,
        },
      ));
      cache = out.cache!;
      doHotRefresh.resolve();
      console.log(
        colors.green(
          colors.bold(
            `Build success done ${
              (new Date().getTime() - start.getTime()).toFixed(0)
            }ms`,
          ),
        ),
      );
    } catch (err) {
      if (err.message != "Failed to prerender page") {
        console.log(colors.red(colors.bold("error: ")) + err.message);
      }
    }
  }, 100);

  const pagesPaths = pages.pages.map((page) => page.path);
  if (pages.app) pagesPaths.push(pages.app.path);
  const deps = await dependencyList(pagesPaths);
  const toWatch = deps
    .filter((dep) => dep.startsWith(`file://`))
    .map(path.fromFileUrl)
    .filter((dep) => dep.startsWith(root));

  (async () => {
    for await (const { kind } of Deno.watchFs(toWatch)) {
      if (kind === "any" || kind === "access") continue;
      await run();
    }
  })();

  const server = serve(
    pages.pages,
    {
      staticDir: outDir,
      address: options.address,
      quiet: true,
      hotRefresh,
    },
  );

  await run();
  await server;
}

async function create(_options: unknown, maybeRoot?: string) {
  const root = path.resolve(Deno.cwd(), maybeRoot ?? "");
  await fs.ensureDir(root);

  const gitIgnorePath = path.join(root, ".gitignore");
  await Deno.writeTextFile(gitIgnorePath, "/.dext\n");

  const tsconfigPath = path.join(root, "tsconfig.json");
  await Deno.writeTextFile(
    tsconfigPath,
    JSON.stringify({
      "compilerOptions": {
        "lib": ["esnext", "dom", "deno.ns"],
        "jsx": "react",
        "jsxFactory": "h",
        "jsxFragmentFactory": "Fragment",
        "importsNotUsedAsValues": "error",
        "isolatedModules": true,
      },
    }),
  );

  const pagesDir = path.join(root, "pages");
  await fs.ensureDir(pagesDir);

  const depsPath = path.join(root, "deps.ts");
  const depsText =
    `export { Fragment, h } from "https://deno.land/x/dext@${VERSION}/deps/preact/mod.ts";
export type {
  AppProps,
  GetStaticData,
  GetStaticDataContext,
  GetStaticPaths,
  PageProps,
} from "https://deno.land/x/dext@${VERSION}/mod.ts";
`;
  await Deno.writeTextFile(depsPath, depsText);

  const indexPath = path.join(pagesDir, "index.tsx");
  const indexText = `import { h, Fragment } from "../deps.ts";
import type { PageProps, GetStaticData } from "../deps.ts";

interface Data {
  random: string;
}

function IndexPage(props: PageProps<Data>) {
  return (
    <>
      <h1>Hello World!!!</h1>
      <p>This is the index page.</p>
      <p>The random is {props.data.random}.</p>
      <p>
        <a href="/user/lucacasonato">Go to @lucacasonato</a>
      </p>
    </>
  );
}

export const getStaticData = (): GetStaticData<Data> => {
  return {
    data: {
      random: Math.random().toString(),
    },
  };
};

export default IndexPage;
`;
  await Deno.writeTextFile(indexPath, indexText);

  const userDir = path.join(pagesDir, "user");
  await fs.ensureDir(userDir);

  const userPath = path.join(userDir, "[name].tsx");
  const userText = `import { h, Fragment } from "../../deps.ts";
import type { PageProps } from "../../deps.ts";

function UserPage(props: PageProps) {
  const name = props.route?.name ?? "";

  return (
    <>
      <h1>This is the page for {name}</h1>
      <p>
        <a href="/">Go home</a>
      </p>
    </>
  );
}

export default UserPage;
`;
  await Deno.writeTextFile(userPath, userText);

  console.log(colors.green(colors.bold(`New project created in ${root}`)));
}
