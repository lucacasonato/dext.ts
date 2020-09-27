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
  path,
  gzipEncode,
  brotliEncode,
  pooledMap,
  fs,
} from "../deps/mod.ts";
import { dextjsPlugin } from "./plugins/dextjs.ts";
import type { Page } from "./util.ts";

export async function bundle(
  pages: Page[],
  options: { rootDir: string; outDir: string; tsconfigPath: string },
) {
  const outputOptions: OutputOptions = {
    dir: path.join(options.outDir, "static"),
    format: "es",
    sourcemap: true,
    compact: true,
  };

  const pageMap: Record<string, Page> = {};

  for (const page of pages) {
    pageMap[page.path] = page;
  }

  const tsconfig = JSON.parse(await Deno.readTextFile(options.tsconfigPath));

  const rollupOptions: RollupOptions = {
    input: [],
    plugins: [
      dextjsPlugin(pageMap, { tsconfigPath: options.tsconfigPath }),
      ...useCache(tsconfig),
      pluginTerserTransform({
        module: true,
        compress: true,
        mangle: true,
      }),
    ],
    output: outputOptions,
    preserveEntrySignatures: false,
  };

  const outDir = outputOptions.dir!;

  const build = await rollup(rollupOptions) as RollupBuild;
  const generated = await persistSourceMaps(build.generate, outputOptions);

  try {
    await Deno.remove(outDir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
  await Deno.mkdir(outDir, { recursive: true });
  await emitFiles(generated, outDir);

  const outGlob = path.join(outDir, "/**/*");
  const res = pooledMap(
    50,
    fs.expandGlob(
      outGlob,
      {
        exclude: [outGlob + ".br", outGlob + ".gz"],
        globstar: true,
        includeDirs: false,
      },
    ),
    async (entry) => {
      const path = entry.path;
      const file = await Deno.readFile(path);
      await Deno.writeFile(path + ".gz", gzipEncode(file));
      await Deno.writeFile(path + ".br", brotliEncode(file, undefined, 11));
    },
  );

  for await (const _ of res) {
    // wait for all files to be processed
  }

  console.log(colors.green(colors.bold("Build success.")));
}
