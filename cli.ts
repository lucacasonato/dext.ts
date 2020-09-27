import {
  colors,
  Command,
  CompletionsCommand,
  fs,
  oak,
  path,
  dateFormat,
} from "./deps/mod.ts";
import { bundle } from "./src/bundle.ts";
import { findPages } from "./src/util.ts";

await new Command()
  .name("dext")
  .version("0.1.0")
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
  .description("Start a built application.")
  .action(start)
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);

async function build(_options: unknown, root?: string) {
  root = path.resolve(Deno.cwd(), root ?? "");

  const tsconfigPath = path.join(root, "tsconfig.json");
  if (!await fs.exists(tsconfigPath)) {
    console.log(colors.red(
      colors.bold("Error: ") +
        "Missing tsconfig.json file.",
    ));
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
  await bundle(pages, { rootDir: root, outDir: dextDir, tsconfigPath });
}

async function start(options: { address: string }, root?: string) {
  root = path.resolve(Deno.cwd(), root ?? "");

  const dextDir = path.join(root, ".dext");
  const pagemapPath = path.join(dextDir, "pagemap.json");
  if (!await fs.exists(pagemapPath)) {
    console.log(colors.red(
      colors.bold("Error: ") +
        "Page map does not exist. Did you build the project?",
    ));
  }
  const pagemap = JSON.parse(await Deno.readTextFile(pagemapPath));

  const staticDir = path.join(dextDir, "static");

  const router = new oak.Router();

  for (const page of pagemap) {
    router.get(
      page.route,
      async (context) => {
        await oak.send(context, page.name + ".html", { root: staticDir });
      },
    );
  }

  const app = new oak.Application();

  app.use(async (ctx, next) => {
    const now = new Date();
    await next();
    console.log(
      `[${
        dateFormat(now, "yyyy-MM-dd HH:mm:ss")
      }] ${ctx.request.method} ${ctx.request.url}`,
    );
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (context) => {
    await oak.send(context, context.request.url.pathname, {
      root: staticDir,
    });
  });

  app.addEventListener("listen", ({ hostname, port }) => {
    console.log(colors.green(
      `Listening on http://${hostname || "127.0.0.1"}:${port}`,
    ));
  });

  await app.listen(options.address);
}
