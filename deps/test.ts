export {
  assert,
  assertEquals,
  assertStringContains,
} from "https://deno.land/std@0.72.0/testing/asserts.ts";
export { exists } from "https://deno.land/std@0.72.0/fs/mod.ts";
import { path } from "./mod.ts";
export const join = path.join;
