// deno-lint-ignore-file
import {
  ComponentProps,
  FunctionalComponent,
  FunctionComponent,
} from "../../deps/preact/mod.ts";
export function memo<P = {}>(
  component: FunctionalComponent<P>,
  comparer?: (prev: P, next: P) => boolean,
): FunctionComponent<P>;
export function memo<C extends FunctionalComponent<any>>(
  component: C,
  comparer?: (
    prev: ComponentProps<C>,
    next: ComponentProps<C>,
  ) => boolean,
): C;
