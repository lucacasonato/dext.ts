import {
  assert,
  assertEquals,
  assertStringIncludes,
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
    assertStringIncludes(ctx.stdout, "Build success.");

    assertEquals(
      JSON.parse(
        await Deno.readTextFile(join(ctx.dir, ".dext", "pagemap.json"))
      ),
      [{ name: "index", route: "/", hasGetStaticPaths: false }]
    );

    const staticdir = join(ctx.dir, ".dext", "static");

    const indexhtml = join(staticdir, "index.html");
    assert(await exists(indexhtml));
    assert(await exists(`${indexhtml}.gz`));
    assert(await exists(`${indexhtml}.br`));

    const index = await Deno.readTextFile(indexhtml);
    assertStringIncludes(index, `<div id="__dext">`);
    assertStringIncludes(index, "<h1>Hello World</h1>");

    assertEquals(
      await Deno.readTextFile(join(staticdir, "test.txt")),
      "hello world"
    );
  },
});

integrationTest({
  name: "custom_app_and_document",
  cmd: ["build"],
  clean: true,
  async after(ctx) {
    assert(ctx.status.success);
    assertStringIncludes(ctx.stdout, "Build success.");

    assertEquals(
      JSON.parse(
        await Deno.readTextFile(join(ctx.dir, ".dext", "pagemap.json"))
      ),
      [{ name: "index", route: "/", hasGetStaticPaths: false }]
    );

    const staticdir = join(ctx.dir, ".dext", "static");

    const indexhtml = join(staticdir, "index.html");
    assert(await exists(indexhtml));
    assert(await exists(`${indexhtml}.gz`));
    assert(await exists(`${indexhtml}.br`));

    const index = await Deno.readTextFile(indexhtml);
    assertStringIncludes(index, `<div id="__dext">`);
    assertStringIncludes(index, "<title>Hello World!</title>");
    assertStringIncludes(index, "<p>My Custom App!</p>");
    assertStringIncludes(index, "<h1>Hello World</h1>");
  },
});

integrationTest({
  name: "static_generation",
  cmd: ["build"],
  clean: true,
  async after(ctx) {
    assert(ctx.status.success);
    assertStringIncludes(ctx.stdout, "Build success.");

    assertEquals(
      JSON.parse(
        await Deno.readTextFile(join(ctx.dir, ".dext", "pagemap.json"))
      ),
      [
        { name: "index", route: "/", hasGetStaticPaths: false },
        {
          name: "uppercase/[str]",
          route: "/uppercase/:str",
          hasGetStaticPaths: true,
        },
      ]
    );

    const staticdir = join(ctx.dir, ".dext", "static");

    const indexhtml = join(staticdir, "index.html");
    assert(await exists(indexhtml));
    assert(await exists(`${indexhtml}.gz`));
    assert(await exists(`${indexhtml}.br`));
    const html = await Deno.readTextFile(indexhtml);
    assertStringIncludes(html, `<div id="__dext">`);
    assertStringIncludes(html, "<h1>Hello world</h1>");

    const lucaPath = join(staticdir, "uppercase", "luca.html");
    assertStringIncludes(
      await Deno.readTextFile(lucaPath),
      "<h1>luca LUCA /uppercase/luca</h1>"
    );
    const bartekPath = join(staticdir, "uppercase", "bartek.html");
    assertStringIncludes(
      await Deno.readTextFile(bartekPath),
      "<h1>bartek BARTEK /uppercase/bartek</h1>"
    );
    const ryanPath = join(staticdir, "uppercase", "ryan.html");
    assertStringIncludes(
      await Deno.readTextFile(ryanPath),
      "<h1>ryan RYAN /uppercase/ryan</h1>"
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
