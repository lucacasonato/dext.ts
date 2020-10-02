import type { ComponentChild } from "../../deps/preact/mod.ts";

export interface AppProps {
  route?: Record<string, string | string[]>;
  children: ComponentChild;
}

export interface PageProps<T = unknown> {
  route?: Record<string, string | string[]>;
  data: T;
}

export interface GetStaticData<T = unknown> {
  data: T;
}
