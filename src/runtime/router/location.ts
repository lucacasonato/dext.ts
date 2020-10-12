import { createContext } from "../../../deps/preact/mod.ts";
import { useContext } from "../../../deps/preact/hooks.ts";

export const locationCtx = createContext<[string, (to: string) => void]>(
  ["", () => {}],
);

export function useLocation() {
  return useContext(locationCtx);
}
