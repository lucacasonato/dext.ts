import {
  brotliEncode,
  emitFiles,
  fs,
  gzipEncode,
  OutputOptions,
  path,
  persistSourceMaps,
  pluginTerserTransform,
  pooledMap,
  rollup,
  RollupBuild,
  RollupCache,
  RollupOptions,
  useCache,
} from "../deps/mod.ts";
import { dextPlugin } from "./plugins/dext.ts";
import type { Page, Pages } from "./util.ts";

export async function bundle(
  pages: Pages,
  options: {
    rootDir: string;
    outDir: string;
    tsconfigPath: string;
    cache?: RollupCache;
    isDev: boolean;
  },
): Promise<RollupCache | undefined> {
  const outputOptions: OutputOptions = {
    dir: options.outDir,
    format: "es",
    sourcemap: true,
    compact: true,
  };

  const tsconfig = JSON.parse(await Deno.readTextFile(options.tsconfigPath));

  const rollupOptions: RollupOptions = {
    input: [],
    plugins: [
      dextPlugin(pages, { tsconfigPath: options.tsconfigPath }),
      ...useCache(tsconfig),
      ...(options.isDev ? [] : [pluginTerserTransform({
        module: true,
        compress: true,
        mangle: true,
      })]),
    ],
    output: outputOptions,
    preserveEntrySignatures: false,
    cache: options.cache,
  };

  const outDir = outputOptions.dir!;

  try {
    await Deno.remove(outDir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }

  const build = await rollup(rollupOptions) as RollupBuild;
  const generated = await persistSourceMaps(build.generate, outputOptions);

  await Deno.mkdir(outDir, { recursive: true });
  await emitFiles(generated, outDir);

  // In production emit .br and .gz files
  if (!options.isDev) {
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
  }

  return build.cache;
}
