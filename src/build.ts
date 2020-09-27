import {
  useCache,
  pluginTerserTransform,
  rollup,
  RollupOptions,
  RollupBuild,
  OutputOptions,
  persistSourceMaps,
  emitFiles,
  colors,
} from "../deps/mod.ts";
import { dextjsPlugin, Page } from "./plugins/dextjs.ts";
import { findPages } from "./util.ts";

export async function build() {
  const outputOptions: OutputOptions = {
    dir: "./dist/",
    format: "es",
    sourcemap: true,
    compact: true,
  };

  const pages = await findPages(Deno.cwd());

  const pageMap: Record<string, Page> = {};

  for (const page of pages) {
    pageMap[page.path] = { name: page.name, route: page.route };
  }

  const options: RollupOptions = {
    input: [],
    plugins: [
      dextjsPlugin(pageMap),
      ...useCache(JSON.parse(Deno.readTextFileSync("./tsconfig.json"))),
      // pluginTerserTransform({
      //   module: true,
      //   compress: true,
      //   mangle: true,
      // }),
    ],
    output: outputOptions,
    preserveEntrySignatures: false,
  };

  const outDir = outputOptions.dir!;

  const build = await rollup(options) as RollupBuild;
  const generated = await persistSourceMaps(build.generate, outputOptions);

  try {
    await Deno.remove(outDir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
  await Deno.mkdir(outDir, { recursive: true });
  await emitFiles(generated, outDir);

  console.log(colors.green(colors.bold("Build success")));
}
