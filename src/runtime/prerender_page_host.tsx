import { h } from "../../deps/preact/mod.ts";
import type { ComponentType } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact/ssr.ts";
import type { AppProps, PageProps } from "./type.ts";

const Component: ComponentType<PageProps> = await import(Deno.args[0]).then(
  (m) => m.default,
);
const App: ComponentType<AppProps> = await import(Deno.args[1]).then(
  (m) => m.default,
);
// deno-lint-ignore no-deprecated-deno-api
const rawData: Uint8Array = await Deno.readAll(Deno.stdin);
const { data, route } = rawData.length == 0
  ? undefined
  : JSON.parse(new TextDecoder().decode(rawData));
// @ts-expect-error because this is a hidden variable.
window.__DEXT_SSR = true;
const body = render(
  <div>
    <App>
      <Component route={route} data={data} />
    </App>
  </div>,
);
// deno-lint-ignore no-deprecated-deno-api
Deno.writeAllSync(
  Deno.stdout,
  new TextEncoder().encode(`<!--dextstart-->${body}<!--dextend-->`),
);
