import { h } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact-render-to-string/mod.ts";
// @ts-ignore Deno.args is not defined when
// deno-lint-ignore no-undef
const Component = await import(Deno.args[0]).then((m) => m.default);
console.log(
  render(
    <div>
      <Component isFallback={true} />
    </div>
  )
);
