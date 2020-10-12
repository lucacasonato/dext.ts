import { colors, Command, fs, path } from "../deps/mod.ts";

export function exportCommand() {
  return new Command()
    .command("netlify [root]")
    .description(
      "Export a project for deployment via Netlify.\n\nThe resulting folder can be uploaded to Netlify without changes.",
    )
    .option(
      "--out <folder:string>",
      "The folder to output to.",
      { default: "dist" },
    )
    .action(exportNetlify);
}

type Pagemap = Array<{
  name: string;
  route: string;
  hasGetStaticPaths: boolean;
}>;

async function exportNetlify(options: { out: string }, root?: string) {
  await fs.ensureDir(options.out);

  const dextDir = path.join(root ?? ".", ".dext");
  await fs.copy(path.join(dextDir, "static"), options.out, { overwrite: true });

  const pagemapPath = path.join(dextDir, "pagemap.json");
  if (!(await fs.exists(pagemapPath))) {
    console.log(
      colors.red(
        colors.bold("Error: ") +
          "Page map does not exist. Did you build the project?",
      ),
    );
    Deno.exit(1);
  }
  const pagemap: Pagemap = JSON.parse(await Deno.readTextFile(pagemapPath));

  const rules = pagemap.map((page) => {
    if (!page.hasGetStaticPaths && page.route.includes("/:")) {
      return `${page.route} /${page.name}.html 200`;
    }
    return undefined;
  }).filter((page) => typeof page === "string");

  const redirects = rules.join("\n");
  if (redirects) {
    await Deno.writeTextFile(path.join(options.out, "_redirects"), redirects);
  }

  console.log(colors.green(colors.bold("Export success.\n")));
}
