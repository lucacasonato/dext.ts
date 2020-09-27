import { JSX, Component, ComponentFactory } from "../preact/mod.d.ts";

interface IAsyncRouteProps {
  path: string;
  component?: Component;
  getComponent?: <T>(
    this: AsyncRoute,
    url: string,
    callback: (component: Component) => void,
    props: T,
  ) => Promise<unknown> | void;
  loading?: () => JSX.Element;
}

// deno-lint-ignore ban-types
export default class AsyncRoute extends Component<IAsyncRouteProps, {}> {
  public render(): JSX.Element | null;
}
