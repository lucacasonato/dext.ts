import { assertEquals } from "../deps/test.ts";
import { checkHasDataHooks } from "./util.ts";

Deno.test("data hooks analysis", async () => {
  const cases: Record<string, unknown> = {
    "./tests/fixtures/full/simple/pages/index.tsx": {
      hasGetStaticPaths: false,
      hasGetStaticData: false,
    },
    "./tests/fixtures/full/static_generation/pages/index.tsx": {
      hasGetStaticPaths: false,
      hasGetStaticData: true,
    },
    "./tests/fixtures/full/static_generation/pages/uppercase/[str].tsx": {
      hasGetStaticPaths: true,
      hasGetStaticData: true,
    },
    "./tests/fixtures/dataHooks/get_static_data_const.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: true,
    },
    "./tests/fixtures/dataHooks/get_static_data_fn.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: true,
    },
    "./tests/fixtures/dataHooks/get_static_data_let.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: true,
    },
    "./tests/fixtures/dataHooks/get_static_data_var.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: true,
    },
    "./tests/fixtures/dataHooks/get_static_data_class.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: false,
    },
    "./tests/fixtures/dataHooks/get_static_data_interface.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: false,
    },
    "./tests/fixtures/dataHooks/get_static_data_type.ts": {
      hasGetStaticPaths: false,
      hasGetStaticData: false,
    },
  };

  for (const case_ in cases) {
    assertEquals(await checkHasDataHooks(case_), cases[case_]);
  }
});
