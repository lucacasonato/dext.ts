import { createContext } from "../../../deps/preact/mod.ts";
import { useContext } from "../../../deps/preact/hooks.ts";

export const locationCtx = createContext<[string, (to: string) => void]>(
  ["", () => {}],
);

export function useLocation(): readonly [string, (to: string) => void] {
  // @ts-expect-error because this is a hidden variable.
  if (window.__DEXT_SSR) {
    return [window.location.pathname, (_to: string) => {
      throw new TypeError("Can not navigate in SSR context.");
    }];
  }
  return useContext(locationCtx);
}
