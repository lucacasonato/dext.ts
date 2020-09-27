import { VNode } from "../preact/preact.d.ts";

interface Options {
  shallow?: boolean;
  xml?: boolean;
  pretty?: boolean | string;
}

export function render(
  vnode: VNode,
  context?: unknown,
  options?: Options,
): string;
export function renderToString(
  vnode: VNode,
  context?: unknown,
  options?: Options,
): string;
export function shallowRender(vnode: VNode, context?: unknown): string;
export default render;
