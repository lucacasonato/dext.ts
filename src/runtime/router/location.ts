// deno-lint-ignore-file no-undef
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "../../../deps/preact/hooks.ts";

/**
 * History API docs @see https://developer.mozilla.org/en-US/docs/Web/API/History
 */
const eventPopstate = "popstate";
const eventPushState = "pushState";
const eventReplaceState = "replaceState";
export const events = [
  eventPopstate,
  eventPushState,
  eventReplaceState,
] as const;

export function useLocation() {
  const [path, update] = useState(location.pathname);
  const prevPath = useRef(path);

  useEffect(() => {
    patchHistoryEvents();

    // this function checks if the location has been changed since the
    // last render and updates the state only when needed.
    // unfortunately, we can't rely on `path` value here, since it can be stale,
    // that's why we store the last pathname in a ref.
    const checkForUpdates = () => {
      const { pathname } = location;
      prevPath.current !== pathname && update((prevPath.current = pathname));
    };

    events.map((e) => addEventListener(e, checkForUpdates));

    // it's possible that an update has occurred between render and the effect handler,
    // so we run additional check on mount to catch these updates. Based on:
    // https://gist.github.com/bvaughn/e25397f70e8c65b0ae0d7c90b731b189
    checkForUpdates();

    return () => events.map((e) => removeEventListener(e, checkForUpdates));
  }, []);

  // the 2nd argument of the `useLocation` return value is a function
  // that allows to perform a navigation.
  //
  // the function reference should stay the same between re-renders, so that
  // it can be passed down as an element prop without any performance concerns.
  const navigate = useCallback(
    (to: string, { replace = false } = {}) =>
      history[replace ? eventReplaceState : eventPushState](0, "", to),
    [],
  );

  return [path, navigate] as const;
}

// While History API does have `popstate` event, the only
// proper way to listen to changes via `push/replaceState`
// is to monkey-patch these methods.
//
// See https://stackoverflow.com/a/4585031

let patched = 0;

const patchHistoryEvents = () => {
  if (patched) return;

  ([eventPushState, eventReplaceState] as const).map((type) => {
    const original = history[type];
    history[type] = function (
      data: unknown,
      title: string,
      url?: string | null | undefined,
    ) {
      const result = original.apply(this, [data, title, url]);
      const event = new Event(type);
      dispatchEvent(event);
      return result;
    };
  });

  return (patched = 1);
};
