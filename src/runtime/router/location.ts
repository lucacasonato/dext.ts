import { createContext } from "../../../deps/preact/mod.ts";
import { useContext } from "../../../deps/preact/hooks.ts";

export const locationCtx = createContext<[string, (to: string) => void, string | null]>(
  ["", () => {}, ""],
);

export function useLocation(): readonly [string, (to: string) => void, string | null] {
  // @ts-expect-error because this is a hidden variable.
  if (window.__DEXT_SSR) {
    return [window.location.pathname, (_to: string) => {
      throw new TypeError("Can not navigate in SSR context.");
      // @ts-expect-error because this is a hidden variable.
    }, window.__DEXT_SSR.pattern];
  }
  return useContext(locationCtx);
}
