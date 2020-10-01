import {
  colors,
  Command,
  CompletionsCommand,
  debounce,
  fs,
  path,
  RollupCache,
} from "./deps/mod.ts";
import { bundle } from "./src/bundle.ts";
import { dependencyList } from "./src/dependency_graph.ts";
import { serve } from "./src/serve.ts";
import { findPages } from "./src/util.ts";

try {
  await new Command()
    .throwErrors()
    .name("dext")
    .version("0.4.0")
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
    .option(
      "--quiet",
      "If access logs should be printed.",
    )
    .description("Start a built application.")
    .action(start)
    .command("dev [root]")
    .option(
      "-a --address <address>",
      "The address to listen on.",
      { default: ":3000" },
    )
    .description("Start your application in development mode.")
    .action(dev)
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
    JSON.stringify(pages.map((page) => ({
      name: page.name,
      route: page.route,
    }))),
  );

  // Do bundling
  const outDir = path.join(dextDir, "static");
  await bundle(pages, { rootDir: root, outDir, tsconfigPath, isDev: false });
  console.log(colors.green(colors.bold("Build success.")));
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

async function dev(options: { address: string }, maybeRoot?: string) {
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

  const run = debounce(async function () {
    const start = new Date();
    console.log(colors.cyan(colors.bold("Started build...")));

    try {
      cache = (await bundle(
        pages,
        { rootDir: root, outDir, tsconfigPath, cache, isDev: true },
      ))!;
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

  const deps = (await dependencyList(pages.map((page) => page.path)));
  const toWatch = deps
    .filter((dep) => dep.startsWith(`file://`))
    .map(path.fromFileUrl)
    .filter((dep) => dep.startsWith(root));

  const server = serve(
    pages,
    { staticDir: outDir, address: options.address, quiet: true },
  );

  await run();

  const watcher = (async () => {
    for await (const { kind } of Deno.watchFs(toWatch)) {
      if (kind === "any" || kind === "access") continue;
      await run();
    }
  })();

  await Promise.all([server, watcher]);
}
