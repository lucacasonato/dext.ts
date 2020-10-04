import {
  assert,
  assertEquals,
  assertStringContains,
  exists,
  join,
} from "../deps/test.ts";
import { integrationTest } from "./test_utils.ts";

integrationTest({
  name: "simple",
  cmd: ["build"],
  clean: true,
  async after(ctx) {
    assert(ctx.status.success);

    assertEquals(
      JSON.parse(
        await Deno.readTextFile(join(ctx.dir, ".dext", "pagemap.json")),
      ),
      [{ name: "index", route: "/", hasGetStaticPaths: false }],
    );

    const staticdir = join(ctx.dir, ".dext", "static");

    const indexhtml = join(staticdir, "index.html");
    assert(await exists(indexhtml));
    assert(await exists(`${indexhtml}.gz`));
    assert(await exists(`${indexhtml}.br`));

    const index = await Deno.readTextFile(indexhtml);
    assertStringContains(index, `<div id="__dext">`);
    assertStringContains(index, "<h1>Hello World</h1>");

    assertEquals(
      await Deno.readTextFile(join(staticdir, "test.txt")),
      "hello world",
    );
  },
});

integrationTest({
  name: "static_generation",
  cmd: ["build"],
  clean: true,
  async after(ctx) {
    assert(ctx.status.success);

    assertEquals(
      JSON.parse(
        await Deno.readTextFile(join(ctx.dir, ".dext", "pagemap.json")),
      ),
      [
        { name: "index", route: "/", hasGetStaticPaths: false },
        {
          name: "uppercase/[str]",
          route: "/uppercase/:str",
          hasGetStaticPaths: true,
        },
      ],
    );

    const staticdir = join(ctx.dir, ".dext", "static");

    const indexhtml = join(staticdir, "index.html");
    assert(await exists(indexhtml));
    assert(await exists(`${indexhtml}.gz`));
    assert(await exists(`${indexhtml}.br`));
    const html = await Deno.readTextFile(indexhtml);
    assertStringContains(html, `<div id="__dext">`);
    assertStringContains(html, "<h1>Hello world</h1>");

    const lucaPath = join(staticdir, "uppercase", "luca.html");
    assertStringContains(
      await Deno.readTextFile(lucaPath),
      "<h1>luca LUCA</h1>",
    );
    const bartekPath = join(staticdir, "uppercase", "bartek.html");
    assertStringContains(
      await Deno.readTextFile(bartekPath),
      "<h1>bartek BARTEK</h1>",
    );
    const ryanPath = join(staticdir, "uppercase", "ryan.html");
    assertStringContains(
      await Deno.readTextFile(ryanPath),
      "<h1>ryan RYAN</h1>",
    );

    const indexJSONPath = join(staticdir, "_dext", "index.json");
    assert(await exists(indexhtml));
    assertEquals(await Deno.readTextFile(indexJSONPath), `{"hello":"world"}`);

    const lucaJSONPath = join(staticdir, "_dext", "uppercase", "luca.json");
    assertEquals(await Deno.readTextFile(lucaJSONPath), `{"str":"LUCA"}`);
    const bartekJSONPath = join(staticdir, "_dext", "uppercase", "bartek.json");
    assertEquals(await Deno.readTextFile(bartekJSONPath), `{"str":"BARTEK"}`);
    const ryanJSONPath = join(staticdir, "_dext", "uppercase", "ryan.json");
    assertEquals(await Deno.readTextFile(ryanJSONPath), `{"str":"RYAN"}`);
  },
});

integrationTest({
  name: "simple_create",
  cmd: ["create"],
  clean: true,
  async after(ctx) {
    assert(ctx.status.success);

    const expectedFiles = [
      ".gitignore",
      "deps.ts",
      "tsconfig.json",
      "pages/index.tsx",
      "pages/user/[name].tsx",
    ];

    for (const expectedFile of expectedFiles) {
      const p = join(ctx.dir, expectedFile);
      assert(await exists(p));
    }
  },
});
