import { h } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact/ssr.ts";
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
const { data, route, path } = rawData.length == 0
  ? undefined
  : JSON.parse(new TextDecoder().decode(rawData));
window.location = { pathname: path } as Location;
const body = render(
  <div>
    <App>
      <Component route={route} data={data} />
    </App>
  </div>,
);
Deno.writeAllSync(
  Deno.stdout,
  new TextEncoder().encode(`<!--dextstart-->${body}<!--dextend-->`),
);
