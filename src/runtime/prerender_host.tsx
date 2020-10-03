import { h } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact-render-to-string/mod.ts";
import type { AppProps, PageProps } from "./type.ts";

const [Component, App, rawData]: [
  ComponentType<PageProps>,
  ComponentType<AppProps>,
  Uint8Array,
] = await Promise.all([
  import(Deno.args[0]).then((m) => m.default),
  import(Deno.args[1]).then((m) => m.default),
  Deno.readAll(Deno.stdin),
]);
const { data, route } = rawData.length == 0
  ? undefined
  : JSON.parse(new TextDecoder().decode(rawData));
console.log(
  render(
    <div>
      <App>
        <Component route={route} data={data} />
      </App>
    </div>,
  ),
);
