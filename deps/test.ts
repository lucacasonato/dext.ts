export {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
export {
  copy,
  ensureDir,
  exists,
} from "https://deno.land/std@0.84.0/fs/mod.ts";
import { path } from "./mod.ts";
export const join = path.join;
