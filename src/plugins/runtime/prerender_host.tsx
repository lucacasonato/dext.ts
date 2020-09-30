import { h } from "./mod.tsx";
import type { ComponentType } from "./mod.tsx";
import { render } from "../../../deps/preact-render-to-string/mod.ts";
import type { PageProps } from "../../type.ts";

const [Component, rawData]: [
  ComponentType<PageProps>,
  Uint8Array,
] = await Promise.all([
  import(Deno.args[0]).then((m) => m.default),
  Deno.readAll(Deno.stdin),
]);
const { data, route } = rawData.length == 0
  ? undefined
  : JSON.parse(new TextDecoder().decode(rawData));
console.log(
  render(
    <div>
      <Component route={route} isFallback={true} data={data} />
    </div>,
  ),
);
