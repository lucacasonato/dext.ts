import { h } from "../../deps/preact/mod.ts";
import { render } from "../../deps/preact/ssr.ts";
import { writeAllSync } from "../../deps/mod.ts";

const Document = await import(Deno.args[0]).then((m) => m.default);
const body = render(<Document />);
writeAllSync(
  Deno.stdout,
  new TextEncoder().encode(`<!--dextstart-->${body}<!--dextend-->`),
);
