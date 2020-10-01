export { rollup } from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/deps.ts";
export type {
  ModuleFormat,
  OutputAsset,
  OutputBundle,
  OutputChunk,
  OutputOptions,
  Plugin,
  ResolveIdResult,
  RollupBuild,
  RollupCache,
  RollupOptions,
  RollupOutput,
} from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/deps.ts";

export { useCache } from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/plugin/mod.ts";
export { pluginTerserTransform } from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/plugin/terserTransform/mod.ts";

export { persistSourceMaps } from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/cli/persistSourceMaps.ts";
export { emitFiles } from "https://raw.githubusercontent.com/lucacasonato/denopack/lucafixed/cli/emitFiles.ts";

// std
export * as colors from "https://deno.land/std@0.71.0/fmt/colors.ts";
export * as path from "https://deno.land/std@0.71.0/path/mod.ts";
export * as fs from "https://deno.land/std@0.71.0/fs/mod.ts";
export { pooledMap } from "https://deno.land/std@0.68.0/async/pool.ts";
export { format as dateFormat } from "https://deno.land/std@0.71.0/datetime/mod.ts";

export {
  Command,
  CompletionsCommand,
  HelpCommand,
} from "https://deno.land/x/cliffy@v0.14.1/command/mod.ts";

// path_to_regexp
export * as oak from "https://deno.land/x/oak@v6.2.0/mod.ts";
// path_to_regexp
export { compile } from "https://deno.land/x/oak@v6.2.0/deps.ts";

export { gzipEncode } from "https://deno.land/x/wasm_gzip@v1.0.0/mod.ts";
export { compress as brotliEncode } from "https://deno.land/x/brotli@v0.1.4/mod.ts";

import { default as _debounce } from "https://unpkg.com/lodash-es@4.17.15/debounce.js";
export const debounce = _debounce as <
  T extends (...args: unknown[]) => unknown,
>(
  func: T,
  wait?: number,
  options?: {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
  },
) => T;
