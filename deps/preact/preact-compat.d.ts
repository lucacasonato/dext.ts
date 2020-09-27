import type { Component, ComponentChild, ComponentChildren } from "./mod.d.ts";

export function lazy<T>(loader: () => Promise<{ default: T }>): T;

export interface SuspenseProps {
  children?: ComponentChildren;
  fallback: ComponentChildren;
}

export class Suspense extends Component<SuspenseProps> {
  render(): ComponentChild;
}
