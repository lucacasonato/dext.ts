import { makeMatcher } from "./matcher.ts";

export type Route<T> = [route: string, data: T];

export class Router<T> {
  private matcher = makeMatcher();

  constructor(private routes: Route<T>[]) {}

  getRoute(path: string):
    | [Route<T>, Record<string, string | string[]>]
    | [null, Record<string, string | string[]>] {
    for (const route of this.routes) {
      const [match, data] = this.matcher(route[0], path);
      if (match) return [route, data!];
    }
    return [null, {}];
  }
}
