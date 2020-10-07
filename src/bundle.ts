import {
  brotliEncode,
  emitFiles,
  fs,
  gzipEncode,
  OutputChunk,
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
import type { Pages } from "./util.ts";

export interface BundleStats {
  framework: FileSize;
  routes: BundleStatsRoute[];
  shared: Record<string, FileSize>;
}

export interface BundleStatsRoute {
  firstLoad: FileSize;
  size: FileSize;
  route: string;
  hasGetStaticData: boolean;
}

export interface FileSize {
  raw: number;
  gzip: number;
  brotli: number;
}

export async function bundle(
  pages: Pages,
  options: {
    rootDir: string;
    outDir: string;
    tsconfigPath: string;
    cache?: RollupCache;
    typecheck: boolean;
    minify: boolean;
    prerender: boolean;
    hotRefresh: boolean;
    hotRefreshHost?: string;
  },
): Promise<{ cache: RollupCache | undefined; stats: BundleStats | undefined }> {
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
      dextPlugin(
        pages,
        {
          tsconfigPath: options.tsconfigPath,
          hotRefresh: options.hotRefresh,
          hotRefreshHost: options.hotRefreshHost,
          typecheck: options.typecheck,
          prerender: options.prerender,
        },
      ),
      ...useCache(tsconfig),
      ...(options.minify
        ? [pluginTerserTransform({
          module: true,
          compress: true,
          mangle: true,
        })]
        : []),
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

  const publicDir = path.join(options.rootDir, "public");
  if (await fs.exists(publicDir)) {
    await fs.copy(publicDir, outDir);
  } else {
    await Deno.mkdir(outDir, { recursive: true });
  }
  await emitFiles(generated, outDir);

  let stats: BundleStats | undefined = undefined;

  // In production emit .br and .gz files
  if (options.minify) {
    const fileStats: Record<string, FileSize> = {};

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
        const gz = gzipEncode(file);
        await Deno.writeFile(path + ".gz", gz);
        const br = brotliEncode(file, undefined, 11);
        await Deno.writeFile(path + ".br", br);
        fileStats[path.slice(outDir.length).replace("\\", "/")] = {
          raw: file.length,
          gzip: gz.length,
          brotli: br.length,
        };
      },
    );

    for await (const _ of res) {
      // wait for all files to be processed
    }

    const routes: BundleStatsRoute[] = [];
    const shared: Record<string, FileSize> = {};

    const chunks = generated.output.filter((d) =>
      d.type === "chunk"
    ) as OutputChunk[];

    for (const out of chunks) {
      const filename = `/${out.fileName}`;
      if (out.facadeModuleId && out.facadeModuleId.startsWith("dext-page://")) {
        const page = pages.pages.find((p) =>
          p.path === out.facadeModuleId!.substring("dext-page://".length)
        )!;
        const imports = [
          ...flattenImports(chunks, out.fileName),
          ...out.implicitlyLoadedBefore,
        ];
        const firstLoad = { ...fileStats[filename] };
        for (const fileName of imports) {
          const stats = fileStats[`/${fileName}`];
          firstLoad.raw += stats.raw;
          firstLoad.gzip += stats.gzip;
          firstLoad.brotli += stats.brotli;
        }

        routes.push({
          route: page.route,
          size: fileStats[filename],
          firstLoad,
          hasGetStaticData: page.hasGetStaticData,
        });
      } else if (out.facadeModuleId === "dext:///main.js") {
        shared[filename] = fileStats[filename];
        const imports = flattenImports(chunks, out.fileName);
        for (const fileName of imports) {
          const filename = `/${fileName}`;
          shared[filename] = fileStats[filename];
        }
      }
    }

    const framework: FileSize = { raw: 0, gzip: 0, brotli: 0 };
    for (const filename in shared) {
      const stats = fileStats[filename];
      framework.raw += stats.raw;
      framework.gzip += stats.gzip;
      framework.brotli += stats.brotli;
    }

    stats = {
      routes: routes.sort((a, b) =>
        (a.route > b.route) ? 1 : ((b.route > a.route) ? -1 : 0)
      ),
      shared,
      framework,
    };
  }

  return { cache: build.cache, stats };
}

function flattenImports(
  chunks: OutputChunk[],
  fileName: string,
  visited: string[] = [],
): string[] {
  const chunk = chunks.find((chunk) => chunk.fileName = fileName);
  if (!chunk) throw new Error("Failed to find chunk " + fileName);
  return [
    ...new Set(chunk.imports.flatMap(
      (fileName) => {
        if (visited.includes(fileName)) return [];
        visited.push(fileName);
        return [fileName, ...flattenImports(chunks, fileName, visited)];
      },
    )),
  ];
}
