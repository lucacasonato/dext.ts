import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.72.0/testing/asserts.ts";
import { exists } from "https://deno.land/std@0.72.0/fs/mod.ts";

Deno.test("[integration test] simple", async () => {
  await Deno.remove("./tests/fixtures/simple/.dext", { recursive: true });

  const proc = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", "../../../cli.ts", "build"],
    cwd: "./tests/fixtures/simple",
  });
  const status = await proc.status();
  assert(status.success);
  proc.close();

  const pagemap = JSON.parse(
    await Deno.readTextFile(
      "./tests/fixtures/simple/.dext/pagemap.json",
    ),
  );
  assertEquals(pagemap, [
    {
      name: "index",
      route: "/",
    },
  ]);

  assert(await exists("./tests/fixtures/simple/.dext/static/index.html"));
  assert(await exists("./tests/fixtures/simple/.dext/static/index.html.gz"));
  assert(await exists("./tests/fixtures/simple/.dext/static/index.html.br"));
});
