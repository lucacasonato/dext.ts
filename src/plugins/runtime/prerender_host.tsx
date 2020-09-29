import { h } from "./mod.tsx";
import type { ComponentType } from "./mod.tsx";
import { render } from "../../../deps/preact-render-to-string/mod.ts";
import type { PageProps } from "../../type.ts";

const Component: ComponentType<PageProps> = await import(Deno.args[0]).then(
  (m) => m.default
);
console.log(
  render(
    <div>
      <Component route={undefined} isFallback={true} data={undefined} />
    </div>
  )
);
