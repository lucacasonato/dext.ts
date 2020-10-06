import { h } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact-render-to-string/mod.ts";

const Document = await import(Deno.args[0]).then((m) => m.default);
const body = render(<Document />);
await Deno.writeAll(
  Deno.stdout,
  new TextEncoder().encode(`<!--dextstart-->${body}<!--dextend-->`),
);
